import Link from "next/link";

export default function CancelPage() {
  return (
    <main className="min-h-screen bg-[#f7f3ec] text-slate-900 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <p className="mb-3 inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.28em] text-amber-700 shadow-sm">
            PurePaw Checkout
          </p>

          <h1 className="text-3xl md:text-4xl font-semibold tracking-tight text-slate-950 mb-3">
            Checkout not completed
          </h1>

          <p className="text-sm md:text-base leading-7 text-slate-700 max-w-md mx-auto">
            Your payment was not completed, and no money has been taken. Your
            design is still waiting for you in the studio.
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-4">
            <h2 className="text-base font-semibold text-slate-900 mb-2">
              What you can do next
            </h2>
            <ul className="space-y-2 text-[13px] leading-6 text-slate-700">
              <li>• Return to the studio to review your design</li>
              <li>• Switch style or preview product if needed</li>
              <li>• Re-enter checkout whenever you’re ready</li>
            </ul>
          </div>

          <p className="mt-4 text-[12px] leading-6 text-slate-500">
            If something went wrong during payment and you need help, visit{" "}
            <Link
              href="/order-help"
              className="font-medium text-amber-700 hover:text-amber-600 underline-offset-2 hover:underline"
            >
              order help
            </Link>
            .
          </p>
        </div>

        <div className="flex justify-center gap-3 mt-8 text-sm">
          <Link
            href="/"
            className="rounded-full bg-slate-900 text-white px-5 py-2.5 font-medium hover:bg-slate-800 transition"
          >
            Back to studio
          </Link>
          <Link
            href="/order-help"
            className="rounded-full border border-slate-300 px-5 py-2.5 text-slate-900 font-medium hover:bg-[#f9f4ed] transition"
          >
            Order help
          </Link>
        </div>
      </div>
    </main>
  );
}