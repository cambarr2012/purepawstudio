import { NextResponse } from "next/server";
import OpenAI from "openai";
import { Buffer } from "node:buffer";

// We still import OpenAI just so the import pattern matches the rest of your project,
// but this route only uses ClipDrop for now.

const CLIPDROP_API_KEY = process.env.CLIPDROP_API_KEY;

if (!CLIPDROP_API_KEY) {
  console.warn(
    "Warning: CLIPDROP_API_KEY is not set. /api/remove-background will fail until you add it to .env.local"
  );
}

export async function POST(request: Request) {
  try {
    const { imageBase64 } = await request.json();

    if (!imageBase64 || typeof imageBase64 !== "string") {
      return NextResponse.json(
        { error: "Missing or invalid imageBase64" },
        { status: 400 }
      );
    }

    if (!CLIPDROP_API_KEY) {
      return NextResponse.json(
        { error: "ClipDrop API key not configured on server" },
        { status: 500 }
      );
    }

    // imageBase64 is a data URL: data:image/jpeg;base64,XXXX
    const commaIndex = imageBase64.indexOf(",");
    if (commaIndex === -1) {
      return NextResponse.json(
        { error: "Invalid data URL for imageBase64" },
        { status: 400 }
      );
    }

    const meta = imageBase64.substring(0, commaIndex); // "data:image/jpeg;base64"
    const base64Data = imageBase64.substring(commaIndex + 1);
    const mimeMatch = meta.match(/data:(.*);base64/);
    const mimeType = mimeMatch?.[1] ?? "image/jpeg";

    const imageBuffer = Buffer.from(base64Data, "base64");

    // Build multipart/form-data for ClipDrop
    const formData = new FormData();
    const blob = new Blob([imageBuffer], { type: mimeType });
    formData.append("image_file", blob, "pet-image");

    const clipRes = await fetch(
      "https://clipdrop-api.co/remove-background/v1",
      {
        method: "POST",
        headers: {
          "x-api-key": CLIPDROP_API_KEY,
        },
        body: formData,
      }
    );

    if (!clipRes.ok) {
      let errorBody: any = null;
      try {
        errorBody = await clipRes.json();
      } catch {
        // ignore
      }
      console.error(
        "ClipDrop error:",
        clipRes.status,
        clipRes.statusText,
        errorBody
      );
      return NextResponse.json(
        {
          error: "ClipDrop background removal failed",
          status: clipRes.status,
          details: errorBody ?? clipRes.statusText,
        },
        { status: 502 }
      );
    }

    const arrayBuffer = await clipRes.arrayBuffer();
    const outBuffer = Buffer.from(arrayBuffer);
    const outMime =
      clipRes.headers.get("content-type") ?? "image/png";

    const outBase64 = outBuffer.toString("base64");
    const outputDataUrl = `data:${outMime};base64,${outBase64}`;

    return NextResponse.json({
      imageBase64: outputDataUrl,
    });
  } catch (error: any) {
    console.error("Remove background error:", error);
    return NextResponse.json(
      {
        error: "Failed to remove background",
        details: error?.message ?? String(error),
      },
      { status: 500 }
    );
  }
}
