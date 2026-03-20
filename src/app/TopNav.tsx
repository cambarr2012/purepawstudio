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
    "px-4 py-2 rounded-full border text-[11px] transition shadow-sm";
  const pillBorder = "border-amber-200/70";
  const pillNeutral = `${pillBase} ${pillBorder} bg-white/80 text-slate-700 hover:bg-white hover:border-amber-300`;
  const pillAccent = `${pillBase} ${pillBorder} bg-white/80 text-slate-900 hover:bg-white hover:border-amber-300`;

  const cardBase = "block rounded-2xl border p-3 transition";
  const cardBorder = "border-amber-200/60";
  const cardNeutral = `${cardBase} ${cardBorder} bg-white hover:bg-amber-50/40`;
  const cardAccent = `${cardBase} ${cardBorder} bg-white hover:bg-amber-50/60`;

  return (
    <>
      <header className="relative z-[60]">
        <div className="mx-auto max-w-6xl px-4 pt-[max(0.75rem,env(safe-area-inset-top))] sm:pt-6 lg:pt-8">
          <div className="mx-auto max-w-5xl">
            <div className="flex items-center justify-between gap-4 rounded-[2rem] border border-slate-200 bg-white/90 px-4 py-3 backdrop-blur-md shadow-[0_18px_45px_rgba(15,23,42,0.08)] sm:px-6 sm:py-3.5 lg:px-7">
              <Link
                href="/"
                className="flex items-center gap-3 select-none"
                aria-label="PurePaw Studio"
              >
                <img
                  src="/purepawstudio-logo.png"
                  alt="PurePawStudio logo"
                  className="h-[52px] w-auto rounded-xl object-contain sm:h-[64px] lg:h-[70px]"
                  draggable={false}
                />
              </Link>

              <nav className="hidden sm:flex items-center gap-3">
                <Link href="/shipping" className={pillNeutral}>
                  Shipping
                </Link>
                <Link href="/order-help" className={pillNeutral}>
                  Order help
                </Link>
                <Link href="/orders" className={pillAccent}>
                  My orders
                </Link>
              </nav>

              <div className="sm:hidden">
                <button
                  type="button"
                  onClick={() => setOpen(true)}
                  className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-900 shadow-sm transition active:scale-[0.99]"
                  aria-label="Open menu"
                  aria-expanded={open}
                >
                  <span className="text-lg leading-none">☰</span>
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
            open ? "bg-black/40 opacity-100" : "bg-black/0 opacity-0"
          }`}
          aria-label="Close menu"
        />

        <aside
          className={`absolute right-0 top-0 h-full w-[86%] max-w-sm border-l border-slate-200 bg-white shadow-2xl transition-transform duration-200 ease-out ${
            open ? "translate-x-0" : "translate-x-full"
          }`}
          role="dialog"
          aria-modal="true"
        >
          <div className="flex items-center justify-between border-b border-slate-200 p-4 pt-[max(1rem,env(safe-area-inset-top))]">
            <p className="text-sm font-semibold text-slate-900">Menu</p>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-full border border-slate-200 px-3 py-1.5 text-xs text-slate-700"
            >
              Close
            </button>
          </div>

          <div className="space-y-2 p-4">
            <Link
              href="/shipping"
              onClick={() => setOpen(false)}
              className={cardNeutral}
            >
              <p className="text-sm font-medium text-slate-900">Shipping</p>
              <p className="text-[11px] text-slate-500">
                Delivery &amp; production
              </p>
            </Link>

            <Link
              href="/order-help"
              onClick={() => setOpen(false)}
              className={cardNeutral}
            >
              <p className="text-sm font-medium text-slate-900">Order help</p>
              <p className="text-[11px] text-slate-500">
                Support &amp; changes
              </p>
            </Link>

            <Link
              href="/orders"
              onClick={() => setOpen(false)}
              className={cardAccent}
            >
              <p className="text-sm font-medium text-slate-900">My orders</p>
              <p className="text-[11px] text-slate-600">Track &amp; manage</p>
            </Link>
          </div>

          <div className="h-[max(1rem,env(safe-area-inset-bottom))]" />
        </aside>
      </div>
    </>
  );
}