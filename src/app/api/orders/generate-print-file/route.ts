// src/app/api/orders/generate-print-file/route.ts
import { NextRequest, NextResponse } from "next/server";
import sharp from "sharp";
import QRCode from "qrcode";
import { CANVAS_SIZE, getArtRect } from "@/lib/printLayout";
import { dataUrlToBuffer } from "@/lib/imageUtils";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    ok: true,
    route: "/api/orders/generate-print-file",
    methods: ["POST"],
    version: "v7-print-matte-keyout-sanitize-rgb",
  });
}

type StyleKey = "gangster" | "disney" | "girlboss";

interface GenerateOrderPrintFileBody {
  orderId?: string;
  artworkId: string;
  artworkUrl: string;
  styleId?: string;
}

function normaliseStyle(styleId?: string | null): StyleKey {
  if (!styleId) return "gangster";
  const s = styleId.toLowerCase();
  if (s.includes("girl")) return "girlboss";
  if (s.includes("disney") || s.includes("cartoon")) return "disney";
  if (s.includes("gangster")) return "gangster";
  return "gangster";
}

function resolveBaseUrl(req: NextRequest) {
  return (
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    req.nextUrl.origin
  );
}

/**
 * Detect + remove opaque black matte backgrounds.
 * (Same fix as generate-art.)
 */
async function removeBlackBoxBackgroundIfNeeded(inputPng: Buffer): Promise<Buffer> {
  const { data, info } = await sharp(inputPng)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const w = info.width;
  const h = info.height;
  const stride = 4;

  const sampleSize = 8;
  const corners: Array<[number, number]> = [
    [0, 0],
    [w - sampleSize, 0],
    [0, h - sampleSize],
    [w - sampleSize, h - sampleSize],
  ];

  let cornerCount = 0;
  let sumA = 0;
  let sumRGB = 0;

  for (const [sx, sy] of corners) {
    for (let y = sy; y < sy + sampleSize; y++) {
      for (let x = sx; x < sx + sampleSize; x++) {
        const i = (y * w + x) * stride;
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const a = data[i + 3];
        sumA += a;
        sumRGB += r + g + b;
        cornerCount++;
      }
    }
  }

  const avgA = sumA / cornerCount;
  const avgRGB = sumRGB / (cornerCount * 3);

  const looksLikeBlackBox = avgA > 245 && avgRGB < 25;
  if (!looksLikeBlackBox) return inputPng;

  const hardCut = 18;
  const softCut = 70;

  const out = Buffer.from(data);

  for (let i = 0; i < out.length; i += 4) {
    const r = out[i];
    const g = out[i + 1];
    const b = out[i + 2];
    const a = out[i + 3];

    if (a < 10) continue;

    const maxc = Math.max(r, g, b);

    if (maxc <= hardCut) {
      out[i + 3] = 0;
    } else if (maxc < softCut) {
      const t = (maxc - hardCut) / (softCut - hardCut);
      out[i + 3] = Math.round(t * 255);
    }
  }

  return sharp(out, { raw: { width: w, height: h, channels: 4 } })
    .png()
    .toBuffer();
}

/**
 * Important for print: remove “hidden RGB” in fully transparent pixels.
 * This prevents halos and weird edge artifacts when resizing.
 */
async function sanitizeTransparentRgb(inputPng: Buffer): Promise<Buffer> {
  const { data, info } = await sharp(inputPng)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const out = Buffer.from(data);

  for (let i = 0; i < out.length; i += 4) {
    const a = out[i + 3];
    if (a === 0) {
      out[i] = 0;
      out[i + 1] = 0;
      out[i + 2] = 0;
    }
  }

  return sharp(out, { raw: { width: info.width, height: info.height, channels: 4 } })
    .png()
    .toBuffer();
}

