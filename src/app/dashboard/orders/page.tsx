import Link from "next/link";
import { createAdminSupabaseClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type OrderRow = {
  id: string;
  order_number: string;
  status: string;
  notes: string | null;
  total_amount: number;
  currency: string;
  placed_at: string;
  customers: Array<{
    line_user_id: string;
    line_display_name: string | null;
  }> | null;
};

function formatPlacedAt(value: string) {
  return new Intl.DateTimeFormat("th-TH", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function statusClasses(status: string) {
  switch (status) {
    case "completed":
      return "bg-emerald-100 text-emerald-800";
    case "processing":
      return "bg-amber-100 text-amber-800";
    case "shipped":
      return "bg-sky-100 text-sky-800";
    case "cancelled":
      return "bg-rose-100 text-rose-800";
    default:
      return "bg-stone-200 text-stone-700";
  }
}

async function loadOrders() {
  const hasEnv =
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) &&
    Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY);

  if (!hasEnv) {
    return {
      orders: [] as OrderRow[],
      setupError:
        "Missing Supabase environment variables. Add the values from .env.example first.",
    };
  }

  try {
    const supabase = createAdminSupabaseClient();
    const { data, error } = await supabase
      .from("orders")
      .select(
        "id, order_number, status, notes, total_amount, currency, placed_at, customers(line_user_id, line_display_name)",
      )
      .order("placed_at", { ascending: false })
      .limit(50);

    if (error) {
      return {
        orders: [] as OrderRow[],
        setupError: error.message,
      };
    }

    return {
      orders: (data ?? []) as OrderRow[],
      setupError: null,
    };
  } catch (error) {
    return {
      orders: [] as OrderRow[],
      setupError:
        error instanceof Error ? error.message : "Unknown dashboard error",
    };
  }
}

export default async function OrdersDashboardPage() {
  const { orders, setupError } = await loadOrders();

  return (
    <main className="min-h-screen bg-stone-100 px-6 py-10 text-stone-950">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
        <section className="rounded-[32px] border border-stone-200 bg-white p-8 shadow-[0_24px_80px_rgba(28,25,23,0.08)]">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-3">
              <div className="inline-flex rounded-full bg-emerald-100 px-4 py-1 text-sm font-medium text-emerald-800">
                Minimal Dashboard
              </div>
              <div className="space-y-2">
                <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                  Orders coming from LINE webhook
                </h1>
                <p className="max-w-2xl text-sm leading-7 text-stone-600 sm:text-base">
                  This page is the first merchant-facing view. It shows the
                  latest draft orders created from incoming LINE messages so we
                  can validate the end-to-end flow quickly.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/"
                className="rounded-full border border-stone-300 px-5 py-2 text-sm font-medium text-stone-700 transition hover:border-stone-900 hover:text-stone-950"
              >
                Home
              </Link>
              <Link
                href="/api/webhooks/line"
                className="rounded-full bg-stone-950 px-5 py-2 text-sm font-medium text-stone-50 transition hover:bg-stone-700"
              >
                Webhook Health
              </Link>
            </div>
          </div>
        </section>

        {setupError ? (
          <section className="rounded-[28px] border border-amber-200 bg-amber-50 p-6 text-amber-950">
            <h2 className="text-lg font-semibold">Setup still needed</h2>
            <p className="mt-2 text-sm leading-7">{setupError}</p>
            <ol className="mt-4 space-y-2 text-sm leading-7 text-amber-900">
              <li>1. Fill in `.env.local` from `.env.example`.</li>
              <li>2. Apply the schema in Supabase.</li>
              <li>3. Add a `line_channels` record for your LINE OA.</li>
              <li>4. Send a test message into LINE after deploying the webhook.</li>
            </ol>
          </section>
        ) : null}

        <section className="overflow-hidden rounded-[28px] border border-stone-200 bg-white shadow-[0_24px_80px_rgba(28,25,23,0.08)]">
          <div className="flex items-center justify-between border-b border-stone-200 px-6 py-5">
            <div>
              <h2 className="text-lg font-semibold">Latest orders</h2>
              <p className="text-sm text-stone-500">
                Showing up to 50 most recent orders.
              </p>
            </div>
            <div className="rounded-full bg-stone-100 px-4 py-1 text-sm font-medium text-stone-700">
              {orders.length} orders
            </div>
          </div>

          {orders.length === 0 ? (
            <div className="px-6 py-14 text-center text-stone-500">
              No orders yet. Once LINE webhook traffic is flowing, draft orders
              will appear here.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-stone-200">
                <thead className="bg-stone-50">
                  <tr className="text-left text-sm text-stone-500">
                    <th className="px-6 py-4 font-medium">Order</th>
                    <th className="px-6 py-4 font-medium">Customer</th>
                    <th className="px-6 py-4 font-medium">Message</th>
                    <th className="px-6 py-4 font-medium">Placed at</th>
                    <th className="px-6 py-4 font-medium">Amount</th>
                    <th className="px-6 py-4 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 bg-white">
                  {orders.map((order) => (
                    <tr key={order.id} className="align-top hover:bg-stone-50 transition-colors">
                      <td className="px-6 py-5">
                        <Link
                          href={`/dashboard/orders/${order.id}`}
                          className="font-medium text-stone-950 hover:underline"
                        >
                          {order.order_number}
                        </Link>
                        <div className="mt-1 text-xs text-stone-500">
                          {order.id}
                        </div>
                      </td>
                      <td className="px-6 py-5 text-sm text-stone-700">
                        {order.customers?.[0]?.line_display_name ??
                          order.customers?.[0]?.line_user_id ??
                          "Unknown"}
                      </td>
                      <td className="max-w-sm px-6 py-5 text-sm leading-7 text-stone-600">
                        {order.notes ?? "-"}
                      </td>
                      <td className="px-6 py-5 text-sm text-stone-600">
                        {formatPlacedAt(order.placed_at)}
                      </td>
                      <td className="px-6 py-5 text-sm font-medium text-stone-800">
                        {order.currency} {order.total_amount.toFixed(2)}
                      </td>
                      <td className="px-6 py-5">
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusClasses(order.status)}`}
                        >
                          {order.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
