// src/app/api/orders/route.ts
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface CreateOrderBody {
  artworkId: string;
  email?: string;
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
    mode: "stateless-order-only",
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

    // Generate a simple order id (we're not using Prisma right now)
    const orderId = `ord_${Math.random().toString(16).slice(2, 10)}`;

    // Echo basic info back – frontend just needs something to call /api/checkout with
    return NextResponse.json(
      {
        ok: true,
        orderId,
        id: orderId, // alias in case frontend expects `id`
        artworkId: body.artworkId,
        email: body.email ?? null,
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
