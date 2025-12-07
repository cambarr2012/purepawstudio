"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Suspense, useState } from "react";
import { CheckCircle, Copy } from "lucide-react";

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
      : sessionId;

  const copyToClipboard = () => {
    if (!sessionId) return;
    navigator.clipboard.writeText(sessionId);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <main className="min-h-screen bg-slate-950 text-slate-50 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-lg">
        {/* Success Heading */}
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-semibold text-teal-300 flex justify-center items-center gap-2">
            Payment successful 🎉
          </h1>

          <p className="text-slate-400 text-sm mt-2">
            Thank you for your purchase! Your order is now being prepared.
          </p>
        </div>

        {/* Main Card */}
        <div className="bg-slate-900/70 backdrop-blur-md border border-slate-800 rounded-2xl p-6 shadow-xl">
          {sessionId ? (
            <>
              <h2 className="text-lg font-semibold text-slate-200 mb-2">
                Order reference
              </h2>

              <div className="flex items-center justify-between bg-slate-800/60 rounded-xl px-4 py-3 border border-slate-700">
                <code className="text-slate-300 font-mono text-sm truncate mr-3">
                  {truncated}
                </code>

                <button
                  onClick={copyToClipboard}
                  className="text-slate-300 hover:text-teal-300 transition"
                  title="Copy full reference"
                >
                  {copied ? (
                    <CheckCircle size={18} className="text-teal-300" />
                  ) : (
                    <Copy size={18} />
                  )}
                </button>
              </div>

              <p className="text-xs text-slate-500 mt-3">
                Your full payment reference has been securely stored. You’ll
                also receive a confirmation email shortly.
              </p>
            </>
          ) : (
            <>
              <h2 className="text-lg font-semibold text-slate-200 mb-3">
                We couldn’t find your reference
              </h2>
              <p className="text-sm text-slate-400">
                This is rare — but your payment did go through. If you need
                help, contact support with your email and the time of payment.
              </p>
            </>
          )}

          {/* What happens next */}
          <div className="mt-6 border-t border-slate-800 pt-5">
            <h3 classname="text-sm font-semibold text-slate-200">
              What happens next?
            </h3>
            <ul className="text-xs text-slate-400 mt-2 space-y-1.5">
              <li>• Your artwork file is now being prepared for printing.</li>
              <li>• We’ll inspect the design for quality and alignment.</li>
              <li>• Your flask will be printed and shipped shortly.</li>
            </ul>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex justify-center gap-3 mt-8 text-sm">
          <Link
            href="/"
            className="rounded-full bg-teal-400 text-slate-950 px-5 py-2 font-medium hover:bg-teal-300 transition"
          >
            Back to studio
          </Link>

          <Link
            href="/orders"
            className="rounded-full border border-slate-700 px-5 py-2 text-slate-200 font-medium hover:bg-slate-900/50 hover:border-slate-500 transition"
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
    <Suspense fallback={<div className="text-white p-10 text-center">Loading…</div>}>
      <SuccessInner />
    </Suspense>
  );
}
