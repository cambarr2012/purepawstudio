// src/app/api/artworks/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxBodySize = "16mb";

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

// Simple GET so we can confirm the route is alive
export async function GET() {
  return NextResponse.json({
    ok: true,
    route: "/api/artworks",
    methods: ["GET", "POST"],
  });
}

export async function POST(req: NextRequest) {
  try {
    console.log("[artworks] POST /api/artworks hit");

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

    // Save directly into the Artwork table
    const artwork = await prisma.artwork.create({
      data: {
        imageUrl: body.imageBase64,
        petName: body.petName ?? null,
        petType: body.petType ?? null,
        styleId: body.styleId,
        qualityJson: body.qualityResult ? (body.qualityResult as any) : null,
      },
    });

    const responsePayload = {
      artworkId: artwork.id,
      imageUrl: artwork.imageUrl,
      petName: artwork.petName,
      petType: artwork.petType,
      styleId: artwork.styleId as StyleId,
      qualityResult: body.qualityResult ?? null,
      createdAt: artwork.createdAt.toISOString(),
    };

    console.log("[artworks] Saved artwork:", responsePayload.artworkId);

    return NextResponse.json(responsePayload, { status: 200 });
  } catch (err: any) {
    console.error("[artworks] Unexpected error in POST /api/artworks:", err);
    return NextResponse.json(
      {
        error: "Internal server error saving artwork",
        details:
          process.env.NODE_ENV === "development"
            ? String(err?.message || err)
            : undefined,
      },
      { status: 500 }
    );
  }
}
