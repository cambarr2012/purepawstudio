// src/app/success/page.tsx
import Link from "next/link";
import Image from "next/image";

type SuccessPageProps = {
  searchParams?: {
    session_id?: string;
  };
};

export default function SuccessPage({ searchParams }: SuccessPageProps) {
  const hasSession = Boolean(searchParams?.session_id);

  return (
    <main className="min-h-screen bg-[#f7f3ed] px-4 py-8 text-slate-900 sm:px-6 sm:py-12">
      <div className="mx-auto max-w-4xl">
        <div className="mb-4 flex justify-center">
          <div className="overflow-hidden rounded-[20px] border border-stone-200 bg-[#efe7d7] shadow-[0_10px_30px_rgba(15,23,42,0.06)]">
            <Image
              src="/purepawstudio-logo.png"
              alt="PurePaw Studio"
              width={88}
              height={88}
              priority
              className="h-[88px] w-[88px] object-cover sm:h-[92px] sm:w-[92px]"
            />
          </div>
        </div>

        <div className="mb-5 flex justify-center">
          <div className="inline-flex rounded-full border border-amber-300 bg-amber-50 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.26em] text-amber-700">
            PurePaw order confirmed
          </div>
        </div>

        <section className="overflow-hidden rounded-[28px] border border-stone-200 bg-white shadow-[0_20px_60px_rgba(15,23,42,0.06)] sm:rounded-[32px]">
          <div className="bg-gradient-to-b from-[#fcf8f2] to-white px-6 pb-8 pt-8 sm:px-10 sm:pb-10 sm:pt-10">
            <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 shadow-[0_8px_24px_rgba(16,185,129,0.10)]">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                className="h-7 w-7"
                stroke="currentColor"
                strokeWidth="2.4"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M20 6 9 17l-5-5" />
              </svg>
            </div>

            <h1 className="max-w-3xl text-4xl font-bold leading-[1.02] tracking-tight text-slate-950 sm:text-5xl">
              Your order is in — and your bottle is on the way
            </h1>

            <p className="mt-5 max-w-2xl text-[17px] leading-8 text-slate-600 sm:text-lg">
              Thanks for ordering with PurePaw Studio. We’ve received your
              payment and your custom bottle is now being prepared for dispatch.
            </p>

            {hasSession ? (
              <div className="mt-5 inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-sm font-medium text-emerald-700">
                Payment received successfully
              </div>
            ) : null}
          </div>

          <div className="border-t border-stone-100 px-6 py-8 sm:px-10 sm:py-10">
            <div className="grid gap-4 sm:grid-cols-3 sm:gap-5">
              <div className="rounded-[22px] border border-stone-200 bg-stone-50 p-5 sm:p-6">
                <div className="mb-4 inline-flex h-9 w-9 items-center justify-center rounded-full bg-white text-sm font-semibold text-slate-900 border border-stone-200">
                  1
                </div>
                <p className="text-base font-semibold text-slate-900">
                  Order confirmed
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Your confirmation email is on its way with the key details of
                  your order.
                </p>
              </div>

              <div className="rounded-[22px] border border-stone-200 bg-stone-50 p-5 sm:p-6">
                <div className="mb-4 inline-flex h-9 w-9 items-center justify-center rounded-full bg-white text-sm font-semibold text-slate-900 border border-stone-200">
                  2
                </div>
                <p className="text-base font-semibold text-slate-900">
                  We prepare your bottle
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Your PurePaw bottle is now being prepared and readied for
                  fulfilment.
                </p>
              </div>

              <div className="rounded-[22px] border border-stone-200 bg-stone-50 p-5 sm:p-6">
                <div className="mb-4 inline-flex h-9 w-9 items-center justify-center rounded-full bg-white text-sm font-semibold text-slate-900 border border-stone-200">
                  3
                </div>
                <p className="text-base font-semibold text-slate-900">
                  Tracking follows later
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Once your order has been dispatched, we’ll email your tracking
                  details separately.
                </p>
              </div>
            </div>

            <div className="mt-8 rounded-[24px] border border-stone-200 bg-[#faf7f2] p-5 sm:p-6">
              <h2 className="text-base font-semibold text-slate-900">
                What happens next
              </h2>

              <div className="mt-4 space-y-3 text-sm leading-6 text-slate-700">
                <p>Keep an eye on your inbox for your confirmation email.</p>
                <p>Your bottle is now moving through preparation and fulfilment.</p>
                <p>
                  Need help before dispatch? Email{" "}
                  <a
                    href="mailto:support@purepawstudio.com"
                    className="font-semibold text-slate-900 underline decoration-amber-400 underline-offset-4"
                  >
                    support@purepawstudio.com
                  </a>
                  .
                </p>
              </div>
            </div>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/"
                className="inline-flex min-h-[48px] items-center justify-center rounded-full bg-slate-950 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                Back to home
              </Link>

              <Link
                href="/orders"
                className="inline-flex min-h-[48px] items-center justify-center rounded-full border border-stone-300 bg-white px-6 py-3 text-sm font-semibold text-slate-900 transition hover:bg-stone-50"
              >
                Need help with your order?
              </Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}