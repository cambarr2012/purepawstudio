import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface CheckoutBody {
  orderId?: string;
  id?: string;
  artworkId?: string;
  artworkUrl?: string;
  styleId?: string;
  productType?: string;
  email?: string;
  [key: string]: unknown;
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    route: "/api/checkout",
    methods: ["POST"],
    mode: "stripe-price-id-single-qty",
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as CheckoutBody | null;

    console.log("[checkout] POST /api/checkout body:", body);

    const orderId =
      body?.orderId ||
      body?.id ||
      `ord_${Math.random().toString(16).slice(2, 10)}`;

    const artworkId =
      body?.artworkId && typeof body.artworkId === "string"
        ? body.artworkId
        : "";

    let artworkUrl =
      body?.artworkUrl && typeof body.artworkUrl === "string"
        ? body.artworkUrl
        : undefined;

    const supabaseUrl = process.env.SUPABASE_URL;
    const artworksBucket = process.env.SUPABASE_ARTWORKS_BUCKET || "artworks";

    if (!artworkUrl && artworkId && supabaseUrl) {
      artworkUrl = `${supabaseUrl}/storage/v1/object/public/${artworksBucket}/artworks/${artworkId}.png`;
      console.log("[checkout] Computed artworkUrl from artworkId:", artworkUrl);
    }

    const email =
      body?.email && typeof body.email === "string" ? body.email : undefined;

    const styleId =
      body?.styleId && typeof body.styleId === "string"
        ? body.styleId
        : undefined;

    const productType =
      body?.productType && typeof body.productType === "string"
        ? body.productType
        : "flask";

    const headerOrigin = req.headers.get("origin");
    const siteUrl =
      process.env.NEXT_PUBLIC_SITE_URL ||
      process.env.SITE_URL ||
      headerOrigin ||
      req.nextUrl.origin ||
      "http://localhost:3000";

    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    const stripePriceId = process.env.STRIPE_PRICE_ID;

    if (!stripeSecretKey) {
      console.error("[checkout] Missing STRIPE_SECRET_KEY");
      return NextResponse.json(
        { error: "Stripe is not configured on the server." },
        { status: 500 }
      );
    }

    if (!stripePriceId) {
      console.error("[checkout] Missing STRIPE_PRICE_ID");
      return NextResponse.json(
        { error: "Stripe price is not configured on the server." },
        { status: 500 }
      );
    }

    const StripeModule = await import("stripe");
    const Stripe = StripeModule.default;
    const stripe = new Stripe(stripeSecretKey);

    const metadata: Record<string, string | undefined> = {
      orderId,
      artworkId,
      artworkUrl,
      styleId,
      productType,
      order_id: orderId,
      artwork_id: artworkId,
      artwork_url: artworkUrl,
      style_id: styleId,
      product_type: productType,
    };

    const sessionParams: any = {
      mode: "payment",
      client_reference_id: orderId,
      line_items: [{ price: stripePriceId, quantity: 1 }],
      success_url: `${siteUrl}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl}/cancel`,
      metadata,
    };

    if (email) {
      sessionParams.customer_email = email;
    }

    const session = await stripe.checkout.sessions.create(sessionParams as any);

    console.log("[checkout] Session created:", session.id);
    console.log("[checkout] Session metadata:", session.metadata);

    if (!session.url) {
      console.error("[checkout] Stripe session created without URL:", session.id);
      return NextResponse.json(
        { error: "Failed to create checkout session." },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        ok: true,
        orderId,
        artworkId,
        artworkUrl,
        styleId: styleId ?? null,
        productType,
        checkoutUrl: session.url,
        url: session.url,
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