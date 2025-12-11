// src/app/admin/page.tsx
// @ts-nocheck

import Link from "next/link";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

async function getData() {
  // Latest orders
  const { data: ordersRaw } = await supabaseAdmin
    .from("orders")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(30);

  const orders = (ordersRaw ?? []) as any[];

  // Collect artwork IDs
  const artworkIds = Array.from(
    new Set(
      orders
        .map((o) => o.artwork_id)
        .filter((id: any): id is string => !!id)
    )
  );

  const artworksMap = new Map<string, any>();

  if (artworkIds.length > 0) {
    const { data: artworksRaw } = await supabaseAdmin
      .from("artworks")
      .select("*")
      .in("id", artworkIds);

    (artworksRaw ?? []).forEach((art: any) => {
      artworksMap.set(art.id, art);
    });
  }

  return { orders, artworksMap };
}

function formatDate(iso: string | null | undefined) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function StatusBadge({ status }: { status: string | null | undefined }) {
  const s = (status || "created").toLowerCase();

  let label = s;
  let classes =
    "bg-slate-800 text-slate-200 border border-slate-600";

  if (s === "created") {
    label = "Created";
    classes = "bg-slate-900 text-slate-200 border border-slate-600";
  } else if (s === "paid") {
    label = "Paid";
    classes = "bg-amber-500/10 text-amber-300 border border-amber-400/60";
  } else if (s === "ready_for_print") {
    label = "Ready for print";
    classes =
      "bg-emerald-500/10 text-emerald-300 border border-emerald-400/70";
  }

  return (
    <span
      className={`inline-flex items-center px-2 py-[2px] rounded-full text-[10px] font-medium ${classes}`}
    >
      {label}
    </span>
  );
}

