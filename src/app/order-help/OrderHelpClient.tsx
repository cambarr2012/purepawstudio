"use client";

import Link from "next/link";

export default function OrderHelpClient() {
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
        <header className="mb-8">
          <p className="mb-3 inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.28em] text-amber-700 shadow-sm">
            PurePaw Order Support
          </p>

          <h1 className="text-3xl md:text-4xl font-semibold tracking-tight text-slate-950 mb-3">
            Help with your order
            <span className="block text-slate-700">updates, changes and support</span>
          </h1>

          <p className="max-w-2xl text-sm md:text-base leading-7 text-slate-700">
            Need a hand with an order? Whether you are waiting on tracking,
            need to update delivery details, or your order has arrived with an
            issue, this page outlines the quickest way to get support from
            PurePaw Studio.
          </p>
        </header>

        <section className="space-y-5 text-sm">
          {/* Common questions */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold mb-2 text-slate-900">
              Common order questions
            </h2>
            <ul className="space-y-3 text-[14px] leading-7 text-slate-700">
              <li>
                • <span className="font-semibold text-slate-900">Where is my order?</span>{" "}
                Check your confirmation email first. Tracking is sent once your
                order has been dispatched, and you can also visit{" "}
                <Link
                  href="/orders"
                  className="font-medium text-amber-700 hover:text-amber-600 underline-offset-2 hover:underline"
                >
                  My orders
                </Link>{" "}
                for the latest guidance.
              </li>
              <li>
                • <span className="font-semibold text-slate-900">Can I change my delivery details?</span>{" "}
                If your order has not moved too far into production, we can
                often help with address corrections or delivery detail updates.
                Contact us as soon as possible.
              </li>
              <li>
                • <span className="font-semibold text-slate-900">My order arrived damaged or there is a problem with it.</span>{" "}
                Send us a clear photo, your order ID if you have it, and a short
                explanation of the issue. We will review it quickly and work
                with you on the best next step.
              </li>
            </ul>
          </div>

          {/* How to contact */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold mb-2 text-slate-900">
              The fastest way to contact us
            </h2>
            <p className="text-[14px] leading-7 text-slate-700 mb-3">
              We currently handle support by email so we can keep everything
              clear, personal and easy to follow.
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
              <li>• A short summary of the help you need</li>
              <li>• Photos, if your order arrived damaged or incorrect</li>
            </ul>
            <p className="mt-3 text-[12px] leading-6 text-slate-500">
              We aim to reply within{" "}
              <span className="font-semibold text-slate-800">1–2 working days</span>.
            </p>
          </div>

          {/* Order updates */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold mb-2 text-slate-900">
              Order updates and tracking
            </h2>
            <p className="text-[14px] leading-7 text-slate-700">
              Once your order has been dispatched, tracking details are sent by
              email. If you need an update before then, the quickest route is to
              contact us with your order details or reply directly to your order
              confirmation email.
            </p>
            <p className="mt-3 text-[12px] leading-6 text-slate-500">
              For expected production and delivery timeframes, visit our{" "}
              <Link
                href="/shipping"
                className="font-medium text-amber-700 hover:text-amber-600 underline-offset-2 hover:underline"
              >
                shipping page
              </Link>
              .
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}