// src/lib/printLayout.ts

export const CANVAS_SIZE = 3000; // final 3000x3000px print file

// Locked print placement:
// This centered 60% x 40% zone matches the current artwork output that
// visually lands correctly on the bottle mockup / print area.
// Avoid changing unless supplier proofs show a real misalignment.
const PRINT_AREA_WIDTH_PERCENT = 60;
const PRINT_AREA_HEIGHT_PERCENT = 40;

export function getPrintAreaRect() {
  const width = Math.round((CANVAS_SIZE * PRINT_AREA_WIDTH_PERCENT) / 100);
  const height = Math.round((CANVAS_SIZE * PRINT_AREA_HEIGHT_PERCENT) / 100);

  const left = Math.round((CANVAS_SIZE - width) / 2);
  const top = Math.round((CANVAS_SIZE - height) / 2);

  return { width, height, left, top };
}

// Art-only rect (no QR band)
export function getArtRect() {
  const print = getPrintAreaRect();
  return {
    left: print.left,
    top: print.top,
    width: print.width,
    height: print.height,
  };
}