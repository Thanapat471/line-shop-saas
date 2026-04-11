import Stripe from "stripe";
import { getStripeEnv } from "@/lib/env";

let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (!_stripe) {
    const { secretKey } = getStripeEnv();
    if (!secretKey) throw new Error("STRIPE_SECRET_KEY ยังไม่ได้ตั้งค่า");
    _stripe = new Stripe(secretKey, { apiVersion: "2025-03-31.basil" });
  }
  return _stripe;
}
