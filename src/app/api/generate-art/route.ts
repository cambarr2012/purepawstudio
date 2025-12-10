// src/app/api/generate-art/route.ts
import { NextRequest, NextResponse } from "next/server";
import { Buffer } from "node:buffer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type StyleId = "gangster" | "cartoon" | "girlboss";

// -------------------------
// STYLE PROMPTS
// -------------------------
function buildStylePrompt(styleId: StyleId): string {
  switch (styleId) {
    case "gangster":
      return "a bold, exaggerated cartoon pet portrait wearing a thick gold chain, confident swagger, deep saturated colours, strong comic-book shading, slightly mischievous vibe, optional subtle sunglasses but keep the face clearly visible";
    case "cartoon":
      return "a vibrant, high-end cartoon illustration inspired by Disney and Pixar, smooth rounded shapes, expressive large eyes, soft but saturated colours, clean outlines, glossy highlights, friendly cute proportions, premium sticker aesthetic, no jewellery or clothing";
    case "girlboss":
      return "a glamorous cartoon pet portrait with feminine styling, long curled eyelashes, soft rose-gold or pastel eyeshadow, subtle glossy highlights, cute confident head tilt, gentle pastel palette, sparkly eye glints, optional tiny heart-shaped cheek blush for charm, no necklaces or clothing";
    default:
      return "a high-quality stylised cartoon illustration with clean outlines and appealing colours";
  }
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
    "Remove collars, harnesses, leashes, toys, furniture or human hands from the photo.",
    "Remove any objects from the mouth including leads, toys or sticks.",
    "Focus on face + upper body, centred.",
    "Use a clean simple background (subtle gradient or colour). No scenery.",
    "Do NOT draw mugs, bottles, hands or other products.",
    "No unrealistic dyed fur colours. No neon fur.",
    "No text or logos.",
  ];

  const accessoryRules: string[] = [];
  if (styleId === "gangster") {
    accessoryRules.push(
      "Add a single thick stylised gold chain around the pet's neck.",
      "Do NOT recolour the fur to resemble gold or orange — only the chain should be gold.",
      "No accessories besides the gold chain."
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

    const buffer = Buffer.from(b64, "base64");

    // Prepare FormData
    const formData = new FormData();
    formData.append("model", "gpt-image-1");
    formData.append("prompt", fullPrompt);
    formData.append(
      "image",
      new Blob([buffer], { type: "image/png" }),
      "pet.png"
    );
    formData.append("background", "transparent"); // 🟢 transparent output
    formData.append("output_format", "png");
    formData.append("quality", "low"); // 🟢 cheaper
    formData.append("input_fidelity", "low"); // 🟢 cheaper

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
    const output = (data as any)?.data?.[0]?.b64_json;

    if (!output) {
      console.error("OpenAI returned unexpected shape:", data);
      return NextResponse.json(
        { error: "Unexpected response from image generator." },
        { status: 500 }
      );
    }

    const outputDataUrl = `data:image/png;base64,${output}`;

    return NextResponse.json({ imageBase64: outputDataUrl });
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
