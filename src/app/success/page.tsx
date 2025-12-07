// src/app/success/page.tsx
import Link from "next/link";
import { stripe } from "@/lib/stripe";
import prisma from "@/lib/prisma";

export const runtime = "nodejs";

type SuccessPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function SuccessPage({ searchParams }: SuccessPageProps) {
  const sp = await searchParams;
  const sessionId = (sp.session_id as string | undefined) ?? null;

  let email: string | null = null;
  let order:
    | (Awaited<ReturnType<typeof prisma.order.findUnique>> & {
        artwork: { imageUrl: string; petName: string | null; petType: string | null } | null;
      })
    | null = null;

  if (sessionId) {
    try {
      const session = await stripe.checkout.sessions.retrieve(sessionId);
      const metadata = (session.metadata || {}) as { orderId?: string };

      email =
        session.customer_email ??
        session.customer_details?.email ??
        null;

      if (metadata.orderId) {
        const found = await prisma.order.findUnique({
          where: { id: metadata.orderId },
          include: { artwork: true },
        });
        if (found) {
          // TS is a bit dumb about the include shape
          // @ts-expect-error – safe at runtime
          order = found;
        }
      }
    } catch (err) {
      console.error("Error loading Stripe session / order:", err);
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900/70 px-6 py-7 shadow-xl">
        <h1 className="text-2xl font-semibold mb-2">
          Thank you for your order 🐾
        </h1>
        <p className="text-sm text-slate-300 mb-4">
          Your payment has been processed securely via Stripe. We&apos;ll start
          preparing your custom flask shortly.
        </p>

        {order ? (
          <div className="mb-4 rounded-lg border border-slate-800 bg-slate-950/60 p-3 text-xs space-y-2">
            <p className="text-slate-300">
              <span className="font-semibold">Order ID:</span>{" "}
              <span className="font-mono">{order.id}</span>
            </p>
            {email && (
              <p className="text-slate-300">
                <span className="font-semibold">Confirmation sent to:</span>{" "}
                {email}
              </p>
            )}
            <p className="text-slate-400">
              <span className="font-semibold">Product:</span>{" "}
              {order.productType.replace(/_/g, " ")}
            </p>
            <p className="text-slate-400">
              <span className="font-semibold">Quantity:</span>{" "}
              {order.quantity}
            </p>
            {order.artwork && (
              <div className="flex items-center gap-3 pt-2 border-t border-slate-800 mt-2">
                <div className="w-14 h-14 rounded-md overflow-hidden border border-slate-700 bg-slate-900">
                  {/* @ts-expect-error – imageUrl is a string */}
                  <img
                    src={order.artwork.imageUrl}
                    alt="Artwork preview"
                    className="w-full h-full object-contain"
                  />
                </div>
                <div className="text-[11px] text-slate-300">
                  <p className="font-semibold">
                    {order.artwork.petName || "Your pet"}
                  </p>
                  <p className="text-slate-400">
                    {order.artwork.petType || "Custom style artwork"}
                  </p>
                </div>
              </div>
            )}
          </div>
        ) : (
          <p className="text-xs text-slate-400 mb-4">
            We couldn&apos;t load the order summary from Stripe, but if you
            completed payment you&apos;re all set. You&apos;ll receive a
            confirmation email shortly.
          </p>
        )}

        <Link
          href="/"
          className="mt-2 inline-flex w-full items-center justify-center rounded-lg bg-emerald-500 py-2.5 text-sm font-medium text-slate-950 hover:bg-emerald-400 transition"
        >
          Back to studio
        </Link>

        <p className="mt-3 text-[11px] text-slate-500 text-center">
          If anything looks wrong, reply to your confirmation email and we&apos;ll help.
        </p>
      </div>
    </main>
  );
}
