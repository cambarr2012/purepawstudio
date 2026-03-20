"use client";

import { useState } from "react";

export default function PhotoTipsAccordion() {
  const [open, setOpen] = useState(false);

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
        aria-expanded={open}
        aria-controls="photo-tips-panel"
      >
        <div className="min-w-0">
          <p className="text-sm font-medium text-slate-900">
            What kind of photo should I upload?
          </p>
          <p className="text-[11px] text-slate-500">
            Front-facing portrait photos usually work best.
          </p>
        </div>

        <span className="whitespace-nowrap text-[11px] font-medium text-slate-500 transition hover:text-slate-900">
          {open ? "Hide examples" : "Show examples"}
        </span>
      </button>

      {open && (
        <div
          id="photo-tips-panel"
          className="border-t border-slate-200 px-4 pb-4 pt-3"
        >
          <div className="grid gap-4">
            <div className="rounded-xl border border-amber-100 bg-amber-50/70 px-3 py-3">
              <p className="text-[12px] font-medium text-amber-900">
                PurePaw works best with portrait-style pet photos.
              </p>
              <p className="mt-1 text-[11px] leading-5 text-slate-600">
                The strongest results usually come from clear, front-facing
                photos where the face is visible and the pet is looking towards
                the camera.
              </p>
            </div>

            <div>
              <p className="mb-2 text-xs font-semibold text-slate-900">
                Best results:
              </p>
              <ul className="list-disc space-y-1.5 pl-5 text-[12px] text-slate-600">
                <li>Front-facing pet portraits or only a very slight angle</li>
                <li>Face clear and in focus, with eyes visible</li>
                <li>Head and a little chest visible, not cropped too tightly</li>
                <li>Bright, even lighting and a clean-looking photo</li>
              </ul>
            </div>

            <div>
              <p className="mb-2 text-xs font-semibold text-slate-900">
                Less ideal for this product:
              </p>
              <ul className="list-disc space-y-1.5 pl-5 text-[12px] text-slate-600">
                <li>Side profiles or photos taken at a strong angle</li>
                <li>Pets that are far away or tiny in the frame</li>
                <li>Very dark, blurry, or heavily filtered photos</li>
                <li>Anything covering the face or eyes</li>
              </ul>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 overflow-hidden">
                <div className="flex items-center gap-2 px-3 py-2">
                  <span className="text-sm">✅</span>
                  <p className="text-[12px] font-semibold text-emerald-800">
                    Strong examples
                  </p>
                </div>

                <div className="space-y-3 px-3 pb-3">
                  <div className="rounded-lg border border-emerald-200 bg-white overflow-hidden">
                    <div className="aspect-[4/3] w-full">
                      <img
                        src="/goodexampleuse1.jpeg"
                        alt="Strong example of a front-facing pet portrait"
                        className="h-full w-full object-cover"
                        loading="lazy"
                      />
                    </div>
                  </div>

                  <div className="rounded-lg border border-emerald-200 bg-white overflow-hidden">
                    <div className="aspect-[4/3] w-full">
                      <img
                        src="/goodexampleuse2.jpeg"
                        alt="Another strong example of a front-facing pet portrait"
                        className="h-full w-full object-cover"
                        loading="lazy"
                      />
                    </div>
                  </div>

                  <p className="text-[11px] text-emerald-800">
                    Front-facing, clear, portrait-style, and easy for the face
                    to read.
                  </p>
                </div>
              </div>

              <div className="rounded-xl border border-rose-200 bg-rose-50 overflow-hidden">
                <div className="flex items-center gap-2 px-3 py-2">
                  <span className="text-sm">⚠️</span>
                  <p className="text-[12px] font-semibold text-rose-800">
                    Less ideal examples
                  </p>
                </div>

                <div className="space-y-3 px-3 pb-3">
                  <div className="rounded-lg border border-rose-200 bg-white overflow-hidden">
                    <div className="aspect-[4/3] w-full">
                      <img
                        src="/badexampleuse1.jpeg"
                        alt="Less ideal example of a side-profile pet photo"
                        className="h-full w-full object-cover"
                        loading="lazy"
                      />
                    </div>
                  </div>

                  <div className="rounded-lg border border-rose-200 bg-white overflow-hidden">
                    <div className="aspect-[4/3] w-full">
                      <img
                        src="/badexampleuse2.jpeg"
                        alt="Another less ideal example of a side-profile pet photo"
                        className="h-full w-full object-cover"
                        loading="lazy"
                      />
                    </div>
                  </div>

                  <p className="text-[11px] text-rose-800">
                    Lovely photos, but weaker for PurePaw because the pet is
                    turned side-on rather than portrait-style.
                  </p>
                </div>
              </div>
            </div>

            <p className="text-[11px] text-slate-500">
              Tip: if you only have a few photos, pick the sharpest one where
              the face is most visible. We can handle most backgrounds.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}