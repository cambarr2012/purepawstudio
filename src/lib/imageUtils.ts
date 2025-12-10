// src/lib/imageUtils.ts

export function dataUrlToBuffer(dataUrl: string): Buffer {
  const matches = dataUrl.match(/^data:(.+);base64,(.+)$/);
  if (!matches || matches.length !== 3) {
    throw new Error("Invalid data URL");
  }
  const base64Data = matches[2];
  return Buffer.from(base64Data, "base64");
}
