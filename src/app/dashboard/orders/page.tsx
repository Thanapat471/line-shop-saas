import Link from "next/link";
import { createAdminSupabaseClient } from "@/lib/supabase/server";
import { PageWrapper } from "@/components/dashboard/PageWrapper";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { AnimatedTbody, AnimatedTr } from "@/components/dashboard/AnimatedRows";
import { OrdersRealtimeRefresh } from "@/components/dashboard/OrdersRealtimeRefresh";
import { OrdersSearchFilter } from "./OrdersSearchFilter";

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

async function loadStats() {
  const supabase = createAdminSupabaseClient();
  const { data } = await supabase
    .from("orders")
    .select("status, total_amount");

  if (!data) return { total: 0, pending: 0, revenue: 0 };

  const total = data.length;
  const pending = data.filter((o) =>
    ["new", "waiting_payment", "processing"].includes(o.status),
  ).length;
  const revenue = data
    .filter((o) => o.status === "completed")
    .reduce((sum, o) => sum + Number(o.total_amount), 0);

  return { total, pending, revenue };
}

function getDateRangeStart(date: string): string | null {
  const now = new Date();
  if (date === "today") {
    now.setHours(0, 0, 0, 0);
    return now.toISOString();
  }
  if (date === "week") {
    now.setDate(now.getDate() - now.getDay());
    now.setHours(0, 0, 0, 0);
    return now.toISOString();
  }
  if (date === "month") {
    now.setDate(1);
    now.setHours(0, 0, 0, 0);
    return now.toISOString();
  }
  return null;
}

async function loadOrders(status: string, q: string, date: string) {
  const supabase = createAdminSupabaseClient();
  let query = supabase
    .from("orders")
    .select(
      "id, order_number, status, notes, total_amount, currency, placed_at, customers(line_user_id, line_display_name)",
    )
    .order("placed_at", { ascending: false })
    .limit(200);

  if (status) query = query.eq("status", status);

  const dateStart = getDateRangeStart(date);
  if (dateStart) query = query.gte("placed_at", dateStart);

  const { data, error } = await query;
  if (error) return { orders: [] as OrderRow[], error: error.message };

  let orders = (data ?? []) as OrderRow[];

  if (q) {
    const lower = q.toLowerCase();
    orders = orders.filter(
      (o) =>
        o.order_number.toLowerCase().includes(lower) ||
        o.customers?.[0]?.line_display_name?.toLowerCase().includes(lower),
    );
  }

  return { orders, error: null };
}

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string; date?: string }>;
}) {
  const { status = "", q = "", date = "" } = await searchParams;
  const [{ total, pending, revenue }, { orders, error }] = await Promise.all([
    loadStats(),
    loadOrders(status, q, date),
  ]);

  return (
    <PageWrapper>
      <OrdersRealtimeRefresh />
      {/* Header */}
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-stone-950">ออเดอร์</h1>
          <p className="mt-1 text-sm text-stone-400">รายการออเดอร์จาก LINE</p>
        </div>
        <Link
          href="/dashboard/orders/new"
          className="rounded-xl bg-stone-950 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-stone-700 active:scale-[0.98]"
        >
          + สร้างออเดอร์
        </Link>
      </div>

      {/* Stats */}
      <div className="mb-8 grid grid-cols-3 gap-4">
        <StatsCard label="ออเดอร์ทั้งหมด" value={total} index={0} />
        <StatsCard
          label="รอดำเนินการ"
          value={pending}
          sub="new + รอชำระ + กำลังเตรียม"
          index={1}
        />
        <StatsCard
          label="รายได้ (completed)"
          value={`฿${revenue.toLocaleString("th-TH", { minimumFractionDigits: 2 })}`}
          index={2}
        />
      </div>

      {/* Search & Date Filter */}
      <OrdersSearchFilter />

      {/* Status Filter */}
      <div className="mb-5 flex flex-wrap gap-2">
        {STATUSES.map((s) => {
          const params = new URLSearchParams();
          if (s.value) params.set("status", s.value);
          if (q) params.set("q", q);
          if (date) params.set("date", date);
          const href = `/dashboard/orders${params.toString() ? `?${params.toString()}` : ""}`;
          return (
            <Link
              key={s.value}
              href={href}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
                status === s.value
                  ? "bg-stone-950 text-white"
                  : "bg-white border border-stone-200 text-stone-500 hover:border-stone-400 hover:text-stone-900"
              }`}
            >
              {s.label}
            </Link>
          );
        })}
      </div>

      {error && (
        <div className="mb-5 rounded-2xl border border-rose-200 bg-rose-50 px-6 py-4 text-sm text-rose-700">
          {error}
        </div>
      )}

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
        {orders.length === 0 ? (
          <div className="py-20 text-center">
            <p className="text-sm font-medium text-stone-400">ไม่มีออเดอร์</p>
            <p className="mt-1 text-xs text-stone-300">
              {status ? `ที่มีสถานะ "${status}"` : "รอข้อความจาก LINE"}
            </p>
          </div>
        ) : (
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-stone-100 bg-stone-50/80 text-left text-xs font-semibold uppercase tracking-wider text-stone-400">
                <th className="px-6 py-3">ออเดอร์</th>
                <th className="px-6 py-3">ลูกค้า</th>
                <th className="px-6 py-3">ข้อความ</th>
                <th className="px-6 py-3">วันที่</th>
                <th className="px-6 py-3 text-right">ยอด</th>
                <th className="px-6 py-3">สถานะ</th>
              </tr>
            </thead>
            <AnimatedTbody className="divide-y divide-stone-100">
              {orders.map((order) => (
                <AnimatedTr
                  key={order.id}
                  className="hover:bg-stone-50/60 transition-colors"
                >
                  <td className="px-6 py-4">
                    <Link
                      href={`/dashboard/orders/${order.id}`}
                      className="font-semibold text-stone-900 hover:text-green-600 transition-colors"
                    >
                      {order.order_number}
                    </Link>
                  </td>
                  <td className="px-6 py-4 text-sm text-stone-600">
                    {order.customers?.[0]?.line_display_name ??
                      order.customers?.[0]?.line_user_id ??
                      "-"}
                  </td>
                  <td className="max-w-[200px] px-6 py-4 text-sm text-stone-400 truncate">
                    {order.notes ?? "-"}
                  </td>
                  <td className="px-6 py-4 text-sm text-stone-400 whitespace-nowrap">
                    {formatDate(order.placed_at)}
                  </td>
                  <td className="px-6 py-4 text-sm font-bold text-stone-900 text-right whitespace-nowrap">
                    ฿{Number(order.total_amount).toFixed(2)}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_STYLES[order.status] ?? "bg-stone-100 text-stone-600"}`}
                    >
                      {order.status}
                    </span>
                  </td>
                </AnimatedTr>
              ))}
            </AnimatedTbody>
          </table>
        )}
      </div>
    </PageWrapper>
  );
}
