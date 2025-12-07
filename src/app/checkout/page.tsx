"use client";

import { useState, useEffect, FormEvent, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";

type CreateOrderResponse = {
  orderId: string;
  status: string;
  createdAt: string;
};

type CreateCheckoutSessionResponse = {
  url: string;
};

const DEFAULT_PRODUCT_TYPE = "twofifteen_premium_stainless_flask_500ml";

function CheckoutContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [artworkId, setArtworkId] = useState<string | null>(null);

  const [customerName, setCustomerName] = useState("");
  const [email, setEmail] = useState("");
  const [addressLine1, setAddressLine1] = useState("");
  const [addressLine2, setAddressLine2] = useState("");
  const [city, setCity] = useState("");
  const [postcode, setPostcode] = useState("");
  const [country, setCountry] = useState("United Kingdom");
  const [quantity, setQuantity] = useState(1);

  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [orderError, setOrderError] = useState<string | null>(null);

  useEffect(() => {
    const idFromQuery = searchParams.get("artworkId");
    if (idFromQuery) {
      setArtworkId(idFromQuery);
    }
  }, [searchParams]);

  async function handleSubmitOrder(e: FormEvent) {
    e.preventDefault();

    if (!artworkId) {
      setOrderError(
        "No design found. Please go back to the studio and generate your flask art first."
      );
      return;
    }

    try {
      setIsSubmittingOrder(true);
      setOrderError(null);
      setOrderId(null);

      // 1) Create order in our DB
      const orderRes = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          artworkId,
          productType: DEFAULT_PRODUCT_TYPE,
          quantity,
          customerName,
          email,
          addressLine1,
          addressLine2: addressLine2 || undefined,
          city,
          postcode,
          country,
        }),
      });

      const orderJson = (await orderRes.json()) as
        | CreateOrderResponse
        | { error?: string };

      if (!orderRes.ok || "error" in orderJson) {
        const errMsg =
          "error" in orderJson && orderJson.error
            ? orderJson.error
            : "Something went wrong while creating your order.";
        setOrderError(errMsg);
        setIsSubmittingOrder(false);
        return;
      }

      const orderData = orderJson as CreateOrderResponse;
      setOrderId(orderData.orderId);
      console.log("Order created:", orderData);

      // 2) Create Stripe checkout session for that order
      const checkoutRes = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
             orderId,
             artworkId,
                 email,
                 }),
                });

      const checkoutJson = (await checkoutRes.json()) as
        | CreateCheckoutSessionResponse
        | { error?: string };

      if (!checkoutRes.ok || "error" in checkoutJson) {
        const errMsg =
          "error" in checkoutJson && checkoutJson.error
            ? checkoutJson.error
            : "Something went wrong while starting secure payment.";
        setOrderError(errMsg);
        setIsSubmittingOrder(false);
        return;
      }

      const { url } = checkoutJson as CreateCheckoutSessionResponse;

      if (!url) {
        setOrderError("No payment URL returned from Stripe.");
        setIsSubmittingOrder(false);
        return;
      }

      // 3) Redirect to Stripe checkout
      window.location.href = url;
    } catch (err) {
      console.error("Error creating order / checkout session:", err);
      setOrderError(
        "Something went wrong while creating your order. Please try again."
      );
      setIsSubmittingOrder(false);
    }
  }

  const hasArtwork = !!artworkId;

  return (
    <main className="min-h-screen bg-slate-950 text-slate-50">
      {/* Background gradient to match studio */}
      <div className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(circle_at_top,_rgba(45,212,191,0.12)_0,transparent_55%),radial-gradient(circle_at_bottom,_rgba(15,23,42,1)_0,rgba(15,23,42,1)_55%)]" />

      <div className="w-full max-w-3xl mx-auto px-4 py-10">
        <button
          type="button"
          onClick={() => router.push("/")}
          className="mb-6 text-xs text-slate-400 hover:text-slate-200 transition"
        >
          ← Back to studio
        </button>

        <header className="mb-6">
          <h1 className="text-2xl md:text-3xl font-semibold mb-2">
            Secure checkout
          </h1>
          <p className="text-slate-300 text-sm md:text-base">
            Confirm your shipping details and we&apos;ll redirect you to our
            encrypted Stripe payment page.
          </p>
        </header>

        <section className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 md:p-6 space-y-4 shadow-[0_20px_60px_rgba(0,0,0,0.6)]">
          <div className="text-[11px] text-slate-400 mb-2">
            {hasArtwork ? (
              <p>
                Design linked ✓ Artwork ID:{" "}
                <span className="font-mono text-[10px] text-slate-200">
                  {artworkId}
                </span>
              </p>
            ) : (
              <p className="text-rose-300">
                No design ID detected. Please return to the studio, generate
                your flask art, and click &quot;Continue to checkout&quot;
                again.
              </p>
            )}
          </div>

          <div className="rounded-lg border border-slate-800 bg-slate-950/60 px-3 py-2 text-[11px] text-slate-300">
            <p className="font-medium">Order summary</p>
            <p className="mt-1 text-slate-400">
              Product: Premium stainless steel flask with your custom AI pet
              artwork.
            </p>
            <p className="text-slate-500 mt-1">
              Your artwork is already stored in our system and will be sent to
              production once payment is complete.
            </p>
          </div>

          <form
            onSubmit={handleSubmitOrder}
            className="space-y-3 text-[11px]"
          >
            <div className="grid grid-cols-1 gap-2">
              <div className="flex flex-col gap-1">
                <label className="text-slate-300">Full name</label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="rounded-md border border-slate-700 bg-slate-900 px-2 py-1.5 text-xs outline-none focus:ring-2 focus:ring-sky-500"
                  placeholder="Name for shipping label"
                  disabled={!hasArtwork || isSubmittingOrder}
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-slate-300">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="rounded-md border border-slate-700 bg-slate-900 px-2 py-1.5 text-xs outline-none focus:ring-2 focus:ring-sky-500"
                  placeholder="We’ll send order updates here"
                  disabled={!hasArtwork || isSubmittingOrder}
                />
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-slate-300">Address line 1</label>
              <input
                type="text"
                value={addressLine1}
                onChange={(e) => setAddressLine1(e.target.value)}
                className="rounded-md border border-slate-700 bg-slate-900 px-2 py-1.5 text-xs outline-none focus:ring-2 focus:ring-sky-500"
                placeholder="House number and street"
                disabled={!hasArtwork || isSubmittingOrder}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-slate-300">Address line 2</label>
              <input
                type="text"
                value={addressLine2}
                onChange={(e) => setAddressLine2(e.target.value)}
                className="rounded-md border border-slate-700 bg-slate-900 px-2 py-1.5 text-xs outline-none focus:ring-2 focus:ring-sky-500"
                placeholder="Optional"
                disabled={!hasArtwork || isSubmittingOrder}
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="flex flex-col gap-1">
                <label className="text-slate-300">City</label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="rounded-md border border-slate-700 bg-slate-900 px-2 py-1.5 text-xs outline-none focus:ring-2 focus:ring-sky-500"
                  disabled={!hasArtwork || isSubmittingOrder}
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-slate-300">Postcode</label>
                <input
                  type="text"
                  value={postcode}
                  onChange={(e) => setPostcode(e.target.value)}
                  className="rounded-md border border-slate-700 bg-slate-900 px-2 py-1.5 text-xs outline-none focus:ring-2 focus:ring-sky-500"
                  disabled={!hasArtwork || isSubmittingOrder}
                />
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-slate-300">Country</label>
              <input
                type="text"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="rounded-md border border-slate-700 bg-slate-900 px-2 py-1.5 text-xs outline-none focus:ring-2 focus:ring-sky-500"
                disabled={!hasArtwork || isSubmittingOrder}
              />
            </div>

            <div className="grid grid-cols-[1fr,1fr] gap-2 items-end">
              <div className="flex flex-col gap-1">
                <label className="text-slate-300">Quantity</label>
                <input
                  type="number"
                  min={1}
                  value={quantity}
                  onChange={(e) =>
                    setQuantity(Math.max(1, Number(e.target.value) || 1))
                  }
                  className="rounded-md border border-slate-700 bg-slate-900 px-2 py-1.5 text-xs outline-none focus:ring-2 focus:ring-sky-500"
                  disabled={!hasArtwork || isSubmittingOrder}
                />
              </div>
              <div className="text-right text-[11px] text-slate-500">
                <p>Product: Premium stainless flask</p>
                <p className="opacity-70">SKU: {DEFAULT_PRODUCT_TYPE}</p>
              </div>
            </div>

            <button
              type="submit"
              disabled={!hasArtwork || isSubmittingOrder}
              className="mt-2 w-full rounded-lg bg-amber-400 text-slate-900 text-xs font-medium py-2.5 disabled:opacity-60 hover:bg-amber-300 transition"
            >
              {isSubmittingOrder
                ? "Redirecting to secure payment…"
                : "Confirm & pay securely"}
            </button>

            {orderError && (
              <p className="mt-2 text-[11px] text-rose-300">{orderError}</p>
            )}
            {orderId && !orderError && (
              <p className="mt-2 text-[11px] text-slate-400">
                Order created ✓ You&apos;ll complete payment on the secure
                Stripe checkout page.
              </p>
            )}
          </form>
        </section>
      </div>
    </main>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense>
      <CheckoutContent />
    </Suspense>
  );
}
