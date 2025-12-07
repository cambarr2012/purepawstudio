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

      const metadata = (session.metadata || {}) as { orderId?: string };
      const orderId = metadata.orderId;

      const email =
        session.customer_email ?? session.customer_details?.email ?? null;

      console.log("[webhook] checkout.session.completed metadata:", metadata);
      console.log("[webhook] checkout.session.completed email:", email);

      if (!orderId && !email) {
        console.warn(
          "[webhook] No orderId or email available to match order, skipping."
        );
      } else {
        let updatedById = false;

        // 1) Try direct update by orderId if we have one
        if (orderId) {
          try {
            const updated = await prisma.order.update({
              where: { id: orderId },
              data: { status: "paid" },
            });
            updatedById = true;
            console.log("[webhook] Order marked as paid by ID:", updated.id);
          } catch (err) {
            console.error(
              "[webhook] Failed to update order by ID, will try fallback:",
              err
            );
          }
        }

        // 2) Fallback: update all pending orders for this email
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
