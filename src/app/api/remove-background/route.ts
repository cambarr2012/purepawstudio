import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const CUTOUT_ENDPOINT =
  "https://www.cutout.pro/api/v1/matting2?mattingType=6&crop=true&preview=true";
// preview=true charges 0.25 credit / image and caps output at 500x500.
// You can remove &preview=true later if you want full-credit, full-res cuts.

function getBase64FromDataUrl(imageBase64: string): string {
  const commaIndex = imageBase64.indexOf(",");
  if (commaIndex === -1) return imageBase64;
  return imageBase64.slice(commaIndex + 1);
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

    const body = await req.json().catch(() => null) as
      | { imageBase64?: string }
      | null;

    const imageBase64 = body?.imageBase64;
    if (!imageBase64) {
      return NextResponse.json(
        { error: "Missing imageBase64 in request body." },
        { status: 400 }
      );
    }

    // Strip the data URL header and turn into a binary buffer
    const pureBase64 = getBase64FromDataUrl(imageBase64);
    const buffer = Buffer.from(pureBase64, "base64");

    // Build multipart/form-data payload for Cutout.Pro
    const formData = new FormData();
    // "file" is the expected field name in their docs
    formData.append("file", new Blob([buffer]), "upload.png");

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

    // Match the existing contract: { imageBase64 } on success
    return NextResponse.json({ imageBase64: dataUrl });
  } catch (err) {
    console.error("Unexpected error in /api/remove-background:", err);
    return NextResponse.json(
      { error: "Background removal failed on the server." },
      { status: 500 }
    );
  }
}

// Simple GET so you can ping the route
export async function GET() {
  return NextResponse.json({
    ok: true,
    route: "/api/remove-background",
    provider: "cutout.pro",
  });
}
