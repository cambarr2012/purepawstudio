import { NextRequest, NextResponse } from "next/server";
import { Buffer } from "node:buffer";

/* ------------------------------------------------------
   FIX 413 ERRORS — Increase allowed request body size
------------------------------------------------------ */
export const runtime = "nodejs";
export const maxBodySize = "12mb";   // <-- This is what stops the 413
export const dynamic = "force-dynamic";

/* ------------------------------------------------------
   STYLE PROMPT HELPERS
------------------------------------------------------ */
type StyleId = "gangster" | "cartoon" | "girlboss";

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
    "Preserve the pet's natural eye colour and nose colour from the reference.",
    "Do not keep any collars, harnesses, leashes, toys, balls, sticks, ropes, blankets, clothing, furniture or human hands from the original photo.",
    "Only keep the pet itself, with the style-specific enhancements.",
    "Use a clean plain background.",
    "No text, no logos, no watermarks.",
  ];

  const accessoryRules: string[] = [];

  if (styleId === "gangster") {
    accessoryRules.push(
      "Add a thick stylised gold chain around the pet's neck.",
      "Do NOT recolour the pet's fur — only the chain should be gold."
    );
  } else {
    accessoryRules.push(
      "Do not add necklaces, jewellery, sunglasses, hats, or clothes."
    );
  }

  return [...baseParts, ...accessoryRules].join(" ");
}

/* ------------------------------------------------------
   ROUTE HANDLER
------------------------------------------------------ */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
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

    if (!imageBase64 || typeof imageBase64 !== "string") {
      return NextResponse.json(
        { error: "imageBase64 is required." },
        { status: 400 }
      );
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "Missing OPENAI_API_KEY on server." },
        { status: 500 }
      );
    }

    const safeStyleId: StyleId = styleId ?? "cartoon";
    const fullPrompt = buildPrompt({
      styleId: safeStyleId,
      petName,
      petType,
    });

    // Strip "data:image/..;base64,"
    let base64Data = imageBase64;
    const commaIndex = imageBase64.indexOf(",");
    if (commaIndex !== -1) {
      base64Data = imageBase64.slice(commaIndex + 1);
    }

    const imageBuffer = Buffer.from(base64Data, "base64");

    const formData = new FormData();
    formData.append("model", "gpt-image-1");
    formData.append("prompt", fullPrompt);
    formData.append(
      "image",
      new Blob([imageBuffer], { type: "image/png" }),
      "pet.png"
    );

    formData.append("background", "transparent");
    formData.append("output_format", "png");
    formData.append("quality", "low");
    formData.append("input_fidelity", "low");

    const response = await fetch("https://api.openai.com/v1/images/edits", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("OpenAI error:", errorText);
      return NextResponse.json(
        { error: "Failed to generate artwork", details: errorText },
        { status: 500 }
      );
    }

    const data = await response.json();
    const b64 = (data as any)?.data?.[0]?.b64_json;

    if (!b64) {
      return NextResponse.json(
        { error: "Invalid image generation response." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      imageBase64: `data:image/png;base64,${b64}`,
    });
  } catch (err: any) {
    console.error("Error in /api/generate-art:", err);
    return NextResponse.json(
      {
        error: "Server error in generate-art",
        details: err?.message ?? String(err),
      },
      { status: 500 }
    );
  }
}
