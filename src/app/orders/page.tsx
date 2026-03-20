"use client";

import { useState, FormEvent } from "react";
import Link from "next/link";

export default function OrdersPage() {
  const [emailValue, setEmailValue] = useState("");
  const [orderIdValue, setOrderIdValue] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setMessage(
      "Thanks — we’ve received your request. We’ll email you an update as soon as possible."
    );
    setTimeout(() => setSubmitting(false), 500);
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#f7f3ec] text-slate-900">
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[url('/backdrop1.png')] bg-repeat opacity-[0.14]"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[#f7f3ec]/88"
      />

      <div className="relative z-10 mx-auto w-full max-w-3xl px-4 py-10 md:py-12">
        <div className="mb-6 flex items-center justify-between">
          <button
            onClick={() => history.back()}
            className="text-[11px] text-slate-500 transition hover:text-slate-800"
            type="button"
          >
            ← Back
          </button>
          <Link
            href="/"
            className="text-[11px] text-slate-700 underline-offset-2 transition hover:text-slate-900 hover:underline"
          >
            Return to studio
          </Link>
        </div>

        <header className="mb-8">
          <p className="mb-3 inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.28em] text-amber-700 shadow-sm">
            Track your order
          </p>

          <h1 className="mb-3 text-3xl font-semibold tracking-tight text-slate-950 md:text-4xl">
            Track your order
            <span className="block text-slate-700">request an email update</span>
          </h1>

          <p className="max-w-2xl text-sm leading-7 text-slate-700 md:text-base">
            Enter the email used at checkout and we’ll send you an update on your
            order status. If you have your order ID, you can include that too.
          </p>
        </header>

        <section className="space-y-5 text-sm">
          <div className="rounded-2xl border border-slate-200/80 bg-white/90 p-5 shadow-sm backdrop-blur-[2px]">
            <h2 className="mb-2 text-lg font-semibold text-slate-900">
              What to expect
            </h2>
            <div className="space-y-3 text-[14px] leading-7 text-slate-700">
              <p>
                After checkout, you should receive an order confirmation by
                email.
              </p>
              <p>
                Once your order has been dispatched, tracking details are sent by
                email.
              </p>
              <p>
                For current production and delivery guidance, visit our{" "}
                <Link
                  href="/shipping"
                  className="font-medium text-amber-700 underline-offset-2 hover:text-amber-600 hover:underline"
                >
                  shipping page
                </Link>
                .
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200/80 bg-white/90 p-5 shadow-sm backdrop-blur-[2px]">
            <h2 className="mb-2 text-lg font-semibold text-slate-900">
              Request an order update
            </h2>
            <p className="mb-3 text-[14px] leading-7 text-slate-700">
              Enter the email used at checkout below. Adding your order ID is
              optional, but it can help us find your order faster.
            </p>

            <form onSubmit={handleSubmit} className="space-y-3 text-[11px]">
              <label className="flex flex-col gap-1">
                <span className="text-slate-800">Checkout email</span>
                <input
                  type="email"
                  value={emailValue}
                  onChange={(e) => setEmailValue(e.target.value)}
                  className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-amber-400"
                  placeholder="Enter the email used at checkout"
                  disabled={submitting}
                />
              </label>

              <label className="flex flex-col gap-1">
                <span className="text-slate-800">
                  Order ID <span className="text-slate-400">(optional)</span>
                </span>
                <input
                  type="text"
                  value={orderIdValue}
                  onChange={(e) => setOrderIdValue(e.target.value)}
                  className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-amber-400"
                  placeholder="Add your order ID if you have it"
                  disabled={submitting}
                />
              </label>

              <button
                type="submit"
                disabled={submitting || !emailValue}
                className="mt-2 w-full rounded-lg bg-slate-900 py-2.5 text-sm font-medium text-slate-50 transition hover:bg-slate-800 disabled:opacity-60"
              >
                {submitting ? "Sending request…" : "Request order update"}
              </button>
            </form>

            {message && (
              <p className="mt-3 text-[12px] leading-6 text-slate-600">
                {message}
              </p>
            )}
          </div>

          <div className="rounded-2xl border border-slate-200/80 bg-white/90 p-5 shadow-sm backdrop-blur-[2px]">
            <h2 className="mb-2 text-lg font-semibold text-slate-900">
              Helpful tracking notes
            </h2>
            <ul className="space-y-2 text-[14px] leading-7 text-slate-700">
              <li>• Keep your order confirmation email handy</li>
              <li>• Check your inbox and junk folder for shipping updates</li>
              <li>• Tracking is sent once your order has been dispatched</li>
              <li>
                • For delivery timings, visit our{" "}
                <Link
                  href="/shipping"
                  className="font-medium text-amber-700 underline-offset-2 hover:text-amber-600 hover:underline"
                >
                  shipping page
                </Link>
              </li>
            </ul>

            <p className="mt-4 text-[13px] leading-6 text-slate-600">
              Need help with something else? Visit{" "}
              <Link
                href="/order-help"
                className="font-medium text-amber-700 underline-offset-2 hover:text-amber-600 hover:underline"
              >
                order help
              </Link>{" "}
              or email{" "}
              <span className="font-mono text-[13px] text-amber-700">
                support@purepawstudio.com
              </span>
              .
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}