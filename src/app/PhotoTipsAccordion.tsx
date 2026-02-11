"use client";

import { useState } from "react";

export default function PhotoTipsAccordion() {
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full px-4 py-3 flex items-center justify-between gap-3 text-left"
        aria-expanded={open}
        aria-controls="photo-tips-panel"
      >
        <div className="min-w-0">
          <p className="text-sm font-medium text-slate-900">
            What kind of photo should I upload?
          </p>
          <p className="text-[11px] text-slate-500">
            Quick tips to get the best portrait.
          </p>
        </div>

        <span className="text-[11px] font-medium text-slate-500 hover:text-slate-900 transition whitespace-nowrap">
          {open ? "Hide examples" : "Show examples"}
        </span>
      </button>

      {open && (
        <div
          id="photo-tips-panel"
          className="px-4 pb-4 pt-1 border-t border-slate-200"
        >
          <div className="grid gap-4">
            <div>
              <p className="text-xs font-semibold text-slate-900 mb-2">
                Best results:
              </p>
              <ul className="space-y-1.5 text-[12px] text-slate-600 list-disc pl-5">
                <li>Pet facing the camera (or slightly angled)</li>
                <li>Face (and a bit of chest) visible — not cropped off</li>
                <li>Bright, even lighting — avoid heavy shadows</li>
                <li>Simple background so your pet stands out</li>
              </ul>
            </div>

            <div>
              <p className="text-xs font-semibold text-slate-900 mb-2">
                Try to avoid:
              </p>
              <ul className="space-y-1.5 text-[12px] text-slate-600 list-disc pl-5">
                <li>Very dark or blurry photos</li>
                <li>Pet tiny in the distance</li>
                <li>Heavy filters / Snapchat-style effects</li>
                <li>Clutter covering the face</li>
              </ul>
            </div>

            {/* Visual examples */}
            <div className="grid gap-3 sm:grid-cols-2">
              {/* Good */}
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 overflow-hidden">
                <div className="px-3 py-2 flex items-center gap-2">
                  <span className="text-sm">✅</span>
                  <p className="text-[12px] font-semibold text-emerald-800">
                    Great example
                  </p>
                </div>
                <div className="px-3 pb-3">
                  <div className="relative rounded-lg overflow-hidden border border-emerald-200 bg-white">
                    <div className="aspect-[4/3] w-full">
                      <img
                        src="/goodphoto.jpeg"
                        alt="Great example pet photo"
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    </div>
                  </div>
                  <p className="mt-2 text-[11px] text-emerald-800">
                    Close-up, bright, face in focus.
                  </p>
                </div>
              </div>

              {/* Bad */}
              <div className="rounded-xl border border-rose-200 bg-rose-50 overflow-hidden">
                <div className="px-3 py-2 flex items-center gap-2">
                  <span className="text-sm">⚠️</span>
                  <p className="text-[12px] font-semibold text-rose-800">
                    Not ideal
                  </p>
                </div>
                <div className="px-3 pb-3">
                  <div className="relative rounded-lg overflow-hidden border border-rose-200 bg-white">
                    <div className="aspect-[4/3] w-full">
                      <img
                        src="/badphoto.png"
                        alt="Not ideal pet photo"
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    </div>
                  </div>
                  <p className="mt-2 text-[11px] text-rose-800">
                    Too dark, far away, or heavily filtered.
                  </p>
                </div>
              </div>
            </div>

            <p className="text-[11px] text-slate-500">
              Tip: If you only have one photo, pick the sharpest one — we can
              handle most backgrounds.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
