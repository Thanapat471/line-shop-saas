import Link from "next/link";
import { createAdminSupabaseClient } from "@/lib/supabase/server";
import { PageWrapper } from "@/components/dashboard/PageWrapper";
import { AnimatedTbody, AnimatedTr } from "@/components/dashboard/AnimatedRows";
import { DeleteButton } from "./DeleteButton";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Product = {
  id: string;
  name: string;
  sku: string | null;
  price_amount: number;
  stock_quantity: number | null;
  is_active: boolean;
  image_url: string | null;
};

async function loadProducts() {
  const supabase = createAdminSupabaseClient();
  const { data, error } = await supabase
    .from("products")
    .select("id, name, sku, price_amount, stock_quantity, is_active, image_url")
    .order("created_at", { ascending: false });

  if (error) return { products: [] as Product[], error: error.message };
  return { products: (data ?? []) as Product[], error: null };
}

export default async function ProductsPage() {
  const { products, error } = await loadProducts();
  const activeCount = products.filter((p) => p.is_active).length;

  return (
    <PageWrapper>
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-stone-950">สินค้า</h1>
          <p className="mt-1 text-sm text-stone-400">
            {activeCount} รายการที่เปิดขาย จากทั้งหมด {products.length} รายการ
          </p>
        </div>
        <Link
          href="/dashboard/products/new"
          className="rounded-xl bg-stone-950 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-stone-700 active:scale-[0.98]"
        >
          + เพิ่มสินค้า
        </Link>
      </div>

      {error && (
        <div className="mb-6 rounded-2xl border border-rose-200 bg-rose-50 px-6 py-4 text-sm text-rose-700">
          {error}
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
        {products.length === 0 ? (
          <div className="py-20 text-center">
            <p className="text-sm font-medium text-stone-400">ยังไม่มีสินค้า</p>
            <p className="mt-1 text-xs text-stone-300 mb-5">
              เพิ่มสินค้าเพื่อให้ระบบจับคู่กับข้อความ LINE ได้
            </p>
            <Link
              href="/dashboard/products/new"
              className="inline-flex rounded-xl bg-stone-950 px-5 py-2.5 text-sm font-semibold text-white hover:bg-stone-700 transition"
            >
              + เพิ่มสินค้าแรก
            </Link>
          </div>
        ) : (
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-stone-100 bg-stone-50/80 text-left text-xs font-semibold uppercase tracking-wider text-stone-400">
                <th className="px-6 py-3">ชื่อสินค้า</th>
                <th className="px-6 py-3">SKU</th>
                <th className="px-6 py-3 text-right">ราคา</th>
                <th className="px-6 py-3 text-right">คงเหลือ</th>
                <th className="px-6 py-3">สถานะ</th>
                <th className="px-6 py-3"></th>
              </tr>
            </thead>
            <AnimatedTbody className="divide-y divide-stone-100">
              {products.map((p) => (
                <AnimatedTr
                  key={p.id}
                  className="hover:bg-stone-50/60 transition-colors"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      {p.image_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={p.image_url}
                          alt={p.name}
                          className="h-10 w-10 shrink-0 rounded-lg object-cover ring-1 ring-stone-100"
                        />
                      ) : (
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-stone-100 text-stone-300">
                          <span className="text-lg">📦</span>
                        </div>
                      )}
                      <span className="font-semibold text-stone-900">{p.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 font-mono text-xs text-stone-400">
                    {p.sku ?? "-"}
                  </td>
                  <td className="px-6 py-4 text-right font-bold text-stone-900">
                    ฿{Number(p.price_amount).toFixed(2)}
                  </td>
                  <td className="px-6 py-4 text-right text-sm text-stone-500">
                    {p.stock_quantity ?? <span className="text-stone-300">∞</span>}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        p.is_active
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-stone-100 text-stone-400"
                      }`}
                    >
                      {p.is_active ? "เปิดขาย" : "ปิด"}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-4">
                      <Link
                        href={`/dashboard/products/${p.id}/edit`}
                        className="text-sm text-stone-400 transition hover:text-stone-900"
                      >
                        แก้ไข
                      </Link>
                      <DeleteButton id={p.id} name={p.name} />
                    </div>
                  </td>
                </AnimatedTr>
              ))}
            </AnimatedTbody>
          </table>
        )}
      </div>
    </PageWrapper>
  );
}
