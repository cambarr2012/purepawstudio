"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";

function SuccessInner() {
  const searchParams = useSearchParams();

  const sessionId =
    searchParams.get("session_id") ||
    searchParams.get("sessionId") ||
    null;

  return (
    <main className="min-h-screen bg-slate-950 text-slate-50 flex items-center justify-center">
      <div className="max-w-lg w-full px-6 text-center">
        <h1 className="text-2xl md:text-3xl font-semibold mb-3 text-teal-300">
          Payment successful 🎉
        </h1>

        {sessionId ? (
          <>
            <p className="text-sm text-slate-200 mb-2">
              Thank you for your purchase!
            </p>
            <p className="text-xs text-slate-400 mb-4">
              Your payment reference is below.
            </p>

            <div className="mt-4 inline-flex flex-col gap-2 items-start mx-auto text-left bg-slate-900/70 border border-slate-700 rounded-xl px-4 py-3 text-xs">
              <p>
                <span className="font-semibold text-slate-200">
                  Order reference:
                </span>{" "}
                <span className="font-mono text-slate-300">{sessionId}</span>
              </p>
            </div>
          </>
        ) : (
          <>
            <p className="text-sm text-slate-200 mb-2">
              Your payment was successful, but we could not read the reference.
            </p>
            <p className="text-xs text-slate-400 mb-4">
              This happens if the page was preloaded or refreshed.
            </p>
          </>
        )}

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

export default function SuccessPage() {
  return (
    <Suspense fallback={<div className="text-white p-10">Loading…</div>}>
      <SuccessInner />
    </Suspense>
  );
}
