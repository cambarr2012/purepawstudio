// src/lib/printLayout.ts

export const CANVAS_SIZE = 3000; // final 3000x3000px print file

// These match your preview proportions
const PRINT_AREA_WIDTH_PERCENT = 44;
const PRINT_AREA_HEIGHT_PERCENT = 33;

export function getPrintAreaRect() {
  const width = Math.round((CANVAS_SIZE * PRINT_AREA_WIDTH_PERCENT) / 100);
  const height = Math.round((CANVAS_SIZE * PRINT_AREA_HEIGHT_PERCENT) / 100);

  const left = Math.round((CANVAS_SIZE - width) / 2);
  const top = Math.round((CANVAS_SIZE - height) / 2);

  return { width, height, left, top };
}

// Art top 80%, QR bottom 20% of the print area
export function getArtAndQrRects() {
  const print = getPrintAreaRect();

  const artHeight = Math.round(print.height * 0.8);
  const qrBandHeight = print.height - artHeight;

  const art = {
    left: print.left,
    top: print.top,
    width: print.width,
    height: artHeight,
  };

  const qrSize = Math.round(Math.min(print.width, qrBandHeight) * 0.55);
  const qr = {
    width: qrSize,
    height: qrSize,
    left: Math.round(print.left + (print.width - qrSize) / 2),
    top: Math.round(print.top + artHeight + (qrBandHeight - qrSize) / 2),
  };

  return { art, qr };
}
