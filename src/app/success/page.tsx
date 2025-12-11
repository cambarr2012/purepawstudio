"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Suspense, useState } from "react";

function SuccessInner() {
  const searchParams = useSearchParams();
  const sessionId =
    searchParams.get("session_id") ||
    searchParams.get("sessionId") ||
    null;

  const [copied, setCopied] = useState(false);

  const truncated =
    sessionId && sessionId.length > 24
      ? sessionId.slice(0, 24) + "…"
      : sessionId || "";

  const copyToClipboard = () => {
    if (!sessionId) return;
    navigator.clipboard.writeText(sessionId);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <main className="min-h-screen bg-[#f7f3ec] text-slate-900 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-lg">
        {/* Heading */}
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-semibold text-amber-700">
            Order complete 🎉
          </h1>
          <p className="text-slate-700 text-sm mt-2">
            Thank you for your purchase — your PurePaw Flask is officially on its way.
          </p>
        </div>

        {/* Card */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          {sessionId ? (
            <>
              <h2 className="text-lg font-semibold text-slate-900 mb-2">
                Order reference
              </h2>

              <div className="flex items-center justify-between bg-[#fdfaf4] rounded-xl px-4 py-3 border border-slate-200">
                <code className="text-slate-700 font-mono text-sm truncate mr-3">
                  {truncated}
                </code>
                <button
                  onClick={copyToClipboard}
                  className="text-xs px-3 py-1 rounded-full border border-slate-300 hover:border-amber-600 hover:text-amber-700 transition"
                >
                  {copied ? "Copied" : "Copy"}
                </button>
              </div>

              <p className="text-xs text-slate-600 mt-3">
                Keep this reference handy — it helps us find your order instantly if you ever need support.
              </p>
            </>
          ) : (
            <>
              <h2 className="text-lg font-semibold text-slate-900 mb-3">
                Order reference missing
              </h2>
              <p className="text-sm text-slate-700">
                Your payment went through successfully, but the reference
                wasn’t included in this link. If you need any help, email us
                with your checkout email and approximate purchase time.
              </p>
            </>
          )}

          {/* What happens next */}
          <div className="mt-6 border-t border-slate-200 pt-5">
            <h3 className="text-sm font-semibold text-slate-900">
              What happens next?
            </h3>
            <ul className="text-xs text-slate-700 mt-2 space-y-1.5 leading-relaxed">
              <li>• Your pet artwork has already been sent to production.</li>
              <li>• Your PurePaw Flask will be printed on a premium 500ml stainless bottle.</li>
              <li>• You’ll receive an email update once it dispatches.</li>
              <li>• Your flask includes a scannable QR memory page — share it with friends once it arrives!</li>
            </ul>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex justify-center gap-3 mt-8 text-sm">
          <Link
            href="/"
            className="rounded-full bg-slate-900 text-white px-5 py-2 font-medium hover:bg-slate-800 transition"
          >
            Back to studio
          </Link>
          <Link
            href="/orders"
            className="rounded-full border border-slate-300 px-5 py-2 text-slate-900 font-medium hover:bg-[#f9f4ed] transition"
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
    <Suspense fallback={<div className="p-10 text-center">Loading…</div>}>
      <SuccessInner />
    </Suspense>
  );
}
