"use client";

import Link from "next/link";

const steps = [
  {
    number: "01",
    title: "Upload your pet photo",
    text: "Start with a clear photo where your pet’s face is easy to see. Bright, sharp images usually create the strongest result.",
  },
  {
    number: "02",
    title: "Choose your style",
    text: "Pick the vibe that suits your pet best — from bold and cheeky to bright and playful or cute and glam.",
  },
  {
    number: "03",
    title: "Preview your bottle",
    text: "Generate your personalised design and see it applied to your bottle before you go to checkout.",
  },
  {
    number: "04",
    title: "Checkout securely",
    text: "Once you’re happy with your preview, place your order through our secure checkout.",
  },
  {
    number: "05",
    title: "We print and ship it",
    text: "Your personalised order is prepared for production, printed, and shipped to the address you provided at checkout.",
  },
];

export default function HowItWorksPage() {
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

      <div className="relative z-10 mx-auto w-full max-w-4xl px-4 py-10 md:py-12">
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
            How it works
          </p>

          <h1 className="mb-3 text-3xl font-semibold tracking-tight text-slate-950 md:text-4xl">
            How PurePaw works
          </h1>

          <p className="max-w-2xl text-sm leading-7 text-slate-700 md:text-base">
            From photo upload to finished bottle, here’s the simple journey from
            design to delivery.
          </p>
        </header>

        <section className="space-y-4">
          {steps.map((step) => (
            <div
              key={step.number}
              className="rounded-2xl border border-slate-200/80 bg-white/90 p-5 shadow-sm backdrop-blur-[2px] md:p-6"
            >
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:gap-5">
                <div className="inline-flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border border-amber-200 bg-amber-50 text-[12px] font-semibold text-amber-800">
                  {step.number}
                </div>

                <div>
                  <h2 className="text-lg font-semibold text-slate-900">
                    {step.title}
                  </h2>
                  <p className="mt-2 text-[14px] leading-7 text-slate-700">
                    {step.text}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </section>

        <div className="mt-8 rounded-2xl border border-slate-200/80 bg-white/90 p-5 shadow-sm backdrop-blur-[2px]">
          <h2 className="text-lg font-semibold text-slate-900">
            Ready to make yours?
          </h2>
          <p className="mt-2 text-[14px] leading-7 text-slate-700">
            Head back to the studio to upload your pet photo and create your
            live preview.
          </p>
          <div className="mt-4">
            <Link
              href="/"
              className="inline-flex rounded-full bg-amber-400 px-5 py-2.5 text-sm font-semibold text-slate-900 transition hover:bg-amber-300"
            >
              Start your design
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}