import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const CUTOUT_ENDPOINT =
  "https://www.cutout.pro/api/v1/matting2?mattingType=6&crop=true&preview=true";

function getBase64FromDataUrl(imageBase64: string): string {
  const commaIndex = imageBase64.indexOf(",");
  if (commaIndex === -1) return imageBase64;
  return imageBase64.slice(commaIndex + 1);
}

function getMimeFromDataUrl(imageBase64: string): string {
  const m = /^data:([^;]+);base64,/i.exec(imageBase64);
  return m?.[1] || "image/png";
}

function filenameFromMime(mime: string): string {
  if (mime.includes("png")) return "upload.png";
  if (mime.includes("webp")) return "upload.webp";
  if (mime.includes("jpeg") || mime.includes("jpg")) return "upload.jpg";
  return "upload.png";
}

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.CUTOUT_PRO_API_KEY;
    if (!apiKey) {
      console.error("CUTOUT_PRO_API_KEY is not set");
      return NextResponse.json(
        { error: "Background removal is temporarily unavailable (config issue)." },
        { status: 500 }
      );
    }

    const body = (await req.json().catch(() => null)) as
      | { imageBase64?: string }
      | null;

    const imageBase64 = body?.imageBase64;
    if (!imageBase64) {
      return NextResponse.json(
        { error: "Missing imageBase64 in request body." },
        { status: 400 }
      );
    }

    const pureBase64 = getBase64FromDataUrl(imageBase64);
    const mime = getMimeFromDataUrl(imageBase64);
    const filename = filenameFromMime(mime);
    const buffer = Buffer.from(pureBase64, "base64");

    const formData = new FormData();
    formData.append(
      "file",
      new Blob([buffer], { type: mime }),
      filename
    );

    const cutoutRes = await fetch(CUTOUT_ENDPOINT, {
      method: "POST",
      headers: {
        APIKEY: apiKey,
      },
      body: formData as any,
    });

    if (!cutoutRes.ok) {
      const text = await cutoutRes.text().catch(() => "");
      console.error(
        "Cutout.Pro error HTTP:",
        cutoutRes.status,
        cutoutRes.statusText,
        text
      );
      return NextResponse.json(
        { error: "Background removal failed on the server." },
        { status: 500 }
      );
    }

    const json = (await cutoutRes.json().catch(() => null)) as
      | { code?: number; data?: { imageBase64?: string }; msg?: string }
      | null;

    if (!json || json.code !== 0 || !json.data?.imageBase64) {
      console.error("Cutout.Pro returned unexpected payload:", json);
      return NextResponse.json(
        { error: "Background removal failed on the server." },
        { status: 500 }
      );
    }

    const resultBase64 = json.data.imageBase64;
    const dataUrl = `data:image/png;base64,${resultBase64}`;

    return NextResponse.json({ imageBase64: dataUrl });
  } catch (err) {
    console.error("Unexpected error in /api/remove-background:", err);
    return NextResponse.json(
      { error: "Background removal failed on the server." },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    route: "/api/remove-background",
    provider: "cutout.pro",
  });
}