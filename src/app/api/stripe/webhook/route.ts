import { NextResponse } from "next/server";
import Stripe from "stripe";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import {
  sendInternalOrderAlertEmail,
  sendOrderConfirmationEmail,
} from "@/lib/email";

export const runtime = "nodejs";

type SessionMetadata = {
  orderId?: string;
  artworkId?: string;
  artworkUrl?: string;
  order_id?: string;
  artwork_id?: string;
  artwork_url?: string;
  styleId?: string;
  style_id?: string;
  productType?: string;
  product_type?: string;
  [key: string]: string | undefined;
};

function getAppUrl() {
  if (process.env.NODE_ENV === "development") {
    return "http://localhost:3000";
  }

  return (
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.SITE_URL ||
    "https://purepawstudio.com"
  );
}

function getSupabaseUrl() {
  return (
    process.env.SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    null
  );
}

function getFirstName(fullName?: string | null) {
  return fullName?.trim()?.split(/\s+/)[0] || null;
}

function resolvePaymentIntentId(
  paymentIntent: Stripe.Checkout.Session["payment_intent"]
) {
  if (!paymentIntent) return null;
  if (typeof paymentIntent === "string") return paymentIntent;
  return paymentIntent.id || null;
}

function pickString(...values: Array<unknown>) {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }
  return null;
}

