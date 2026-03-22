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

  const DEBUG_PRINT_BOX = false;

  const PRINT_AREA_WIDTH_PERCENT = 60;
  const PRINT_AREA_HEIGHT_PERCENT = 60;
  const PRINT_AREA_TOP_PERCENT = 35;
  const PRINT_AREA_LEFT_PERCENT = 19;

  const SAFE_PADDING_PERCENT = 6;

  const previewScale =
    styleId === "girlboss" ? 0.96 : styleId === "disney" ? 0.98 : 0.94;

  const previewScaleX = styleId === "gangster" ? 1 : 1;

  const yNudgePercent = styleId === "girlboss" ? -1 : 0;

  const styleDisplay =
    styleId === "disney"
      ? "Cartoon"
      : styleId === "girlboss"
      ? "Girlboss"
      : "Gangster";

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
        <div className="pointer-events-none absolute inset-y-6 left-1/2 w-[70%] -translate-x-1/2 rounded-full bg-amber-200/25 blur-3xl" />

        <div className="absolute inset-0 bg-[radial-gradient(circle_at_10%_0%,rgba(148,163,184,0.35)_0,transparent_40%),radial-gradient(circle_at_80%_90%,rgba(148,163,184,0.45)_0,transparent_55%)] pointer-events-none" />

        <div
          className="absolute"
          style={{
            top: `${PRINT_AREA_TOP_PERCENT}%`,
            left: `${PRINT_AREA_LEFT_PERCENT}%`,
            width: `${PRINT_AREA_WIDTH_PERCENT}%`,
            height: `${PRINT_AREA_HEIGHT_PERCENT}%`,
            pointerEvents: "none",
          }}
        >
          {DEBUG_PRINT_BOX && (
            <div className="absolute inset-0 rounded-xl border-2 border-rose-400/80" />
          )}

          <div
            className="absolute inset-0"
            style={{
              padding: `${SAFE_PADDING_PERCENT}%`,
            }}
          >
            {imageUrl ? (
              <div
                className="w-full h-full flex items-center justify-center"
                style={{
                  transform: `translateY(${yNudgePercent}%) scale(${previewScale}) scaleX(${previewScaleX})`,
                  transformOrigin: "center",
                }}
              >
                <img
                  src={imageUrl}
                  alt="Pet flask artwork preview"
                  className="max-w-full max-h-full object-contain select-none"
                  draggable={false}
                />
              </div>
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <div className="flex flex-col items-center justify-center text-[11px] px-3 text-center rounded-xl bg-white/90 border border-slate-200 shadow-[0_10px_25px_rgba(15,23,42,0.06)]">
                  <span className="text-slate-800">
                    Your final design will appear on the flask here.
                  </span>
                  <span className="mt-1 text-slate-500">
                    Upload a photo, pass the quick check and create your design.
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-white/90 text-[10px] font-medium text-slate-800 border border-slate-200 backdrop-blur flex items-center gap-1 pointer-events-none shadow-sm">
          <span>{hasGeneratedArt ? "Final design" : "No design yet"}</span>
          <span className="opacity-40">·</span>
          <span className="text-amber-600">{styleDisplay}</span>
        </div>
      </div>
    </div>
  );
}