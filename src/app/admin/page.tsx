// src/app/admin/page.tsx
import prisma from "@/lib/prisma";
import Link from "next/link";

export const dynamic = "force-dynamic"; // always fresh in dev

async function getData() {
  const [orders, artworks] = await Promise.all([
    prisma.order.findMany({
      include: { artwork: true },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
    prisma.artwork.findMany({
      include: {
        _count: {
          select: { orders: true },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
  ]);

  return { orders, artworks };
}

export default async function AdminPage() {
  const { orders, artworks } = await getData();

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <header className="mb-8 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-semibold">
              Admin dashboard
            </h1>
            <p className="text-sm text-slate-400">
              Internal view of AI pet flask artworks and orders.
            </p>
          </div>
          <p className="text-xs text-slate-500">
            Tip: this is dev-only, no auth yet.
          </p>
        </header>

        <div className="grid gap-8 md:grid-cols-[1.4fr,1fr] items-start">
          {/* Orders */}
          <section className="bg-slate-900/70 border border-slate-800 rounded-2xl p-4 md:p-5">
            <div className="flex items-center justify-between gap-2 mb-4">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-300">
                Recent orders
              </h2>
              <span className="text-[11px] text-slate-500">
                Showing latest {orders.length || 0}
              </span>
            </div>

            {orders.length === 0 ? (
              <p className="text-sm text-slate-500">
                No orders yet. Generate a design and complete checkout to see
                them here.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400">
                      <th className="py-2 pr-3 text-left font-medium">
                        Order
                      </th>
                      <th className="py-2 px-3 text-left font-medium">
                        Customer
                      </th>
                      <th className="py-2 px-3 text-left font-medium">
                        Product
                      </th>
                      <th className="py-2 px-3 text-left font-medium">
                        Artwork
                      </th>
                      <th className="py-2 pl-3 text-right font-medium">
                        Created
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((order: any) => (
                      <tr
                        key={order.id}
                        className="border-b border-slate-900/70 hover:bg-slate-900/80 transition"
                      >
                        <td className="py-2 pr-3 align-top">
                          <Link
                            href={`/admin/orders/${order.id}`}
                            className="text-emerald-300 hover:text-emerald-200 font-mono text-[11px]"
                          >
                            {order.id.slice(0, 10)}…
                          </Link>
                          <div className="mt-1 text-[10px] text-slate-500">
                            Status:{" "}
                            <span className="uppercase font-medium">
                              {order.status}
                            </span>
                          </div>
                        </td>
                        <td className="py-2 px-3 align-top text-[11px]">
                          <div className="font-medium">
                            {order.customerName || "—"}
                          </div>
                          <div className="text-slate-500">
                            {order.email || "—"}
                          </div>
                          <div className="text-slate-500">
                            {order.city}, {order.country}
                          </div>
                        </td>
                        <td className="py-2 px-3 align-top text-[11px]">
                          <div className="font-medium">
                            {order.productType}
                          </div>
                          <div className="text-slate-500">
                            Qty: {order.quantity}
                          </div>
                        </td>
                        <td className="py-2 px-3 align-top text-[11px]">
                          <div className="font-mono text-[10px] text-slate-300">
                            {order.artworkId}
                          </div>
                          <div className="text-slate-500 text-[10px]">
                            {order.artwork?.petName
                              ? `${order.artwork.petName} · ${
                                  order.artwork.petType ?? "Pet"
                                }`
                              : order.artwork?.petType ?? "—"}
                          </div>
                          <div className="text-slate-500 text-[10px]">
                            Style: {order.artwork?.styleId ?? "unknown"}
                          </div>
                        </td>
                        <td className="py-2 pl-3 pr-1 align-top text-right text-[10px] text-slate-500 whitespace-nowrap">
                          {order.createdAt instanceof Date
                            ? order.createdAt.toLocaleString("en-GB", {
                                day: "2-digit",
                                month: "short",
                                hour: "2-digit",
                                minute: "2-digit",
                              })
                            : String(order.createdAt)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {/* Artworks */}
          <section className="bg-slate-900/70 border border-slate-800 rounded-2xl p-4 md:p-5">
            <div className="flex items-center justify-between gap-2 mb-4">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-300">
                Recent artworks
              </h2>
              <span className="text-[11px] text-slate-500">
                Showing latest {artworks.length || 0}
              </span>
            </div>

            {artworks.length === 0 ? (
              <p className="text-sm text-slate-500">
                No artworks yet. Generate some designs first.
              </p>
            ) : (
              <div className="space-y-3 max-h-[460px] overflow-y-auto pr-1">
                {artworks.map((artwork: any) => (
                  <div
                    key={artwork.id}
                    className="flex gap-3 rounded-xl border border-slate-800 bg-slate-950/60 p-3"
                  >
                    <div className="w-20 h-20 rounded-lg overflow-hidden border border-slate-800 bg-slate-900 flex items-center justify-center">
                      {artwork.imageUrl ? (
                        <img
                          src={artwork.imageUrl}
                          alt={artwork.petName ?? "Artwork"}
                          className="w-full h-full object-contain"
                        />
                      ) : (
                        <span className="text-[10px] text-slate-500 px-2 text-center">
                          No preview
                        </span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <div className="space-y-0.5">
                          <div className="font-mono text-[10px] text-emerald-300">
                            {artwork.id}
                          </div>
                          <div className="text-[11px] text-slate-200">
                            {artwork.petName
                              ? `${artwork.petName} · ${
                                  artwork.petType ?? "Pet"
                                }`
                              : artwork.petType ?? "Unnamed pet"}
                          </div>
                          <div className="text-[10px] text-slate-500">
                            Style: {artwork.styleId}
                          </div>
                        </div>
                        <div className="text-right text-[10px] text-slate-500 whitespace-nowrap">
                          {artwork.createdAt instanceof Date
                            ? artwork.createdAt.toLocaleString("en-GB", {
                                day: "2-digit",
                                month: "short",
                                hour: "2-digit",
                                minute: "2-digit",
                              })
                            : String(artwork.createdAt)}
                          <div className="mt-1">
                            <span className="inline-flex items-center rounded-full border border-slate-700 px-2 py-[2px] text-[9px] text-slate-400">
                              Orders: {(artwork as any)._count?.orders ?? 0}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
