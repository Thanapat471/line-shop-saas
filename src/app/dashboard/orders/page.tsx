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

const STATUSES = [
  { value: "", label: "ทั้งหมด" },
  { value: "new", label: "ใหม่" },
  { value: "waiting_payment", label: "รอชำระ" },
  { value: "paid", label: "ชำระแล้ว" },
  { value: "processing", label: "กำลังเตรียม" },
  { value: "shipped", label: "จัดส่งแล้ว" },
  { value: "completed", label: "เสร็จสิ้น" },
  { value: "cancelled", label: "ยกเลิก" },
];

const STATUS_STYLES: Record<string, string> = {
  completed: "bg-emerald-100 text-emerald-700",
  processing: "bg-amber-100 text-amber-700",
  paid: "bg-amber-100 text-amber-700",
  shipped: "bg-sky-100 text-sky-700",
  cancelled: "bg-rose-100 text-rose-700",
  waiting_payment: "bg-violet-100 text-violet-700",
  new: "bg-stone-100 text-stone-600",
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("th-TH", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

async function loadOrders(status: string) {
  const supabase = createAdminSupabaseClient();
  let query = supabase
    .from("orders")
    .select(
      "id, order_number, status, notes, total_amount, currency, placed_at, customers(line_user_id, line_display_name)",
    )
    .order("placed_at", { ascending: false })
    .limit(100);

  if (status) query = query.eq("status", status);

  const { data, error } = await query;
  if (error) return { orders: [] as OrderRow[], error: error.message };
  return { orders: (data ?? []) as OrderRow[], error: null };
}

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status = "" } = await searchParams;
  const { orders, error } = await loadOrders(status);

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-stone-950">ออเดอร์</h1>
        <p className="mt-1 text-sm text-stone-500">
          รายการออเดอร์จาก LINE ทั้งหมด
        </p>
      </div>

      {/* Filter */}
      <div className="mb-6 flex flex-wrap gap-2">
        {STATUSES.map((s) => (
          <Link
            key={s.value}
            href={
              s.value
                ? `/dashboard/orders?status=${s.value}`
                : "/dashboard/orders"
            }
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
              status === s.value
                ? "bg-stone-950 text-white"
                : "bg-white border border-stone-200 text-stone-600 hover:border-stone-400"
            }`}
          >
            {s.label}
          </Link>
        ))}
      </div>

      {error && (
        <div className="mb-6 rounded-2xl border border-rose-200 bg-rose-50 px-6 py-4 text-sm text-rose-700">
          {error}
        </div>
      )}

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
        {orders.length === 0 ? (
          <div className="py-20 text-center text-sm text-stone-400">
            ไม่มีออเดอร์{status ? ` ที่มีสถานะ "${status}"` : ""}
          </div>
        ) : (
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-stone-100 bg-stone-50 text-left text-xs font-medium text-stone-400">
                <th className="px-6 py-3">ออเดอร์</th>
                <th className="px-6 py-3">ลูกค้า</th>
                <th className="px-6 py-3">ข้อความ</th>
                <th className="px-6 py-3">วันที่</th>
                <th className="px-6 py-3 text-right">ยอด</th>
                <th className="px-6 py-3">สถานะ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {orders.map((order) => (
                <tr
                  key={order.id}
                  className="hover:bg-stone-50 transition-colors"
                >
                  <td className="px-6 py-4">
                    <Link
                      href={`/dashboard/orders/${order.id}`}
                      className="font-medium text-stone-900 hover:text-stone-600 hover:underline"
                    >
                      {order.order_number}
                    </Link>
                  </td>
                  <td className="px-6 py-4 text-sm text-stone-600">
                    {order.customers?.[0]?.line_display_name ??
                      order.customers?.[0]?.line_user_id ??
                      "-"}
                  </td>
                  <td className="max-w-xs px-6 py-4 text-sm text-stone-400 truncate">
                    {order.notes ?? "-"}
                  </td>
                  <td className="px-6 py-4 text-sm text-stone-500 whitespace-nowrap">
                    {formatDate(order.placed_at)}
                  </td>
                  <td className="px-6 py-4 text-sm font-semibold text-stone-900 text-right whitespace-nowrap">
                    ฿{Number(order.total_amount).toFixed(2)}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLES[order.status] ?? "bg-stone-100 text-stone-600"}`}
                    >
                      {order.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
