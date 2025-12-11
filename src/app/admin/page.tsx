// src/app/admin/page.tsx
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import Link from "next/link";

export const dynamic = "force-dynamic";

type OrderRow = {
  id: number;
  order_id: string;
  artwork_id: string | null;
  style_id: string | null;
  product_type: string | null;
  quantity: number | null;
  customer_name: string | null;
  email: string | null;
  address_line1: string | null;
  address_line2: string | null;
  city: string | null;
  postcode: string | null;
  country: string | null;
  status: string | null;
  stripe_session_id: string | null;
  print_file_url: string | null;
  created_at: string | null;
};

async function getData() {
  const { data: orders, error } = await supabaseAdmin
    .from("orders")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(20);

  if (error) {
    console.error("[admin] Failed to fetch orders:", error);
  }

  const safeOrders: OrderRow[] = (orders ?? []) as any[];

  const totals = {
    totalOrders: safeOrders.length,
    paid: safeOrders.filter((o) =>
      (o.status ?? "").toLowerCase().includes("paid")
    ).length,
    readyForPrint: safeOrders.filter((o) => !!o.print_file_url).length,
  };

  return { orders: safeOrders, totals };
}

export default async function AdminPage() {
  const { orders, totals } = await getData();

  return (
    <main className="min-h-screen bg-[#F8F1E7] text-slate-900">
      <div className="max-w-6xl mx-auto px-4 py-10">
        {/* Header */}
        <header className="mb-8 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-slate-900">
              Admin dashboard
            </h1>
            <p className="text-sm text-slate-600">
              Internal view of PurePaw Flask orders &amp; print files.
            </p>
          </div>
          <div className="text-xs text-right text-slate-600 space-y-1">
            <p className="uppercase tracking-[0.18em] text-amber-700">
              Dev-only · no auth · Supabase-backed
            </p>
            <p>
              Orders:{" "}
              <span className="font-semibold text-slate-900">
                {totals.totalOrders}
              </span>{" "}
              · Paid:{" "}
              <span className="font-semibold text-emerald-700">
                {totals.paid}
              </span>{" "}
              · Ready for print:{" "}
              <span className="font-semibold text-amber-700">
                {totals.readyForPrint}
              </span>
            </p>
          </div>
        </header>

        {/* Card */}
        <section className="rounded-3xl border border-[#e2d6c5] bg-[#FCFAF7] shadow-[0_18px_40px_rgba(15,23,42,0.12)] px-4 py-4 md:px-6 md:py-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xs font-semibold tracking-[0.22em] uppercase text-amber-700">
              Recent orders
            </h2>
            <span className="text-[11px] text-slate-500">
              Showing latest {orders.length || 0}
            </span>
          </div>

          {orders.length === 0 ? (
            <p className="text-sm text-slate-600">
              No orders yet. Generate a design and complete checkout to see them
              here.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-xs">
                <thead>
                  <tr className="border-b border-[#eadfce] text-slate-500 text-[11px]">
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
                    <th className="py-2 px-3 text-left font-medium">Status</th>
                    <th className="py-2 pl-3 text-right font-medium">
                      Created
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => {
                    const created =
                      order.created_at &&
                      new Date(order.created_at).toLocaleString("en-GB", {
                        day: "2-digit",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      });

                    const hasPrintFile = !!order.print_file_url;
                    const statusLabel = (order.status ?? "Created").toUpperCase();

                    return (
                      <tr
                        key={order.id}
                        className="border-b border-[#f0e5d6] hover:bg-[#f4e9da] transition"
                      >
                        <td className="py-2 pr-3 align-top">
                          <div className="font-mono text-[11px] text-amber-700">
                            {order.order_id?.slice(0, 12) ?? "—"}
                          </div>
                          <div className="mt-1 text-[10px] text-slate-500">
                            Stripe:{" "}
                            <span className="font-mono">
                              {order.stripe_session_id?.slice(0, 10) || "—"}
                            </span>
                          </div>
                        </td>

                        <td className="py-2 px-3 align-top text-[11px]">
                          <div className="font-medium text-slate-900">
                            {order.customer_name || "—"}
                          </div>
                          <div className="text-slate-500">
                            {order.email || "—"}
                          </div>
                          <div className="mt-1 text-slate-500">
                            {order.address_line1 && (
                              <>
                                {order.address_line1}
                                {order.address_line2 && (
                                  <>
                                    <br />
                                    {order.address_line2}
                                  </>
                                )}
                                <br />
                              </>
                            )}
                            {order.city && `${order.city}, `}
                            {order.postcode}
                            {order.country && (
                              <>
                                <br />
                                {order.country}
                              </>
                            )}
                          </div>
                        </td>

                        <td className="py-2 px-3 align-top text-[11px]">
                          <div className="font-medium text-slate-900">
                            {order.product_type || "—"}
                          </div>
                          <div className="text-slate-500">
                            Qty: {order.quantity ?? 1}
                          </div>
                          {order.style_id && (
                            <div className="text-[10px] text-slate-500">
                              Style: {order.style_id}
                            </div>
                          )}
                        </td>

                        <td className="py-2 px-3 align-top text-[11px]">
                          <div className="font-mono text-[10px] text-slate-700">
                            {order.artwork_id || "—"}
                          </div>
                          <div className="mt-1 text-[10px] text-slate-500">
                            Print file:{" "}
                            {hasPrintFile ? (
                              <span className="text-emerald-700 font-medium">
                                Ready
                              </span>
                            ) : (
                              <span>Awaiting</span>
                            )}
                          </div>
                          {hasPrintFile && (
                            <a
                              href={order.print_file_url!}
                              target="_blank"
                              rel="noreferrer"
                              className="mt-1 inline-flex text-[10px] text-amber-700 underline"
                            >
                              Open PNG
                            </a>
                          )}
                        </td>

                        <td className="py-2 px-3 align-top text-[11px]">
                          <span className="inline-flex items-center rounded-full border border-amber-300 bg-amber-100/80 px-2 py-[2px] text-[10px] font-medium text-amber-800">
                            {statusLabel}
                          </span>
                          <div className="mt-1 text-[10px] text-slate-500">
                            {hasPrintFile ? "Print file ready" : "Awaiting print file"}
                          </div>
                        </td>

                        <td className="py-2 pl-3 pr-1 align-top text-right text-[10px] text-slate-500 whitespace-nowrap">
                          {created || "—"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <div className="mt-6">
          <Link
            href="/"
            className="text-[11px] text-amber-700 hover:text-amber-800 underline underline-offset-4"
          >
            ← Back to studio
          </Link>
        </div>
      </div>
    </main>
  );
}
