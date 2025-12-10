// src/app/api/stripe/webhook/route.ts
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { stripe } from "@/lib/stripe";
import prisma from "@/lib/prisma";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const rawBody = await req.text();
    const sig = req.headers.get("stripe-signature");
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    let event: Stripe.Event;

    if (process.env.NODE_ENV === "development") {
      // 🔓 DEV ONLY: skip signature verification to avoid endless secret/header issues
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
      // 🔒 PROD: real Stripe signature verification
      if (!sig || !webhookSecret) {
        console.error("[webhook] Missing signature or webhook secret", {
          hasSig: !!sig,
          hasSecret: !!webhookSecret,
        });
        return new NextResponse("Bad request", { status: 400 });
      }

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
        [key: string]: string | undefined;
      };

      const orderId =
        metadata.orderId || metadata.order_id || session.client_reference_id;

      const artworkId =
        metadata.artworkId || metadata.artwork_id || undefined;

      const artworkUrl =
        metadata.artworkUrl || metadata.artwork_url || undefined;

      const email =
        session.customer_email ?? session.customer_details?.email ?? null;

      console.log("[webhook] checkout.session.completed metadata:", metadata);
      console.log("[webhook] checkout.session.completed email:", email);
      console.log("[webhook] Resolved orderId/artworkId:", {
        orderId,
        artworkId,
      });

      if (!orderId && !email) {
        console.warn(
          "[webhook] No orderId or email available to match order, skipping DB update + print file generation."
        );
      } else {
        let updatedById = false;

        // 1️⃣ Mark order as paid by ID (main path)
        if (orderId) {
          try {
            const updated = await prisma.order.update({
              where: { id: orderId },
              data: {
                status: "paid",
                stripeSessionId: session.id,
                stripePaymentIntentId:
                  typeof session.payment_intent === "string"
                    ? session.payment_intent
                    : session.payment_intent?.id ?? null,
              },
            });
            updatedById = true;
            console.log("[webhook] Order marked as paid by ID:", updated.id);
          } catch (err) {
            console.error(
              "[webhook] Failed to update order by ID, will try fallback by email:",
              err
            );
          }
        }

        // 2️⃣ Fallback: update all pending orders for this email (legacy safety net)
        if (!updatedById && email) {
          try {
            const result = await prisma.order.updateMany({
              where: {
                email,
                status: "pending_payment",
              },
              data: {
                status: "paid",
              },
            });
            console.log(
              "[webhook] Fallback updateMany for email result:",
              result
            );
          } catch (err) {
            console.error(
              "[webhook] Fallback update by email failed as well:",
              err
            );
          }
        }

        // 3️⃣ Trigger print-file generation
        if (!orderId) {
          console.warn(
            "[webhook] No orderId resolved – cannot generate print file."
          );
        } else if (!artworkId) {
          console.warn(
            "[webhook] No artworkId in metadata – cannot generate print file."
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
            });

            const res = await fetch(
              `${appUrl}/api/orders/generate-print-file`,
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  orderId,
                  artworkId,
                  artworkUrl,
                }),
              }
            );

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
                [key: string]: any;
              };

              console.log(
                "[webhook] generate-print-file success. Response summary:",
                {
                  printFileUrl: data.printFileUrl,
                  targetUrl: data.targetUrl,
                }
              );

              // OPTIONAL: persist print file info to your Order record
              // await prisma.order.update({
              //   where: { id: orderId },
              //   data: {
              //     printFileUrl: data.printFileUrl,
              //     qrTargetUrl: data.targetUrl,
              //   },
              // });
            }
          } catch (err) {
            console.error(
              "[webhook] Error while calling generate-print-file:",
              err
            );
          }
        }
      }
    } else {
      console.log("[webhook] Unhandled event type, ignoring:", event.type);
    }

    return new NextResponse("OK", { status: 200 });
  } catch (err) {
    console.error("[webhook] Unhandled top-level error:", err);
    // In dev, still return 200 so Stripe doesn't spam retries
    return new NextResponse("OK", { status: 200 });
  }
}