export async function POST(req: NextRequest) {
  console.log("🔥 [generate-print-file] VERSION=v7 (MATTE KEYOUT + SANITIZE RGB)");

  try {
    const body = (await req.json()) as GenerateOrderPrintFileBody;
    const { orderId, artworkId, artworkUrl, styleId } = body ?? ({} as any);

    if (!artworkId || !artworkUrl) {
      return NextResponse.json(
        { error: "artworkId and artworkUrl are required" },
        { status: 400 }
      );
    }

    const baseUrl = resolveBaseUrl(req);
    if (!baseUrl) {
      return NextResponse.json(
        { error: "Base app URL is not configured" },
        { status: 500 }
      );
    }

    const styleKey = normaliseStyle(styleId);

    const encodedArtworkUrl = encodeURIComponent(artworkUrl);
    const encodedStyle = encodeURIComponent(styleKey);
    const qrTargetUrl = `${baseUrl}/p?img=${encodedArtworkUrl}&s=${encodedStyle}`;

    const fileId = orderId ?? artworkId;

    console.log("[generate-print-file] Inputs:", {
      orderId: orderId ?? null,
      artworkId,
      artworkUrl,
      styleKey,
      fileId,
      baseUrl,
      qrTargetUrl,
    });

    // 1) Fetch the artwork image (this should already be PNG w/ alpha)
    const artRes = await fetch(artworkUrl);
    if (!artRes.ok) {
      console.error(
        "[generate-print-file] Failed to fetch artworkUrl:",
        artRes.status,
        artRes.statusText
      );
      return NextResponse.json(
        { error: "Failed to fetch artwork image" },
        { status: 500 }
      );
    }
    const artBuffer = Buffer.from(await artRes.arrayBuffer());

    // ✅ 1b) Fix black matte backgrounds (old gens + occasional model outputs)
    const matteCleaned = await removeBlackBoxBackgroundIfNeeded(artBuffer);

    // ✅ 1c) Ensure transparent pixels don’t carry junk RGB (prevents halos on resize)
    const cleanedForPrint = await sanitizeTransparentRgb(matteCleaned);

    // 2) Build ART-ONLY print file
    const artRect = getArtRect();

    const resizedArt = await sharp(cleanedForPrint)
      .ensureAlpha()
      .resize({
        width: artRect.width,
        height: artRect.height,
        fit: "contain",
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      })
      .png()
      .toBuffer();

    const finalPrintBuffer = await sharp({
      create: {
        width: CANVAS_SIZE,
        height: CANVAS_SIZE,
        channels: 4,
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      },
    })
      .composite([{ input: resizedArt, left: artRect.left, top: artRect.top }])
      .png()
      .toBuffer();

    // 3) Upload print file
    const printObjectPath = `print-files/${fileId}.png`;

    const { error: uploadPrintError } = await supabaseAdmin.storage
      .from("artworks")
      .upload(printObjectPath, finalPrintBuffer, {
        contentType: "image/png",
        upsert: true,
      });

    if (uploadPrintError) {
      console.error(
        "[generate-print-file] Upload print file error:",
        uploadPrintError
      );
      return NextResponse.json(
        { error: "Failed to upload print file to storage" },
        { status: 500 }
      );
    }

    const {
      data: { publicUrl: printFileUrl },
    } = supabaseAdmin.storage.from("artworks").getPublicUrl(printObjectPath);

    console.log("[generate-print-file] Uploaded print file:", {
      printObjectPath,
      printFileUrl,
    });

    // 4) Generate QR (separate asset)
    const qrDataUrl = await QRCode.toDataURL(qrTargetUrl, {
      width: 1200,
      margin: 1,
      color: {
        dark: "#000000ff",
        light: "#ffffffff",
      },
    });
    const qrBuffer = dataUrlToBuffer(qrDataUrl);

    const qrObjectPath = `qrs/${fileId}.png`;
    const { error: uploadQrError } = await supabaseAdmin.storage
      .from("artworks")
      .upload(qrObjectPath, qrBuffer, {
        contentType: "image/png",
        upsert: true,
      });

    if (uploadQrError) {
      console.error("[generate-print-file] Upload QR error:", uploadQrError);
      // Don't fail the whole request — print file is critical.
    }

    const {
      data: { publicUrl: qrUrl },
    } = supabaseAdmin.storage.from("artworks").getPublicUrl(qrObjectPath);

    // 5) Persist URLs to orders row (requires orderId)
    let dbMatchedOrder: boolean | null = null;

    if (orderId) {
      const { error: updateError } = await supabaseAdmin
        .from("orders")
        .update({
          print_file_url: printFileUrl,
          qr_url: qrUrl,
          qr_target_url: qrTargetUrl,
          status: "ready_for_print",
        })
        .eq("order_id", orderId);

      if (updateError) {
        console.error("[generate-print-file] Orders update error:", updateError);
        dbMatchedOrder = null;
      } else {
        const { data: verifyData, error: verifyError } = await supabaseAdmin
          .from("orders")
          .select("order_id")
          .eq("order_id", orderId)
          .limit(1);

        if (verifyError) {
          console.error(
            "[generate-print-file] Orders verify error:",
            verifyError
          );
          dbMatchedOrder = null;
        } else {
          dbMatchedOrder = (verifyData?.length ?? 0) > 0;
        }
      }
    } else {
      console.warn(
        "[generate-print-file] No orderId supplied — storage uploads succeeded, but orders table was NOT updated."
      );
    }

    return NextResponse.json(
      {
        ok: true,
        version: "v7-print-matte-keyout-sanitize-rgb",
        orderId: orderId ?? null,
        artworkId,
        artworkUrl,
        styleKey,
        printFileUrl,
        qrUrl,
        qrTargetUrl,
        canvasSize: CANVAS_SIZE,
        artRect,
        dbMatchedOrder,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("[generate-print-file] Fatal error:", error);
    return NextResponse.json(
      {
        error: "Failed to generate order print file",
        details: error?.message ?? String(error),
      },
      { status: 500 }
    );
  }
}
