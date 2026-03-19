"use client";

import { useState, FormEvent } from "react";
import Link from "next/link";

export default function OrdersPage() {
  const [lookupValue, setLookupValue] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setMessage(
      "Thanks — live order lookup is being finalised. For now, please check your confirmation email or contact support with your order ID or checkout email and we’ll send you an update."
    );
    setTimeout(() => setSubmitting(false), 500);
  }

  return (
    <main className="min-h-screen bg-[#f7f3ec] text-slate-900">
      <div className="w-full max-w-3xl mx-auto px-4 py-10 md:py-12">
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

        <header className="mb-8">
          <p className="mb-3 inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.28em] text-amber-700 shadow-sm">
            PurePaw Order Tracking
          </p>

          <h1 className="text-3xl md:text-4xl font-semibold tracking-tight text-slate-950 mb-3">
            Order updates
            <span className="block text-slate-700">tracking and support</span>
          </h1>

          <p className="max-w-2xl text-sm md:text-base leading-7 text-slate-700">
            We’ll keep you updated as your PurePaw Studio order moves through
            production and dispatch. Tracking details are added once your order
            has been shipped.
          </p>
        </header>

        <section className="space-y-5 text-sm">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold mb-2 text-slate-900">
              What to expect
            </h2>
            <div className="space-y-3 text-[14px] leading-7 text-slate-700">
              <p>
                After checkout, you should receive an order confirmation by
                email.
              </p>
              <p>
                Once your order has been dispatched, we’ll send your tracking
                details by email.
              </p>
              <p>
                Production and delivery times can vary slightly depending on the
                product and destination, so our{" "}
                <Link
                  href="/shipping"
                  className="font-medium text-amber-700 hover:text-amber-600 underline-offset-2 hover:underline"
                >
                  shipping page
                </Link>{" "}
                is the best place to check current timelines.
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold mb-2 text-slate-900">
              Request an order update
            </h2>
            <p className="text-[14px] leading-7 text-slate-700 mb-3">
              Enter your order ID or the email used at checkout and we’ll point
              you in the right direction while live order lookup is being
              completed.
            </p>

            <form onSubmit={handleSubmit} className="space-y-3 text-[11px]">
              <label className="flex flex-col gap-1">
                <span className="text-slate-800">
                  Order ID or checkout email
                </span>
                <input
                  type="text"
                  value={lookupValue}
                  onChange={(e) => setLookupValue(e.target.value)}
                  className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-amber-400"
                  placeholder="Paste your order ID or email"
                  disabled={submitting}
                />
              </label>
              <button
                type="submit"
                disabled={submitting || !lookupValue}
                className="mt-2 w-full rounded-lg bg-slate-900 text-slate-50 text-sm font-medium py-2.5 disabled:opacity-60 hover:bg-slate-800 transition"
              >
                {submitting ? "Checking…" : "Request an update"}
              </button>
            </form>

            {message && (
              <p className="mt-3 text-[12px] leading-6 text-slate-600">
                {message}
              </p>
            )}
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold mb-2 text-slate-900">
              Helpful order information
            </h2>
            <ul className="space-y-2 text-[14px] leading-7 text-slate-700">
              <li>• Keep your order confirmation email handy</li>
              <li>• Check your inbox and junk folder for shipping updates</li>
              <li>• Tracking is sent once your order has been dispatched</li>
              <li>
                • For delivery timelines, visit our{" "}
                <Link
                  href="/shipping"
                  className="font-medium text-amber-700 hover:text-amber-600 underline-offset-2 hover:underline"
                >
                  shipping page
                </Link>
              </li>
            </ul>

            <p className="mt-4 text-[13px] leading-6 text-slate-600">
              Need help? Email{" "}
              <span className="font-mono text-[13px] text-amber-700">
                support@purepawstudio.com
              </span>{" "}
              with your order ID or checkout email and we’ll get back to you as
              soon as possible.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}