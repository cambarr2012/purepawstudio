// src/app/api/orders/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

type CreateOrderBody = {
  artworkId: string;
  productType: string;
  quantity: number;
  customerName: string;
  email: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  postcode: string;
  country: string;
};

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as CreateOrderBody;

    const requiredFields: (keyof CreateOrderBody)[] = [
      "artworkId",
      "productType",
      "quantity",
      "customerName",
      "email",
      "addressLine1",
      "city",
      "postcode",
      "country",
    ];

    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
    }

    const artwork = await prisma.artwork.findUnique({
      where: { id: body.artworkId },
    });

    if (!artwork) {
      return NextResponse.json(
        { error: "Artwork not found. Please regenerate and try again." },
        { status: 404 }
      );
    }

    const order = await prisma.order.create({
      data: {
        artworkId: artwork.id,
        productType: body.productType,
        quantity: body.quantity || 1,
        customerName: body.customerName,
        email: body.email,
        addressLine1: body.addressLine1,
        addressLine2: body.addressLine2 ?? null,
        city: body.city,
        postcode: body.postcode,
        country: body.country,
        status: "pending_payment",
      },
    });

    return NextResponse.json(
      {
        orderId: order.id,
        status: order.status,
        createdAt: order.createdAt.toISOString(),
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("[orders] Unexpected error in POST /api/orders:", err);
    return NextResponse.json(
      { error: "Internal server error creating order" },
      { status: 500 }
    );
  }
}
