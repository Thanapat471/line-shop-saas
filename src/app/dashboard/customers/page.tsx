import { createAdminSupabaseClient } from "@/lib/supabase/server";
import { PageWrapper } from "@/components/dashboard/PageWrapper";
import { AnimatedTbody, AnimatedTr } from "@/components/dashboard/AnimatedRows";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Customer = {
  id: string;
  line_user_id: string;
  line_display_name: string | null;
  picture_url: string | null;
  last_message_at: string | null;
  created_at: string;
};

async function loadCustomers() {
  const supabase = createAdminSupabaseClient();
  const { data, error } = await supabase
    .from("customers")
    .select(
      "id, line_user_id, line_display_name, picture_url, last_message_at, created_at",
    )
    .order("last_message_at", { ascending: false, nullsFirst: false });

  if (error) return { customers: [] as Customer[], error: error.message };
  return { customers: (data ?? []) as Customer[], error: null };
}

function formatDate(value: string | null) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("th-TH", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

function Avatar({ name, url }: { name: string; url: string | null }) {
  if (url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={url}
        alt={name}
        className="h-9 w-9 rounded-full object-cover ring-2 ring-stone-100"
      />
    );
  }
  return (
    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-stone-100 text-sm font-bold text-stone-500">
      {name.slice(0, 1).toUpperCase()}
    </div>
  );
}

export default async function CustomersPage() {
  const { customers, error } = await loadCustomers();

  return (
    <PageWrapper>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-stone-950">ลูกค้า</h1>
        <p className="mt-1 text-sm text-stone-400">
          {customers.length} คนที่ส่งข้อความมาทาง LINE
        </p>
      </div>

      {error && (
        <div className="mb-6 rounded-2xl border border-rose-200 bg-rose-50 px-6 py-4 text-sm text-rose-700">
          {error}
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
        {customers.length === 0 ? (
          <div className="py-20 text-center">
            <p className="text-sm font-medium text-stone-400">ยังไม่มีลูกค้า</p>
            <p className="mt-1 text-xs text-stone-300">
              เมื่อมีคนส่งข้อความมาทาง LINE จะแสดงที่นี่
            </p>
          </div>
        ) : (
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-stone-100 bg-stone-50/80 text-left text-xs font-semibold uppercase tracking-wider text-stone-400">
                <th className="px-6 py-3">ลูกค้า</th>
                <th className="px-6 py-3">LINE User ID</th>
                <th className="px-6 py-3">ข้อความล่าสุด</th>
                <th className="px-6 py-3">เข้าระบบวันที่</th>
              </tr>
            </thead>
            <AnimatedTbody className="divide-y divide-stone-100">
              {customers.map((c) => {
                const name = c.line_display_name ?? "ไม่ทราบชื่อ";
                return (
                  <AnimatedTr
                    key={c.id}
                    className="hover:bg-stone-50/60 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <Avatar name={name} url={c.picture_url} />
                        <span className="font-semibold text-stone-900">
                          {name}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-mono text-xs text-stone-400">
                      {c.line_user_id}
                    </td>
                    <td className="px-6 py-4 text-sm text-stone-500">
                      {formatDate(c.last_message_at)}
                    </td>
                    <td className="px-6 py-4 text-sm text-stone-500">
                      {formatDate(c.created_at)}
                    </td>
                  </AnimatedTr>
                );
              })}
            </AnimatedTbody>
          </table>
        )}
      </div>
    </PageWrapper>
  );
}
