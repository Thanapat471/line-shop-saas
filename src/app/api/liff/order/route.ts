import { NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

type OrderItem = {
  productId: string;
  quantity: number;
};

export async function POST(request: Request) {
  try {
    const { lineUserId, channelId, items } = (await request.json()) as {
      lineUserId: string;
      channelId: string;
      items: OrderItem[];
    };

    if (!lineUserId || !channelId || !items?.length) {
      return NextResponse.json({ ok: false, error: "Missing required fields" }, { status: 400 });
    }

    const supabase = createAdminSupabaseClient();

    // หา channel จาก channelId
    const { data: channel } = await supabase
      .from("line_channels")
      .select("id, shop_id")
      .eq("channel_id", channelId)
      .eq("is_active", true)
      .maybeSingle();

    if (!channel) {
      return NextResponse.json({ ok: false, error: "Channel not found" }, { status: 404 });
    }

    // หา customer
    const { data: customer } = await supabase
      .from("customers")
      .select("id")
      .eq("shop_id", channel.shop_id)
      .eq("line_user_id", lineUserId)
      .maybeSingle();

    if (!customer) {
      return NextResponse.json({ ok: false, error: "Customer not found" }, { status: 404 });
    }

    // โหลด products
    const productIds = items.map((i) => i.productId);
    const { data: products } = await supabase
      .from("products")
      .select("id, name, sku, price_amount")
      .in("id", productIds)
      .eq("shop_id", channel.shop_id)
      .eq("is_active", true);

    if (!products?.length) {
      return NextResponse.json({ ok: false, error: "Products not found" }, { status: 404 });
    }

    // คำนวณยอด
    const productMap = new Map(products.map((p) => [p.id, p]));
    const orderItems = items
      .map((item) => {
        const product = productMap.get(item.productId);
        if (!product) return null;
        return { product, quantity: item.quantity };
      })
      .filter(Boolean) as Array<{ product: (typeof products)[0]; quantity: number }>;

    const subtotal = orderItems.reduce(
      (sum, { product, quantity }) => sum + product.price_amount * quantity,
      0,
    );

    const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

    // สร้าง order
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        shop_id: channel.shop_id,
        customer_id: customer.id,
        line_channel_id: channel.id,
        order_number: orderNumber,
        source: "line_chat",
        status: "new",
        payment_status: "pending",
        fulfillment_status: "unfulfilled",
        notes: `สั่งจาก LIFF catalog`,
        currency: "THB",
        subtotal_amount: subtotal,
        discount_amount: 0,
        shipping_amount: 0,
        total_amount: subtotal,
        placed_at: new Date().toISOString(),
      })
      .select("id")
      .single();

    if (orderError || !order) {
      return NextResponse.json({ ok: false, error: "Failed to create order" }, { status: 500 });
    }

    // สร้าง order_items
    await supabase.from("order_items").insert(
      orderItems.map(({ product, quantity }) => ({
        order_id: order.id,
        product_id: product.id,
        product_name_snapshot: product.name,
        sku_snapshot: product.sku ?? null,
        unit_price_amount: product.price_amount,
        quantity,
        line_total_amount: product.price_amount * quantity,
      })),
    );

    return NextResponse.json({ ok: true, orderNumber });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "Unknown error" },
      { status: 500 },
    );
  }
}
