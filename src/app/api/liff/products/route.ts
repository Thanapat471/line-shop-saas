import { NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const channelId = searchParams.get("channelId");

  if (!channelId) {
    return NextResponse.json({ ok: false, error: "Missing channelId" }, { status: 400 });
  }

  const supabase = createAdminSupabaseClient();

  const { data: channel } = await supabase
    .from("line_channels")
    .select("shop_id")
    .eq("channel_id", channelId)
    .eq("is_active", true)
    .maybeSingle();

  if (!channel) {
    return NextResponse.json({ ok: false, error: "Channel not found" }, { status: 404 });
  }

  const { data: products } = await supabase
    .from("products")
    .select("id, name, description, price_amount, image_url")
    .eq("shop_id", channel.shop_id)
    .eq("is_active", true)
    .order("created_at", { ascending: true });

  return NextResponse.json({ ok: true, products: products ?? [] });
}
