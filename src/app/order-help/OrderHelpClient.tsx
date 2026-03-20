"use client";

import Link from "next/link";

export default function OrderHelpClient() {
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
            Contact us
          </p>

          <h1 className="mb-3 text-3xl font-semibold tracking-tight text-slate-950 md:text-4xl">
            Contact PurePaw
            <span className="block text-slate-700">help with your order or item</span>
          </h1>

          <p className="max-w-2xl text-sm leading-7 text-slate-700 md:text-base">
            Need help with your order, delivery details, or an item that arrived
            damaged or incorrect? Email us and we’ll take a look as quickly as
            possible.
          </p>
        </header>

        <section className="space-y-5 text-sm">
          <div className="rounded-2xl border border-slate-200/80 bg-white/90 p-5 shadow-sm backdrop-blur-[2px]">
            <h2 className="mb-2 text-lg font-semibold text-slate-900">
              What we can help with
            </h2>
            <ul className="space-y-3 text-[14px] leading-7 text-slate-700">
              <li>
                • <span className="font-semibold text-slate-900">Damaged item</span>{" "}
                — send us a clear photo and a short explanation of the issue.
              </li>
              <li>
                • <span className="font-semibold text-slate-900">Incorrect item or print issue</span>{" "}
                — let us know what’s wrong and include photos if possible.
              </li>
              <li>
                • <span className="font-semibold text-slate-900">Delivery detail changes</span>{" "}
                — if your order has not moved too far into production, we may be
                able to help.
              </li>
              <li>
                • <span className="font-semibold text-slate-900">General support</span>{" "}
                — if you’re unsure what to do next, email us and we’ll point you
                in the right direction.
              </li>
            </ul>
          </div>

          <div className="rounded-2xl border border-slate-200/80 bg-white/90 p-5 shadow-sm backdrop-blur-[2px]">
            <h2 className="mb-2 text-lg font-semibold text-slate-900">
              The fastest way to reach us
            </h2>

            <p className="mb-3 text-[14px] leading-7 text-slate-700">
              We currently handle support by email so everything stays clear,
              personal and easy to follow.
            </p>

            <p className="text-[14px] leading-7 text-slate-700">
              Email{" "}
              <span className="font-mono text-[13px] text-amber-700">
                support@purepawstudio.com
              </span>{" "}
              and include:
            </p>

            <ul className="mt-3 space-y-2 text-[14px] leading-7 text-slate-700">
              <li>• Your full name</li>
              <li>• The email used at checkout</li>
              <li>• Your order ID, if available</li>
              <li>• A short summary of the issue</li>
              <li>• Photos, if your item arrived damaged or incorrect</li>
            </ul>

            <p className="mt-3 text-[12px] leading-6 text-slate-500">
              We aim to reply within{" "}
              <span className="font-semibold text-slate-800">1–2 working days</span>.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200/80 bg-white/90 p-5 shadow-sm backdrop-blur-[2px]">
            <h2 className="mb-2 text-lg font-semibold text-slate-900">
              Personalised order policy
            </h2>

            <p className="text-[14px] leading-7 text-slate-700">
              Because each PurePaw item is personalised and made to order, we do
              not accept returns for change of mind.
            </p>

            <p className="mt-3 text-[14px] leading-7 text-slate-700">
              If your item arrives damaged or there is a problem with your order,
              contact us and we’ll review it as quickly as possible.
            </p>

            <p className="mt-3 text-[12px] leading-6 text-slate-500">
              Looking for a delivery estimate or dispatch guidance? Visit our{" "}
              <Link
                href="/shipping"
                className="font-medium text-amber-700 underline-offset-2 hover:text-amber-600 hover:underline"
              >
                shipping page
              </Link>
              . For order status updates, visit{" "}
              <Link
                href="/orders"
                className="font-medium text-amber-700 underline-offset-2 hover:text-amber-600 hover:underline"
              >
                track your order
              </Link>
              .
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}