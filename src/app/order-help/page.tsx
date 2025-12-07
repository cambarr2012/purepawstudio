"use client";

import Link from "next/link";

export default function OrderHelpPage() {
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
            Order help
          </p>
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight mb-2">
            Need help with an order?
          </h1>
          <p className="text-sm md:text-base text-slate-300">
            Whether something&apos;s gone wrong or you just have a question,
            this is the easiest way to reach us.
          </p>
        </header>

        <section className="space-y-5 text-sm text-slate-300">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
            <h2 className="text-base font-medium mb-1 text-slate-50">
              Common questions
            </h2>
            <ul className="mt-2 space-y-2 text-[13px] text-slate-300">
              <li>
                • <span className="font-semibold">“Where is my order?”</span>{" "}
                — check your inbox for the Stripe receipt and our confirmation
                email. If it&apos;s been more than 7 working days, contact us
                below.
              </li>
              <li>
                •{" "}
                <span className="font-semibold">
                  “My flask arrived damaged.”
                </span>{" "}
                — send us a clear photo of the damage and your order ID and
                we&apos;ll sort a replacement or refund.
              </li>
              <li>
                •{" "}
                <span className="font-semibold">
                  “Can I change my shipping address?”
                </span>{" "}
                — if your order hasn&apos;t gone into production yet, we can
                usually update it.
              </li>
            </ul>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
            <h2 className="text-base font-medium mb-1 text-slate-50">
              How to contact us
            </h2>
            <p className="text-[13px] text-slate-300 mb-2">
              For now we&apos;re handling support via email so we can keep
              things personal and fast.
            </p>
            <p className="text-[13px]">
              Please email{" "}
              <span className="font-mono text-teal-300">
                support@purepawstudio.com
              </span>{" "}
              with:
            </p>
            <ul className="mt-2 text-[13px] text-slate-300 space-y-1">
              <li>• Your full name</li>
              <li>• The email you used at checkout</li>
              <li>• Your order ID (if you have it)</li>
              <li>• A short description of what you need help with</li>
            </ul>
            <p className="mt-2 text-[12px] text-slate-400">
              We aim to reply within{" "}
              <span className="font-semibold text-slate-200">
                1–2 working days
              </span>
              .
            </p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
            <h2 className="text-base font-medium mb-1 text-slate-50">
              Order status
            </h2>
            <p className="text-[13px] text-slate-300">
              We&apos;re building a self-serve order tracking page. For now,
              the fastest way to get an update is to email us with your order
              details or reply directly to your confirmation email.
            </p>
            <p className="mt-2 text-[12px] text-slate-400">
              Tip: keep your Stripe receipt email handy — it contains the exact
              date and amount paid which helps us find your order quickly.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
