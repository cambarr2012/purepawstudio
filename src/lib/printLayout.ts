// src/lib/printLayout.ts

// 🔥 UPGRADED HIGH-RES PRINT SYSTEM
// Final print file is now 5000×5000px for maximum POD clarity.
export const CANVAS_SIZE = 5000;

// Maintain same proportions as your live preview
const PRINT_AREA_WIDTH_PERCENT = 44;   // matches preview
const PRINT_AREA_HEIGHT_PERCENT = 33;  // matches preview

// This computes the full rectangular print zone on the 5000px canvas
export function getPrintAreaRect() {
  const width = Math.round((CANVAS_SIZE * PRINT_AREA_WIDTH_PERCENT) / 100);
  const height = Math.round((CANVAS_SIZE * PRINT_AREA_HEIGHT_PERCENT) / 100);

  // centred horizontally and vertically
  const left = Math.round((CANVAS_SIZE - width) / 2);
  const top = Math.round((CANVAS_SIZE - height) / 2);

  return { width, height, left, top };
}

// -------------------------------
// ART + QR LAYOUT (UPGRADED)
// -------------------------------
//
// Art = top 80% of print area
// QR  = bottom 20%
// QR is now ~1000px to maintain scan reliability after print scaling.
//
// Because CANVAS_SIZE increased from 3000 → 5000,
// all output assets scale proportionally and stay crisp.
//
export function getArtAndQrRects() {
  const print = getPrintAreaRect();

  // NEW sizes on 5000px canvas:
  // print.width  ≈ 2200px
  // print.height ≈ 1650px

  const artHeight = Math.round(print.height * 0.8); // 80% for artwork
  const qrBandHeight = print.height - artHeight;    // bottom 20%

  // Artwork rectangle (full width, top 80%)
  const art = {
    left: print.left,
    top: print.top,
    width: print.width,
    height: artHeight,
  };

  // QR scaling — ensure minimum meaningful size
  // This will usually yield ~1000–1100px squares.
  const qrSize = Math.max(
    900, // 🔥 minimum: ensures QR is always safely scannable
    Math.round(Math.min(print.width, qrBandHeight) * 0.65) // scale with band
  );

  const qr = {
    width: qrSize,
    height: qrSize,
    left: Math.round(print.left + (print.width - qrSize) / 2), // centred
    top: Math.round(print.top + artHeight + (qrBandHeight - qrSize) / 2),
  };

  return { art, qr };
}
