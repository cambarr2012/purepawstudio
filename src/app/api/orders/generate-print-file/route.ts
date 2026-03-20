// src/app/api/orders/generate-print-file/route.ts
import { NextRequest, NextResponse } from "next/server";
import sharp from "sharp";
import QRCode from "qrcode";
import { CANVAS_SIZE } from "@/lib/printLayout";
import { dataUrlToBuffer } from "@/lib/imageUtils";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    ok: true,
    route: "/api/orders/generate-print-file",
    methods: ["POST"],
    version: "v8-print-match-artwork-normalisation",
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
    req.nextUrl.origin
  );
}

/**
 * Detect + remove opaque black matte backgrounds.
 * Same general fix as generate-art.
 */
async function removeBlackBoxBackgroundIfNeeded(inputPng: Buffer): Promise<Buffer> {
  const { data, info } = await sharp(inputPng)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const w = info.width;
  const h = info.height;
  const stride = 4;

  const sampleSize = Math.min(8, w, h);
  const corners: Array<[number, number]> = [
    [0, 0],
    [Math.max(0, w - sampleSize), 0],
    [0, Math.max(0, h - sampleSize)],
    [Math.max(0, w - sampleSize), Math.max(0, h - sampleSize)],
  ];

  let pixelCount = 0;
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
        pixelCount++;
      }
    }
  }

  const avgA = sumA / pixelCount;
  const avgRGB = sumRGB / (pixelCount * 3);

  const looksLikeBlackBox = avgA > 245 && avgRGB < 25;
  if (!looksLikeBlackBox) return inputPng;

  const out = Buffer.from(data);
  const hardCut = 18;
  const softCut = 70;

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

  return sharp(out, {
    raw: { width: w, height: h, channels: 4 },
  })
    .png()
    .toBuffer();
}

/**
 * Important for print: remove hidden RGB in fully transparent pixels.
 * This helps prevent edge halos when resizing/compositing.
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

  return sharp(out, {
    raw: { width: info.width, height: info.height, channels: 4 },
  })
    .png()
    .toBuffer();
}

/**
 * Match the artwork composition logic rather than squeezing the art
 * into the legacy print-area rectangle.
 *
 * This makes the paid print file visually match the artwork PNG that
 * already looks correct when dropped into the supplier.
 */
async function normaliseArtworkToPrintCanvas(
  inputPng: Buffer,
  opts?: { canvasSize?: number; innerScale?: number; verticalBias?: number }
): Promise<Buffer> {
  const canvasSize = opts?.canvasSize ?? CANVAS_SIZE;
  const innerScale = Math.min(0.95, Math.max(0.72, opts?.innerScale ?? 0.84));
  const verticalBias = Math.min(0.15, Math.max(-0.15, opts?.verticalBias ?? -0.04));

  const trimmed = await sharp(inputPng)
    .ensureAlpha()
    .trim({ threshold: 10 })
    .png()
    .toBuffer();

  const meta = await sharp(trimmed).metadata();
  const srcW = meta.width ?? canvasSize;
  const srcH = meta.height ?? canvasSize;

  const maxDim = Math.max(srcW, srcH);
  const scale = (canvasSize * innerScale) / maxDim;

  const targetW = Math.max(1, Math.round(srcW * scale));
  const targetH = Math.max(1, Math.round(srcH * scale));

  const fitted = await sharp(trimmed)
    .resize({
      width: targetW,
      height: targetH,
      fit: "fill",
    })
    .png()
    .toBuffer();

  const left = Math.round((canvasSize - targetW) / 2);
  const centeredTop = Math.round((canvasSize - targetH) / 2);
  const biasedTop = Math.round(centeredTop + canvasSize * verticalBias);
  const top = Math.max(0, Math.min(canvasSize - targetH, biasedTop));

  return sharp({
    create: {
      width: canvasSize,
      height: canvasSize,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite([{ input: fitted, left, top }])
    .png()
    .toBuffer();
}

export async function POST(req: NextRequest) {
  console.log("🔥 [generate-print-file] VERSION=v8 (MATCH ARTWORK NORMALISATION)");

  try {
    const body = (await req.json()) as GenerateOrderPrintFileBody;
    const { orderId, artworkId, artworkUrl, styleId } = body ?? ({} as GenerateOrderPrintFileBody);

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

    // 1) Fetch the artwork image
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

    // 2) Clean it for print
    const matteCleaned = await removeBlackBoxBackgroundIfNeeded(artBuffer);
    const cleanedForPrint = await sanitizeTransparentRgb(matteCleaned);

    // 3) Build print file using the same visual composition logic as artwork output
    const finalPrintBuffer = await normaliseArtworkToPrintCanvas(cleanedForPrint, {
      canvasSize: CANVAS_SIZE,
      innerScale: 0.84,
      verticalBias: -0.04,
    });

    // 4) Upload print file
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

    // 5) Generate QR
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
      // Do not fail whole request if QR upload fails.
    }

    const {
      data: { publicUrl: qrUrl },
    } = supabaseAdmin.storage.from("artworks").getPublicUrl(qrObjectPath);

    // 6) Persist order fields
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
          console.error("[generate-print-file] Orders verify error:", verifyError);
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
        version: "v8-print-match-artwork-normalisation",
        orderId: orderId ?? null,
        artworkId,
        artworkUrl,
        styleKey,
        printFileUrl,
        qrUrl,
        qrTargetUrl,
        canvasSize: CANVAS_SIZE,
        normalisedWith: {
          innerScale: 0.84,
          verticalBias: -0.04,
        },
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