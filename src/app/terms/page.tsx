"use client";

import Link from "next/link";

export default function TermsPage() {
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
            Terms
          </p>

          <h1 className="mb-3 text-3xl font-semibold tracking-tight text-slate-950 md:text-4xl">
            Terms of service
          </h1>

          <p className="max-w-2xl text-sm leading-7 text-slate-700 md:text-base">
            These terms explain how orders with PurePaw Studio work and what to
            expect when using the site and purchasing a personalised product.
          </p>
        </header>

        <section className="space-y-5 text-sm">
          <div className="rounded-2xl border border-slate-200/80 bg-white/90 p-5 shadow-sm backdrop-blur-[2px]">
            <h2 className="mb-2 text-lg font-semibold text-slate-900">
              Personalised products
            </h2>
            <p className="text-[14px] leading-7 text-slate-700">
              PurePaw Studio creates personalised items using the photo and
              selections you provide. Because each product is made to order,
              slight differences may occur between on-site previews and the
              final printed item.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200/80 bg-white/90 p-5 shadow-sm backdrop-blur-[2px]">
            <h2 className="mb-2 text-lg font-semibold text-slate-900">
              Customer responsibility
            </h2>
            <p className="text-[14px] leading-7 text-slate-700">
              You are responsible for providing accurate order, contact, and
              delivery information, and for ensuring you have the right to use
              any photo you upload.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200/80 bg-white/90 p-5 shadow-sm backdrop-blur-[2px]">
            <h2 className="mb-2 text-lg font-semibold text-slate-900">
              Pricing and payment
            </h2>
            <p className="text-[14px] leading-7 text-slate-700">
              Prices are shown on the site and at checkout. Orders are only
              confirmed once payment has been successfully completed.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200/80 bg-white/90 p-5 shadow-sm backdrop-blur-[2px]">
            <h2 className="mb-2 text-lg font-semibold text-slate-900">
              Shipping and delivery
            </h2>
            <p className="text-[14px] leading-7 text-slate-700">
              Production and delivery times are estimates and may vary slightly.
              We will do our best to keep customers updated if delays occur.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200/80 bg-white/90 p-5 shadow-sm backdrop-blur-[2px]">
            <h2 className="mb-2 text-lg font-semibold text-slate-900">
              Returns and issues
            </h2>
            <p className="text-[14px] leading-7 text-slate-700">
              Because PurePaw products are personalised and made to order, we do
              not accept returns for change of mind. If an item arrives damaged
              or there is a problem with your order, contact us and we will
              review the issue.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200/80 bg-white/90 p-5 shadow-sm backdrop-blur-[2px]">
            <h2 className="mb-2 text-lg font-semibold text-slate-900">
              Contact
            </h2>
            <p className="text-[14px] leading-7 text-slate-700">
              For support, email{" "}
              <a
                href="mailto:support@purepawstudio.com"
                className="font-medium text-amber-700 underline-offset-2 hover:text-amber-600 hover:underline"
              >
                support@purepawstudio.com
              </a>
              .
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}