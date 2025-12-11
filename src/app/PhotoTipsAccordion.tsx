// src/app/PhotoTipsAccordion.tsx
"use client";

import { useState } from "react";

export default function PhotoTipsAccordion() {
  const [open, setOpen] = useState(false);

  return (
    <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50/80 text-slate-800">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-3 py-2.5 text-xs font-medium"
      >
        <span>What kind of photo should I upload?</span>
        <span className="ml-2 text-[11px] text-slate-500">
          {open ? "Hide examples" : "Show examples"}
        </span>
      </button>

      {open && (
        <div className="border-t border-slate-200 px-3 py-3 text-[11px] space-y-3 bg-white">
          <div>
            <p className="font-semibold mb-1">Best results:</p>
            <ul className="list-disc list-inside space-y-1 text-slate-700">
              <li>Pet facing the camera (or slightly angled)</li>
              <li>Face and chest visible, not cropped off</li>
              <li>Good lighting — no heavy shadows</li>
              <li>Simple background so your pet stands out</li>
            </ul>
          </div>

          <div>
            <p className="font-semibold mb-1">Try to avoid:</p>
            <ul className="list-disc list-inside space-y-1 text-slate-700">
              <li>Very dark or blurry photos</li>
              <li>Pet tiny in the distance</li>
              <li>Heavy filters or Snapchat-style effects</li>
              <li>Lots of clutter covering the face</li>
            </ul>
          </div>

          <div className="mt-1 grid grid-cols-2 gap-2 text-[10px] text-slate-600">
            <div className="rounded-lg border border-emerald-200 bg-emerald-50/80 px-2 py-1.5">
              <p className="font-semibold text-emerald-700 mb-1">
                ✅ Great example
              </p>
              <p>Close-up, bright, face in focus.</p>
            </div>
            <div className="rounded-lg border border-rose-200 bg-rose-50/80 px-2 py-1.5">
              <p className="font-semibold text-rose-700 mb-1">⚠️ Not ideal</p>
              <p>Very dark, far away or heavily filtered.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
