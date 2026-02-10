// src/app/api/generate-art/route.ts
import { NextRequest, NextResponse } from "next/server";
import { Buffer } from "node:buffer";
import sharp from "sharp";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type StyleId = "gangster" | "cartoon" | "girlboss";

// -------------------------
// STYLE PROMPTS (NO BORDERS / NO NEON RIM-LIGHTS)
// -------------------------
function buildStylePrompt(styleId: StyleId): string {
  switch (styleId) {
    case "gangster":
      // Fix: prevent red/pink rim-light / neon outline glow that causes reddish tint
      return "a bold, exaggerated high-end cartoon pet portrait with confident swagger, deep rich colours, strong comic-book shading, smooth rounded shapes, clean crisp edges, COOL/NEUTRAL lighting, no red or pink rim-light, no neon outlines, neutral dark outlines only";
    case "cartoon":
      return "a vibrant, high-end family-friendly cartoon illustration with smooth rounded shapes, expressive eyes, soft but saturated colours, clean outlines, glossy highlights, friendly cute proportions";
    case "girlboss":
      return "a glamorous high-end cartoon pet portrait with feminine styling, long curled eyelashes, subtle rose-gold or pastel eyeshadow, glossy highlights, cute confident head tilt, gentle pastel palette, sparkly eye glints";
    default:
      return "a high-quality stylised cartoon illustration with clean outlines and appealing colours";
  }
}

/**
 * Normalise output so preview/print behave consistently:
 * - Ensure alpha
 * - Trim extra transparent whitespace (or tight crops)
 * - Resize into a consistent square with margin (prevents 'huge/cut off' previews)
 */
