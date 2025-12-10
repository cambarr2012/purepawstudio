import { NextRequest, NextResponse } from "next/server";
import QRCode from "qrcode";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface GenerateQrBody {
  artworkId?: string;
  orderId?: string;
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as GenerateQrBody;
    const { artworkId, orderId } = body;

    if (!artworkId && !orderId) {
      return NextResponse.json(
        { error: "artworkId or orderId is required" },
        { status: 400 }
      );
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL;
    if (!baseUrl) {
      return NextResponse.json(
        { error: "NEXT_PUBLIC_APP_URL is not configured" },
        { status: 500 }
      );
    }

    // For now, we bind the QR to the artwork; you can flip to order later.
    const targetId = artworkId ?? orderId!;
    const targetUrl = `${baseUrl}/p/${targetId}`;

    // Generate a transparent PNG QR as a data URL
    const qrDataUrl = await QRCode.toDataURL(targetUrl, {
      width: 400, // good for later print compositing
      margin: 0,
      color: {
        dark: "#000000ff", // black
        light: "#ffffff00", // transparent
      },
    });

    return NextResponse.json({
      ok: true,
      targetUrl,
      qrDataUrl,
    });
  } catch (error) {
    console.error("QR generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate QR code" },
      { status: 500 }
    );
  }
}
