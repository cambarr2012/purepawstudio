// src/app/cancel/page.tsx
import Link from "next/link";

export default function CancelPage() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900/70 px-6 py-7 shadow-xl">
        <h1 className="text-2xl font-semibold mb-2">Checkout cancelled</h1>
        <p className="text-sm text-slate-300 mb-4">
          Your payment wasn&apos;t completed. No money has been taken.
        </p>
        <p className="text-xs text-slate-400 mb-4">
          You can go back to the studio to review your design, update your details,
          or try checkout again whenever you&apos;re ready.
        </p>
        <Link
          href="/"
          className="inline-flex w-full items-center justify-center rounded-lg bg-slate-200 py-2.5 text-sm font-medium text-slate-950 hover:bg-white transition"
        >
          Back to studio
        </Link>
      </div>
    </main>
  );
}
