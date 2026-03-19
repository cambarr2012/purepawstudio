// src/app/api/stripe/webhook/route.ts
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { sendOrderConfirmationEmail } from "@/lib/email";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const rawBody = await req.text();
    const sig = req.headers.get("stripe-signature");
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

    let event: Stripe.Event;

    if (process.env.NODE_ENV === "development") {
      try {
        event = JSON.parse(rawBody) as Stripe.Event;
        console.log("[webhook][dev] Parsed event without signature check:", {
          id: event.id,
          type: event.type,
        });
      } catch (err: any) {
        console.error("[webhook][dev] Failed to parse raw body:", err?.message);
        return new NextResponse("Bad event payload", { status: 400 });
      }
    } else {
      if (!sig || !webhookSecret || !stripeSecretKey) {
        console.error("[webhook] Missing sig/secret/stripe key", {
          hasSig: !!sig,
          hasWebhookSecret: !!webhookSecret,
          hasStripeKey: !!stripeSecretKey,
        });
        return new NextResponse("Bad request", { status: 400 });
      }

      const stripe = new Stripe(stripeSecretKey);

      try {
        event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
      } catch (err: any) {
        console.error("[webhook] Signature verification failed:", err.message);
        return new NextResponse(`Webhook error: ${err.message}`, {
          status: 400,
        });
      }
    }

    console.log("[webhook] Received event type:", event.type);

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;

      const metadata = (session.metadata || {}) as {
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

      const orderId =
        metadata.orderId || metadata.order_id || session.client_reference_id;

      const artworkId =
        metadata.artworkId || metadata.artwork_id || undefined;

      const artworkUrl =
        metadata.artworkUrl || metadata.artwork_url || undefined;

      const styleIdMeta =
        metadata.styleId || metadata.style_id || undefined;

      const productType =
        metadata.productType || metadata.product_type || "flask";

      console.log("[webhook] checkout.session.completed metadata:", metadata);
      console.log("[webhook] Resolved orderId/artworkId/styleId/productType:", {
        orderId,
        artworkId,
        styleId: styleIdMeta,
        productType,
      });

      const customerEmail =
        session.customer_details?.email || session.customer_email || null;

      const firstName =
        session.customer_details?.name?.trim()?.split(/\s+/)[0] || null;

      let shouldSendConfirmationEmail = false;

      if (orderId) {
        try {
          const { data: existingOrder, error: fetchError } = await supabaseAdmin
            .from("orders")
            .select("order_id, status")
            .eq("order_id", orderId)
            .maybeSingle();

          if (fetchError) {
            console.error("[webhook] Failed to fetch existing order:", fetchError);
          } else if (!existingOrder) {
            console.warn("[webhook] No order found for orderId:", orderId);
          } else {
            shouldSendConfirmationEmail = existingOrder.status !== "paid";

            const { error: updateError } = await supabaseAdmin
              .from("orders")
              .update({
                stripe_session_id: session.id,
                status: "paid",
              })
              .eq("order_id", orderId);

            if (updateError) {
              console.error(
                "[webhook] Failed to update order with Stripe session:",
                updateError
              );
              shouldSendConfirmationEmail = false;
            }
          }
        } catch (err) {
          console.error(
            "[webhook] Error while updating order with Stripe session:",
            err
          );
          shouldSendConfirmationEmail = false;
        }
      } else {
        console.warn(
          "[webhook] No orderId resolved – cannot update order with Stripe session."
        );
      }

      let animationUrl: string | null = null;

      if (!orderId) {
        console.warn(
          "[webhook] No orderId resolved – cannot generate print file."
        );
      } else if (!artworkId) {
        console.warn(
          "[webhook] No artworkId in metadata – cannot generate print file."
        );
      } else if (!artworkUrl) {
        console.warn(
          "[webhook] No artworkUrl in metadata – cannot generate print file."
        );
      } else {
        try {
          const appUrl =
            process.env.NODE_ENV === "development"
              ? "http://localhost:3000"
              : process.env.NEXT_PUBLIC_APP_URL ||
                process.env.NEXT_PUBLIC_SITE_URL ||
                "https://purepawstudio.com";

          console.log("[webhook] Using appUrl:", appUrl);
          console.log("[webhook] Calling generate-print-file with:", {
            orderId,
            artworkId,
            artworkUrl,
            styleId: styleIdMeta,
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
              styleId: styleIdMeta,
            }),
          });

          if (!res.ok) {
            const text = await res.text();
            console.error(
              "[webhook] generate-print-file failed:",
              res.status,
              text
            );
          } else {
            const data = (await res.json()) as {
              printFileUrl?: string;
              targetUrl?: string;
              qrTargetUrl?: string;
              [key: string]: any;
            };

            animationUrl = data.qrTargetUrl || data.targetUrl || null;

            console.log(
              "[webhook] generate-print-file success. Response summary:",
              {
                printFileUrl: data.printFileUrl,
                animationUrl,
              }
            );
          }
        } catch (err) {
          console.error(
            "[webhook] Error while calling generate-print-file:",
            err
          );
        }
      }

      if (!orderId) {
        console.warn(
          "[webhook] No orderId resolved – cannot send confirmation email."
        );
      } else if (!customerEmail) {
        console.warn(
          "[webhook] No customer email on session – cannot send confirmation email."
        );
      } else if (!shouldSendConfirmationEmail) {
        console.log(
          "[webhook] Confirmation email skipped (already paid, order missing, or update failed)."
        );
      } else {
        try {
          const emailResult = await sendOrderConfirmationEmail({
            to: customerEmail,
            firstName,
            orderId,
            productType,
            styleId: styleIdMeta,
            animationUrl,
          });

          console.log("[webhook] Confirmation email sent:", {
            orderId,
            to: customerEmail,
            animationUrl,
            emailId: emailResult.data?.id,
            error: emailResult.error,
          });
        } catch (err) {
          console.error("[webhook] Failed to send confirmation email:", err);
        }
      }
    } else {
      console.log("[webhook] Unhandled event type, ignoring:", event.type);
    }

    return new NextResponse("OK", { status: 200 });
  } catch (err) {
    console.error("[webhook] Unhandled top-level error:", err);
    return new NextResponse("OK", { status: 200 });
  }
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    route: "/api/stripe/webhook",
    method: "GET",
  });
}