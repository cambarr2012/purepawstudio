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
            Shipping & delivery
          </p>

          <h1 className="mb-3 text-3xl font-semibold tracking-tight text-slate-950 md:text-4xl">
            Shipping & delivery
            <span className="block text-slate-700">what to expect after checkout</span>
          </h1>

          <p className="max-w-2xl text-sm leading-7 text-slate-700 md:text-base">
            Every PurePaw item is personalised and made to order. We keep our
            production and delivery guidance clear so you know what to expect
            from checkout to arrival.
          </p>
        </header>

        <section className="space-y-5 text-sm">
          <div className="rounded-2xl border border-slate-200/80 bg-white/90 p-5 shadow-sm backdrop-blur-[2px]">
            <h2 className="mb-2 text-lg font-semibold text-slate-900">
              Production time
            </h2>
            <p className="text-[14px] leading-7 text-slate-700">
              Once payment is confirmed, your design is prepared and sent into
              production. Most orders are produced within{" "}
              <span className="font-semibold text-slate-900">
                2–5 working days
              </span>
              .
            </p>
            <p className="mt-3 text-[12px] leading-6 text-slate-500">
              If there is ever an unexpected delay, we’ll let you know by email
              as soon as possible.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200/80 bg-white/90 p-5 shadow-sm backdrop-blur-[2px]">
            <h2 className="mb-2 text-lg font-semibold text-slate-900">
              UK delivery
            </h2>
            <p className="text-[14px] leading-7 text-slate-700">
              Standard tracked UK delivery is typically{" "}
              <span className="font-semibold text-slate-900">
                2–3 working days
              </span>{" "}
              after dispatch.
            </p>
            <p className="mt-3 text-[14px] leading-7 text-slate-700">
              Most customers receive their order within{" "}
              <span className="font-semibold text-slate-900">
                4–8 working days
              </span>{" "}
              from placing it.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200/80 bg-white/90 p-5 shadow-sm backdrop-blur-[2px]">
            <h2 className="mb-2 text-lg font-semibold text-slate-900">
              Tracking
            </h2>
            <p className="text-[14px] leading-7 text-slate-700">
              Once your order has been dispatched, tracking details are sent to
              the email used at checkout.
            </p>
            <p className="mt-3 text-[12px] leading-6 text-slate-500">
              If you need an update before dispatch, visit{" "}
              <Link
                href="/orders"
                className="font-medium text-amber-700 underline-offset-2 hover:text-amber-600 hover:underline"
              >
                track your order
              </Link>
              .
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200/80 bg-white/90 p-5 shadow-sm backdrop-blur-[2px]">
            <h2 className="mb-2 text-lg font-semibold text-slate-900">
              International shipping
            </h2>
            <p className="text-[14px] leading-7 text-slate-700">
              We are currently focused on the UK so we can keep quality and
              delivery times reliable.
            </p>
            <p className="mt-3 text-[14px] leading-7 text-slate-700">
              If you are outside the UK and interested in ordering, contact us
              and we’ll let you know when wider shipping becomes available.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200/80 bg-white/90 p-5 shadow-sm backdrop-blur-[2px]">
            <h2 className="mb-2 text-lg font-semibold text-slate-900">
              Delivery issues
            </h2>
            <p className="text-[14px] leading-7 text-slate-700">
              If your order is running late, tracking has not arrived, or your
              item arrives damaged, we’ll do our best to help quickly.
            </p>
            <p className="mt-3 text-[12px] leading-6 text-slate-500">
              For status updates, visit{" "}
              <Link
                href="/orders"
                className="font-medium text-amber-700 underline-offset-2 hover:text-amber-600 hover:underline"
              >
                track your order
              </Link>
              . For damaged items or general support, visit{" "}
              <Link
                href="/order-help"
                className="font-medium text-amber-700 underline-offset-2 hover:text-amber-600 hover:underline"
              >
                contact us
              </Link>
              .
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}