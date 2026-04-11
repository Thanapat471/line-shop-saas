import { createAdminSupabaseClient } from "@/lib/supabase/server";
import { PageWrapper } from "@/components/dashboard/PageWrapper";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { SalesChart } from "@/components/dashboard/SalesChart";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const STATUS_LABELS: Record<string, string> = {
  new: "ใหม่",
  waiting_payment: "รอชำระ",
  paid: "ชำระแล้ว",
  processing: "กำลังเตรียม",
  shipped: "จัดส่งแล้ว",
  completed: "เสร็จสิ้น",
  cancelled: "ยกเลิก",
};

const STATUS_STYLES: Record<string, string> = {
  completed: "bg-emerald-100 text-emerald-700",
  processing: "bg-amber-100 text-amber-700",
  paid: "bg-amber-100 text-amber-700",
  shipped: "bg-sky-100 text-sky-700",
  cancelled: "bg-rose-100 text-rose-700",
  waiting_payment: "bg-violet-100 text-violet-700",
  new: "bg-stone-100 text-stone-600",
};

function thaiDateLabel(dateStr: string) {
  return new Intl.DateTimeFormat("th-TH", {
    day: "numeric",
    month: "short",
  }).format(new Date(dateStr));
}

async function loadReportData() {
  const supabase = createAdminSupabaseClient();

  // โหลดทุก order (สำหรับคำนวณ stats และกราฟ)
  const { data: orders } = await supabase
    .from("orders")
    .select("status, total_amount, placed_at")
    .order("placed_at", { ascending: true });

  if (!orders) return null;

  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);
  const weekAgo = new Date(now);
  weekAgo.setDate(weekAgo.getDate() - 6);

  // ยอดวันนี้
  const todayOrders = orders.filter(
    (o) => o.placed_at.slice(0, 10) === todayStr,
  );
  const todayRevenue = todayOrders
    .filter((o) => o.status === "completed")
    .reduce((s, o) => s + Number(o.total_amount), 0);

  // ยอดสัปดาห์นี้
  const weekOrders = orders.filter(
    (o) => new Date(o.placed_at) >= weekAgo,
  );
  const weekRevenue = weekOrders
    .filter((o) => o.status === "completed")
    .reduce((s, o) => s + Number(o.total_amount), 0);

  // รายได้รวมทั้งหมด
  const totalRevenue = orders
    .filter((o) => o.status === "completed")
    .reduce((s, o) => s + Number(o.total_amount), 0);

  // สถิติตาม status
  const byStatus = orders.reduce<Record<string, number>>((acc, o) => {
    acc[o.status] = (acc[o.status] ?? 0) + 1;
    return acc;
  }, {});

  // กราฟ 30 วัน — สร้าง array วันย้อนหลัง 30 วัน
  const days: { date: string; revenue: number; orders: number }[] = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().slice(0, 10);
    const dayOrders = orders.filter((o) => o.placed_at.slice(0, 10) === dateStr);
    days.push({
      date: thaiDateLabel(dateStr),
      revenue: dayOrders
        .filter((o) => o.status === "completed")
        .reduce((s, o) => s + Number(o.total_amount), 0),
      orders: dayOrders.length,
    });
  }

  return {
    todayOrders: todayOrders.length,
    todayRevenue,
    weekOrders: weekOrders.length,
    weekRevenue,
    totalRevenue,
    totalOrders: orders.length,
    byStatus,
    chartData: days,
  };
}

export default async function ReportsPage() {
  const data = await loadReportData();

  if (!data) {
    return (
      <PageWrapper>
        <p className="text-sm text-stone-400">ไม่สามารถโหลดข้อมูลได้</p>
      </PageWrapper>
    );
  }

  const {
    todayOrders,
    todayRevenue,
    weekOrders,
    weekRevenue,
    totalRevenue,
    totalOrders,
    byStatus,
    chartData,
  } = data;

  return (
    <PageWrapper>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-stone-950">รายงาน</h1>
        <p className="mt-1 text-sm text-stone-400">สรุปยอดขายและออเดอร์</p>
      </div>

      {/* Stats */}
      <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatsCard label="ออเดอร์วันนี้" value={todayOrders} index={0} />
        <StatsCard
          label="ยอดวันนี้"
          value={`฿${todayRevenue.toLocaleString("th-TH", { minimumFractionDigits: 2 })}`}
          sub="completed เท่านั้น"
          index={1}
        />
        <StatsCard
          label="ออเดอร์สัปดาห์นี้"
          value={weekOrders}
          sub="7 วันที่ผ่านมา"
          index={2}
        />
        <StatsCard
          label="ยอดสัปดาห์นี้"
          value={`฿${weekRevenue.toLocaleString("th-TH", { minimumFractionDigits: 2 })}`}
          sub="completed เท่านั้น"
          index={3}
        />
      </div>

      {/* Chart */}
      <div className="mb-6 overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
        <div className="border-b border-stone-100 px-6 py-4">
          <h2 className="font-semibold text-stone-900">
            ยอดขาย 30 วันที่ผ่านมา
          </h2>
          <p className="mt-0.5 text-xs text-stone-400">
            รวมเฉพาะออเดอร์ที่สถานะ completed
          </p>
        </div>
        <div className="px-4 py-6">
          <SalesChart data={chartData} />
        </div>
      </div>

      {/* Bottom row */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Status breakdown */}
        <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
          <div className="border-b border-stone-100 px-6 py-4">
            <h2 className="font-semibold text-stone-900">ออเดอร์ตามสถานะ</h2>
          </div>
          <div className="divide-y divide-stone-100">
            {Object.entries(byStatus).map(([status, count]) => (
              <div
                key={status}
                className="flex items-center justify-between px-6 py-3"
              >
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_STYLES[status] ?? "bg-stone-100 text-stone-600"}`}
                >
                  {STATUS_LABELS[status] ?? status}
                </span>
                <span className="text-sm font-bold text-stone-900">{count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Summary totals */}
        <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
          <div className="border-b border-stone-100 px-6 py-4">
            <h2 className="font-semibold text-stone-900">ภาพรวมทั้งหมด</h2>
          </div>
          <div className="divide-y divide-stone-100">
            <div className="flex justify-between px-6 py-3 text-sm">
              <span className="text-stone-500">ออเดอร์ทั้งหมด</span>
              <span className="font-bold text-stone-900">{totalOrders}</span>
            </div>
            <div className="flex justify-between px-6 py-3 text-sm">
              <span className="text-stone-500">รายได้รวม (completed)</span>
              <span className="font-bold text-emerald-600">
                ฿{totalRevenue.toLocaleString("th-TH", { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex justify-between px-6 py-3 text-sm">
              <span className="text-stone-500">ออเดอร์ที่ยกเลิก</span>
              <span className="font-bold text-rose-500">
                {byStatus["cancelled"] ?? 0}
              </span>
            </div>
            <div className="flex justify-between px-6 py-3 text-sm">
              <span className="text-stone-500">รอดำเนินการ</span>
              <span className="font-bold text-stone-900">
                {(byStatus["new"] ?? 0) +
                  (byStatus["waiting_payment"] ?? 0) +
                  (byStatus["processing"] ?? 0)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </PageWrapper>
  );
}
