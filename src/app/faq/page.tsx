"use client";

import Link from "next/link";

const faqs = [
  {
    question: "How does PurePaw work?",
    answer:
      "Upload your pet photo, choose a style, and preview your personalised bottle before checkout. Once you place your order, we prepare the design for production and ship it to you.",
  },
  {
    question: "What kind of pet photo works best?",
    answer:
      "Clear, sharp photos with your pet’s face easy to see usually create the strongest result. Bright lighting and a front-facing photo tend to work best.",
  },
  {
    question: "Can I preview my design before ordering?",
    answer:
      "Yes — you can generate a live preview on the site before going to checkout.",
  },
  {
    question: "How long does production and delivery take?",
    answer:
      "Most orders are produced within 2–5 working days, then UK tracked delivery is typically 2–3 working days after dispatch.",
  },
  {
    question: "Do you ship outside the UK?",
    answer:
      "Not at the moment. We are currently focused on the UK so we can keep quality and delivery times reliable.",
  },
  {
    question: "Can I return a personalised item?",
    answer:
      "Because each PurePaw item is personalised and made to order, we do not accept returns for change of mind. If your item arrives damaged or there is a problem with your order, contact us and we’ll help.",
  },
  {
    question: "What if my item arrives damaged or incorrect?",
    answer:
      "Email support@purepawstudio.com with your order details, a short explanation, and clear photos if possible. We’ll review it as quickly as we can.",
  },
  {
    question: "How do I track my order?",
    answer:
      "Once your order has been dispatched, tracking details are sent to the email used at checkout. If you need an update before then, use our order tracking page to request one.",
  },
];

export default function FAQPage() {
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
            FAQ
          </p>

          <h1 className="mb-3 text-3xl font-semibold tracking-tight text-slate-950 md:text-4xl">
            Frequently asked questions
          </h1>

          <p className="max-w-2xl text-sm leading-7 text-slate-700 md:text-base">
            A few quick answers about photos, previews, shipping, and support.
          </p>
        </header>

        <section className="space-y-4">
          {faqs.map((item) => (
            <div
              key={item.question}
              className="rounded-2xl border border-slate-200/80 bg-white/90 p-5 shadow-sm backdrop-blur-[2px]"
            >
              <h2 className="text-lg font-semibold text-slate-900">
                {item.question}
              </h2>
              <p className="mt-2 text-[14px] leading-7 text-slate-700">
                {item.answer}
              </p>
            </div>
          ))}
        </section>

        <div className="mt-8 rounded-2xl border border-slate-200/80 bg-white/90 p-5 shadow-sm backdrop-blur-[2px]">
          <h2 className="text-lg font-semibold text-slate-900">
            Still need help?
          </h2>
          <p className="mt-2 text-[14px] leading-7 text-slate-700">
            For order issues or general support, visit{" "}
            <Link
              href="/order-help"
              className="font-medium text-amber-700 underline-offset-2 hover:text-amber-600 hover:underline"
            >
              contact us
            </Link>
            . For status updates, visit{" "}
            <Link
              href="/orders"
              className="font-medium text-amber-700 underline-offset-2 hover:text-amber-600 hover:underline"
            >
              track your order
            </Link>
            .
          </p>
        </div>
      </div>
    </main>
  );
}