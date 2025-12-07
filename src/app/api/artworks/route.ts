// src/app/api/artworks/route.ts
import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import fs from "fs/promises";
import path from "path";
import prisma from "@/lib/prisma";

const STORAGE_MODE = process.env.ARTWORK_STORAGE ?? "local"; // "local" | "none"
const ARTWORK_DIR =
  process.env.ARTWORK_DIR ?? path.join(process.cwd(), ".artworks");

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

async function ensureArtworkDir() {
  try {
    await fs.mkdir(ARTWORK_DIR, { recursive: true });
  } catch (err) {
    console.error("[artworks] Failed to create artwork dir:", err);
  }
}

async function saveToLocalPng(artworkId: string, buffer: Buffer) {
  await ensureArtworkDir();
  const filePath = path.join(ARTWORK_DIR, `${artworkId}.png`);
  await fs.writeFile(filePath, buffer);
  return filePath;
}

function extractBase64(imageBase64: string): { rawBase64: string; mime: string } {
  const match = imageBase64.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
  if (!match) {
    throw new Error("Invalid imageBase64 data URL format");
  }
  const [, mime, rawBase64] = match;
  return { rawBase64, mime };
}

function computeArtworkId(buffer: Buffer): string {
  const hash = crypto.createHash("sha256").update(buffer).digest("hex");
  return `art_${hash.slice(0, 16)}`;
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as SaveArtworkBody;

    if (!body.imageBase64 || !body.styleId) {
      return NextResponse.json(
        { error: "imageBase64 and styleId are required" },
        { status: 400 }
      );
    }

    let rawBase64: string;
    let mime: string;
    try {
      ({ rawBase64, mime } = extractBase64(body.imageBase64));
    } catch (err) {
      console.error("[artworks] Failed to parse data URL:", err);
      return NextResponse.json(
        { error: "Invalid imageBase64 data URL" },
        { status: 400 }
      );
    }

    if (mime !== "image/png") {
      console.warn(
        `[artworks] Non-PNG mime received (${mime}). Continuing but consider enforcing PNG.`
      );
    }

    const buffer = Buffer.from(rawBase64, "base64");
    const artworkId = computeArtworkId(buffer);

    let localPath: string | null = null;

    if (STORAGE_MODE === "local") {
      try {
        localPath = await saveToLocalPng(artworkId, buffer);
        console.log(`[artworks] Saved artwork to ${localPath}`);
      } catch (err) {
        console.error("[artworks] Failed to save artwork locally:", err);
      }
    } else {
      console.log(
        `[artworks] STORAGE_MODE is "${STORAGE_MODE}", skipping physical save.`
      );
    }

    // For now, keep imageUrl as the data URL – later swap to S3/Supabase URL.
    const imageUrl = body.imageBase64;

    const artwork = await prisma.artwork.upsert({
      where: { id: artworkId },
      create: {
        id: artworkId,
        imageUrl,
        petName: body.petName ?? null,
        petType: body.petType ?? null,
        styleId: body.styleId,
        qualityJson: body.qualityResult ? (body.qualityResult as any) : null,
      },
      update: {
        imageUrl,
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
      storageMode: STORAGE_MODE,
      localPath: localPath ?? null,
      createdAt: artwork.createdAt.toISOString(),
    };

    return NextResponse.json(responsePayload, { status: 200 });
  } catch (err) {
    console.error("[artworks] Unexpected error in POST /api/artworks:", err);
    return NextResponse.json(
      { error: "Internal server error saving artwork" },
      { status: 500 }
    );
  }
}
