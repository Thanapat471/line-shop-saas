import Link from "next/link";
import { createAdminSupabaseClient } from "@/lib/supabase/server";
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
};

async function loadProducts() {
  const supabase = createAdminSupabaseClient();
  const { data, error } = await supabase
    .from("products")
    .select("id, name, sku, price_amount, stock_quantity, is_active")
    .order("created_at", { ascending: false });

  if (error) return { products: [] as Product[], error: error.message };
  return { products: (data ?? []) as Product[], error: null };
}

export default async function ProductsPage() {
  const { products, error } = await loadProducts();

  return (
    <div className="p-8">
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-stone-950">สินค้า</h1>
          <p className="mt-1 text-sm text-stone-500">
            จัดการสินค้าทั้งหมดในร้าน
          </p>
        </div>
        <Link
          href="/dashboard/products/new"
          className="rounded-xl bg-stone-950 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-stone-700"
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
            <p className="text-sm text-stone-400">ยังไม่มีสินค้า</p>
            <Link
              href="/dashboard/products/new"
              className="mt-3 inline-flex rounded-xl bg-stone-950 px-5 py-2 text-sm font-medium text-white hover:bg-stone-700"
            >
              เพิ่มสินค้าแรก
            </Link>
          </div>
        ) : (
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-stone-100 bg-stone-50 text-left text-xs font-medium text-stone-400">
                <th className="px-6 py-3">ชื่อสินค้า</th>
                <th className="px-6 py-3">SKU</th>
                <th className="px-6 py-3 text-right">ราคา</th>
                <th className="px-6 py-3 text-right">คงเหลือ</th>
                <th className="px-6 py-3">สถานะ</th>
                <th className="px-6 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {products.map((p) => (
                <tr
                  key={p.id}
                  className="hover:bg-stone-50 transition-colors"
                >
                  <td className="px-6 py-4 font-medium text-stone-900">
                    {p.name}
                  </td>
                  <td className="px-6 py-4 font-mono text-sm text-stone-400">
                    {p.sku ?? "-"}
                  </td>
                  <td className="px-6 py-4 text-right font-semibold text-stone-900">
                    ฿{Number(p.price_amount).toFixed(2)}
                  </td>
                  <td className="px-6 py-4 text-right text-sm text-stone-500">
                    {p.stock_quantity ?? "∞"}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        p.is_active
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-stone-100 text-stone-500"
                      }`}
                    >
                      {p.is_active ? "เปิดขาย" : "ปิด"}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-4">
                      <Link
                        href={`/dashboard/products/${p.id}/edit`}
                        className="text-sm text-stone-400 hover:text-stone-900 transition"
                      >
                        แก้ไข
                      </Link>
                      <DeleteButton id={p.id} name={p.name} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
