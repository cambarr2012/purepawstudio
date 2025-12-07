// src/app/admin/orders/[orderId]/page.tsx
import prisma from "@/lib/prisma";
import Link from "next/link";

interface OrderPageProps {
  params: any; // we'll normalise it ourselves
}

export const dynamic = "force-dynamic";

export default async function OrderDetailPage({ params }: OrderPageProps) {
  // Normalise params in case it's a Promise or a plain object
  const resolvedParams = await Promise.resolve(params);
  console.log("OrderDetailPage resolvedParams:", resolvedParams);

  const orderId: string | undefined =
    resolvedParams.orderId ?? resolvedParams["order-Id"];

  if (!orderId) {
    return (
      <main className="min-h-screen bg-slate-950 text-slate-100">
        <div className="max-w-3xl mx-auto px-4 py-10">
          <Link
            href="/admin"
            className="text-xs text-sky-400 hover:text-sky-300"
          >
            ← Back to admin
          </Link>
          <h1 className="mt-4 text-xl font-semibold">Invalid order URL</h1>
          <p className="mt-2 text-sm text-slate-400">
            This order page is missing a valid ID. Try going back to the admin
            dashboard and clicking the order link again.
          </p>
        </div>
      </main>
    );
  }

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { artwork: true },
  });

  if (!order) {
    return (
      <main className="min-h-screen bg-slate-950 text-slate-100">
        <div className="max-w-3xl mx-auto px-4 py-10">
          <Link
            href="/admin"
            className="text-xs text-sky-400 hover:text-sky-300"
          >
            ← Back to admin
          </Link>
          <h1 className="mt-4 text-xl font-semibold">Order not found</h1>
          <p className="mt-2 text-sm text-slate-400">
            No order exists with ID{" "}
            <span className="font-mono">{orderId}</span>.
          </p>
        </div>
      </main>
    );
  }

  const createdAt =
    order.createdAt instanceof Date
      ? order.createdAt.toLocaleString("en-GB", {
          day: "2-digit",
          month: "short",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })
      : String(order.createdAt);

  const artwork = order.artwork;

  const orderPack = {
    orderId: order.id,
    createdAt,
    status: order.status,
    productType: order.productType,
    quantity: order.quantity,
    customer: {
      name: order.customerName,
      email: order.email,
      addressLine1: order.addressLine1,
      addressLine2: order.addressLine2,
      city: order.city,
      postcode: order.postcode,
      country: order.country,
    },
    artwork: artwork
      ? {
          artworkId: artwork.id,
          petName: artwork.petName,
          petType: artwork.petType,
          styleId: artwork.styleId,
          imageUrl: artwork.imageUrl,
        }
      : null,
  };

  const orderPackText = JSON.stringify(orderPack, null, 2);

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between gap-2 mb-6">
          <div className="space-y-1">
            <Link
              href="/admin"
              className="text-xs text-sky-400 hover:text-sky-300"
            >
              ← Back to admin
            </Link>
            <h1 className="text-2xl font-semibold mt-2">
              Order{" "}
              <span className="font-mono text-emerald-300 text-sm">
                {order.id}
              </span>
            </h1>
            <p className="text-sm text-slate-400">
              Created: {createdAt} · Status:{" "}
              <span className="uppercase font-medium">{order.status}</span>
            </p>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-[1.2fr,1fr] items-start">
          {/* Left column: details + JSON pack */}
          <section className="bg-slate-900/70 border border-slate-800 rounded-2xl p-4 md:p-5 space-y-4">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-300">
              Customer & shipping
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div>
                <p className="text-slate-400">Name</p>
                <p className="font-medium text-slate-100">
                  {order.customerName}
                </p>
              </div>
              <div>
                <p className="text-slate-400">Email</p>
                <p className="font-medium text-slate-100">{order.email}</p>
              </div>
              <div>
                <p className="text-slate-400">Address</p>
                <p className="font-medium text-slate-100">
                  {order.addressLine1}
                  {order.addressLine2 && (
                    <>
                      <br />
                      {order.addressLine2}
                    </>
                  )}
                  <br />
                  {order.city}
                  <br />
                  {order.postcode}
                  <br />
                  {order.country}
                </p>
              </div>
              <div>
                <p className="text-slate-400">Product</p>
                <p className="font-medium text-slate-100">
                  {order.productType}
                </p>
                <p className="mt-1 text-slate-400">
                  Qty: <span className="font-semibold">{order.quantity}</span>
                </p>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-300 mb-2">
                Order pack (copy for Two Fifteen)
              </h2>
              <p className="text-[11px] text-slate-500 mb-2">
                Copy this JSON into your internal notes or attach it when
                placing the order with Two Fifteen. It contains everything you
                need: artwork ID, customer details, SKU and quantity.
              </p>
              <textarea
                readOnly
                className="w-full h-64 text-[11px] font-mono rounded-lg border border-slate-800 bg-slate-950/80 p-3 text-slate-100 resize-none"
                value={orderPackText}
              />
            </div>
          </section>

          {/* Right column: artwork preview */}
          <section className="bg-slate-900/70 border border-slate-800 rounded-2xl p-4 md:p-5 space-y-4">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-300">
              Artwork preview
            </h2>

            {artwork ? (
              <div className="space-y-3 text-xs">
                <div className="w-full aspect-square rounded-xl overflow-hidden border border-slate-800 bg-slate-950 flex items-center justify-center">
                  {artwork.imageUrl ? (
                    <img
                      src={artwork.imageUrl}
                      alt={artwork.petName ?? "Artwork"}
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <span className="text-slate-500 text-[11px]">
                      No image available
                    </span>
                  )}
                </div>
                <div className="space-y-1">
                  <p className="font-mono text-[10px] text-emerald-300">
                    Artwork ID: {artwork.id}
                  </p>
                  <p className="text-[11px] text-slate-200">
                    {artwork.petName
                      ? `${artwork.petName} · ${artwork.petType ?? "Pet"}`
                      : artwork.petType ?? "Pet artwork"}
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Style: <span className="font-medium">{artwork.styleId}</span>
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-sm text-slate-500">
                No artwork found for this order (this shouldn&apos;t normally
                happen).
              </p>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
