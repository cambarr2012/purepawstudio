"use client";

import Link from "next/link";

export default function ShippingPage() {
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
            Shipping & Production
          </p>
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight mb-2">
            How long will my PurePaw Flask take?
          </h1>
          <p className="text-sm md:text-base text-slate-700">
            Every flask is made to order. We keep timelines clear and simple so
            you know when to expect your delivery before you pay.
          </p>
        </header>

        <section className="space-y-5 text-sm">
          {/* Production time */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="text-base font-medium mb-1 text-slate-900">
              Production time
            </h2>
            <p className="text-[13px] text-slate-700">
              Once your payment is confirmed, your design is prepared and sent
              to production. Most flasks are{" "}
              <span className="font-semibold">
                produced within 2–5 working days
              </span>
              .
            </p>
            <p className="mt-2 text-[12px] text-slate-500">
              If there&apos;s ever a delay, we&apos;ll let you know by email as
              soon as possible.
            </p>
          </div>

          {/* UK shipping */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="text-base font-medium mb-1 text-slate-900">
              UK shipping
            </h2>
            <p className="text-[13px] text-slate-700">
              Standard tracked UK delivery is typically{" "}
              <span className="font-semibold">2–3 working days</span> after
              dispatch. Most customers receive their flask within{" "}
              <span className="font-semibold">4–8 working days</span> from
              placing an order.
            </p>
            <p className="mt-2 text-[12px] text-slate-500">
              Your exact shipping cost and estimated delivery window are shown
              clearly at checkout before you pay.
            </p>
          </div>

          {/* International */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="text-base font-medium mb-1 text-slate-900">
              International shipping
            </h2>
            <p className="text-[13px] text-slate-700">
              We&apos;re starting with the UK first so we can keep quality and
              delivery times reliable. If you&apos;re outside the UK and
              interested in ordering, drop us a message via{" "}
              <Link
                href="/order-help"
                className="text-amber-700 hover:text-amber-600 underline-offset-2 hover:underline"
              >
                order help
              </Link>{" "}
              and we&apos;ll let you know as soon as international shipping
              opens.
            </p>
          </div>

          {/* Delays / issues */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="text-base font-medium mb-1 text-slate-900">
              Delays, issues & damaged items
            </h2>
            <p className="text-[13px] text-slate-700">
              If your order is running late, has tracking issues, or arrives
              damaged, we&apos;ll always work with you to fix it quickly. Start
              by checking{" "}
              <Link
                href="/orders"
                className="text-amber-700 hover:text-amber-600 underline-offset-2 hover:underline"
              >
                My orders
              </Link>{" "}
              for the latest status, or contact us via{" "}
              <Link
                href="/order-help"
                className="text-amber-700 hover:text-amber-600 underline-offset-2 hover:underline"
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
