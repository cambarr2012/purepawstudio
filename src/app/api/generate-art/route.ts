import { NextRequest, NextResponse } from "next/server";
import { Buffer } from "node:buffer";
import sharp from "sharp";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type StyleId = "gangster" | "cartoon" | "girlboss";

function coerceStyleId(input: unknown): StyleId {
  const s = String(input ?? "").trim().toLowerCase();
  if (s === "disney") return "cartoon";
  if (s === "gangster" || s === "cartoon" || s === "girlboss") return s;
  return "cartoon";
}

function parseDataUri(dataUri: string): { mime: string; b64: string } {
  const match = /^data:([^;]+);base64,(.+)$/i.exec(dataUri);
  if (!match) return { mime: "image/png", b64: dataUri };
  return { mime: match[1] || "image/png", b64: match[2] || "" };
}

function fileExtFromMime(mime: string): string {
  if (mime.includes("png")) return "png";
  if (mime.includes("webp")) return "webp";
  if (mime.includes("jpeg") || mime.includes("jpg")) return "jpg";
  return "png";
}

function buildStylePrompt(styleId: StyleId): string {
  switch (styleId) {
    case "gangster":
      return [
        "a premium stylised cartoon pet portrait with confident swagger",
        "deep rich colours",
        "strong but tasteful comic-book shading",
        "clean crisp edges",
        "smooth rounded forms",
        "cool neutral lighting",
        "neutral dark outlines only",
        "high-end commercial illustration quality",
      ].join(", ");

    case "cartoon":
      return [
        "a premium family-friendly cartoon pet portrait",
        "smooth rounded forms",
        "expressive eyes",
        "soft but saturated colours",
        "clean outlines",
        "glossy highlights",
        "friendly polished commercial illustration quality",
      ].join(", ");

    case "girlboss":
      return [
        "a premium glamorous cartoon pet portrait with feminine styling",
        "long curled eyelashes",
        "subtle rose-gold or pastel eyeshadow",
        "glossy highlights",
        "cute confident expression",
        "smooth rounded forms",
        "clean crisp edges",
        "high-end commercial illustration quality",
      ].join(", ");

    default:
      return "a high-quality stylised cartoon pet portrait with clean outlines and appealing colours";
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

  const parts: string[] = [
    `Create ${stylePrompt} of ${subject}.`,

    "Use the uploaded image as an exact reference for the pet's face, head shape, ear shape, muzzle shape, body proportions, and fur markings.",
    "Preserve the pet's base fur colour exactly as in the reference photo.",
    "Preserve the pet's natural eye colour and nose colour.",
    "Preserve breed character and real facial structure.",
    "Do not turn the pet into a generic cartoon template.",

    "Remove collars, harnesses, leashes, toys, furniture, background clutter, and human hands.",
    "Remove any objects from the mouth including leads, toys, or sticks.",

    "Composition: a centred studio-style pet portrait showing the full head, full ears, neck, and a modest amount of upper chest or shoulder fur.",
    "Portrait framing only.",
    "The portrait must feel balanced, elegant, and premium.",
    "Keep the head visually centred with a natural neck transition into the upper chest.",
    "Show enough upper chest or shoulder fur to ground the portrait naturally.",
    "Do not crop too tightly under the chin.",
    "Do not compress the neck or chest area.",
    "Do not create a floating head.",
    "Do not include full body, torso, legs, paws, belly, hips, front legs, or seated body. Portrait only: head, neck, and a small amount of upper chest or shoulder fur.",
    "Camera angle: eye-level, straight-on or very slight three-quarter turn only.",
    "Keep the face level and balanced, not dramatically tilted.",
    "Keep a small margin around the ears and head and do not crop the ears.",
    "Keep subject scale consistent: the head should occupy roughly 55 to 68 percent of the image height.",
    "One pet only.",

    "The lower silhouette must end in a soft natural rounded shape with gentle fur contours.",
    "Include visible upper chest or shoulder fur so the bottom edge feels organic and portrait-like.",
    "Never end the portrait with a straight horizontal cut line.",
    "Avoid an overly compact lower silhouette.",

    "Do not produce a logo, emblem, mascot, icon, badge, sticker design, or flat cutout look.",
    "Do not create a bulky emblem-shaped lower silhouette.",
    "Do not make the portrait look like a decorative badge.",
    "Do not place any backing plate, sticker backing, panel, block, or shape behind the pet.",

    "Keep the pet anatomically correct: two eyes, complete ears, complete nose, no missing facial features, no distortions.",
    "Do not duplicate the pet. No extra heads, extra eyes, extra ears, or extra bodies.",

    "Output must be a clean cut-out on a fully transparent background with PNG alpha.",
    "No background, no gradient, no shadow, no backdrop.",
    "Silhouette edge must be smooth and naturally curved.",
    "Avoid jagged or pixelated cutout edges; produce a clean anti-aliased alpha edge.",
    "Do not add any outer border, sticker outline, white trim, glow, stroke, or cutline around the character.",
    "No coloured glow or rim-light around the character.",
    "No cyan highlights, no blue edge glow, no neon outlines.",
    "Keep outlines neutral black or dark grey only.",
    "Do not draw mugs, bottles, hands, or other products.",
    "No unrealistic dyed fur colours. No neon fur.",
    "No text, no logos, no watermarks.",
  ];

  if (styleId === "gangster") {
  parts.push(
    "Add a single thick stylised gold chain around the pet's neck.",
    "Ensure the gold chain is fully visible around the neck within the portrait crop.",
    "The chain should sit directly under the chin on the upper chest.",
    "The chain must be clean, symmetrical, readable, and secondary to the face.",
    "Do not let the chain dominate the composition.",
    "Do not widen the lower silhouette excessively to show the chain.",
    "Keep the portrait refined and portrait-like, not emblem-like or mascot-like.",
    "Keep the lower silhouette soft and natural, with a gently rounded chest shape.",
    "Do not end the lower silhouette in a sharp point, flame shape, spike, or exaggerated fur tip.",
    "Do not create a pointed badge-like bottom shape.",
    "Do not recolour the fur to resemble gold or orange. Only the chain should be gold.",
    "No accessories besides the gold chain."
  );
} else {
  parts.push(
    "Do not add any necklaces, jewellery, sunglasses, hats, clothes, or accessories."
  );
}

if (styleId === "girlboss") {
  parts.push(
    "Keep the girlboss portrait true to the pet's real facial structure and proportions.",
    "Do not overly stylise the face into a generic cute cartoon template.",
    "Portrait only: show the head, neck, and a small elegant amount of upper chest or shoulder fur.",
    "Do not show torso, front legs, paws, seated body, or rounded body shapes.",
    "Important: do not crop the portrait with a flat bottom edge.",
    "Ensure the lower silhouette is softly rounded and organic with visible shoulder or chest fur.",
    "Keep the lower shape compact, portrait-like, and balanced."
  );
}

if (styleId === "cartoon") {
  parts.push(
    "Keep the cartoon portrait premium and portrait-like, not mascot-like.",
    "Maintain a balanced head-to-neck-to-chest relationship.",
    "Do not elongate the lower neck or chest area.",
    "Do not create a second neck, dangling lower extension, or extra vertical taper below the chest.",
    "Keep the bottom silhouette short, softly rounded, and naturally finished."
  );
}

  parts.push(
    "Use a consistent premium portrait layout suitable for printing on a bottle.",
    "All styles should feel like part of the same product family with different vibes but similar portrait structure."
  );

  return parts.join(" ");
}

async function removeBlackBoxBackgroundIfNeeded(inputPng: Buffer): Promise<Buffer> {
  const { data, info } = await sharp(inputPng)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const w = info.width;
  const h = info.height;
  const stride = 4;

  const sampleSize = Math.min(8, w, h);
  const corners: Array<[number, number]> = [
    [0, 0],
    [Math.max(0, w - sampleSize), 0],
    [0, Math.max(0, h - sampleSize)],
    [Math.max(0, w - sampleSize), Math.max(0, h - sampleSize)],
  ];

  let pixelCount = 0;
  let sumA = 0;
  let sumRGB = 0;

  for (const [sx, sy] of corners) {
    for (let y = sy; y < sy + sampleSize; y++) {
      for (let x = sx; x < sx + sampleSize; x++) {
        const i = (y * w + x) * stride;
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const a = data[i + 3];
        sumA += a;
        sumRGB += r + g + b;
        pixelCount++;
      }
    }
  }

  const avgA = sumA / pixelCount;
  const avgRGB = sumRGB / (pixelCount * 3);

  const looksLikeBlackBox = avgA > 245 && avgRGB < 25;
  if (!looksLikeBlackBox) return inputPng;

  const out = Buffer.from(data);
  const hardCut = 18;
  const softCut = 70;

  for (let i = 0; i < out.length; i += 4) {
    const r = out[i];
    const g = out[i + 1];
    const b = out[i + 2];
    const a = out[i + 3];

    if (a < 10) continue;

    const maxc = Math.max(r, g, b);

    if (maxc <= hardCut) {
      out[i + 3] = 0;
    } else if (maxc < softCut) {
      const t = (maxc - hardCut) / (softCut - hardCut);
      out[i + 3] = Math.round(t * 255);
    }
  }

  return sharp(out, {
    raw: { width: w, height: h, channels: 4 },
  })
    .png()
    .toBuffer();
}

async function normaliseArtworkPng(
  inputPng: Buffer,
  opts?: { canvasSize?: number; innerScale?: number; verticalBias?: number }
): Promise<Buffer> {
  const canvasSize = opts?.canvasSize ?? 1024;
  const innerScale = Math.min(0.95, Math.max(0.72, opts?.innerScale ?? 0.84));
  const verticalBias = Math.min(0.15, Math.max(-0.15, opts?.verticalBias ?? -0.04));

  const trimmed = await sharp(inputPng)
    .ensureAlpha()
    .trim({ threshold: 10 })
    .png()
    .toBuffer();

  const meta = await sharp(trimmed).metadata();
  const srcW = meta.width ?? canvasSize;
  const srcH = meta.height ?? canvasSize;

  const maxDim = Math.max(srcW, srcH);
  const scale = (canvasSize * innerScale) / maxDim;

  const targetW = Math.max(1, Math.round(srcW * scale));
  const targetH = Math.max(1, Math.round(srcH * scale));

  const fitted = await sharp(trimmed)
    .resize({
      width: targetW,
      height: targetH,
      fit: "fill",
    })
    .png()
    .toBuffer();

  const left = Math.round((canvasSize - targetW) / 2);
  const centeredTop = Math.round((canvasSize - targetH) / 2);
  const biasedTop = Math.round(centeredTop + canvasSize * verticalBias);
  const top = Math.max(0, Math.min(canvasSize - targetH, biasedTop));

  return sharp({
    create: {
      width: canvasSize,
      height: canvasSize,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite([{ input: fitted, left, top }])
    .png()
    .toBuffer();
}

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
      styleId?: unknown;
      petName?: string;
      petType?: string;
    } = body || {};

    if (process.env.DEV_PLACEHOLDER === "true") {
      if (!imageBase64) {
        return NextResponse.json(
          { error: "No image provided, even in dev mode." },
          { status: 400 }
        );
      }
      return NextResponse.json({ imageBase64, devMode: true });
    }

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

    const safeStyleId = coerceStyleId(styleId);
    const prompt = buildPrompt({ styleId: safeStyleId, petName, petType });

    const { mime, b64 } = parseDataUri(imageBase64);
    const inputBuffer = Buffer.from(b64, "base64");
    const fileExt = fileExtFromMime(mime);

    const formData = new FormData();
    formData.append("model", "gpt-image-1");
    formData.append("prompt", prompt);
    formData.append(
      "image",
      new Blob([inputBuffer], { type: mime }),
      `pet.${fileExt}`
    );
    formData.append("background", "transparent");
    formData.append("output_format", "png");
    formData.append("quality", "medium");
    formData.append("input_fidelity", "high");

    const response = await fetch("https://api.openai.com/v1/images/edits", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errTxt = await response.text().catch(() => "");
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

    const outputBuffer = Buffer.from(outputB64, "base64");
    const cleanedBuffer = await removeBlackBoxBackgroundIfNeeded(outputBuffer);

    const normalisedBuffer = await normaliseArtworkPng(cleanedBuffer, {
      canvasSize: 1024,
      innerScale: 0.84,
      verticalBias: -0.04,
    });

    return NextResponse.json({
      imageBase64: `data:image/png;base64,${normalisedBuffer.toString("base64")}`,
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