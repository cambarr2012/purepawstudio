"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";

type OrderWithArtwork = {
  id: string;
  status: string;
  createdAt: string | Date;
  artwork?: {
    id: string;
    imageUrl?: string | null;
    styleId?: string | null;
  } | null;
};

function SuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId");

  const [order, setOrder] = useState<OrderWithArtwork | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Fetch order details from API
  useEffect(() => {
    if (!orderId) return;

    async function fetchOrder() {
      try {
        const res = await fetch(`/api/orders?orderId=${orderId}`);
        const data = await res.json();

        if (!res.ok || data.error) {
          setError(data.error || "Could not load your order.");
          return;
        }

        setOrder(data.order ?? null);
      } catch (err) {
        console.error("Failed to load order:", err);
        setError("Something went wrong while loading your order.");
      }
    }

    fetchOrder();
  }, [orderId]);

  return (
    <main className="min-h-screen bg-slate-950 text-slate-50">
      {/* Background gradient */}
      <div className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(circle_at_top,_rgba(45,212,191,0.12)_0,transparent_55%),radial-gradient(circle_at_bottom,_rgba(15,23,42,1)_0,rgba(15,23,42,1)_55%)]" />

      <div className="max-w-3xl mx-auto px-4 py-14 text-center">
        <h1 className="text-3xl font-semibold mb-3 text-teal-300">
          Payment successful 🎉
        </h1>

        {!orderId && (
          <p className="text-slate-400 text-sm">
            Missing order reference — please return to the studio.
          </p>
        )}

        {error && (
          <p className="mt-4 text-rose-300 text-sm">{error}</p>
        )}

        {order && !error && (
          <>
            <p className="text-slate-300 mt-2 text-sm">
              Order ID:{" "}
              <span className="font-mono text-[11px] text-slate-100">
                {order.id}
              </span>
            </p>

            <p className="text-slate-400 mt-1 text-sm">
              We’ll start preparing your custom flask for production.
            </p>

            {order.artwork?.imageUrl && (
              <div className="mt-8 flex justify-center">
                <img
                  src={order.artwork.imageUrl}
                  alt="Your Artwork"
                  className="w-60 h-60 object-contain rounded-xl border border-slate-800 bg-slate-900 shadow-[0_10px_40px_rgba(0,0,0,0.6)]"
                />
              </div>
            )}

            <button
              onClick={() => router.push("/")}
              className="mt-10 px-5 py-2.5 rounded-lg bg-teal-400 text-slate-900 font-medium text-sm hover:bg-teal-300 transition"
            >
              Back to home
            </button>
          </>
        )}
      </div>
    </main>
  );
}

export default function SuccessPage() {
  return (
    <Suspense fallback={<div className="text-slate-400 p-10">Loading…</div>}>
      <SuccessContent />
    </Suspense>
  );
}
