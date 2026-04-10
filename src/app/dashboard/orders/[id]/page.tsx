import Link from "next/link";
import { notFound } from "next/navigation";
import { createAdminSupabaseClient } from "@/lib/supabase/server";
import { StatusForm } from "./StatusForm";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function statusClasses(status: string) {
  switch (status) {
    case "completed":
      return "bg-emerald-100 text-emerald-800";
    case "processing":
    case "paid":
      return "bg-amber-100 text-amber-800";
    case "shipped":
      return "bg-sky-100 text-sky-800";
    case "cancelled":
      return "bg-rose-100 text-rose-800";
    case "waiting_payment":
      return "bg-violet-100 text-violet-800";
    default:
      return "bg-stone-200 text-stone-700";
  }
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("th-TH", {
    dateStyle: "long",
    timeStyle: "short",
  }).format(new Date(value));
}

async function loadOrder(id: string) {
  const supabase = createAdminSupabaseClient();

  const { data, error } = await supabase
    .from("orders")
    .select(
      `id, order_number, status, payment_status, notes,
       subtotal_amount, discount_amount, shipping_amount, total_amount, currency,
       placed_at, customer_name, shipping_address, shipping_postcode, shipping_note,
       customers(line_user_id, line_display_name, picture_url),
       order_items(id, product_name_snapshot, sku_snapshot, quantity, unit_price_amount, line_total_amount)`,
    )
    .eq("id", id)
    .single();

  if (error || !data) return null;
  return data;
}

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const order = await loadOrder(id);

  if (!order) notFound();

  const customer = Array.isArray(order.customers)
    ? order.customers[0]
    : order.customers;

  const displayName =
    customer?.line_display_name ?? customer?.line_user_id ?? "ไม่ทราบชื่อ";

  return (
    <main className="min-h-screen bg-stone-100 px-6 py-10 text-stone-950">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
        {/* Back + header */}
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/orders"
            className="rounded-full border border-stone-300 px-4 py-1.5 text-sm font-medium text-stone-700 transition hover:border-stone-900 hover:text-stone-950"
          >
            ← กลับ
          </Link>
          <h1 className="text-xl font-semibold">{order.order_number}</h1>
          <span
            className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusClasses(order.status)}`}
          >
            {order.status}
          </span>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Left column: items + summary */}
          <div className="flex flex-col gap-6 lg:col-span-2">
            {/* Order items */}
            <section className="overflow-hidden rounded-[24px] border border-stone-200 bg-white shadow-[0_8px_32px_rgba(28,25,23,0.06)]">
              <div className="border-b border-stone-200 px-6 py-4">
                <h2 className="font-semibold">สินค้าในออเดอร์</h2>
              </div>
              {order.order_items.length === 0 ? (
                <p className="px-6 py-8 text-center text-sm text-stone-500">
                  ไม่มีรายการสินค้า
                </p>
              ) : (
                <table className="min-w-full divide-y divide-stone-100">
                  <thead className="bg-stone-50 text-left text-xs text-stone-500">
                    <tr>
                      <th className="px-6 py-3 font-medium">สินค้า</th>
                      <th className="px-6 py-3 font-medium">SKU</th>
                      <th className="px-6 py-3 font-medium text-right">ราคา/ชิ้น</th>
                      <th className="px-6 py-3 font-medium text-right">จำนวน</th>
                      <th className="px-6 py-3 font-medium text-right">รวม</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {order.order_items.map((item) => (
                      <tr key={item.id}>
                        <td className="px-6 py-4 text-sm font-medium text-stone-950">
                          {item.product_name_snapshot}
                        </td>
                        <td className="px-6 py-4 text-sm text-stone-500">
                          {item.sku_snapshot ?? "-"}
                        </td>
                        <td className="px-6 py-4 text-sm text-right text-stone-700">
                          {Number(item.unit_price_amount).toFixed(2)}
                        </td>
                        <td className="px-6 py-4 text-sm text-right text-stone-700">
                          {item.quantity}
                        </td>
                        <td className="px-6 py-4 text-sm text-right font-medium text-stone-950">
                          {Number(item.line_total_amount).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
              {/* Summary */}
              <div className="border-t border-stone-200 px-6 py-4 space-y-1.5 text-sm">
                <div className="flex justify-between text-stone-600">
                  <span>ยอดสินค้า</span>
                  <span>{Number(order.subtotal_amount).toFixed(2)}</span>
                </div>
                {Number(order.discount_amount) > 0 && (
                  <div className="flex justify-between text-rose-600">
                    <span>ส่วนลด</span>
                    <span>-{Number(order.discount_amount).toFixed(2)}</span>
                  </div>
                )}
                {Number(order.shipping_amount) > 0 && (
                  <div className="flex justify-between text-stone-600">
                    <span>ค่าจัดส่ง</span>
                    <span>{Number(order.shipping_amount).toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between border-t border-stone-200 pt-2 font-semibold text-stone-950">
                  <span>ยอดรวม ({order.currency})</span>
                  <span>{Number(order.total_amount).toFixed(2)}</span>
                </div>
              </div>
            </section>

            {/* Notes */}
            {order.notes && (
              <section className="rounded-[24px] border border-stone-200 bg-white px-6 py-5 shadow-[0_8px_32px_rgba(28,25,23,0.06)]">
                <h2 className="mb-2 font-semibold">ข้อความจากลูกค้า</h2>
                <p className="text-sm leading-7 text-stone-600">{order.notes}</p>
              </section>
            )}
          </div>

          {/* Right column: customer + status */}
          <div className="flex flex-col gap-6">
            {/* Customer */}
            <section className="rounded-[24px] border border-stone-200 bg-white px-6 py-5 shadow-[0_8px_32px_rgba(28,25,23,0.06)]">
              <h2 className="mb-4 font-semibold">ลูกค้า</h2>
              <div className="flex items-center gap-3">
                {customer?.picture_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={customer.picture_url}
                    alt={displayName}
                    className="h-10 w-10 rounded-full object-cover"
                  />
                ) : (
                  <div className="h-10 w-10 rounded-full bg-stone-200 flex items-center justify-center text-stone-500 text-sm font-medium">
                    {displayName.slice(0, 1).toUpperCase()}
                  </div>
                )}
                <div>
                  <p className="text-sm font-medium text-stone-950">
                    {displayName}
                  </p>
                  <p className="text-xs text-stone-500">
                    {customer?.line_user_id}
                  </p>
                </div>
              </div>
              <div className="mt-4 text-sm text-stone-600">
                <p className="text-xs text-stone-400 mb-0.5">วันที่สั่ง</p>
                <p>{formatDate(order.placed_at)}</p>
              </div>
            </section>

            {/* Change status */}
            <section className="rounded-[24px] border border-stone-200 bg-white px-6 py-5 shadow-[0_8px_32px_rgba(28,25,23,0.06)]">
              <h2 className="mb-4 font-semibold">เปลี่ยนสถานะ</h2>
              <StatusForm orderId={id} currentStatus={order.status} />
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}
