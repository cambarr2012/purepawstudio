// src/app/success/page.tsx
import Link from "next/link";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type SearchParams = {
  session_id?: string;
  sessionId?: string;
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
  // Handle either `session_id` or `sessionId` just in case
  const rawSessionId = searchParams?.session_id || searchParams?.sessionId || "";
  const sessionId = rawSessionId && rawSessionId.trim().length > 0 ? rawSessionId : null;

  // 1) No session id in URL at all
  if (!sessionId) {
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

  // 2) We have a session_id – try to load the Stripe Checkout Session
  const session = await fetchStripeSession(sessionId);

  if (!session) {
    // Could not load the session from Stripe; still show the raw session id as reference
    return (
      <main className="min-h-screen bg-slate-950 text-slate-50 flex items-center justify-center">
        <div className="max-w-lg w-full px-6 text-center">
          <h1 className="text-2xl md:text-3xl font-semibold mb-3 text-teal-300">
            Payment successful 🎉
          </h1>
          <p className="text-sm text-slate-200 mb-2">
            Your payment was processed, but we couldn&apos;t load the full
            details from Stripe right now.
          </p>
          <div className="mt-4 inline-flex flex-col gap-2 items-start mx-auto text-left bg-slate-900/70 border border-slate-700 rounded-xl px-4 py-3 text-xs">
            <p>
              <span className="font-semibold text-slate-200">
                Payment reference:
              </span>{" "}
              <span className="font-mono text-slate-300">{sessionId}</span>
            </p>
            <p className="text-slate-400 mt-1">
              If you need help, contact support with this reference and your
              email address.
            </p>
          </div>

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

  // 3) We have a valid Stripe session – extract metadata and fall back to the Stripe session ID
  const metadata = (session.metadata ??
    {}) as Record<string, string | undefined>;

  const orderIdFromMetadata =
    metadata.orderId || metadata.order_id || undefined;

  const artworkId =
    metadata.artworkId || metadata.artwork_id || undefined;

  const stripeSessionId = session.id || sessionId;

  const customerEmail =
    (session.customer_details?.email as string | null) ??
    (session.customer_email as string | null) ??
    null;

  const primaryOrderReference = orderIdFromMetadata || stripeSessionId || null;
  const hasReference = !!primaryOrderReference || !!artworkId;

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
              {primaryOrderReference && (
                <p>
                  <span className="font-semibold text-slate-200">
                    Order reference:
                  </span>{" "}
                  <span className="font-mono text-slate-300">
                    {primaryOrderReference}
                  </span>
                </p>
              )}

              {orderIdFromMetadata &&
                stripeSessionId &&
                orderIdFromMetadata !== stripeSessionId && (
                  <p>
                    <span className="font-semibold text-slate-200">
                      Internal order ID:
                    </span>{" "}
                    <span className="font-mono text-slate-300">
                      {orderIdFromMetadata}
                    </span>
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
              If this happens in production, contact support with your email,
              this payment reference:
            </p>
            <div className="mt-2 inline-flex items-center justify-center bg-slate-900/70 border border-slate-700 rounded-xl px-3 py-2 text-xs">
              <span className="font-semibold text-slate-200 mr-1">
                Payment reference:
              </span>
              <span className="font-mono text-slate-300">
                {stripeSessionId}
              </span>
            </div>
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
