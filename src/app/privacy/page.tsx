"use client";

import Link from "next/link";

export default function PrivacyPage() {
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
            Privacy policy
          </p>

          <h1 className="mb-3 text-3xl font-semibold tracking-tight text-slate-950 md:text-4xl">
            Privacy policy
          </h1>

          <p className="max-w-2xl text-sm leading-7 text-slate-700 md:text-base">
            This page explains what information we collect when you use PurePaw
            Studio and how we use it to process orders, provide support, and run
            the website.
          </p>
        </header>

        <section className="space-y-5 text-sm">
          <div className="rounded-2xl border border-slate-200/80 bg-white/90 p-5 shadow-sm backdrop-blur-[2px]">
            <h2 className="mb-2 text-lg font-semibold text-slate-900">
              Information we collect
            </h2>
            <p className="text-[14px] leading-7 text-slate-700">
              When you place an order or contact us, we may collect information
              such as your name, email address, delivery address, uploaded pet
              photos, order details, and any messages you send to us.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200/80 bg-white/90 p-5 shadow-sm backdrop-blur-[2px]">
            <h2 className="mb-2 text-lg font-semibold text-slate-900">
              How we use your information
            </h2>
            <ul className="space-y-2 text-[14px] leading-7 text-slate-700">
              <li>• To process and fulfil your order</li>
              <li>• To generate and prepare your personalised design</li>
              <li>• To send order confirmations and shipping updates</li>
              <li>• To provide customer support</li>
              <li>• To improve the website and customer experience</li>
            </ul>
          </div>

          <div className="rounded-2xl border border-slate-200/80 bg-white/90 p-5 shadow-sm backdrop-blur-[2px]">
            <h2 className="mb-2 text-lg font-semibold text-slate-900">
              Payments
            </h2>
            <p className="text-[14px] leading-7 text-slate-700">
              Payments are processed securely through our payment providers. We
              do not store your full card details ourselves.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200/80 bg-white/90 p-5 shadow-sm backdrop-blur-[2px]">
            <h2 className="mb-2 text-lg font-semibold text-slate-900">
              Sharing your information
            </h2>
            <p className="text-[14px] leading-7 text-slate-700">
              We only share information where needed to operate the service,
              such as with payment, fulfilment, delivery, and website providers.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200/80 bg-white/90 p-5 shadow-sm backdrop-blur-[2px]">
            <h2 className="mb-2 text-lg font-semibold text-slate-900">
              Contact
            </h2>
            <p className="text-[14px] leading-7 text-slate-700">
              If you have any questions about this policy or your information,
              email{" "}
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