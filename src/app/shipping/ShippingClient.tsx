"use client";

import Link from "next/link";

export default function ShippingClient() {
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

      <div className="relative z-10 w-full max-w-3xl mx-auto px-4 py-10 md:py-12">
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
        <header className="mb-8">
          <p className="mb-3 inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.28em] text-amber-700 shadow-sm">
            PurePaw Delivery Guide
          </p>

          <h1 className="text-3xl md:text-4xl font-semibold tracking-tight text-slate-950 mb-3">
            Shipping, production
            <span className="block text-slate-700">and delivery timelines</span>
          </h1>

          <p className="max-w-2xl text-sm md:text-base leading-7 text-slate-700">
            Every PurePaw piece is made to order and prepared with care. We keep
            our delivery guidance clear, simple and upfront so you know what to
            expect from checkout to arrival.
          </p>
        </header>

        <section className="space-y-5 text-sm">
          <div className="rounded-2xl border border-slate-200/80 bg-white/90 p-5 shadow-sm backdrop-blur-[2px]">
            <h2 className="text-lg font-semibold mb-2 text-slate-900">
              Production time
            </h2>
            <p className="text-[14px] leading-7 text-slate-700">
              Once your payment is confirmed, your design is prepared and sent
              into production. Most flasks are{" "}
              <span className="font-semibold text-slate-900">
                produced within 2–5 working days
              </span>
              .
            </p>
            <p className="mt-3 text-[12px] leading-6 text-slate-500">
              If there&apos;s ever a delay, we&apos;ll keep you updated by email
              as soon as possible.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200/80 bg-white/90 p-5 shadow-sm backdrop-blur-[2px]">
            <h2 className="text-lg font-semibold mb-2 text-slate-900">
              UK shipping
            </h2>
            <p className="text-[14px] leading-7 text-slate-700">
              Standard tracked UK delivery is typically{" "}
              <span className="font-semibold text-slate-900">
                2–3 working days
              </span>{" "}
              after dispatch. Most customers receive their flask within{" "}
              <span className="font-semibold text-slate-900">
                4–8 working days
              </span>{" "}
              from placing an order.
            </p>
            <p className="mt-3 text-[12px] leading-6 text-slate-500">
              Your exact shipping cost and estimated delivery window are shown
              clearly at checkout before you pay.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200/80 bg-white/90 p-5 shadow-sm backdrop-blur-[2px]">
            <h2 className="text-lg font-semibold mb-2 text-slate-900">
              International shipping
            </h2>
            <p className="text-[14px] leading-7 text-slate-700">
              We&apos;re starting with the UK first so we can keep quality and
              delivery times reliable. If you&apos;re outside the UK and
              interested in ordering, send us a message via{" "}
              <Link
                href="/order-help"
                className="font-medium text-amber-700 hover:text-amber-600 underline-offset-2 hover:underline"
              >
                order help
              </Link>{" "}
              and we&apos;ll let you know as soon as international shipping
              opens.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200/80 bg-white/90 p-5 shadow-sm backdrop-blur-[2px]">
            <h2 className="text-lg font-semibold mb-2 text-slate-900">
              Delays, issues &amp; damaged items
            </h2>
            <p className="text-[14px] leading-7 text-slate-700">
              If your order is running late, has tracking issues, or arrives
              damaged, we&apos;ll always work quickly to make it right. Start by
              checking{" "}
              <Link
                href="/orders"
                className="font-medium text-amber-700 hover:text-amber-600 underline-offset-2 hover:underline"
              >
                My orders
              </Link>{" "}
              for the latest status, or contact us via{" "}
              <Link
                href="/order-help"
                className="font-medium text-amber-700 hover:text-amber-600 underline-offset-2 hover:underline"
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