async function normaliseArtworkPng(
  inputPng: Buffer,
  opts?: { canvasSize?: number; innerScale?: number }
): Promise<Buffer> {
  const canvasSize = opts?.canvasSize ?? 1024;
  // innerScale = how much of the canvas the subject can occupy (0.86 = 86%)
  const innerScale = Math.min(0.95, Math.max(0.75, opts?.innerScale ?? 0.86));
  const innerSize = Math.round(canvasSize * innerScale);

  const trimmed = await sharp(inputPng)
    .ensureAlpha()
    .trim({ threshold: 10 })
    .png()
    .toBuffer();

  const fitted = await sharp(trimmed)
    .resize({
      width: innerSize,
      height: innerSize,
      fit: "contain",
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toBuffer();

  return await sharp({
    create: {
      width: canvasSize,
      height: canvasSize,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite([
      {
        input: fitted,
        left: Math.round((canvasSize - innerSize) / 2),
        top: Math.round((canvasSize - innerSize) / 2),
      },
    ])
    .png()
    .toBuffer();
}

// -------------------------
// FULL PROMPT BUILDER
// -------------------------
function buildPrompt(params: {
  styleId: StyleId;
  petName?: string;
  petType?: string;
}) {
  const { styleId } = params;

  const stylePrompt = buildStylePrompt(styleId);
  const subject = "the pet in the uploaded reference photo";

  const baseParts: string[] = [
    `Create ${stylePrompt} of ${subject}.`,
    "Use the uploaded image as an exact reference for the pet's face, head shape, ears, body proportions and fur markings.",
    "Preserve the pet's base fur colour exactly as in the reference photo. Match coat colours, patches, patterns and markings.",
    "Preserve the pet's natural eye colour and nose colour.",
    "Remove collars, harnesses, leashes, toys, furniture, background clutter, or human hands.",
    "Remove any objects from the mouth including leads, toys or sticks.",
    "Focus on face + upper body, centred. One pet only.",
    "Keep the pet anatomically correct: two eyes, complete ears, complete nose, no missing facial features, no distortions.",
    "Do not duplicate the pet. No extra heads, extra eyes, or extra bodies.",
    "Output must be a clean cut-out on a fully transparent background (PNG alpha). No background, no gradient, no shadow.",
    "Do NOT add any outer border, sticker outline, white trim, glow, stroke, or cutline around the character.",
    "No coloured glow or rim-light around the character. No neon outlines. Keep outlines neutral (black/dark grey) only.",
    "Do NOT draw mugs, bottles, hands or other products.",
    "No unrealistic dyed fur colours. No neon fur.",
    "No text, no logos, no watermarks.",
  ];

  const accessoryRules: string[] = [];
  if (styleId === "gangster") {
    accessoryRules.push(
      "Add a single thick stylised gold chain around the pet's neck.",
      "Do NOT recolour the fur to resemble gold or orange — only the chain should be gold.",
      "No accessories besides the gold chain.",
      "No red/pink rim lighting or coloured edge highlights. Avoid neon edge glows. Use neutral or cool-toned shading only."
    );
  } else {
    accessoryRules.push(
      "Do not add any necklaces, jewellery, sunglasses, hats, clothes or accessories."
    );
  }

  return [...baseParts, ...accessoryRules].join(" ");
}

// -------------------------
// POST HANDLER
// -------------------------
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);

    const {
      imageBase64,
      styleId,
      petName,
      petType,
    }: {
      imageBase64?: string;
      styleId?: StyleId;
      petName?: string;
      petType?: string;
    } = body || {};

    // DEV fallback mode
    if (process.env.DEV_PLACEHOLDER === "true") {
      console.log("🟡 DEV_PLACEHOLDER active — returning placeholder image.");
      if (!imageBase64) {
        return NextResponse.json(
          { error: "No image provided, even in dev mode." },
          { status: 400 }
        );
      }
      return NextResponse.json({
        imageBase64,
        devMode: true,
      });
    }

    // Required env var
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "Missing OPENAI_API_KEY on server." },
        { status: 500 }
      );
    }

    if (!imageBase64) {
      return NextResponse.json(
        { error: "imageBase64 is required." },
        { status: 400 }
      );
    }

    const safeStyleId: StyleId = styleId ?? "cartoon";
    const fullPrompt = buildPrompt({ styleId: safeStyleId, petName, petType });

    // Extract raw base64
    let b64 = imageBase64;
    const idx = imageBase64.indexOf(",");
    if (idx !== -1) b64 = imageBase64.slice(idx + 1);

    const inputBuffer = Buffer.from(b64, "base64");

    // Prepare FormData
    const formData = new FormData();
    formData.append("model", "gpt-image-1");
    formData.append("prompt", fullPrompt);
    formData.append(
      "image",
      new Blob([inputBuffer], { type: "image/png" }),
      "pet.png"
    );

    formData.append("background", "transparent");
    formData.append("output_format", "png");

    // Reliability
    formData.append("quality", "medium");
    formData.append("input_fidelity", "high");

    // Hit OpenAI
    const response = await fetch("https://api.openai.com/v1/images/edits", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errTxt = await response.text();
      console.error("OpenAI error:", errTxt);
      return NextResponse.json(
        {
          error: "Failed to generate artwork.",
          details: errTxt,
          statusCode: response.status,
        },
        { status: 500 }
      );
    }

    const data = await response.json();
    const outputB64 = (data as any)?.data?.[0]?.b64_json;

    if (!outputB64) {
      console.error("OpenAI returned unexpected shape:", data);
      return NextResponse.json(
        { error: "Unexpected response from image generator." },
        { status: 500 }
      );
    }

    // Normalise output padding/margins to stop style variance in preview
    const outputBuffer = Buffer.from(outputB64, "base64");
    const normalisedBuffer = await normaliseArtworkPng(outputBuffer, {
      canvasSize: 1024,
      innerScale: 0.86,
    });

    const finalB64 = normalisedBuffer.toString("base64");
    return NextResponse.json({
      imageBase64: `data:image/png;base64,${finalB64}`,
    });
  } catch (err: any) {
    console.error("Error in /api/generate-art:", err);
    return NextResponse.json(
      {
        error: "Something went wrong while generating the artwork.",
        details: err?.message ?? String(err),
      },
      { status: 500 }
    );
  }
}
