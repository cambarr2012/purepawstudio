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
    version: "v4-art-only-print-separate-qr-db-verify",
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
  // Prefer explicit env in prod. Fallback to request origin.
  return (
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    req.nextUrl.origin
  );
}

export async function POST(req: NextRequest) {
  console.log(
    "🔥 [generate-print-file] VERSION=v4 (ART ONLY PRINT + QR SEPARATE + DB VERIFY)"
  );

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

    // QR target URL (stored; NOT printed)
    const encodedArtworkUrl = encodeURIComponent(artworkUrl);
    const encodedStyle = encodeURIComponent(styleKey);
    const qrTargetUrl = `${baseUrl}/p?img=${encodedArtworkUrl}&s=${encodedStyle}`;

    // Use orderId for storage naming if present (recommended)
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

    // 2) Build ART-ONLY print file
    const artRect = getArtRect();

    const resizedArt = await sharp(artBuffer)
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

    console.log("[generate-print-file] Uploaded QR:", {
      qrObjectPath,
      qrUrl,
      qrTargetUrl,
    });

    // 5) Persist URLs to orders row (requires orderId)
    // NOTE: we avoid `.select("...", {count})` to satisfy supabase-js typings.
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
        // Verify the row exists (and gives you a reliable “matched” signal)
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

        console.log("[generate-print-file] Orders row updated:", {
          orderId,
          dbMatchedOrder,
        });
      }
    } else {
      console.warn(
        "[generate-print-file] No orderId supplied — storage uploads succeeded, but orders table was NOT updated."
      );
    }

    return NextResponse.json(
      {
        ok: true,
        version: "v4-art-only-print-separate-qr-db-verify",
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