export async function POST(req: Request) {
  const rawBody = await req.text();
  const sig = req.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

  let event: Stripe.Event;

  try {
    const canVerifySignature = !!sig && !!webhookSecret && !!stripeSecretKey;

    if (canVerifySignature) {
      const stripe = new Stripe(stripeSecretKey!);
      event = stripe.webhooks.constructEvent(rawBody, sig!, webhookSecret!);
    } else if (process.env.NODE_ENV === "development") {
      console.warn(
        "[webhook] Falling back to raw JSON parse because signature verification inputs are missing.",
        {
          hasSig: !!sig,
          hasWebhookSecret: !!webhookSecret,
          hasStripeKey: !!stripeSecretKey,
        }
      );
      event = JSON.parse(rawBody) as Stripe.Event;
    } else {
      console.error("[webhook] Missing sig/secret/stripe key", {
        hasSig: !!sig,
        hasWebhookSecret: !!webhookSecret,
        hasStripeKey: !!stripeSecretKey,
      });
      return new NextResponse("Bad request", { status: 400 });
    }

    if (event.type !== "checkout.session.completed") {
      console.log("[webhook] Ignoring event type:", event.type);
      return new NextResponse("OK", { status: 200 });
    }

    const session = event.data.object as Stripe.Checkout.Session;
    const metadata = (session.metadata || {}) as SessionMetadata;

    console.log("[webhook] session received", {
      sessionId: session.id,
      client_reference_id: session.client_reference_id,
      metadata: session.metadata,
      customer_email: session.customer_email,
      customer_details: session.customer_details,
      amount_total: session.amount_total,
      currency: session.currency,
    });

    const orderId =
      metadata.orderId ||
      metadata.order_id ||
      session.client_reference_id ||
      undefined;

    const artworkId = metadata.artworkId || metadata.artwork_id || undefined;

    let artworkUrl = metadata.artworkUrl || metadata.artwork_url || undefined;

    if (!artworkUrl && artworkId) {
      const supabaseUrl = getSupabaseUrl();
      const artworksBucket = process.env.SUPABASE_ARTWORKS_BUCKET || "artworks";

      if (supabaseUrl) {
        artworkUrl = `${supabaseUrl}/storage/v1/object/public/${artworksBucket}/artworks/${artworkId}.png`;
        console.log("[webhook] Reconstructed artworkUrl from artworkId:", artworkUrl);
      }
    }

    const styleId = metadata.styleId || metadata.style_id || undefined;
    const productType =
      metadata.productType || metadata.product_type || "flask";

    const customerName = session.customer_details?.name || null;
    const customerEmail =
      session.customer_details?.email || session.customer_email || null;
    const firstName = getFirstName(customerName);
    const paymentIntentId = resolvePaymentIntentId(session.payment_intent);

    console.log("[webhook] resolved", {
      orderId,
      artworkId,
      artworkUrl,
      styleId,
      productType,
      customerEmail,
    });

    let shouldSendConfirmationEmail = false;
    let printFileUrl: string | null = null;
    let animationUrl: string | null = null;
    let orderRow: Record<string, any> | null = null;

    if (!orderId) {
      console.warn("[webhook] No orderId resolved.");
    } else {
      try {
        const { data, error } = await supabaseAdmin
          .from("orders")
          .select("*")
          .eq("order_id", orderId)
          .maybeSingle();

        if (error) {
          console.error("[webhook] Failed to fetch order row:", error);
        } else if (!data) {
          console.warn("[webhook] No order found for orderId:", orderId);
        } else {
          orderRow = data;
          shouldSendConfirmationEmail = data.status !== "paid";

          const { error: updateError } = await supabaseAdmin
            .from("orders")
            .update({
              stripe_session_id: session.id,
              status: "paid",
            })
            .eq("order_id", orderId);

          if (updateError) {
            console.error("[webhook] Failed to update order:", updateError);
            shouldSendConfirmationEmail = false;
          } else {
            console.log("[webhook] Order marked paid:", {
              orderId,
              stripeSessionId: session.id,
            });
          }
        }
      } catch (err) {
        console.error("[webhook] Error fetching/updating order:", err);
        shouldSendConfirmationEmail = false;
      }
    }

    if (!orderId) {
      console.warn("[webhook] No orderId resolved – cannot generate print file.");
    } else if (!artworkId) {
      console.warn("[webhook] No artworkId – cannot generate print file.");
    } else if (!artworkUrl) {
      console.warn("[webhook] No artworkUrl – cannot generate print file.");
    } else {
      try {
        const appUrl = getAppUrl();

        console.log("[webhook] Calling generate-print-file:", {
          appUrl,
          orderId,
          artworkId,
          artworkUrl,
          styleId,
        });

        const res = await fetch(`${appUrl}/api/orders/generate-print-file`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            orderId,
            artworkId,
            artworkUrl,
            styleId,
          }),
        });

        if (!res.ok) {
          const text = await res.text();
          console.error("[webhook] generate-print-file failed:", res.status, text);
        } else {
          const data = (await res.json()) as {
            printFileUrl?: string;
            targetUrl?: string;
            qrTargetUrl?: string;
          };

          printFileUrl = data.printFileUrl || null;
          animationUrl = data.qrTargetUrl || data.targetUrl || null;

          console.log("[webhook] generate-print-file succeeded:", {
            orderId,
            printFileUrl,
            animationUrl,
          });
        }
      } catch (err) {
        console.error("[webhook] Error generating print file:", err);
      }
    }

    if (!orderId) {
      console.warn("[webhook] No orderId – cannot send confirmation email.");
    } else if (!customerEmail) {
      console.warn("[webhook] No customer email – cannot send confirmation email.");
    } else if (!shouldSendConfirmationEmail) {
      console.log("[webhook] Confirmation email skipped.", {
        orderId,
        customerEmail,
        shouldSendConfirmationEmail,
      });
    } else {
      try {
        const emailResult = await sendOrderConfirmationEmail({
          to: customerEmail,
          firstName,
          orderId,
          productType:
            pickString(
              orderRow?.product_type,
              orderRow?.productType,
              productType
            ) || "flask",
          styleId:
            pickString(orderRow?.style_id, orderRow?.styleId, styleId) || undefined,
          animationUrl,
        });

        console.log("[webhook] Confirmation email result:", {
          orderId,
          to: customerEmail,
          emailId: emailResult?.data?.id,
          error: emailResult?.error,
        });
      } catch (err) {
        console.error("[webhook] Failed to send confirmation email:", err);
      }
    }

    try {
      const internalAlertTo =
        process.env.INTERNAL_ORDER_ALERT_EMAIL || "support@purepawstudio.com";

      const resolvedCustomerName =
        pickString(
          orderRow?.customer_name,
          orderRow?.customerName,
          customerName
        ) || null;

      const resolvedCustomerEmail =
        pickString(orderRow?.email, orderRow?.customer_email, customerEmail) || null;

      const resolvedProductType =
        pickString(orderRow?.product_type, orderRow?.productType, productType) ||
        "flask";

      const resolvedStyleId =
        pickString(orderRow?.style_id, orderRow?.styleId, styleId) || undefined;

      const shippingName =
        pickString(
          orderRow?.shipping_name,
          orderRow?.customer_name,
          orderRow?.customerName,
          customerName
        ) || null;

      const shippingAddress = {
        line1: pickString(orderRow?.address_line1, orderRow?.addressLine1),
        line2: pickString(orderRow?.address_line2, orderRow?.addressLine2),
        city: pickString(orderRow?.city),
        state: pickString(orderRow?.state, orderRow?.county, orderRow?.region),
        postal_code: pickString(orderRow?.postcode, orderRow?.postal_code),
        country: pickString(orderRow?.country),
      };

      const internalResult = await sendInternalOrderAlertEmail({
        to: internalAlertTo,
        orderId: orderId || "unknown",
        customerName: resolvedCustomerName,
        customerEmail: resolvedCustomerEmail,
        productType: resolvedProductType,
        styleId: resolvedStyleId,
        animationUrl,
        amountTotal: session.amount_total ?? null,
        currency: session.currency ?? null,
        stripeSessionId: session.id,
        paymentIntentId,
        artworkId,
        artworkUrl,
        printFileUrl,
        shippingName,
        shippingAddress,
      });

      console.log("[webhook] Internal order alert result:", {
        orderId,
        to: internalAlertTo,
        emailId: internalResult?.data?.id,
        error: internalResult?.error,
      });
    } catch (err) {
      console.error("[webhook] Failed to send internal order alert:", err);
    }

    return new NextResponse("OK", { status: 200 });
  } catch (err: any) {
    console.error("[webhook] Unhandled top-level error:", err?.message || err);
    return new NextResponse("Internal webhook error", { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    route: "/api/stripe/webhook",
    method: "GET",
  });
}