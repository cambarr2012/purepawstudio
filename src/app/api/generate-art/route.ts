import { NextRequest, NextResponse } from "next/server";
import { Buffer } from "node:buffer";

export const runtime = "nodejs";

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
    // What to copy from the photo
    "Use the uploaded image as an exact reference for the pet's face, head shape, ears, body proportions and fur markings.",
    "Preserve the pet's base fur colour exactly as in the reference photo. Match the main coat colour, patches, spots, patterns and markings so the pet is clearly recognisable as the same animal.",
    "Preserve the pet's natural eye colour and nose colour from the reference.",
    "You may add stylised lighting, shading and subtle gradients, but the underlying coat colour and markings must remain true to the original pet.",
    // What NOT to keep
    "Do not keep any collars, harnesses, leashes, toys, balls, sticks, ropes, blankets, clothing, furniture or human hands from the original photo.",
    "Remove any objects from the pet's mouth, including leads, toys, sticks, ropes, balls, food or other items.",
    "Only keep the pet itself, with the style-specific facial styling described in the style prompt.",
    // Composition + background
    "Focus mainly on the pet's face and upper body, centred in the frame.",
    "Use a plain, clean background (simple soft colour or subtle gradient) with no objects, no scenery and no props.",
    // Hard negatives
    "Do NOT draw mugs, cups, bottles, flasks, human hands or any other products or containers.",
    "Do not change the pet's fur to unrealistic, dyed or neon colours. Avoid fantasy colours such as bright blue, green or purple fur unless they already exist in the reference photo.",
    "No text, no logos, no watermarks.",
  ];

  const accessoryRules: string[] = [];

  if (styleId === "gangster") {
    accessoryRules.push(
      "Add a single thick stylised gold chain around the pet's neck as part of the gangster style.",
      "Keep the pet's fur colour exactly the same as in the reference photo. Do NOT recolour the fur to gold, orange or yellow – only the chain (and any subtle sunglasses) should be bright gold.",
      "Do not add any other clothing or accessories besides the gold chain (and optional subtle sunglasses if it fits the style)."
    );
  } else {
    accessoryRules.push(
      "Do not add any necklaces, gold chains, jewellery, sunglasses, hats, bandanas, clothes or other accessories to the pet."
    );
  }

  const fullPrompt = [...baseParts, ...accessoryRules].join(" ");
  return fullPrompt;
}

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

    // -----------------------------------------------
    // DEV FALLBACK MODE
    // -----------------------------------------------
    if (process.env.DEV_PLACEHOLDER === "true") {
      console.log("🟡 DEV_PLACEHOLDER active — returning placeholder image.");

      if (!imageBase64) {
        return NextResponse.json(
          { error: "No image provided, even in dev mode." },
          { status: 400 }
        );
      }

      return NextResponse.json({
        imageBase64: imageBase64,
        devMode: true,
      });
    }
    // -----------------------------------------------
    // END DEV FALLBACK
    // -----------------------------------------------

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "Missing OPENAI_API_KEY on the server." },
        { status: 500 }
      );
    }

    if (!imageBase64 || typeof imageBase64 !== "string") {
      return NextResponse.json(
        { error: "imageBase64 is required." },
        { status: 400 }
      );
    }

    const safeStyleId: StyleId = styleId ?? "cartoon";
    const fullPrompt = buildPrompt({
      styleId: safeStyleId,
      petName,
      petType,
    });

    // Convert incoming base64 → pure base64
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

    // Transparent PNG output so we can place it cleanly on the flask
    formData.append("background", "transparent");
    formData.append("output_format", "png");
    formData.append("quality", "low");
    formData.append("input_fidelity", "low"); // ✅ cheap for all styles

    const response = await fetch("https://api.openai.com/v1/images/edits", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("OpenAI image API error:", response.status, errorText);
      return NextResponse.json(
        {
          error:
            "Failed to generate artwork. Please try again or check your OpenAI image settings.",
          details: errorText,
          statusCode: response.status,
        },
        { status: 500 }
      );
    }

    const data = await response.json();
    const b64 = (data as any)?.data?.[0]?.b64_json;

    if (!b64 || typeof b64 !== "string") {
      console.error("Unexpected OpenAI image response structure:", data);
      return NextResponse.json(
        { error: "Unexpected response from image generator." },
        { status: 500 }
      );
    }

    const dataUrl = `data:image/png;base64,${b64}`;
    return NextResponse.json({ imageBase64: dataUrl });
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
