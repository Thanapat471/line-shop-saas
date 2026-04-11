"use server";

import { redirect } from "next/navigation";
import { createAdminSupabaseClient } from "@/lib/supabase/server";

async function getFirstShopId() {
  const supabase = createAdminSupabaseClient();
  const { data } = await supabase
    .from("shops")
    .select("id")
    .eq("status", "active")
    .limit(1)
    .single();
  return data?.id ?? null;
}

type OrderItem = {
  product_id: string;
  quantity: number;
  unit_price: number;
};

export async function createManualOrder(formData: FormData) {
  const shopId = await getFirstShopId();
  if (!shopId) throw new Error("No active shop found");

  const supabase = createAdminSupabaseClient();

  const customerId = formData.get("customer_id") as string;
  if (!customerId) throw new Error("กรุณาเลือกลูกค้า");

  const notes = (formData.get("notes") as string) || null;

  // parse items JSON ที่ส่งมาจาก form
  const itemsJson = formData.get("items") as string;
  const items: OrderItem[] = JSON.parse(itemsJson);

  if (!items.length) throw new Error("กรุณาเลือกสินค้าอย่างน้อย 1 รายการ");

  // โหลด product info สำหรับ snapshot
  const productIds = items.map((i) => i.product_id);
  const { data: productRows } = await supabase
    .from("products")
    .select("id, name, sku")
    .in("id", productIds);

  const productMap = new Map(productRows?.map((p) => [p.id, p]) ?? []);

  const subtotal = items.reduce(
    (sum, item) => sum + item.unit_price * item.quantity,
    0,
  );

  const orderNumber = `MAN-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

  // สร้าง order
  const { data: order, error: orderError } = await supabase
    .from("orders")
    .insert({
      shop_id: shopId,
      customer_id: customerId,
      order_number: orderNumber,
      source: "dashboard",
      status: "new",
      payment_status: "pending",
      fulfillment_status: "unfulfilled",
      notes,
      currency: "THB",
      subtotal_amount: subtotal,
      discount_amount: 0,
      shipping_amount: 0,
      total_amount: subtotal,
      placed_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (orderError) throw new Error(orderError.message);

  // สร้าง order_items (ใช้ column names ตาม schema)
  const orderItemRows = items.map((item) => {
    const product = productMap.get(item.product_id);
    return {
      order_id: order.id,
      product_id: item.product_id,
      product_name_snapshot: product?.name ?? "สินค้า",
      sku_snapshot: product?.sku ?? null,
      quantity: item.quantity,
      unit_price_amount: item.unit_price,
      line_total_amount: item.unit_price * item.quantity,
      currency: "THB",
    };
  });

  const { error: itemsError } = await supabase
    .from("order_items")
    .insert(orderItemRows);

  if (itemsError) throw new Error(itemsError.message);

  redirect(`/dashboard/orders/${order.id}`);
}
