import { NextResponse } from "next/server";
import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export async function POST(request: Request) {
  try {
    const { imageBase64 } = await request.json();

    if (!imageBase64 || typeof imageBase64 !== "string") {
      return NextResponse.json(
        { error: "Missing or invalid imageBase64" },
        { status: 400 }
      );
    }

    const prompt = `
You are grading whether this pet photo is suitable for AI art generation on a mug.

Evaluate from 0–10 for each:
- face: How clearly the pet's face is visible and facing the camera.
- sharpness: How sharp and in-focus the pet is.
- lighting: How well-lit the pet's face is (no harsh shadows or blown highlights).
- background: How simple and uncluttered the background is (plain is best).

Then:
- score: overall average from 0–10.
- status:
  - "good" if score >= 7
  - "warn" if 4 <= score < 7
  - "bad" if score < 4

Return ONLY valid JSON, no extra text, exactly in this shape:

{
  "face": number,
  "sharpness": number,
  "lighting": number,
  "background": number,
  "score": number,
  "status": "good" | "warn" | "bad"
}
`;

    const response = await client.responses.create({
      model: "gpt-4.1",
      input: [
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text: prompt,
            },
            {
              type: "input_image",
              image_url: imageBase64,
              detail:"auto",
            },
          ],
        },
      ],
    });

    // In the JS SDK, output_text is a PROPERTY, not a function.
    const text = (response as any).output_text as string | undefined;
    console.log("Raw model output_text:", text);

    if (!text) {
      console.error("No output_text on response:", response);
      return NextResponse.json(
        { error: "Model returned no text output" },
        { status: 502 }
      );
    }

    let parsed: any;
    try {
      parsed = JSON.parse(text);
    } catch (err) {
      console.error("Failed to parse JSON from model:", text);
      return NextResponse.json(
        { error: "Model returned invalid JSON", raw: text },
        { status: 502 }
      );
    }

    const { face, sharpness, lighting, background, score, status } = parsed;

    if (
      typeof face !== "number" ||
      typeof sharpness !== "number" ||
      typeof lighting !== "number" ||
      typeof background !== "number" ||
      typeof score !== "number" ||
      (status !== "good" && status !== "warn" && status !== "bad")
    ) {
      console.error("JSON from model failed validation:", parsed);
      return NextResponse.json(
        { error: "Model JSON failed validation", raw: parsed },
        { status: 502 }
      );
    }

    return NextResponse.json({
      face,
      sharpness,
      lighting,
      background,
      score,
      status,
    });
  } catch (error: any) {
    console.error("Quality check error:", error);
    return NextResponse.json(
      {
        error: "Failed to score image",
        details: error?.message ?? String(error),
      },
      { status: 500 }
    );
  }
}
