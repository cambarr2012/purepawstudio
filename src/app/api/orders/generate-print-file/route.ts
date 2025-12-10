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

type StyleKey = "gangster" | "disney" | "girlboss";

interface GenerateOrderPrintFileBody {
  orderId?: string;   // optional – nice for naming
  artworkId: string;  // the art we’re tying this to
  artworkUrl: string; // Supabase PNG URL (artwork image)
  styleId?: string;   // e.g. "gangster" | "disney" | "girlboss" | "cartoon"
}

function normaliseStyle(styleId?: string | null): StyleKey {
  if (!styleId) return "gangster";

  const s = styleId.toLowerCase();

  if (s.includes("girl")) return "girlboss";
  if (s.includes("disney") || s.includes("cartoon")) return "disney";
  if (s.includes("gangster")) return "gangster";

  return "gangster"; // safe default
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as GenerateOrderPrintFileBody;
    const { orderId, artworkId, artworkUrl, styleId } = body;

    if (!artworkId || !artworkUrl) {
      return NextResponse.json(
        { error: "artworkId and artworkUrl are required" },
        { status: 400 }
      );
    }

    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      process.env.NEXT_PUBLIC_SITE_URL ||
      req.nextUrl.origin;

    if (!baseUrl) {
      return NextResponse.json(
        { error: "Base app URL is not configured" },
        { status: 500 }
      );
    }

    const styleKey = normaliseStyle(styleId);

    // 1) Build QR target URL: /p?img=<artworkUrl>&s=<styleKey>
    const encodedArtworkUrl = encodeURIComponent(artworkUrl);
    const encodedStyle = encodeURIComponent(styleKey);
    const targetUrl = `${baseUrl}/p?img=${encodedArtworkUrl}&s=${encodedStyle}`;

    // 2) Fetch artwork PNG (clean artwork)
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

    // 3) Generate QR PNG (transparent) pointing to targetUrl
    const qrDataUrl = await QRCode.toDataURL(targetUrl, {
      width: 400,
      margin: 0,
      color: {
        dark: "#000000ff",
        light: "#ffffff00",
      },
    });
    const qrBuffer = dataUrlToBuffer(qrDataUrl);

    // 4) Layout: art on top, QR below
    const { art, qr } = getArtAndQrRects();

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
      .from("artworks")
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

    return NextResponse.json(
      {
        ok: true,
        orderId: orderId ?? null,
        artworkId,
        artworkUrl,
        styleKey,
        targetUrl, // where QR points: /p?img=...&s=...
        printFileUrl, // final PNG for printer
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
