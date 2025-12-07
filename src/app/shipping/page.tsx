"use client";

import Link from "next/link";

export default function ShippingPage() {
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
            Shipping & Production
          </p>
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight mb-2">
            How long will my flask take?
          </h1>
          <p className="text-sm md:text-base text-slate-300">
            We keep things simple: small-batch production, quality checks, and
            clear expectations before you pay.
          </p>
        </header>

        <section className="space-y-5 text-sm text-slate-300">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
            <h2 className="text-base font-medium mb-1 text-slate-50">
              Production time
            </h2>
            <p className="text-[13px] text-slate-300">
              Each flask is made to order. Once your payment is confirmed, your
              design is sent to our print partner and usually{" "}
              <span className="font-semibold">
                produced within 2–4 working days
              </span>
              .
            </p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
            <h2 className="text-base font-medium mb-1 text-slate-50">
              UK shipping
            </h2>
            <p className="text-[13px] text-slate-300">
              Standard UK delivery is typically{" "}
              <span className="font-semibold">2–3 working days</span> after
              production. Most orders arrive within{" "}
              <span className="font-semibold">4–7 working days</span> from
              purchase.
            </p>
            <p className="mt-2 text-[12px] text-slate-400">
              You&apos;ll receive a confirmation email as soon as your order is
              on the way.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
            <h2 className="text-base font-medium mb-1 text-slate-50">
              International shipping
            </h2>
            <p className="text-[13px] text-slate-300">
              We&apos;re starting with the UK first. If you&apos;re outside the
              UK and interested in ordering, drop us a message via{" "}
              <Link
                href="/order-help"
                className="text-teal-300 hover:text-teal-200"
              >
                order help
              </Link>{" "}
              and we&apos;ll let you know when shipping opens to your country.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
            <h2 className="text-base font-medium mb-1 text-slate-50">
              Delays & issues
            </h2>
            <p className="text-[13px] text-slate-300">
              If your order is running late or arrives damaged, we&apos;ll
              always work with you to fix it. Start by checking{" "}
              <Link
                href="/orders"
                className="text-teal-300 hover:text-teal-200"
              >
                My orders
              </Link>{" "}
              or contact us via{" "}
              <Link
                href="/order-help"
                className="text-teal-300 hover:text-teal-200"
              >
                order help
              </Link>
              .
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
