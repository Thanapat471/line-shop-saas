import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { createAdminSupabaseClient } from "@/lib/supabase/server";
import { updateOrderStatus } from "./actions";
import { StatusForm } from "./StatusForm";

export const dynamic = "force-dynamic";
export const revalidate = 0;

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
    dateStyle: "long",
    timeStyle: "short",
  }).format(new Date(value));
}

async function loadOrder(id: string) {
  const supabase = createAdminSupabaseClient();
  const { data } = await supabase
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
    <div className="p-8">
      {/* Back + title */}
      <div className="mb-8 flex items-center gap-4">
        <Link
          href="/dashboard/orders"
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-stone-200 bg-white text-stone-500 transition hover:border-stone-400 hover:text-stone-900"
        >
          <ChevronLeft size={18} />
        </Link>
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-stone-950">
              {order.order_number}
            </h1>
            <span
              className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLES[order.status] ?? "bg-stone-100 text-stone-600"}`}
            >
              {order.status}
            </span>
          </div>
          <p className="mt-0.5 text-sm text-stone-400">
            {formatDate(order.placed_at)}
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left */}
        <div className="flex flex-col gap-6 lg:col-span-2">
          {/* Items */}
          <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
            <div className="border-b border-stone-100 px-6 py-4">
              <h2 className="font-semibold text-stone-900">สินค้าในออเดอร์</h2>
            </div>
            {order.order_items.length === 0 ? (
              <p className="py-10 text-center text-sm text-stone-400">
                ไม่มีรายการสินค้า
              </p>
            ) : (
              <>
                <table className="min-w-full">
                  <thead>
                    <tr className="border-b border-stone-100 bg-stone-50 text-left text-xs font-medium text-stone-400">
                      <th className="px-6 py-3">สินค้า</th>
                      <th className="px-6 py-3">SKU</th>
                      <th className="px-6 py-3 text-right">ราคา/ชิ้น</th>
                      <th className="px-6 py-3 text-right">จำนวน</th>
                      <th className="px-6 py-3 text-right">รวม</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {order.order_items.map((item) => (
                      <tr key={item.id}>
                        <td className="px-6 py-4 font-medium text-stone-900">
                          {item.product_name_snapshot}
                        </td>
                        <td className="px-6 py-4 font-mono text-xs text-stone-400">
                          {item.sku_snapshot ?? "-"}
                        </td>
                        <td className="px-6 py-4 text-right text-sm text-stone-600">
                          ฿{Number(item.unit_price_amount).toFixed(2)}
                        </td>
                        <td className="px-6 py-4 text-right text-sm text-stone-600">
                          {item.quantity}
                        </td>
                        <td className="px-6 py-4 text-right font-semibold text-stone-900">
                          ฿{Number(item.line_total_amount).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="space-y-2 border-t border-stone-100 px-6 py-4 text-sm">
                  <div className="flex justify-between text-stone-500">
                    <span>ยอดสินค้า</span>
                    <span>฿{Number(order.subtotal_amount).toFixed(2)}</span>
                  </div>
                  {Number(order.discount_amount) > 0 && (
                    <div className="flex justify-between text-rose-600">
                      <span>ส่วนลด</span>
                      <span>-฿{Number(order.discount_amount).toFixed(2)}</span>
                    </div>
                  )}
                  {Number(order.shipping_amount) > 0 && (
                    <div className="flex justify-between text-stone-500">
                      <span>ค่าจัดส่ง</span>
                      <span>฿{Number(order.shipping_amount).toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between border-t border-stone-100 pt-2 font-bold text-stone-950">
                    <span>ยอดรวม</span>
                    <span>฿{Number(order.total_amount).toFixed(2)}</span>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Notes */}
          {order.notes && (
            <div className="rounded-2xl border border-stone-200 bg-white px-6 py-5 shadow-sm">
              <h2 className="mb-2 font-semibold text-stone-900">
                ข้อความจากลูกค้า
              </h2>
              <p className="text-sm leading-7 text-stone-500">{order.notes}</p>
            </div>
          )}
        </div>

        {/* Right */}
        <div className="flex flex-col gap-6">
          {/* Customer */}
          <div className="rounded-2xl border border-stone-200 bg-white px-6 py-5 shadow-sm">
            <h2 className="mb-4 font-semibold text-stone-900">ลูกค้า</h2>
            <div className="flex items-center gap-3">
              {customer?.picture_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={customer.picture_url}
                  alt={displayName}
                  className="h-10 w-10 rounded-full object-cover"
                />
              ) : (
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-stone-100 text-sm font-semibold text-stone-500">
                  {displayName.slice(0, 1).toUpperCase()}
                </div>
              )}
              <div>
                <p className="font-medium text-stone-900">{displayName}</p>
                <p className="font-mono text-xs text-stone-400">
                  {customer?.line_user_id}
                </p>
              </div>
            </div>
          </div>

          {/* Status */}
          <div className="rounded-2xl border border-stone-200 bg-white px-6 py-5 shadow-sm">
            <h2 className="mb-4 font-semibold text-stone-900">เปลี่ยนสถานะ</h2>
            <StatusForm orderId={id} currentStatus={order.status} />
          </div>
        </div>
      </div>
    </div>
  );
}
