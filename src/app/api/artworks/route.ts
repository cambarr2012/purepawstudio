// src/app/api/artworks/route.ts
import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { dataUrlToBuffer } from "@/lib/imageUtils";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type StyleId = "gangster" | "cartoon" | "girlboss";
type QualityStatus = "good" | "warn" | "bad";

interface QualityResult {
  face: number;
  sharpness: number;
  lighting: number;
  background: number;
  score: number;
  status: QualityStatus;
}

interface SaveArtworkBody {
  imageBase64: string; // data URL
  petName?: string;
  petType?: string;
  styleId: StyleId;
  qualityResult?: QualityResult;
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    route: "/api/artworks",
    methods: ["GET", "POST"],
    storage: "supabase-stateless",
  });
}

export async function POST(req: NextRequest) {
  try {
    console.log("[artworks] POST hit (supabase upload)");

    const body = (await req.json()) as SaveArtworkBody | null;

    if (!body?.imageBase64 || !body?.styleId) {
      return NextResponse.json(
        { error: "imageBase64 and styleId are required" },
        { status: 400 }
      );
    }

    if (!body.imageBase64.startsWith("data:image")) {
      return NextResponse.json(
        { error: "imageBase64 must be a data:image URL" },
        { status: 400 }
      );
    }

    // Create a temporary ID — still stateless
    const artworkId = `art_${crypto.randomBytes(8).toString("hex")}`;

    // Convert data URL → Buffer
    const buffer = dataUrlToBuffer(body.imageBase64);

    // Upload to Supabase
    const objectPath = `artworks/${artworkId}.png`;

    const { error: uploadError } = await supabaseAdmin.storage
      .from("artworks")
      .upload(objectPath, buffer, {
        contentType: "image/png",
        upsert: true,
      });

    if (uploadError) {
      console.error("[artworks] upload error:", uploadError);
      return NextResponse.json(
        { error: "Failed to upload artwork to storage" },
        { status: 500 }
      );
    }

    // Get public URL
    const {
      data: { publicUrl },
    } = supabaseAdmin.storage.from("artworks").getPublicUrl(objectPath);

    const payload = {
      artworkId,
      imageUrl: publicUrl,
      petName: body.petName ?? null,
      petType: body.petType ?? null,
      styleId: body.styleId,
      qualityResult: body.qualityResult ?? null,
      storageMode: "supabase",
      createdAt: new Date().toISOString(),
    };

    console.log("[artworks] returning:", payload);

    return NextResponse.json(payload, { status: 200 });
  } catch (err: any) {
    console.error("[artworks] unexpected error:", err);
    return NextResponse.json(
      {
        error: "Internal error saving artwork",
        details: err?.message ?? String(err),
      },
      { status: 500 }
    );
  }
}
