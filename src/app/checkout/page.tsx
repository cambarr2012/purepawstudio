"use client";

import Image from "next/image";
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

type ProductType = "flask" | "gym_bottle";

const PRODUCT_LABELS: Record<ProductType, string> = {
  flask: "PurePaw Flask",
  gym_bottle: "PurePaw Gym Bottle",
};

const PRODUCT_PRICES: Record<ProductType, number> = {
  flask: 19.99,
  gym_bottle: 19.99,
};

function CheckoutContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [artworkId, setArtworkId] = useState<string | null>(null);
  const [styleId, setStyleId] = useState<string | null>(null);
  const [productType, setProductType] = useState<ProductType>("flask");

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

    const productTypeFromQuery = searchParams.get("productType");
    if (productTypeFromQuery === "gym_bottle" || productTypeFromQuery === "flask") {
      setProductType(productTypeFromQuery);
    }
  }, [searchParams]);

  const hasArtwork = !!artworkId;
  const productLabel = PRODUCT_LABELS[productType];
  const productPrice = PRODUCT_PRICES[productType] ?? 19.99;
  const formattedPrice = `£${productPrice.toFixed(2)}`;

  const inputBase =
    "w-full rounded-md border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 px-3 py-2 text-sm outline-none " +
    "focus:ring-2 focus:ring-amber-400 focus:border-amber-400 " +
    "disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed " +
    "[color-scheme:light]";

  async function handleSubmitOrder(e: FormEvent) {
    e.preventDefault();

    if (!artworkId) {
      setOrderError(
        "No bottle selected. Please return to the studio and create your bottle first."
      );
      return;
    }

    if (
      !customerName.trim() ||
      !email.trim() ||
      !addressLine1.trim() ||
      !city.trim() ||
      !postcode.trim()
    ) {
      setOrderError(
        "Please fill in all required fields (name, email, address, city, postcode)."
      );
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
          productType,
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
        setOrderError(
          orderJson.error || "Something went wrong while creating your order."
        );
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
          productType,
          email: email.trim(),
        }),
      });

      const checkoutJson =
        (await checkoutRes.json()) as CreateCheckoutSessionResponse;

      if (!checkoutRes.ok || checkoutJson.error) {
        setOrderError(
          checkoutJson.error ||
            "Something went wrong while starting secure payment."
        );
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
      setOrderError(
        "Something went wrong while creating your order. Please try again."
      );
      setIsSubmittingOrder(false);
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#f7f3ec] text-slate-900">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.22]"
        style={{
          backgroundImage: 'url("/backdrop1.png")',
          backgroundRepeat: "repeat",
          backgroundSize: "720px",
          backgroundPosition: "center top",
        }}
      />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[#f7f3ec]/78"
      />

      <div
        className="relative w-full max-w-5xl mx-auto px-4 py-8 md:py-12"
        style={{ colorScheme: "light" }}
      >
        <button
          type="button"
          onClick={() => router.push("/")}
          className="mb-6 text-xs text-slate-600 hover:text-slate-900 underline-offset-2 hover:underline transition"
        >
          ← Back to studio
        </button>

        <header className="mb-8">
          <p className="mb-3 inline-flex items-center rounded-full border border-amber-200 bg-amber-50/95 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.28em] text-amber-700 shadow-sm">
            PurePaw Secure Checkout
          </p>

          <h1 className="text-3xl md:text-4xl font-semibold tracking-tight text-slate-950">
            Complete your order
            <span className="block text-slate-700">and secure your bottle</span>
          </h1>
        </header>

        {!hasArtwork && (
          <div className="mb-5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3">
            <p className="text-sm font-medium text-rose-800">No bottle selected</p>
            <p className="text-[12px] text-rose-700">
              Please return to the studio and create your bottle before checking out.
            </p>
          </div>
        )}

        <div className="grid gap-6 md:grid-cols-[1.08fr,0.92fr]">
          <section className="rounded-[1.4rem] border border-white/70 bg-white/90 p-5 shadow-[0_10px_30px_rgba(15,23,42,0.07)] backdrop-blur-sm md:p-6">
            <div className="mb-5 rounded-2xl border border-amber-100 bg-gradient-to-r from-amber-50 via-white to-amber-50/80 p-4">
              <div className="flex items-center gap-4">
                <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-full border border-white shadow-sm md:h-20 md:w-20">
                  <Image
                    src="/puppydog.png"
                    alt="Cute puppy"
                    fill
                    className="object-cover"
                    sizes="80px"
                    priority
                  />
                </div>

                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-900">Nearly there</p>
                  <p className="mt-1 text-[13px] leading-6 text-slate-600">
                    Fill in your details below to continue to secure payment. Look
                    out for the extra bonus we send in your email after your order.
                  </p>
                </div>
              </div>
            </div>

            <div className="mb-5">
              <h2 className="text-lg font-semibold text-slate-900 mb-2">
                Delivery details
              </h2>
              <p className="text-[13px] leading-6 text-slate-600">
                Enter your checkout details carefully so we can prepare your
                order and send tracking updates once it has been dispatched.
              </p>
            </div>

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
                    placeholder="Your full name"
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
                    placeholder="House number and street"
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
                    placeholder="Flat, apartment or building (optional)"
                    autoComplete="address-line2"
                    disabled={!hasArtwork || isSubmittingOrder}
                  />
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
                className="mt-2 w-full rounded-xl bg-slate-900 py-3 text-sm font-medium text-slate-50 transition hover:bg-slate-800 disabled:opacity-60"
              >
                {isSubmittingOrder
                  ? "Redirecting to secure payment…"
                  : "Continue to secure payment"}
              </button>

              {orderError && (
                <p className="mt-2 text-[12px] text-rose-600">{orderError}</p>
              )}

              <p className="mt-2 text-center text-[11px] text-slate-500">
                Powered by{" "}
                <span className="font-semibold text-slate-800">Stripe</span> ·
                Encrypted checkout
              </p>

              {orderId && (
                <p className="text-center text-[11px] text-slate-500">
                  Order created: <span className="font-mono">{orderId}</span>
                </p>
              )}
            </form>
          </section>

          <aside className="h-fit rounded-[1.4rem] border border-white/70 bg-white/92 p-5 shadow-[0_10px_30px_rgba(15,23,42,0.07)] backdrop-blur-sm md:p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-3">
              Order summary
            </h2>

            <div className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50/95 px-4 py-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[12px] uppercase tracking-[0.18em] text-slate-500">
                    Selected product
                  </p>
                  <p className="text-sm font-medium text-slate-900">
                    {productLabel}
                  </p>
                </div>

                <div className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-amber-700">
                  Personalised for you
                </div>
              </div>

              <div>
                <p className="text-[12px] uppercase tracking-[0.18em] text-slate-500">
                  Bottle style
                </p>
                <p className="text-sm font-medium capitalize text-slate-900">
                  {styleId === "disney" ? "Disney" : styleId || "Selected bottle"}
                </p>
              </div>

              <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-700">
                  Included
                </p>
                <p className="mt-1 text-[13px] text-emerald-900">
                  Free UK shipping on your order
                </p>
              </div>

              <div className="border-t border-slate-200 pt-3 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-600">Product</span>
                  <span className="font-medium text-slate-900">{formattedPrice}</span>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-600">Shipping</span>
                  <span className="font-medium text-emerald-700">Free</span>
                </div>

                <div className="flex items-center justify-between border-t border-slate-200 pt-2 text-sm">
                  <span className="font-semibold text-slate-900">Total</span>
                  <span className="text-base font-semibold text-slate-950">
                    {formattedPrice}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-5 space-y-3">
              <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
                <p className="text-[12px] font-medium text-slate-900">
                  What happens next
                </p>
                <ul className="mt-2 space-y-2 text-[12px] leading-6 text-slate-600">
                  <li>• Your order is confirmed after secure payment</li>
                  <li>• Your bottle is prepared for production</li>
                  <li>• Tracking is sent by email once dispatched</li>
                </ul>
              </div>

              <div className="rounded-xl border border-amber-100 bg-amber-50/80 px-4 py-3">
                <p className="text-[12px] font-medium text-amber-900">
                  Before you pay
                </p>
                <p className="mt-1 text-[12px] leading-6 text-slate-600">
                  Double-check your email and delivery details carefully.
                  Tracking updates and order support will use the information you
                  enter here.
                </p>
              </div>
            </div>
          </aside>
        </div>
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