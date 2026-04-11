import { NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe/client";
import { getStripeEnv } from "@/lib/env";
import { createAdminSupabaseClient } from "@/lib/supabase/server";
import type Stripe from "stripe";

export const runtime = "nodejs";

// ต้องปิด body parser เพื่อให้ stripe verify signature ได้
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const sig = request.headers.get("stripe-signature");
  const { webhookSecret } = getStripeEnv();

  if (!sig || !webhookSecret) {
    return NextResponse.json({ error: "missing signature or webhook secret" }, { status: 400 });
  }

  const rawBody = await request.text();
  const stripe = getStripe();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
  } catch {
    return NextResponse.json({ error: "invalid stripe signature" }, { status: 400 });
  }

  const supabase = createAdminSupabaseClient();

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const shopId = session.metadata?.shop_id;
      if (!shopId || !session.subscription) break;

      // โหลด subscription details จาก Stripe
      const sub = await stripe.subscriptions.retrieve(session.subscription as string);
      const priceId = sub.items.data[0]?.price.id;
      const amount = (sub.items.data[0]?.price.unit_amount ?? 0) / 100;
      const interval = sub.items.data[0]?.price.recurring?.interval ?? "month";

      await supabase.from("subscriptions").upsert(
        {
          shop_id: shopId,
          provider: "stripe",
          provider_subscription_id: sub.id,
          plan_code: priceId ?? "monthly",
          status: "active",
          billing_cycle: interval === "year" ? "yearly" : "monthly",
          amount,
          currency: "THB",
          current_period_start: new Date(sub.current_period_start * 1000).toISOString(),
          current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
        },
        { onConflict: "shop_id" },
      );

      // อัพเดท shop status
      await supabase.from("shops").update({ status: "active" }).eq("id", shopId);
      break;
    }

    case "customer.subscription.updated": {
      const sub = event.data.object as Stripe.Subscription;
      const shopId = sub.metadata?.shop_id;
      if (!shopId) break;

      const statusMap: Record<string, string> = {
        active: "active",
        trialing: "trialing",
        past_due: "past_due",
        canceled: "cancelled",
        paused: "paused",
        unpaid: "past_due",
      };

      await supabase
        .from("subscriptions")
        .update({
          status: statusMap[sub.status] ?? sub.status,
          current_period_start: new Date(sub.current_period_start * 1000).toISOString(),
          current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
          cancelled_at: sub.canceled_at
            ? new Date(sub.canceled_at * 1000).toISOString()
            : null,
        })
        .eq("provider_subscription_id", sub.id);
      break;
    }

    case "customer.subscription.deleted": {
      const sub = event.data.object as Stripe.Subscription;
      await supabase
        .from("subscriptions")
        .update({
          status: "cancelled",
          cancelled_at: new Date().toISOString(),
        })
        .eq("provider_subscription_id", sub.id);
      break;
    }
  }

  return NextResponse.json({ received: true });
}
