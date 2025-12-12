// src/lib/printLayout.ts

export const CANVAS_SIZE = 3000; // final 3000x3000px print file

// Print zone in the center of the canvas.
// Keep these numbers if they match your physical print-safe area.
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
