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
    <main className="min-h-screen bg-slate-950 text-slate-50">
      <div className="w-full max-w-2xl mx-auto px-4 py-10 md:py-12">
        <div className="mb-6 flex items-center justify-between">
          <button
            onClick={() => history.back()}
            className="text-[11px] text-slate-400 hover:text-slate-100 transition"
            type="button"
          >
            ← Back
          </button>
          <Link
            href="/"
            className="text-[11px] text-teal-300 hover:text-teal-100 transition"
          >
            Return to studio
          </Link>
        </div>

        <header className="mb-6">
          <p className="text-[11px] uppercase tracking-[0.25em] text-teal-300/80 mb-2">
            My orders
          </p>
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight mb-2">
            Check your order status
          </h1>
          <p className="text-sm md:text-base text-slate-300">
            We&apos;re building a live tracking view for your PurePawStudio
            orders. For now this page explains how to find updates.
          </p>
        </header>

        <section className="space-y-5 text-sm text-slate-300">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
            <h2 className="text-base font-medium mb-1 text-slate-50">
              Coming soon: live order lookup
            </h2>
            <p className="text-[13px] text-slate-300">
              Soon you&apos;ll be able to enter your order ID or email here and
              see a live status:{" "}
              <span className="italic">
                Received → In production → Shipped
              </span>{" "}
              plus tracking info when available.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
            <h2 className="text-base font-medium mb-2 text-slate-50">
              Quick lookup (MVP)
            </h2>
            <p className="text-[13px] text-slate-300 mb-3">
              While we finish the tracking system, you can still reach out using
              your order ID or the email you used at checkout.
            </p>

            <form onSubmit={handleSubmit} className="space-y-2 text-[11px]">
              <label className="flex flex-col gap-1">
                <span className="text-slate-200">
                  Order ID or checkout email
                </span>
                <input
                  type="text"
                  value={lookupValue}
                  onChange={(e) => setLookupValue(e.target.value)}
                  className="rounded-md border border-slate-700 bg-slate-900 px-2 py-1.5 text-xs outline-none focus:ring-2 focus:ring-teal-500"
                  placeholder="Paste your order ID or email"
                  disabled={submitting}
                />
              </label>
              <button
                type="submit"
                disabled={submitting || !lookupValue}
                className="mt-2 w-full rounded-lg bg-teal-400 text-slate-950 text-xs font-medium py-2 disabled:opacity-60 hover:bg-teal-300 transition"
              >
                {submitting ? "Checking…" : "Request an update"}
              </button>
            </form>

            {message && (
              <p className="mt-2 text-[11px] text-slate-400">{message}</p>
            )}

            <p className="mt-4 text-[12px] text-slate-400">
              Alternatively, email{" "}
              <span className="font-mono text-teal-300">
                support@purepawstudio.com
              </span>{" "}
              with your order details and we&apos;ll reply with a status update.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
            <h2 className="text-base font-medium mb-1 text-slate-50">
              Where else to check
            </h2>
            <ul className="mt-2 space-y-1 text-[13px] text-slate-300">
              <li>• Your email inbox for our confirmation email</li>
              <li>• Your Stripe receipt for payment confirmation</li>
              <li>
                •{" "}
                <Link
                  href="/shipping"
                  className="text-teal-300 hover:text-teal-200"
                >
                  Shipping page
                </Link>{" "}
                for current production + delivery timelines
              </li>
            </ul>
          </div>
        </section>
      </div>
    </main>
  );
}
