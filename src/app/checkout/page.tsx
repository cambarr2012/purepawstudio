"use client";

import { useState, useEffect, FormEvent, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";

type CreateOrderResponse = {
  ok?: boolean;
  orderId: string;
  id?: string;
  artworkId?: string;
  styleId?: string | null;
  email?: string | null;
};

type CreateCheckoutSessionResponse = {
  url: string;
};

const DEFAULT_PRODUCT_TYPE = "twofifteen_premium_stainless_flask_500ml";

function CheckoutContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [artworkId, setArtworkId] = useState<string | null>(null);
  const [styleId, setStyleId] = useState<string | null>(null);

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

    const styleFromQuery = searchParams.get("styleId");
    if (styleFromQuery) {
      setStyleId(styleFromQuery);
    }
  }, [searchParams]);

  async function handleSubmitOrder(e: FormEvent) {
    e.preventDefault();

    if (!artworkId) {
      setOrderError(
        "No design found. Please go back to the studio and create your PurePaw Flask design first."
      );
      return;
    }

    try {
      setIsSubmittingOrder(true);
      setOrderError(null);
      setOrderId(null);

      // 1) Create order (stateless API)
      const orderRes = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          artworkId,
          styleId,
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
      const createdOrderId = orderData.orderId;
      setOrderId(createdOrderId);
      console.log("Order created:", orderData);

      // 2) Create Stripe checkout session for that order
      const checkoutRes = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: createdOrderId,
          artworkId,
          styleId,
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
    <main className="min-h-screen bg-[#f7f3ec] text-slate-900">
      <div className="w-full max-w-3xl mx-auto px-4 py-10 md:py-12">
        {/* Back link */}
        <button
          type="button"
          onClick={() => router.push("/")}
          className="mb-6 text-xs text-slate-600 hover:text-slate-900 underline-offset-2 hover:underline transition"
        >
          ← Back to studio
        </button>

        {/* Header */}
        <header className="mb-6">
          <p className="text-[11px] uppercase tracking-[0.25em] text-amber-600/80 mb-2">
            Secure checkout
          </p>
          <h1 className="text-2xl md:text-3xl font-semibold mb-2">
            Finish your PurePaw Flask order
          </h1>
          <p className="text-slate-700 text-sm md:text-base">
            You&apos;ve designed your flask. Now confirm your details and we’ll
            take you to our encrypted Stripe checkout to complete your purchase.
          </p>
        </header>

        {/* Checkout card */}
        <section className="bg-white border border-slate-200 rounded-2xl p-5 md:p-6 space-y-4 shadow-sm">
          {/* Artwork + style summary */}
          <div className="text-[11px] text-slate-600 mb-2 space-y-1">
            {hasArtwork ? (
              <>
                <p>
                  Design linked ✓ Artwork ID:{" "}
                  <span className="font-mono text-[10px] text-slate-900">
                    {artworkId}
                  </span>
                </p>
                {styleId && (
                  <p>
                    Style:{" "}
                    <span className="font-mono text-[10px] text-amber-700">
                      {styleId}
                    </span>
                  </p>
                )}
              </>
            ) : (
              <p className="text-rose-600">
                No design ID detected. Please return to the studio, create your
                PurePaw Flask design, and click &quot;Continue to checkout&quot;
                again.
              </p>
            )}
          </div>

          {/* Order summary */}
          <div className="rounded-lg border border-slate-200 bg-[#fdfaf4] px-3 py-2 text-[11px] text-slate-700">
            <p className="font-medium text-slate-900">Order summary</p>
            <p className="mt-1">
              Product:{" "}
              <span className="font-semibold">PurePaw Flask (500ml)</span>{" "}
              – a double-walled stainless steel bottle with your pet&apos;s
              portrait printed on the front.
            </p>
            <p className="mt-1">
              Design: the artwork you just created in the studio will be used as
              the final print on your flask.
            </p>
            <p className="text-slate-600 mt-1">
              Once payment is complete, your order goes straight into
              production and we&apos;ll email you updates as it moves through
              printing and dispatch.
            </p>
          </div>

          {/* Form */}
          <form
            onSubmit={handleSubmitOrder}
            className="space-y-3 text-[11px]"
          >
            <div className="grid grid-cols-1 gap-2">
              <div className="flex flex-col gap-1">
                <label className="text-slate-800">Full name</label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="rounded-md border border-slate-300 bg-white px-2 py-1.5 text-xs text-slate-900 outline-none focus:ring-2 focus:ring-amber-400"
                  placeholder="Name for shipping label"
                  disabled={!hasArtwork || isSubmittingOrder}
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-slate-800">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="rounded-md border border-slate-300 bg-white px-2 py-1.5 text-xs text-slate-900 outline-none focus:ring-2 focus:ring-amber-400"
                  placeholder="We’ll send your order updates here"
                  disabled={!hasArtwork || isSubmittingOrder}
                />
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-slate-800">Address line 1</label>
              <input
                type="text"
                value={addressLine1}
                onChange={(e) => setAddressLine1(e.target.value)}
                className="rounded-md border border-slate-300 bg-white px-2 py-1.5 text-xs text-slate-900 outline-none focus:ring-2 focus:ring-amber-400"
                placeholder="House number and street"
                disabled={!hasArtwork || isSubmittingOrder}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-slate-800">Address line 2</label>
              <input
                type="text"
                value={addressLine2}
                onChange={(e) => setAddressLine2(e.target.value)}
                className="rounded-md border border-slate-300 bg-white px-2 py-1.5 text-xs text-slate-900 outline-none focus:ring-2 focus:ring-amber-400"
                placeholder="Optional"
                disabled={!hasArtwork || isSubmittingOrder}
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="flex flex-col gap-1">
                <label className="text-slate-800">City</label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="rounded-md border border-slate-300 bg-white px-2 py-1.5 text-xs text-slate-900 outline-none focus:ring-2 focus:ring-amber-400"
                  disabled={!hasArtwork || isSubmittingOrder}
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-slate-800">Postcode</label>
                <input
                  type="text"
                  value={postcode}
                  onChange={(e) => setPostcode(e.target.value)}
                  className="rounded-md border border-slate-300 bg-white px-2 py-1.5 text-xs text-slate-900 outline-none focus:ring-2 focus:ring-amber-400"
                  disabled={!hasArtwork || isSubmittingOrder}
                />
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-slate-800">Country</label>
              <input
                type="text"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="rounded-md border border-slate-300 bg-white px-2 py-1.5 text-xs text-slate-900 outline-none focus:ring-2 focus:ring-amber-400"
                disabled={!hasArtwork || isSubmittingOrder}
              />
            </div>

            <div className="grid grid-cols-[1fr,1fr] gap-2 items-end">
              <div className="flex flex-col gap-1">
                <label className="text-slate-800">Quantity</label>
                <input
                  type="number"
                  min={1}
                  value={quantity}
                  onChange={(e) =>
                    setQuantity(Math.max(1, Number(e.target.value) || 1))
                  }
                  className="rounded-md border border-slate-300 bg-white px-2 py-1.5 text-xs text-slate-900 outline-none focus:ring-2 focus:ring-amber-400"
                  disabled={!hasArtwork || isSubmittingOrder}
                />
              </div>
              <div className="text-right text-[11px] text-slate-600">
                <p>Product: PurePaw Flask (500ml)</p>
                <p className="opacity-70">Internal SKU: {DEFAULT_PRODUCT_TYPE}</p>
              </div>
            </div>

            <button
              type="submit"
              disabled={!hasArtwork || isSubmittingOrder}
              className="mt-2 w-full rounded-lg bg-slate-900 text-slate-50 text-xs font-medium py-2.5 disabled:opacity-60 hover:bg-slate-800 transition"
            >
              {isSubmittingOrder
                ? "Redirecting to secure payment…"
                : "Confirm & pay securely"}
            </button>

            {orderError && (
              <p className="mt-2 text-[11px] text-rose-600">{orderError}</p>
            )}
            {orderId && !orderError && (
              <p className="mt-2 text-[11px] text-slate-600">
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
