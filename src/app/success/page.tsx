"use client";

import { useSearchParams, useRouter } from "next/navigation";

export default function SuccessPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const orderId = searchParams.get("orderId") || undefined;

  return (
    <main className="min-h-screen bg-slate-950 text-slate-50">
      {/* Background gradient */}
      <div className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(circle_at_top,_rgba(45,212,191,0.12)_0,transparent_55%),radial-gradient(circle_at_bottom,_rgba(15,23,42,1)_0,rgba(15,23,42,1)_55%)]" />

      <div className="w-full max-w-xl mx-auto px-4 py-10 md:py-14">
        {/* Top pill / logo area */}
        <div className="mb-8 flex items-center justify-start gap-3 rounded-full border border-slate-800/80 bg-slate-950/80 px-4 py-2 backdrop-blur-sm shadow-[0_18px_40px_rgba(0,0,0,0.75)]">
          <img
            src="/purepawstudio-logo.png"
            alt="PurePawStudio logo"
            className="h-8 w-auto object-contain select-none rounded-lg"
          />
          <span className="text-[11px] uppercase tracking-[0.24em] text-teal-300/80">
            Order confirmed
          </span>
        </div>

        <section className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 md:p-8 shadow-[0_20px_60px_rgba(0,0,0,0.6)] text-center space-y-4">
          <div className="inline-flex items-center justify-center rounded-full bg-emerald-500/10 border border-emerald-500/40 px-3 py-1 text-[11px] text-emerald-200 font-medium mb-1">
            Payment successful ✓
          </div>

          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">
            Thank you for your order.
          </h1>

          <p className="text-sm md:text-base text-slate-300 max-w-md mx-auto">
            We’ve received your payment and queued your{" "}
            <span className="font-medium text-teal-300">
              custom AI pet flask
            </span>{" "}
            for production. You’ll receive an email with your order details and
            shipping updates shortly.
          </p>

          {orderId && (
            <div className="mt-3 rounded-xl border border-slate-800 bg-slate-950/80 px-4 py-3 text-left text-[11px]">
              <p className="text-slate-400 mb-1">Order reference</p>
              <p className="font-mono text-[11px] text-slate-100 break-all">
                {orderId}
              </p>
              <p className="mt-1 text-slate-500">
                Keep this handy if you need help with your order.
              </p>
            </div>
          )}

          <div className="pt-4 border-t border-slate-800 mt-4 space-y-2 text-[11px] text-slate-400">
            <p>
              We now prepare your artwork file at print resolution and send it
              to our production partner. Most orders are produced and shipped
              within a few working days.
            </p>
            <p>
              If you have any questions, you can always reach out via the{" "}
              <span className="text-teal-300 font-medium">
                Order help
              </span>{" "}
              page.
            </p>
          </div>

          <div className="pt-4 flex flex-col sm:flex-row gap-3 justify-center mt-2">
            <button
              type="button"
              onClick={() => router.push("/")}
              className="inline-flex items-center justify-center rounded-lg bg-teal-400 text-slate-950 text-xs font-medium px-4 py-2.5 hover:bg-teal-300 transition"
            >
              Back to studio
            </button>
            <button
              type="button"
              onClick={() => router.push("/orders")}
              className="inline-flex items-center justify-center rounded-lg border border-slate-700 bg-slate-900 text-slate-100 text-xs font-medium px-4 py-2.5 hover:bg-slate-800 transition"
            >
              View my orders
            </button>
          </div>
        </section>
      </div>
    </main>
  );
}
