// src/app/api/orders/generate-print-file/route.ts
import { NextRequest, NextResponse } from "next/server";
import QRCode from "qrcode";
import sharp from "sharp";
import { CANVAS_SIZE, getArtAndQrRects } from "@/lib/printLayout";
import { dataUrlToBuffer } from "@/lib/imageUtils";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    ok: true,
    route: "/api/orders/generate-print-file",
    methods: ["POST"],
  });
}

interface GenerateOrderPrintFileBody {
  orderId?: string; // optional – nice for naming
  artworkId: string; // the art we’re tying this to
  artworkUrl: string; // Supabase PNG URL (artwork image)
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as GenerateOrderPrintFileBody;
    const { orderId, artworkId, artworkUrl } = body;

    if (!artworkId || !artworkUrl) {
      return NextResponse.json(
        { error: "artworkId and artworkUrl are required" },
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

    // 1) Fetch artwork PNG from Supabase (or wherever artworkUrl points)
    const artRes = await fetch(artworkUrl);
    if (!artRes.ok) {
      console.error(
        "[orders/generate-print-file] Failed to fetch artwork image:",
        artRes.status,
        artRes.statusText
      );
      return NextResponse.json(
        { error: "Failed to fetch artwork image" },
        { status: 500 }
      );
    }
    const artBuffer = Buffer.from(await artRes.arrayBuffer());

    // 2) Generate QR PNG (transparent) pointing at the experience URL
    const targetUrl = `${baseUrl}/p?t=${encodeURIComponent(artworkId)}`;

    const qrDataUrl = await QRCode.toDataURL(targetUrl, {
      width: 400,
      margin: 0,
      color: {
        dark: "#000000ff",
        light: "#ffffff00",
      },
    });
    const qrBuffer = dataUrlToBuffer(qrDataUrl);

    // 3) Layout: art on top, QR below – matches your preview print zone
    const { art, qr } = getArtAndQrRects();

    // 4) Resize art + QR into their slots
    const resizedArt = await sharp(artBuffer)
      .resize({
        width: art.width,
        height: art.height,
        fit: "contain",
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      })
      .png()
      .toBuffer();

    const resizedQr = await sharp(qrBuffer)
      .resize({
        width: qr.width,
        height: qr.height,
        fit: "contain",
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      })
      .png()
      .toBuffer();

    // 5) Composite onto a 3000x3000 transparent canvas
    const finalBuffer = await sharp({
      create: {
        width: CANVAS_SIZE,
        height: CANVAS_SIZE,
        channels: 4,
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      },
    })
      .composite([
        { input: resizedArt, left: art.left, top: art.top },
        { input: resizedQr, left: qr.left, top: qr.top },
      ])
      .png()
      .toBuffer();

    // 6) Upload final print file to Supabase Storage
    const fileId = orderId ?? artworkId;
    const objectPath = `print-files/${fileId}.png`;

    const { error: uploadError } = await supabaseAdmin.storage
      .from("artworks") // bucket name
      .upload(objectPath, finalBuffer, {
        contentType: "image/png",
        upsert: true,
      });

    if (uploadError) {
      console.error(
        "[orders/generate-print-file] Supabase upload error:",
        uploadError
      );
      return NextResponse.json(
        { error: "Failed to upload print file to storage" },
        { status: 500 }
      );
    }

    const {
      data: { publicUrl: printFileUrl },
    } = supabaseAdmin.storage.from("artworks").getPublicUrl(objectPath);

    // 7) Return clean metadata – ready to attach to an Order later
    return NextResponse.json(
      {
        ok: true,
        orderId: orderId ?? null,
        artworkId,
        artworkUrl,
        targetUrl, // where QR points (now /p?t=<artworkId>)
        printFileUrl, // final 3000x3000 PNG for the printer
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("[orders/generate-print-file] error:", error);
    return NextResponse.json(
      {
        error: "Failed to generate order print file",
        details: error?.message ?? String(error),
      },
      { status: 500 }
    );
  }
}
