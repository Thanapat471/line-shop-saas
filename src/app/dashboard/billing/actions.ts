"use server";

import { redirect } from "next/navigation";
import { createAdminSupabaseClient } from "@/lib/supabase/server";
import { getStripe } from "@/lib/stripe/client";
import { getStripeEnv } from "@/lib/env";

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

export async function createCheckoutSession() {
  const shopId = await getFirstShopId();
  if (!shopId) throw new Error("ไม่พบ shop");

  const { priceIdMonthly } = getStripeEnv();
  if (!priceIdMonthly) throw new Error("STRIPE_PRICE_ID_MONTHLY ยังไม่ได้ตั้งค่า");

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const stripe = getStripe();

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    line_items: [{ price: priceIdMonthly, quantity: 1 }],
    success_url: `${appUrl}/dashboard/billing?success=1`,
    cancel_url: `${appUrl}/dashboard/billing?cancelled=1`,
    metadata: { shop_id: shopId },
    allow_promotion_codes: true,
    billing_address_collection: "required",
  });

  if (!session.url) throw new Error("ไม่สามารถสร้าง Stripe session ได้");
  redirect(session.url);
}

export async function createCustomerPortalSession(stripeCustomerId: string) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const stripe = getStripe();

  const session = await stripe.billingPortal.sessions.create({
    customer: stripeCustomerId,
    return_url: `${appUrl}/dashboard/billing`,
  });

  redirect(session.url);
}
