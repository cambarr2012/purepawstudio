"use client";

import { useState } from "react";
import Link from "next/link";

export default function TopNav() {
  const [open, setOpen] = useState(false);

  return (
    <div className="mb-6 flex items-center justify-between gap-4 rounded-full border border-slate-200 bg-white/80 px-5 md:px-8 py-2.5 md:py-3.5 backdrop-blur-sm shadow-[0_18px_45px_rgba(15,23,42,0.06)]">
      {/* Logo */}
      <div className="flex items-center gap-3">
        <img
          src="/purepawstudio-logo.png"
          alt="PurePawStudio logo"
          className="h-12 w-auto sm:h-14 object-contain select-none rounded-xl"
        />
      </div>

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

      {/* Mobile hamburger */}
      <div className="sm:hidden">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-3 py-2 text-slate-900 shadow-sm"
          aria-label="Open menu"
        >
          <span className="text-lg leading-none">☰</span>
        </button>
      </div>

      {/* Drawer */}
      {open && (
        <div className="fixed inset-0 z-50">
          {/* backdrop */}
          <button
            type="button"
            className="absolute inset-0 bg-black/35"
            aria-label="Close menu"
            onClick={() => setOpen(false)}
          />

          {/* panel */}
          <div className="absolute right-0 top-0 h-full w-[86%] max-w-sm bg-white shadow-2xl border-l border-slate-200">
            <div className="p-4 flex items-center justify-between border-b border-slate-200">
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
          </div>
        </div>
      )}
    </div>
  );
}
