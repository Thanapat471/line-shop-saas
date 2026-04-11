import { createAdminSupabaseClient } from "@/lib/supabase/server";
import { PageWrapper } from "@/components/dashboard/PageWrapper";
import { createLineChannel, updateLineChannel } from "./actions";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type LineChannel = {
  id: string;
  channel_id: string;
  channel_secret: string;
  channel_access_token: string;
  display_name: string | null;
  basic_id: string | null;
  webhook_url: string | null;
  promptpay_number: string | null;
  is_active: boolean;
  last_webhook_at: string | null;
};

async function loadChannels() {
  const supabase = createAdminSupabaseClient();
  const { data, error } = await supabase
    .from("line_channels")
    .select(
      "id, channel_id, channel_secret, channel_access_token, display_name, basic_id, webhook_url, promptpay_number, is_active, last_webhook_at",
    )
    .order("created_at", { ascending: true });

  if (error) return { channels: [] as LineChannel[], error: error.message };
  return { channels: (data ?? []) as LineChannel[], error: null };
}

function formatDate(value: string | null) {
  if (!value) return "ยังไม่เคย";
  return new Intl.DateTimeFormat("th-TH", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

const inputClass =
  "rounded-xl border border-stone-200 bg-stone-50 px-3 py-2 text-sm text-stone-950 outline-none transition focus:border-stone-400 focus:bg-white";

function SectionLabel({ children }: { children: string }) {
  return (
    <p className="text-xs font-semibold uppercase tracking-wider text-stone-400">
      {children}
    </p>
  );
}

export default async function SettingsPage() {
  const { channels, error } = await loadChannels();

  return (
    <PageWrapper>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-stone-950">ตั้งค่า</h1>
        <p className="mt-1 text-sm text-stone-400">จัดการ LINE Channel ของร้าน</p>
      </div>

      {error && (
        <div className="mb-6 rounded-2xl border border-rose-200 bg-rose-50 px-6 py-4 text-sm text-rose-700">
          {error}
        </div>
      )}

      <div className="flex flex-col gap-6 max-w-2xl">
        {/* Existing channels */}
        {channels.map((ch) => (
          <div
            key={ch.id}
            className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm"
          >
            {/* Channel header */}
            <div className="flex items-center justify-between border-b border-stone-100 bg-stone-50/60 px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-green-500">
                  <span className="text-sm font-bold text-white">L</span>
                </div>
                <div>
                  <p className="font-semibold text-stone-900">
                    {ch.display_name ?? ch.channel_id}
                  </p>
                  <p className="text-xs text-stone-400">
                    Webhook ล่าสุด: {formatDate(ch.last_webhook_at)}
                  </p>
                </div>
              </div>
              <span
                className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                  ch.is_active
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-stone-100 text-stone-400"
                }`}
              >
                {ch.is_active ? "ใช้งานอยู่" : "ปิด"}
              </span>
            </div>

            {/* Read-only info */}
            <div className="grid gap-4 border-b border-stone-100 px-6 py-5 sm:grid-cols-2 text-sm">
              <div>
                <SectionLabel>Channel ID</SectionLabel>
                <p className="mt-1 font-mono text-stone-700">{ch.channel_id}</p>
              </div>
              {ch.basic_id && (
                <div>
                  <SectionLabel>Basic ID</SectionLabel>
                  <p className="mt-1 font-mono text-stone-700">{ch.basic_id}</p>
                </div>
              )}
            </div>

            {/* Edit form */}
            <form action={updateLineChannel.bind(null, ch.id)} className="flex flex-col gap-4 px-6 py-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-stone-500">Display Name</label>
                  <input name="display_name" defaultValue={ch.display_name ?? ""} className={inputClass} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-stone-500">Webhook URL</label>
                  <input name="webhook_url" defaultValue={ch.webhook_url ?? ""} placeholder="https://..." className={inputClass} />
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-stone-500">Channel Secret</label>
                <input name="channel_secret" defaultValue={ch.channel_secret} className={`${inputClass} font-mono`} />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-stone-500">Channel Access Token</label>
                <textarea name="channel_access_token" defaultValue={ch.channel_access_token} rows={3} className={`${inputClass} resize-none font-mono`} />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-stone-500">
                  เบอร์ PromptPay
                  <span className="ml-1.5 font-normal text-stone-400">(เบอร์โทรหรือเลขบัตรประชาชน)</span>
                </label>
                <input
                  name="promptpay_number"
                  defaultValue={ch.promptpay_number ?? ""}
                  placeholder="0812345678"
                  className={inputClass}
                />
                <p className="text-xs text-stone-400">ใช้รับชำระเงินจากลูกค้าผ่าน PromptPay QR</p>
              </div>
              <label className="flex cursor-pointer items-center gap-2">
                <input name="is_active" type="checkbox" defaultChecked={ch.is_active} className="h-4 w-4 accent-stone-950" />
                <span className="text-sm font-medium text-stone-700">เปิดใช้งาน</span>
              </label>
              <div>
                <button type="submit" className="rounded-xl bg-stone-950 px-5 py-2 text-sm font-semibold text-white transition hover:bg-stone-700 active:scale-[0.98]">
                  บันทึก
                </button>
              </div>
            </form>
          </div>
        ))}

        {/* Add new channel */}
        <div className="overflow-hidden rounded-2xl border border-dashed border-stone-300 bg-white shadow-sm">
          <div className="border-b border-stone-100 px-6 py-4">
            <h2 className="font-semibold text-stone-900">+ เพิ่ม LINE Channel ใหม่</h2>
            <p className="mt-0.5 text-xs text-stone-400">
              เพิ่ม OA ใหม่เพื่อรองรับหลายร้านในระบบเดียว
            </p>
          </div>
          <form action={createLineChannel} className="flex flex-col gap-4 px-6 py-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-stone-500">
                  Channel ID <span className="text-rose-400">*</span>
                </label>
                <input name="channel_id" required className={`${inputClass} font-mono`} />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-stone-500">Display Name</label>
                <input name="display_name" className={inputClass} />
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-stone-500">Webhook URL</label>
              <input name="webhook_url" placeholder="https://your-app.vercel.app/api/webhooks/line" className={inputClass} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-stone-500">
                Channel Secret <span className="text-rose-400">*</span>
              </label>
              <input name="channel_secret" required className={`${inputClass} font-mono`} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-stone-500">
                Channel Access Token <span className="text-rose-400">*</span>
              </label>
              <textarea name="channel_access_token" required rows={3} className={`${inputClass} resize-none font-mono`} />
            </div>
            <div>
              <button type="submit" className="rounded-xl bg-stone-950 px-5 py-2 text-sm font-semibold text-white transition hover:bg-stone-700 active:scale-[0.98]">
                เพิ่ม Channel
              </button>
            </div>
          </form>
        </div>
      </div>
    </PageWrapper>
  );
}
