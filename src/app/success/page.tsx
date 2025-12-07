// src/app/success/page.tsx
"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

export default function SuccessPage() {
  const searchParams = useSearchParams();

  // Handle both session_id and sessionId just in case
  const raw = searchParams.get("session_id") || searchParams.get("sessionId");
  const sessionId = raw && raw.trim().length > 0 ? raw : null;

  // If there is literally no session id in the URL at all
  if (!sessionId) {
    return (
      <main className="min-h-screen bg-slate-950 text-slate-50 flex items-center justify-center">
        <div className="max-w-md text-center px-6">
          <h1 className="text-2xl md:text-3xl font-semibold mb-3 text-teal-300">
            Payment successful 🎉
          </h1>
          <p className="text-sm text-slate-300 mb-4">
            We couldn&apos;t find a payment reference in this link.
          </p>
          <p className="text-xs text-slate-500 mb-6">
            This can happen if the page was opened directly (without coming
            from Stripe) or the URL was modified.
          </p>
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-full bg-teal-400 px-4 py-2 text-xs font-medium text-slate-950 hover:bg-teal-300 transition"
          >
            Return to the studio
          </Link>
        </div>
      </main>
    );
  }

  // We have a session id in the URL – treat it as a valid payment reference for MVP
  const orderReference = sessionId;

  return (
    <main className="min-h-screen bg-slate-950 text-slate-50 flex items-center justify-center">
      <div className="max-w-lg w-full px-6 text-center">
        <h1 className="text-2xl md:text-3xl font-semibold mb-3 text-teal-300">
          Payment successful 🎉
        </h1>

        <p className="text-sm text-slate-200 mb-2">
          Thank you for ordering your custom pet flask.
        </p>
        <p className="text-xs text-slate-400 mb-4">
          We&apos;ve received your payment and will start preparing your artwork
          for printing.
        </p>

        <div className="mt-4 inline-flex flex-col gap-2 items-start mx-auto text-left bg-slate-900/70 border border-slate-700 rounded-xl px-4 py-3 text-xs">
          <p>
            <span className="font-semibold text-slate-200">
              Order reference:
            </span>{" "}
            <span className="font-mono text-slate-300">{orderReference}</span>
          </p>
          <p className="text-slate-400 mt-1">
            If you ever need help with this order, just quote this reference and
            we&apos;ll find it instantly.
          </p>
        </div>

        <p className="mt-5 text-[11px] text-slate-500">
          You don&apos;t need to keep this page open — we&apos;ll use this
          reference internally to print and ship your flask.
        </p>

        <div className="mt-6 flex justify-center gap-3 text-xs">
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-full bg-teal-400 px-4 py-2 font-medium text-slate-950 hover:bg-teal-300 transition"
          >
            Back to studio
          </Link>
          <Link
            href="/orders"
            className="inline-flex items-center justify-center rounded-full border border-slate-700 px-4 py-2 font-medium text-slate-200 hover:border-slate-500 hover:bg-slate-900/60 transition"
          >
            View my orders
          </Link>
        </div>
      </div>
    </main>
  );
}
