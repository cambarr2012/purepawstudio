// src/app/api/checkout/route.ts
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface CheckoutBody {
  orderId?: string;
  id?: string; // some UIs send `id` instead
  artworkId?: string;
  email?: string;
  [key: string]: unknown;
}

// Simple GET – helps us check the route is live
export async function GET() {
  return NextResponse.json({
    ok: true,
    route: "/api/checkout",
    methods: ["POST"],
    mode: "stripe-inline-price",
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as CheckoutBody | null;

    console.log("[checkout] POST /api/checkout body:", body);

    const orderId =
      body?.orderId || body?.id || `ord_${Math.random().toString(16).slice(2, 10)}`;
    const artworkId = body?.artworkId ?? "";
    const email =
      body?.email && typeof body.email === "string" ? body.email : undefined;

    // More robust SITE_URL handling for local + Vercel preview + prod
    const headerOrigin = req.headers.get("origin");
    const siteUrl =
      process.env.NEXT_PUBLIC_SITE_URL ||
      process.env.SITE_URL ||
      headerOrigin ||
      req.nextUrl.origin ||
      "http://localhost:3000";

    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

    if (!stripeSecretKey) {
      console.error("[checkout] Missing STRIPE_SECRET_KEY");
      return NextResponse.json(
        { error: "Stripe is not configured on the server." },
        { status: 500 }
      );
    }

    // Lazy import Stripe so this route never accidentally becomes edge
    const StripeModule = await import("stripe");
    const Stripe = StripeModule.default;
    const stripe = new Stripe(stripeSecretKey);

    // Inline price for now – £19.99 GBP
    const sessionParams: any = {
      mode: "payment",
      client_reference_id: orderId,
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
      success_url: `${siteUrl}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl}/cancel`,
      metadata: {
        // camelCase
        orderId,
        artworkId,
        // snake_case for older code paths / success page expectations
        order_id: orderId,
        artwork_id: artworkId,
      },
    };

    if (email) {
      sessionParams.customer_email = email;
    }

    const session = await stripe.checkout.sessions.create(sessionParams as any);

    if (!session.url) {
      console.error(
        "[checkout] Stripe session created without URL:",
        session.id
      );
      return NextResponse.json(
        { error: "Failed to create checkout session." },
        { status: 500 }
      );
    }

    console.log(
      "[checkout] Created Stripe session",
      session.id,
      "for order",
      orderId
    );

    return NextResponse.json(
      {
        ok: true,
        orderId,
        artworkId,
        checkoutUrl: session.url,
        url: session.url, // alias in case frontend expects `url`
        sessionId: session.id,
      },
      { status: 200 }
    );
  } catch (err: any) {
    console.error("[checkout] Unexpected error in POST /api/checkout:", err);
    return NextResponse.json(
      {
        error: "Internal server error while creating checkout session.",
        details:
          process.env.NODE_ENV === "development"
            ? String(err?.message || err)
            : undefined,
      },
      { status: 500 }
    );
  }
}
