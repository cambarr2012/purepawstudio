// src/app/api/artworks/route.ts
import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

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
  imageBase64: string; // data:image/png;base64,...
  petName?: string;
  petType?: string;
  styleId: StyleId;
  qualityResult?: QualityResult;
}

// Simple GET so we can confirm the route is alive in the browser
export async function GET() {
  return NextResponse.json({
    ok: true,
    route: "/api/artworks",
    methods: ["GET", "POST"],
    storage: "stateless-temp",
  });
}

export async function POST(req: NextRequest) {
  try {
    console.log("[artworks] POST /api/artworks hit (stateless mode)");

    const body = (await req.json()) as SaveArtworkBody | null;
    console.log(
      "[artworks] Request body keys:",
      body ? Object.keys(body) : []
    );

    if (!body?.imageBase64 || !body?.styleId) {
      return NextResponse.json(
        { error: "imageBase64 and styleId are required" },
        { status: 400 }
      );
    }

    if (!body.imageBase64.startsWith("data:image")) {
      console.warn("[artworks] imageBase64 is not a data URL");
    }

    // 🔑 Generate a pseudo-stable artwork ID without touching the DB
    const artworkId = `art_${crypto.randomBytes(8).toString("hex")}`;

    const responsePayload = {
      artworkId,
      // Frontend only really needs artworkId; keep everything else light
      imageUrl: null as string | null,
      petName: body.petName ?? null,
      petType: body.petType ?? null,
      styleId: body.styleId as StyleId,
      qualityResult: body.qualityResult ?? null,
      storageMode: "stateless-temp",
      createdAt: new Date().toISOString(),
    };

    console.log("[artworks] Returning fake saved artwork:", responsePayload);

    return NextResponse.json(responsePayload, { status: 200 });
  } catch (err: any) {
    console.error("[artworks] Unexpected error in POST /api/artworks:", err);
    return NextResponse.json(
      {
        error: "Internal server error saving artwork (stateless mode)",
        details:
          process.env.NODE_ENV === "development"
            ? String(err?.message || err)
            : undefined,
      },
      { status: 500 }
    );
  }
}
