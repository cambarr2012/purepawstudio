"use client";

import { useState, FormEvent } from "react";
import Link from "next/link";

export default function OrdersPage() {
  const [lookupValue, setLookupValue] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    // Placeholder behaviour for now
    setSubmitting(true);
    setMessage(
      "Order lookup is coming soon. For now, please check your confirmation email or contact support with your order details."
    );
    setTimeout(() => setSubmitting(false), 500);
  }

  return (
    <main className="min-h-screen bg-[#f7f3ec] text-slate-900">
      <div className="w-full max-w-3xl mx-auto px-4 py-10 md:py-12">
        {/* Top bar */}
        <div className="mb-6 flex items-center justify-between">
          <button
            onClick={() => history.back()}
            className="text-[11px] text-slate-500 hover:text-slate-800 transition"
            type="button"
          >
            ← Back
          </button>
          <Link
            href="/"
            className="text-[11px] text-slate-700 hover:text-slate-900 underline-offset-2 hover:underline transition"
          >
            Return to studio
          </Link>
        </div>

        {/* Header */}
        <header className="mb-6">
          <p className="text-[11px] uppercase tracking-[0.25em] text-amber-600/80 mb-2">
            My orders
          </p>
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight mb-2">
            Check your order status
          </h1>
          <p className="text-sm md:text-base text-slate-700">
            We&apos;re building a live tracking view for your PurePaw Studio
            orders. For now this page explains how to get updates.
          </p>
        </header>

        <section className="space-y-5 text-sm">
          {/* Coming soon */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="text-base font-medium mb-1 text-slate-900">
              Coming soon: live order lookup
            </h2>
            <p className="text-[13px] text-slate-700">
              Soon you&apos;ll be able to enter your order ID or email here and
              see a live status:{" "}
              <span className="italic">
                Received → In production → Shipped
              </span>{" "}
              plus tracking info when available.
            </p>
          </div>

          {/* MVP lookup form */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="text-base font-medium mb-2 text-slate-900">
              Quick lookup (for now)
            </h2>
            <p className="text-[13px] text-slate-700 mb-3">
              While we finish the tracking system, you can still reach out using
              your order ID or the email you used at checkout.
            </p>

            <form onSubmit={handleSubmit} className="space-y-2 text-[11px]">
              <label className="flex flex-col gap-1">
                <span className="text-slate-800">
                  Order ID or checkout email
                </span>
                <input
                  type="text"
                  value={lookupValue}
                  onChange={(e) => setLookupValue(e.target.value)}
                  className="rounded-md border border-slate-300 bg-white px-2 py-1.5 text-xs text-slate-900 outline-none focus:ring-2 focus:ring-amber-400"
                  placeholder="Paste your order ID or email"
                  disabled={submitting}
                />
              </label>
              <button
                type="submit"
                disabled={submitting || !lookupValue}
                className="mt-2 w-full rounded-lg bg-slate-900 text-slate-50 text-xs font-medium py-2 disabled:opacity-60 hover:bg-slate-800 transition"
              >
                {submitting ? "Checking…" : "Request an update"}
              </button>
            </form>

            {message && (
              <p className="mt-2 text-[11px] text-slate-600">{message}</p>
            )}

            <p className="mt-4 text-[12px] text-slate-600">
              Alternatively, email{" "}
              <span className="font-mono text-[12px] text-amber-700">
                support@purepawstudio.com
              </span>{" "}
              with your order details and we&apos;ll reply with a status
              update.
            </p>
          </div>

          {/* Where else to check */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="text-base font-medium mb-1 text-slate-900">
              Where else to check
            </h2>
            <ul className="mt-2 space-y-1 text-[13px] text-slate-700">
              <li>• Your email inbox for our confirmation email</li>
              <li>• Your Stripe receipt for payment confirmation</li>
              <li>
                •{" "}
                <Link
                  href="/shipping"
                  className="text-amber-700 hover:text-amber-600 underline-offset-2 hover:underline"
                >
                  Shipping page
                </Link>{" "}
                for current production and delivery timelines
              </li>
            </ul>
          </div>
        </section>
      </div>
    </main>
  );
}
