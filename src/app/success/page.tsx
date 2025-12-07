// src/app/success/page.tsx
import Link from "next/link";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type SearchParams = {
  session_id?: string;
};

async function fetchStripeSession(sessionId: string) {
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

  if (!stripeSecretKey) {
    console.error("[success] Missing STRIPE_SECRET_KEY");
    return null;
  }

  try {
    const StripeModule = await import("stripe");
    const Stripe = StripeModule.default;
    const stripe = new Stripe(stripeSecretKey);

    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ["payment_intent"],
    });

    return session;
  } catch (err) {
    console.error("[success] Error retrieving Stripe session:", err);
    return null;
  }
}

export default async function SuccessPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const sessionId = searchParams?.session_id;

  if (!sessionId) {
    // No session id in URL at all
    return (
      <main className="min-h-screen bg-slate-950 text-slate-50 flex items-center justify-center">
        <div className="max-w-md text-center px-6">
          <h1 className="text-2xl md:text-3xl font-semibold mb-3 text-teal-300">
            Payment successful 🎉
          </h1>
          <p className="text-sm text-slate-300 mb-4">
            We couldn&apos;t find a payment reference in this link.
          </p>
          <p className="text-xs text-slate-500 mb-6">
            This can happen if the page was opened directly or the URL was
            modified.
          </p>
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-full bg-teal-400 px-4 py-2 text-xs font-medium text-slate-950 hover:bg-teal-300 transition"
          >
            Return to the studio
          </Link>
        </div>
      </main>
    );
  }

  const session = await fetchStripeSession(sessionId);

  const metadata = (session?.metadata ??
    {}) as Record<string, string | undefined>;

  const orderId =
    metadata.orderId ||
    metadata.order_id ||
    session?.client_reference_id ||
    null;

  const artworkId = metadata.artworkId || metadata.artwork_id || null;

  const customerEmail =
    (session?.customer_details?.email as string | null) ?? null;

  const hasReference = !!orderId || !!artworkId;

  return (
    <main className="min-h-screen bg-slate-950 text-slate-50 flex items-center justify-center">
      <div className="max-w-lg w-full px-6 text-center">
        <h1 className="text-2xl md:text-3xl font-semibold mb-3 text-teal-300">
          Payment successful 🎉
        </h1>

        {hasReference ? (
          <>
            <p className="text-sm text-slate-200 mb-2">
              Thank you for ordering your custom pet flask.
            </p>
            <p className="text-xs text-slate-400 mb-4">
              We&apos;ve received your order and will start preparing your
              artwork for printing.
            </p>

            <div className="mt-4 inline-flex flex-col gap-2 items-start mx-auto text-left bg-slate-900/70 border border-slate-700 rounded-xl px-4 py-3 text-xs">
              {orderId && (
                <p>
                  <span className="font-semibold text-slate-200">
                    Order reference:
                  </span>{" "}
                  <span className="font-mono text-slate-300">{orderId}</span>
                </p>
              )}
              {artworkId && (
                <p>
                  <span className="font-semibold text-slate-200">
                    Artwork ID:
                  </span>{" "}
                  <span className="font-mono text-slate-300">
                    {artworkId}
                  </span>
                </p>
              )}
              {customerEmail && (
                <p className="text-slate-400">
                  A confirmation has been sent to{" "}
                  <span className="font-medium text-slate-200">
                    {customerEmail}
                  </span>
                  .
                </p>
              )}
            </div>

            <p className="mt-5 text-[11px] text-slate-500">
              You don&apos;t need to keep this page open — we&apos;ll use these
              references internally to print and ship your flask.
            </p>
          </>
        ) : (
          <>
            <p className="text-sm text-slate-200 mb-2">
              Your card was successfully charged, but we couldn&apos;t find an
              order reference for this session.
            </p>
            <p className="text-xs text-slate-400 mb-4">
              This is usually safe to ignore during testing. If this happens in
              production, contact support with your email and the time of
              payment and we&apos;ll locate your order.
            </p>
          </>
        )}

        <div className="mt-6 flex justify-center gap-3 text-xs">
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-full bg-teal-400 px-4 py-2 font-medium text-slate-950 hover:bg-teal-300 transition"
          >
            Back to studio
          </Link>
          <Link
            href="/orders"
            className="inline-flex items-center justify-center rounded-full border border-slate-700 px-4 py-2 font-medium text-slate-200 hover:border-slate-500 hover:bg-slate-900/60 transition"
          >
            View my orders
          </Link>
        </div>
      </div>
    </main>
  );
}
