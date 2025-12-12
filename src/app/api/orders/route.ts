// src/app/api/orders/route.ts
import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface CreateOrderBody {
  artworkId: string;
  styleId?: string; // selected style

  email?: string;

  // naming differences between older + newer code
  name?: string;
  customerName?: string;

  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  postcode?: string;
  country?: string;

  productType?: string;
  quantity?: number;

  [key: string]: unknown;
}

// Simple GET so we can sanity-check the route in the browser
export async function GET() {
  return NextResponse.json({
    ok: true,
    route: "/api/orders",
    methods: ["POST"],
    mode: "supabase-backed",
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

    // Generate a robust order id
    const orderId = `ord_${randomUUID()}`;

    const {
      artworkId,
      styleId,
      email,
      productType = "twofifteen_premium_stainless_flask_500ml",
      quantity = 1,
      addressLine1,
      addressLine2,
      city,
      postcode,
      country,
    } = body;

    // Prefer `customerName`, fall back to `name`
    const customerName = body.customerName ?? body.name ?? null;

    // Persist to Supabase `orders` table
    const { error } = await supabaseAdmin.from("orders").insert({
      order_id: orderId,
      artwork_id: artworkId,
      style_id: styleId ?? null,
      product_type: productType,
      quantity: quantity ?? 1,
      customer_name: customerName,
      email: email ?? null,
      address_line1: addressLine1 ?? null,
      address_line2: addressLine2 ?? null,
      city: city ?? null,
      postcode: postcode ?? null,
      country: country ?? null,
      status: "created",
      // stripe_session_id + print_file_url will be filled later from webhook / print pipeline
    });

    if (error) {
      console.error("[orders] Supabase insert error:", error);
      return NextResponse.json(
        { error: "Failed to create order in database." },
        { status: 500 }
      );
    }

    // Keep the old response contract the same so checkout doesn't break
    return NextResponse.json(
      {
        ok: true,
        orderId,
        id: orderId, // alias if frontend expects `id`
        artworkId,
        styleId: styleId ?? null,
        email: email ?? null,
      },
      { status: 200 }
    );
  } catch (err: any) {
    console.error("[orders] Unexpected error in POST /api/orders:", err);
    return NextResponse.json(
      {
        error: "Internal server error while creating order.",
        details:
          process.env.NODE_ENV === "development"
            ? String(err?.message || err)
            : undefined,
      },
      { status: 500 }
    );
  }
}
