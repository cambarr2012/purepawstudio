// src/app/api/checkout/route.ts
import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import prisma from "@/lib/prisma";

export const runtime = "nodejs"; // ensure not running in edge

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { orderId } = body;

    if (!orderId || typeof orderId !== "string") {
      return NextResponse.json(
        { error: "Missing or invalid orderId" },
        { status: 400 }
      );
    }

    // Quick debugging info (won't leak secrets)
    console.log("[/api/checkout] Incoming orderId:", orderId);
    console.log("[/api/checkout] ENV flags:", {
      hasSecret: !!process.env.STRIPE_SECRET_KEY,
      hasSuccessUrl: !!process.env.STRIPE_SUCCESS_URL,
      hasCancelUrl: !!process.env.STRIPE_CANCEL_URL,
      hasPriceId: !!process.env.STRIPE_PRICE_ID,
    });

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { artwork: true },
    });

    if (!order) {
      return NextResponse.json(
        { error: "Order not found" },
        { status: 404 }
      );
    }

    if (!process.env.STRIPE_SUCCESS_URL || !process.env.STRIPE_CANCEL_URL) {
      return NextResponse.json(
        { error: "Stripe redirect URLs not configured" },
        { status: 500 }
      );
    }

    const unitAmount = 1999; // £19.99 in pence

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        process.env.STRIPE_PRICE_ID
          ? {
              price: process.env.STRIPE_PRICE_ID,
              quantity: order.quantity ?? 1,
            }
          : {
              price_data: {
                currency: "gbp",
                unit_amount: unitAmount,
                product_data: {
                  name: "Custom Pet Flask",
                  description: order.productType,
                },
              },
              quantity: order.quantity ?? 1,
            },
      ],
      success_url: `${process.env.STRIPE_SUCCESS_URL}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: process.env.STRIPE_CANCEL_URL,
      metadata: {
        orderId: order.id,
        artworkId: order.artworkId,
        customerEmail: order.email ?? "",
      },
      customer_email: order.email ?? undefined,
    });

    console.log("[/api/checkout] Created session:", session.id);

    return NextResponse.json({ url: session.url }, { status: 200 });
  } catch (error: any) {
    console.error("Error creating checkout session:", error);

    // Surface the useful part of the error during local dev
    const message =
      error?.raw?.message ||
      error?.message ||
      "Internal server error creating checkout session";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
