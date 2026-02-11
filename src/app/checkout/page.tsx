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
  error?: string;
};

type CreateCheckoutSessionResponse = {
  url?: string;
  error?: string;
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

  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [orderError, setOrderError] = useState<string | null>(null);

  useEffect(() => {
    const idFromQuery = searchParams.get("artworkId");
    if (idFromQuery) setArtworkId(idFromQuery);

    const styleFromQuery = searchParams.get("styleId");
    if (styleFromQuery) setStyleId(styleFromQuery);
  }, [searchParams]);

  const hasArtwork = !!artworkId;

  const inputBase =
    "w-full rounded-md border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 px-3 py-2 text-sm outline-none " +
    "focus:ring-2 focus:ring-amber-400 focus:border-amber-400 " +
    "disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed " +
    // force light form control rendering even if something sets color-scheme dark
    "[color-scheme:light]";

  async function handleSubmitOrder(e: FormEvent) {
    e.preventDefault();

    if (!artworkId) {
      setOrderError(
        "No design found. Please return to the studio and create your design first."
      );
      return;
    }

    // Basic validation (keeps Stripe handoff clean)
    if (!customerName.trim() || !email.trim() || !addressLine1.trim() || !city.trim() || !postcode.trim()) {
      setOrderError("Please fill in all required fields (name, email, address, city, postcode).");
      return;
    }

    try {
      setIsSubmittingOrder(true);
      setOrderError(null);
      setOrderId(null);

      const quantity = 1;

      const orderRes = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          artworkId,
          styleId,
          productType: DEFAULT_PRODUCT_TYPE,
          quantity,
          customerName: customerName.trim(),
          email: email.trim(),
          addressLine1: addressLine1.trim(),
          addressLine2: addressLine2.trim() || undefined,
          city: city.trim(),
          postcode: postcode.trim(),
          country: country.trim(),
        }),
      });

      const orderJson = (await orderRes.json()) as CreateOrderResponse;

      if (!orderRes.ok || orderJson.error) {
        setOrderError(orderJson.error || "Something went wrong while creating your order.");
        setIsSubmittingOrder(false);
        return;
      }

      const createdOrderId = orderJson.orderId;
      setOrderId(createdOrderId);

      const checkoutRes = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: createdOrderId,
          artworkId,
          styleId,
          email: email.trim(),
        }),
      });

      const checkoutJson = (await checkoutRes.json()) as CreateCheckoutSessionResponse;

      if (!checkoutRes.ok || checkoutJson.error) {
        setOrderError(checkoutJson.error || "Something went wrong while starting secure payment.");
        setIsSubmittingOrder(false);
        return;
      }

      if (!checkoutJson.url) {
        setOrderError("No payment URL returned from Stripe.");
        setIsSubmittingOrder(false);
        return;
      }

      window.location.href = checkoutJson.url;
    } catch (err) {
      console.error(err);
      setOrderError("Something went wrong while creating your order. Please try again.");
      setIsSubmittingOrder(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#f7f3ec] text-slate-900">
      <div
        className="w-full max-w-3xl mx-auto px-4 py-10 md:py-12"
        // hard force light controls (fixes blacked-out inputs)
        style={{ colorScheme: "light" }}
      >
        <button
          type="button"
          onClick={() => router.push("/")}
          className="mb-6 text-xs text-slate-600 hover:text-slate-900 underline-offset-2 hover:underline transition"
        >
          ← Back to studio
        </button>

        <header className="mb-6">
          <p className="text-[11px] uppercase tracking-[0.25em] text-amber-600/80 mb-2">
            Secure checkout
          </p>
          <h1 className="text-2xl md:text-3xl font-semibold mb-2">
            Finish your PurePaw Flask order
          </h1>
          <p className="text-slate-700 text-sm md:text-base">
            Confirm your details below and we’ll take you to our encrypted Stripe checkout to complete your purchase.
          </p>
        </header>

        {!hasArtwork && (
          <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3">
            <p className="text-sm font-medium text-rose-800">No design selected</p>
            <p className="text-[12px] text-rose-700">
              Please go back to the studio and create a design first.
            </p>
          </div>
        )}

        <section className="bg-white border border-slate-200 rounded-2xl p-5 md:p-6 shadow-sm">
          <form onSubmit={handleSubmitOrder} className="space-y-4">
            <div className="grid gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-[12px] font-medium text-slate-800">
                  Full name <span className="text-rose-600">*</span>
                </label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className={inputBase}
                  placeholder="Your name"
                  autoComplete="name"
                  disabled={!hasArtwork || isSubmittingOrder}
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[12px] font-medium text-slate-800">
                  Email <span className="text-rose-600">*</span>
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={inputBase}
                  placeholder="you@example.com"
                  autoComplete="email"
                  disabled={!hasArtwork || isSubmittingOrder}
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[12px] font-medium text-slate-800">
                  Address line 1 <span className="text-rose-600">*</span>
                </label>
                <input
                  type="text"
                  value={addressLine1}
                  onChange={(e) => setAddressLine1(e.target.value)}
                  className={inputBase}
                  placeholder="House number + street"
                  autoComplete="address-line1"
                  disabled={!hasArtwork || isSubmittingOrder}
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[12px] font-medium text-slate-800">
                  Address line 2
                </label>
                <input
                  type="text"
                  value={addressLine2}
                  onChange={(e) => setAddressLine2(e.target.value)}
                  className={inputBase}
                  placeholder="Flat / apartment / building (optional)"
                  autoComplete="address-line2"
                  disabled={!hasArtwork || isSubmittingOrder}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-[12px] font-medium text-slate-800">
                    City <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className={inputBase}
                    placeholder="City"
                    autoComplete="address-level2"
                    disabled={!hasArtwork || isSubmittingOrder}
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[12px] font-medium text-slate-800">
                    Postcode <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="text"
                    value={postcode}
                    onChange={(e) => setPostcode(e.target.value)}
                    className={inputBase}
                    placeholder="Postcode"
                    autoComplete="postal-code"
                    disabled={!hasArtwork || isSubmittingOrder}
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[12px] font-medium text-slate-800">
                  Country
                </label>
                <input
                  type="text"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  className={inputBase}
                  placeholder="United Kingdom"
                  autoComplete="country-name"
                  disabled={!hasArtwork || isSubmittingOrder}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={!hasArtwork || isSubmittingOrder}
              className="mt-2 w-full rounded-lg bg-slate-900 text-slate-50 text-sm font-medium py-3 disabled:opacity-60 hover:bg-slate-800 transition"
            >
              {isSubmittingOrder ? "Redirecting to secure payment…" : "Confirm & pay securely"}
            </button>

            {orderError && (
              <p className="mt-2 text-[12px] text-rose-600">{orderError}</p>
            )}

            <p className="mt-2 text-[11px] text-slate-500 text-center">
              Powered by <span className="font-semibold text-slate-800">Stripe</span> · Encrypted checkout
            </p>

            {orderId && (
              <p className="text-[11px] text-slate-500 text-center">
                Order created: <span className="font-mono">{orderId}</span>
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
