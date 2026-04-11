import { createAdminSupabaseClient } from "@/lib/supabase/server";
import { PageWrapper } from "@/components/dashboard/PageWrapper";
import { CheckCircle2, AlertCircle, CreditCard } from "lucide-react";
import { createCheckoutSession, createCustomerPortalSession } from "./actions";

export const dynamic = "force-dynamic";

const PLAN_LABELS: Record<string, string> = {
  free: "ทดลองใช้ฟรี",
  monthly: "รายเดือน",
  yearly: "รายปี",
};

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  trialing: { label: "ทดลองใช้", color: "bg-amber-100 text-amber-700" },
  active: { label: "ใช้งานอยู่", color: "bg-emerald-100 text-emerald-700" },
  past_due: { label: "ค้างชำระ", color: "bg-rose-100 text-rose-700" },
  cancelled: { label: "ยกเลิกแล้ว", color: "bg-stone-100 text-stone-500" },
  paused: { label: "หยุดพัก", color: "bg-stone-100 text-stone-500" },
  expired: { label: "หมดอายุ", color: "bg-rose-100 text-rose-700" },
};

async function loadSubscription() {
  const supabase = createAdminSupabaseClient();
  const { data: shop } = await supabase
    .from("shops")
    .select("id, name")
    .eq("status", "active")
    .limit(1)
    .single();

  if (!shop) return { shop: null, subscription: null };

  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("shop_id", shop.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  return { shop, subscription };
}

function formatDate(iso: string | null) {
  if (!iso) return "-";
  return new Intl.DateTimeFormat("th-TH", { dateStyle: "long" }).format(new Date(iso));
}

export default async function BillingPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string; cancelled?: string }>;
}) {
  const { success, cancelled } = await searchParams;
  const { shop, subscription } = await loadSubscription();

  const isActive =
    subscription?.status === "active" || subscription?.status === "trialing";

  const stripeCustomerId = subscription?.provider === "stripe"
    ? (subscription?.provider_subscription_id?.split("_").slice(0, -1).join("_") ?? null)
    : null;

  return (
    <PageWrapper>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-stone-950">แผนการใช้งาน</h1>
        <p className="mt-1 text-sm text-stone-400">จัดการ subscription ของร้าน</p>
      </div>

      {success && (
        <div className="mb-6 flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm text-emerald-700">
          <CheckCircle2 size={18} className="shrink-0" />
          ชำระเงินสำเร็จ! subscription ของคุณถูกเปิดใช้งานแล้ว
        </div>
      )}

      {cancelled && (
        <div className="mb-6 flex items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-700">
          <AlertCircle size={18} className="shrink-0" />
          ยกเลิกการสมัคร subscription แล้ว
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Current plan */}
        <div className="rounded-2xl border border-stone-200 bg-white p-7 shadow-sm">
          <h2 className="mb-5 text-base font-bold text-stone-950">แผนปัจจุบัน</h2>

          {subscription ? (
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-stone-500">แผน</span>
                <span className="font-semibold text-stone-900">
                  {PLAN_LABELS[subscription.plan_code] ?? subscription.plan_code}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-stone-500">สถานะ</span>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                    STATUS_LABELS[subscription.status]?.color ?? "bg-stone-100 text-stone-600"
                  }`}
                >
                  {STATUS_LABELS[subscription.status]?.label ?? subscription.status}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-stone-500">ค่าบริการ</span>
                <span className="font-semibold text-stone-900">
                  ฿{Number(subscription.amount).toLocaleString("th-TH")}/{subscription.billing_cycle === "monthly" ? "เดือน" : "ปี"}
                </span>
              </div>
              {subscription.current_period_end && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-stone-500">รอบถัดไป</span>
                  <span className="text-sm text-stone-700">
                    {formatDate(subscription.current_period_end)}
                  </span>
                </div>
              )}
            </div>
          ) : (
            <div className="py-6 text-center">
              <p className="text-sm text-stone-400">ยังไม่มี subscription</p>
              <p className="mt-1 text-xs text-stone-300">สมัครแผนด้านล่างเพื่อใช้งาน</p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="rounded-2xl border border-stone-200 bg-white p-7 shadow-sm">
          <h2 className="mb-5 text-base font-bold text-stone-950">
            {isActive ? "จัดการ Subscription" : "สมัคร Subscription"}
          </h2>

          {isActive && stripeCustomerId ? (
            <div className="flex flex-col gap-3">
              <p className="text-sm text-stone-500">
                จัดการการชำระเงิน ดาวน์โหลดใบเสร็จ หรือยกเลิก subscription ได้ที่ Stripe Customer Portal
              </p>
              <form action={createCustomerPortalSession.bind(null, stripeCustomerId)}>
                <button
                  type="submit"
                  className="flex items-center gap-2 rounded-xl border border-stone-200 px-5 py-2.5 text-sm font-semibold text-stone-700 transition hover:border-stone-400 hover:text-stone-900"
                >
                  <CreditCard size={16} />
                  จัดการการชำระเงิน
                </button>
              </form>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {/* Monthly plan */}
              <div className="rounded-xl border border-stone-200 p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold text-stone-900">แผนรายเดือน</p>
                    <p className="mt-1 text-sm text-stone-400">
                      จัดการออเดอร์ไม่จำกัด · LINE push notification · รายงานยอดขาย
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold text-stone-950">฿990</p>
                    <p className="text-xs text-stone-400">/เดือน</p>
                  </div>
                </div>
                <form action={createCheckoutSession} className="mt-4">
                  <button
                    type="submit"
                    className="w-full rounded-xl bg-stone-950 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-stone-700 active:scale-[0.98]"
                  >
                    สมัครเลย
                  </button>
                </form>
              </div>
              <p className="text-center text-xs text-stone-400">
                ชำระเงินปลอดภัยผ่าน Stripe · ยกเลิกได้ทุกเมื่อ
              </p>
            </div>
          )}
        </div>
      </div>
    </PageWrapper>
  );
}
