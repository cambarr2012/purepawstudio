// src/app/api/orders/route.ts
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface CreateOrderBody {
  artworkId: string;
  email: string;
  name?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  postcode?: string;
  country?: string;
  [key: string]: unknown;
}

// Simple GET so we can sanity-check the route in the browser
export async function GET() {
  return NextResponse.json({
    ok: true,
    route: "/api/orders",
    methods: ["POST"],
    mode: "stateless-stripe-inline-price",
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as CreateOrderBody | null;

    console.log("[orders] POST /api/orders body:", body);

    if (!body?.artworkId) {
      return NextResponse.json(
        { error: "artworkId is required" },
        { status: 400 }
      );
    }

    if (!body.email) {
      return NextResponse.json(
        { error: "email is required" },
        { status: 400 }
      );
    }

    const origin = req.nextUrl.origin;
    const siteUrl = process.env.SITE_URL || origin;

    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

    if (!stripeSecretKey) {
      console.error("[orders] Missing STRIPE_SECRET_KEY");
      return NextResponse.json(
        { error: "Stripe is not configured on the server." },
        { status: 500 }
      );
    }

    // 🔥 Lazy import Stripe so this route never becomes edge by accident
    const StripeModule = await import("stripe");
    const Stripe = StripeModule.default;
    const stripe = new Stripe(stripeSecretKey); // no apiVersion to keep TS happy

    // Generate a simple order id for metadata – we’re not hitting Prisma
    const orderId = `ord_${Math.random().toString(16).slice(2, 10)}`;

    // 💸 Inline price: £19.99 GBP for the custom flask
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "gbp",
            unit_amount: 1999, // £19.99 in pence
            product_data: {
              name: "Custom Pet Flask",
              description:
                "AI-generated pet artwork on a premium stainless steel flask",
            },
          },
          quantity: 1,
        },
      ],
      customer_email: body.email,
      success_url: `${siteUrl}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl}/cancel`,
      metadata: {
        orderId,
        artworkId: body.artworkId,
        email: body.email,
      },
    });

    if (!session.url) {
      console.error("[orders] Stripe session created without URL:", session.id);
      return NextResponse.json(
        {
          error: "Failed to create checkout session.",
        },
        { status: 500 }
      );
    }

    console.log(
      "[orders] Created Stripe session",
      session.id,
      "for order",
      orderId
    );

    // Return a generous payload so whatever the checkout page expects is covered
    return NextResponse.json(
      {
        ok: true,
        orderId,
        id: orderId,
        checkoutUrl: session.url,
        url: session.url,
        sessionUrl: session.url,
        stripeSessionId: session.id,
      },
      { status: 200 }
    );
  } catch (err: any) {
    console.error("[orders] Unexpected error in POST /api/orders:", err);
    return NextResponse.json(
      {
        error: "Internal server error while creating order / checkout session.",
        details:
          process.env.NODE_ENV === "development"
            ? String(err?.message || err)
            : undefined,
      },
      { status: 500 }
    );
  }
}
