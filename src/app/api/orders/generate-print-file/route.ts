// src/app/api/orders/generate-print-file/route.ts
import { NextRequest, NextResponse } from "next/server";
import sharp from "sharp";
import QRCode from "qrcode";
import { CANVAS_SIZE, getPrintAreaRect } from "@/lib/printLayout";
import { dataUrlToBuffer } from "@/lib/imageUtils";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    ok: true,
    route: "/api/orders/generate-print-file",
    methods: ["POST"],
    version: "v4-art-only-print-separate-qr-with-db-update-count",
  });
}

type StyleKey = "gangster" | "disney" | "girlboss";

interface GenerateOrderPrintFileBody {
  orderId?: string; // must match orders.order_id (text)
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

export async function POST(req: NextRequest) {
  console.log("🔥 [generate-print-file] VERSION=v4 (ART ONLY PRINT + QR STORED SEPARATELY + DB UPDATE COUNT)");

  try {
    const body = (await req.json()) as GenerateOrderPrintFileBody;
    const { orderId, artworkId, artworkUrl, styleId } = body ?? ({} as any);

    if (!artworkId || !artworkUrl) {
      return NextResponse.json(
        { error: "artworkId and artworkUrl are required" },
        { status: 400 }
      );
    }

    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      process.env.NEXT_PUBLIC_SITE_URL ||
      req.headers.get("origin") ||
      req.nextUrl.origin;

    const styleKey = normaliseStyle(styleId);

    // NOTE: you’re encoding the artworkUrl into the landing page query for now
    const encodedArtworkUrl = encodeURIComponent(artworkUrl);
    const encodedStyle = encodeURIComponent(styleKey);
    const qrTargetUrl = `${baseUrl}/p?img=${encodedArtworkUrl}&s=${encodedStyle}`;

    // Use orderId for naming if present; else fallback to artworkId
    const fileId = orderId ?? artworkId;

    console.log("[generate-print-file] Inputs:", {
      orderId: orderId ?? null,
      artworkId,
      artworkUrl,
      styleKey,
      fileId,
      baseUrl,
    });

    // 1) Fetch artwork
    const artRes = await fetch(artworkUrl);
    if (!artRes.ok) {
      console.error("[generate-print-file] Failed to fetch artworkUrl:", {
        status: artRes.status,
        statusText: artRes.statusText,
      });
      return NextResponse.json(
        { error: "Failed to fetch artwork image" },
        { status: 500 }
      );
    }
    const artBuffer = Buffer.from(await artRes.arrayBuffer());

    // 2) ART-ONLY print file: put the art into the print-area rect (no QR)
    const printArea = getPrintAreaRect();

    const resizedArt = await sharp(artBuffer)
      .resize({
        width: printArea.width,
        height: printArea.height,
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
      .composite([
        {
          input: resizedArt,
          left: printArea.left,
          top: printArea.top,
        },
      ])
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
      console.error("[generate-print-file] Upload print file error:", uploadPrintError);
      return NextResponse.json(
        { error: "Failed to upload print file to storage" },
        { status: 500 }
      );
    }

    const {
      data: { publicUrl: printFileUrl },
    } = supabaseAdmin.storage.from("artworks").getPublicUrl(printObjectPath);

    console.log("[generate-print-file] Uploaded print file:", { printObjectPath, printFileUrl });

    // 4) Generate QR PNG separately (high-res for insert/email)
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
      // Don't hard-fail: print file is the critical path.
    }

    const {
      data: { publicUrl: qrUrl },
    } = supabaseAdmin.storage.from("artworks").getPublicUrl(qrObjectPath);

    console.log("[generate-print-file] Uploaded QR:", { qrObjectPath, qrUrl, qrTargetUrl });

    // 5) Update orders row (must match orders.order_id)
    let rowsUpdated: number | null = null;

    if (orderId) {
      const { data, error, count } = await supabaseAdmin
        .from("orders")
        .update({
          print_file_url: printFileUrl,
          qr_url: qrUrl,
          qr_target_url: qrTargetUrl,
          status: "ready_for_print",
        })
        .eq("order_id", orderId)
        .select("order_id", { count: "exact" });

      rowsUpdated = typeof count === "number" ? count : (data?.length ?? null);

      if (error) {
        console.error("[generate-print-file] Orders update error:", error);
      } else if (!rowsUpdated) {
        console.error(
          "🚨 [generate-print-file] 0 rows updated. This means the orderId you passed DOES NOT MATCH any row in orders.order_id",
          { orderId }
        );
      } else {
        console.log("[generate-print-file] Orders row updated:", { orderId, rowsUpdated });
      }
    } else {
      console.warn(
        "[generate-print-file] No orderId supplied — uploads succeeded, but orders table was NOT updated."
      );
    }

    // 6) Return payload
    return NextResponse.json(
      {
        ok: true,
        version: "v4-art-only-print-separate-qr-with-db-update-count",
        orderId: orderId ?? null,
        artworkId,
        artworkUrl,
        styleKey,
        printFileUrl,
        qrUrl,
        qrTargetUrl,
        canvasSize: CANVAS_SIZE,
        printArea,
        rowsUpdated,
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
