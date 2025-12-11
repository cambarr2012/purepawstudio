// src/app/MugPreview.tsx

type StyleId = "gangster" | "disney" | "girlboss";

interface MugPreviewProps {
  imageUrl: string | null;
  hasGeneratedArt: boolean;
  styleId: StyleId;
}

export default function MugPreview({
  imageUrl,
  hasGeneratedArt,
  styleId,
}: MugPreviewProps) {
  const mugBackgroundUrl = "/flasks/twofifteen-premium-bottle.png";

  // Print zone on the bottle mockup (already dialled in)
  const PRINT_AREA_WIDTH_PERCENT = 47;
  const PRINT_AREA_HEIGHT_PERCENT = 36;
  const PRINT_AREA_TOP_PERCENT = 45;
  const PRINT_AREA_LEFT_PERCENT = 25;

  const styleLabel = styleId;

  return (
    <div className="w-full flex-1 flex items-center justify-center">
      <div
        className="relative w-full max-w-xs sm:max-w-sm aspect-[4/5] mx-auto rounded-3xl border border-slate-200 bg-white shadow-[0_18px_40px_rgba(15,23,42,0.12)] overflow-hidden select-none"
        style={{
          backgroundImage: `url(${mugBackgroundUrl})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
        onContextMenu={(e) => e.preventDefault()}
      >
        {/* Soft glow behind flask */}
        <div className="pointer-events-none absolute inset-y-6 left-1/2 w-[70%] -translate-x-1/2 rounded-full bg-amber-200/25 blur-3xl" />

        {/* Vignette */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_10%_0%,rgba(148,163,184,0.35)_0,transparent_40%),radial-gradient(circle_at_80%_90%,rgba(148,163,184,0.45)_0,transparent_55%)] pointer-events-none" />

        {/* Print area */}
        <div
          className="absolute flex items-center justify-center pointer-events-none"
          style={{
            top: `${PRINT_AREA_TOP_PERCENT}%`,
            left: `${PRINT_AREA_LEFT_PERCENT}%`,
            width: `${PRINT_AREA_WIDTH_PERCENT}%`,
            height: `${PRINT_AREA_HEIGHT_PERCENT}%`,
          }}
        >
          {imageUrl ? (
            <div className="flex flex-col items-center justify-between w-full h-full">
              {/* Art takes the top ~80% of the print area */}
              <div className="flex items-center justify-center w-full h-[85%]">
                <img
                  src={imageUrl}
                  alt="Pet flask artwork preview"
                  className="max-h-full w-auto object-contain select-none"
                />
              </div>

              {/* QR: fixed size, sits in the lower ~20% of the same print zone */}
              <div className="flex items-start justify-center w-full h-[25%]">
                <img
                  src="/qr-placeholder.png"
                  alt="QR code preview"
                  className="h-[55%] aspect-square object-contain select-none"
                  style={{
                    mixBlendMode: "multiply",
                    opacity: 0.96,
                  }}
                />
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center text-[11px] px-3 text-center rounded-xl bg-white/90 border border-slate-200 shadow-[0_10px_25px_rgba(15,23,42,0.06)]">
              <span className="text-slate-800">
                Your final design will appear on the flask here.
              </span>
              <span className="mt-1 text-slate-500">
                Upload a photo, pass the quick check and create your design.
              </span>
            </div>
          )}
        </div>

        {/* Label pill */}
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-white/90 text-[10px] font-medium text-slate-800 border border-slate-200 backdrop-blur flex items-center gap-1 pointer-events-none shadow-sm">
          <span>{hasGeneratedArt ? "Final design" : "No design yet"}</span>
          <span className="opacity-40">·</span>
          <span className="capitalize text-amber-600">{styleLabel}</span>
        </div>
      </div>
    </div>
  );
}
