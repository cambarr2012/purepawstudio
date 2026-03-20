"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function TopNav() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    if (open) window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  const pillBase =
    "px-4 py-2 rounded-full border text-[11px] transition";
  const pillBorder = "border-[#e7d3a0]";
  const pillFilled = `${pillBase} ${pillBorder} bg-[#f6ebcb]/92 text-slate-800 hover:bg-[#f2e2b3] hover:border-[#daba66]`;

  const cardBase = "block rounded-2xl border p-3 transition";
  const cardBorder = "border-[#e7d3a0]";
  const cardFilled = `${cardBase} ${cardBorder} bg-[#f6ebcb]/92 hover:bg-[#f2e2b3]`;

  return (
    <>
      <header className="relative z-[60]">
        <div className="mx-auto max-w-6xl px-4 pt-[max(0.75rem,env(safe-area-inset-top))] sm:pt-6 lg:pt-8">
          <div className="mx-auto max-w-5xl">
            <div className="flex items-center justify-between gap-4 rounded-[2rem] border border-[#efe2bb] bg-[#fbf7ec]/84 px-4 py-3.5 shadow-[0_8px_22px_rgba(15,23,42,0.04)] backdrop-blur-sm sm:px-6 sm:py-4 lg:px-7 lg:py-4.5">
              <Link
                href="/"
                className="flex items-center gap-3 select-none"
                aria-label="PurePaw Studio"
              >
                <img
                  src="/purepawstudio-logo.png"
                  alt="PurePawStudio logo"
                  className="h-[64px] w-auto rounded-xl object-contain sm:h-[78px] lg:h-[86px]"
                  draggable={false}
                />
              </Link>

              <nav className="hidden sm:flex items-center gap-3">
                <Link href="/how-it-works" className={pillFilled}>
                  How it works
                </Link>
                <Link href="/shipping" className={pillFilled}>
                  Shipping &amp; delivery
                </Link>
                <Link href="/orders" className={pillFilled}>
                  Track your order
                </Link>
              </nav>

              <div className="sm:hidden">
                <button
                  type="button"
                  onClick={() => setOpen(true)}
                  className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-[#e7d3a0] bg-[#f6ebcb]/92 text-slate-900 shadow-[0_4px_10px_rgba(15,23,42,0.04)] transition active:scale-[0.99]"
                  aria-label="Open menu"
                  aria-expanded={open}
                >
                  <span className="text-xl leading-none">☰</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="h-5 sm:h-8 lg:h-10" />

      <div
        className={`fixed inset-0 z-[70] ${
          open ? "pointer-events-auto" : "pointer-events-none"
        }`}
        aria-hidden={!open}
      >
        <button
          type="button"
          onClick={() => setOpen(false)}
          className={`absolute inset-0 transition-opacity duration-200 ${
            open ? "bg-black/24 opacity-100" : "bg-black/0 opacity-0"
          }`}
          aria-label="Close menu"
        />

        <aside
          className={`absolute right-0 top-0 h-full w-[86%] max-w-sm border-l border-[#efe2bb] bg-[#fbf7ec] shadow-2xl transition-transform duration-200 ease-out ${
            open ? "translate-x-0" : "translate-x-full"
          }`}
          role="dialog"
          aria-modal="true"
        >
          <div className="flex items-center justify-between border-b border-[#efe2bb] p-4 pt-[max(1rem,env(safe-area-inset-top))]">
            <p className="text-sm font-semibold text-slate-900">Menu</p>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-full border border-[#e7d3a0] bg-[#f6ebcb]/92 px-3 py-1.5 text-xs text-slate-700"
            >
              Close
            </button>
          </div>

          <div className="space-y-2 p-4">
            <Link
              href="/how-it-works"
              onClick={() => setOpen(false)}
              className={cardFilled}
            >
              <p className="text-sm font-medium text-slate-900">How it works</p>
              <p className="text-[11px] text-slate-600">
                From photo to finished bottle
              </p>
            </Link>

            <Link
              href="/shipping"
              onClick={() => setOpen(false)}
              className={cardFilled}
            >
              <p className="text-sm font-medium text-slate-900">
                Shipping &amp; delivery
              </p>
              <p className="text-[11px] text-slate-600">
                Production, dispatch &amp; timing
              </p>
            </Link>

            <Link
              href="/orders"
              onClick={() => setOpen(false)}
              className={cardFilled}
            >
              <p className="text-sm font-medium text-slate-900">
                Track your order
              </p>
              <p className="text-[11px] text-slate-600">
                Request an email update
              </p>
            </Link>

            <Link
              href="/faq"
              onClick={() => setOpen(false)}
              className={cardFilled}
            >
              <p className="text-sm font-medium text-slate-900">FAQ</p>
              <p className="text-[11px] text-slate-600">
                Quick answers and guidance
              </p>
            </Link>

            <Link
              href="/order-help"
              onClick={() => setOpen(false)}
              className={cardFilled}
            >
              <p className="text-sm font-medium text-slate-900">Contact us</p>
              <p className="text-[11px] text-slate-600">
                Damaged items and support
              </p>
            </Link>
          </div>

          <div className="h-[max(1rem,env(safe-area-inset-bottom))]" />
        </aside>
      </div>
    </>
  );
}