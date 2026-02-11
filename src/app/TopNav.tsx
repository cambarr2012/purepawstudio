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
                className="h-10 w-auto sm:h-12 object-contain rounded-xl"
                draggable={false}
              />
            </Link>

            {/* Desktop nav */}
            <nav className="hidden sm:flex items-center gap-8 text-[11px] text-slate-500">
              <Link href="/shipping" className="hover:text-slate-900 transition">
                Shipping
              </Link>
              <Link href="/order-help" className="hover:text-slate-900 transition">
                Order help
              </Link>
              <Link
                href="/orders"
                className="px-3 py-1.5 rounded-full bg-slate-900 text-slate-50 border border-slate-900 hover:bg-slate-700 transition"
              >
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
      <div className="h-[86px] sm:h-[92px]" />

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
              className="block rounded-xl border border-slate-200 p-3 hover:bg-slate-50 transition"
            >
              <p className="text-sm font-medium text-slate-900">Shipping</p>
              <p className="text-[11px] text-slate-500">
                Delivery times &amp; costs
              </p>
            </Link>

            <Link
              href="/order-help"
              onClick={() => setOpen(false)}
              className="block rounded-xl border border-slate-200 p-3 hover:bg-slate-50 transition"
            >
              <p className="text-sm font-medium text-slate-900">Order help</p>
              <p className="text-[11px] text-slate-500">
                Questions, changes &amp; returns
              </p>
            </Link>

            <Link
              href="/orders"
              onClick={() => setOpen(false)}
              className="block rounded-xl border border-slate-900 bg-slate-900 p-3 hover:bg-slate-800 transition"
            >
              <p className="text-sm font-medium text-white">My orders</p>
              <p className="text-[11px] text-white/80">
                Track &amp; manage your order
              </p>
            </Link>
          </div>

          {/* Bottom safe-area padding */}
          <div className="h-[max(1rem,env(safe-area-inset-bottom))]" />
        </aside>
      </div>
    </>
  );
}
