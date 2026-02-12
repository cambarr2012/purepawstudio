"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function TopNav() {
  const [open, setOpen] = useState(false);

  // Lock background scroll when drawer is open
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  // Escape key closes drawer
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    if (open) window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  // Desktop pills
  const pillBase = "px-4 py-2 rounded-full border text-[11px] transition shadow-sm";
  const pillNeutral =
    `${pillBase} border-amber-200/70 bg-white/80 text-slate-700 hover:bg-white hover:border-amber-300`;
  const pillAccent =
    `${pillBase} border-amber-400 bg-white/80 text-slate-900 hover:bg-white hover:border-amber-500`;

  // Drawer cards
  const cardBase = "block rounded-2xl border p-3 transition";
  const cardNeutral =
    `${cardBase} border-amber-200/60 bg-white hover:bg-amber-50/40`;
  const cardAccent =
    `${cardBase} border-amber-400 bg-white hover:bg-amber-50/60`;

  return (
    <>
      {/* FIXED TOP BAR */}
      <header className="fixed left-0 right-0 top-0 z-[60]">
        <div className="mx-auto max-w-6xl px-4 pt-[max(0.75rem,env(safe-area-inset-top))]">
          <div className="flex items-center justify-between gap-4 rounded-full border border-slate-200 bg-white/90 px-5 py-2.5 backdrop-blur-md shadow-[0_18px_45px_rgba(15,23,42,0.08)]">
            {/* Logo */}
            <Link
              href="/"
              className="flex items-center gap-3 select-none"
              aria-label="PurePaw Studio"
            >
              <img
                src="/purepawstudio-logo.png"
                alt="PurePawStudio logo"
                className="h-[60px] w-auto sm:h-[78px] object-contain rounded-xl"
                draggable={false}
              />
            </Link>

            {/* Desktop nav (ALL pills) */}
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

            {/* Mobile button */}
            <div className="sm:hidden">
              <button
                type="button"
                onClick={() => setOpen(true)}
                className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-3 py-2 text-slate-900 shadow-sm active:scale-[0.99] transition"
                aria-label="Open menu"
                aria-expanded={open}
              >
                <span className="text-lg leading-none">☰</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Spacer so fixed header doesn't overlap content */}
      <div className="h-[116px] sm:h-[140px]" />

      {/* DRAWER */}
      <div
        className={`fixed inset-0 z-[70] ${
          open ? "pointer-events-auto" : "pointer-events-none"
        }`}
        aria-hidden={!open}
      >
        {/* Backdrop */}
        <button
          type="button"
          onClick={() => setOpen(false)}
          className={`absolute inset-0 transition-opacity duration-200 ${
            open ? "opacity-100 bg-black/40" : "opacity-0 bg-black/0"
          }`}
          aria-label="Close menu"
        />

        {/* Panel */}
        <aside
          className={`absolute right-0 top-0 h-full w-[86%] max-w-sm bg-white shadow-2xl border-l border-slate-200 transition-transform duration-200 ease-out
          ${open ? "translate-x-0" : "translate-x-full"}`}
          role="dialog"
          aria-modal="true"
        >
          <div className="p-4 flex items-center justify-between border-b border-slate-200 pt-[max(1rem,env(safe-area-inset-top))]">
            <p className="text-sm font-semibold text-slate-900">Menu</p>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-full border border-slate-200 px-3 py-1.5 text-xs text-slate-700"
            >
              Close
            </button>
          </div>

          <div className="p-4 space-y-2">
            <Link
              href="/shipping"
              onClick={() => setOpen(false)}
              className={cardNeutral}
            >
              <p className="text-sm font-medium text-slate-900">Shipping</p>
              <p className="text-[11px] text-slate-500">Delivery &amp; production</p>
            </Link>

            <Link
              href="/order-help"
              onClick={() => setOpen(false)}
              className={cardNeutral}
            >
              <p className="text-sm font-medium text-slate-900">Order help</p>
              <p className="text-[11px] text-slate-500">Support &amp; changes</p>
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