export default async function AdminPage() {
  const { orders, artworksMap } = await getData();

  const totalOrders = orders.length;
  const paidCount = orders.filter(
    (o: any) => (o.status || "").toLowerCase() === "paid"
  ).length;
  const readyCount = orders.filter(
    (o: any) => (o.status || "").toLowerCase() === "ready_for_print"
  ).length;

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      {/* Warm amber/navy background to match new brand vibe */}
      <div className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(circle_at_top,_rgba(251,191,36,0.16)_0,transparent_55%),radial-gradient(circle_at_bottom,_rgba(15,23,42,1)_0,rgba(15,23,42,1)_60%)]" />

      <div className="max-w-6xl mx-auto px-4 py-8">
        <header className="mb-8 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">
              Admin dashboard
            </h1>
            <p className="text-sm text-slate-400">
              Internal view of PurePaw Flask orders &amp; print files.
            </p>
          </div>
          <div className="text-right text-[11px] text-slate-500 space-y-1">
            <p>Dev-only · no auth · Supabase-backed.</p>
            <p className="text-slate-400">
              Orders:{" "}
              <span className="text-slate-50 font-semibold">
                {totalOrders}
              </span>{" "}
              · Paid:{" "}
              <span className="text-amber-300 font-semibold">
                {paidCount}
              </span>{" "}
              · Ready for print:{" "}
              <span className="text-emerald-300 font-semibold">
                {readyCount}
              </span>
            </p>
          </div>
        </header>

        <section className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 md:p-5 shadow-[0_18px_50px_rgba(0,0,0,0.7)]">
          <div className="flex items-center justify-between gap-2 mb-4">
            <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-300">
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
                    <th className="py-2 pr-3 text-left font-medium">Order</th>
                    <th className="py-2 px-3 text-left font-medium">
                      Customer &amp; shipping
                    </th>
                    <th className="py-2 px-3 text-left font-medium">
                      Product
                    </th>
                    <th className="py-2 px-3 text-left font-medium">
                      Artwork
                    </th>
                    <th className="py-2 px-3 text-left font-medium">
                      Status
                    </th>
                    <th className="py-2 pl-3 text-right font-medium">
                      Created
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order: any) => {
                    const artwork = order.artwork_id
                      ? artworksMap.get(order.artwork_id)
                      : undefined;

                    return (
                      <tr
                        key={order.order_id}
                        className="border-b border-slate-900/70 hover:bg-slate-900/70 transition"
                      >
                        {/* Order + Stripe + print file */}
                        <td className="py-2 pr-3 align-top">
                          <div className="font-mono text-[11px] text-amber-300">
                            {String(order.order_id).slice(0, 12)}…
                          </div>
                          {order.stripe_session_id && (
                            <div className="mt-1 text-[10px] text-slate-500">
                              Stripe:{" "}
                              <span className="font-mono">
                                {String(order.stripe_session_id).slice(0, 10)}…
                              </span>
                            </div>
                          )}
                          {order.print_file_url && (
                            <div className="mt-1">
                              <a
                                href={order.print_file_url}
                                target="_blank"
                                rel="noreferrer"
                                className="text-[10px] text-emerald-300 hover:text-emerald-200 underline"
                              >
                                View print file
                              </a>
                            </div>
                          )}
                        </td>

                        {/* Customer + shipping */}
                        <td className="py-2 px-3 align-top text-[11px]">
                          <div className="font-medium">
                            {order.customer_name || "—"}
                          </div>
                          <div className="text-slate-400">
                            {order.email || "—"}
                          </div>
                          <div className="mt-1 text-[10px] text-slate-500 leading-tight">
                            {order.address_line1 && (
                              <div>{order.address_line1}</div>
                            )}
                            {order.address_line2 && (
                              <div>{order.address_line2}</div>
                            )}
                            <div>
                              {order.city || "—"},{" "}
                              {order.postcode || "—"}
                            </div>
                            <div>{order.country || "—"}</div>
                          </div>
                        </td>

                        {/* Product */}
                        <td className="py-2 px-3 align-top text-[11px]">
                          <div className="font-medium">
                            {order.product_type ||
                              "twofifteen_premium_stainless_flask_500ml"}
                          </div>
                          <div className="text-slate-500">
                            Qty: {order.quantity ?? 1}
                          </div>
                          {order.style_id && (
                            <div className="mt-1 text-[10px] text-slate-500">
                              Style: {order.style_id}
                            </div>
                          )}
                        </td>

                        {/* Artwork summary */}
                        <td className="py-2 px-3 align-top text-[11px]">
                          {order.artwork_id ? (
                            <>
                              <div className="font-mono text-[10px] text-slate-300">
                                {order.artwork_id}
                              </div>
                              {artwork && (
                                <div className="mt-1 text-[10px] text-slate-500">
                                  {artwork.pet_name
                                    ? `${artwork.pet_name} · ${
                                        artwork.pet_type ?? "Pet"
                                      }`
                                    : artwork.pet_type ?? "Unnamed pet"}
                                </div>
                              )}
                            </>
                          ) : (
                            <span className="text-slate-500">—</span>
                          )}
                        </td>

                        {/* Status */}
                        <td className="py-2 px-3 align-top text-right">
                          <div className="mb-1">
                            <StatusBadge status={order.status} />
                          </div>
                          {order.print_file_url ? (
                            <p className="text-[10px] text-emerald-300">
                              Print file ready
                            </p>
                          ) : (
                            <p className="text-[10px] text-slate-500">
                              Awaiting print file
                            </p>
                          )}
                        </td>

                        {/* Created */}
                        <td className="py-2 pl-3 pr-1 align-top text-right text-[10px] text-slate-500 whitespace-nowrap">
                          {formatDate(order.created_at)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <div className="mt-8 text-[11px] text-amber-300">
          <Link
            href="/"
            className="inline-flex items-center gap-1 border-b border-amber-300/60 hover:border-amber-200"
          >
            <span>← Back to studio</span>
          </Link>
        </div>
      </div>
    </main>
  );
}
