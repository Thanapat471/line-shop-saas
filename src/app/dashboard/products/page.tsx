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
    <main className="min-h-screen bg-stone-100 px-6 py-10 text-stone-950">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold">สินค้า</h1>
          <Link
            href="/dashboard/products/new"
            className="rounded-full bg-stone-950 px-5 py-2 text-sm font-medium text-stone-50 transition hover:bg-stone-700"
          >
            + เพิ่มสินค้า
          </Link>
        </div>

        {error && (
          <div className="rounded-[20px] border border-rose-200 bg-rose-50 px-6 py-4 text-sm text-rose-700">
            {error}
          </div>
        )}

        <section className="overflow-hidden rounded-[24px] border border-stone-200 bg-white shadow-[0_8px_32px_rgba(28,25,23,0.06)]">
          {products.length === 0 ? (
            <div className="px-6 py-14 text-center text-stone-500">
              ยังไม่มีสินค้า{" "}
              <Link
                href="/dashboard/products/new"
                className="underline hover:text-stone-950"
              >
                เพิ่มสินค้าแรก
              </Link>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-stone-100">
              <thead className="bg-stone-50 text-left text-xs text-stone-500">
                <tr>
                  <th className="px-6 py-3 font-medium">ชื่อสินค้า</th>
                  <th className="px-6 py-3 font-medium">SKU</th>
                  <th className="px-6 py-3 font-medium text-right">ราคา</th>
                  <th className="px-6 py-3 font-medium text-right">คงเหลือ</th>
                  <th className="px-6 py-3 font-medium">สถานะ</th>
                  <th className="px-6 py-3 font-medium"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {products.map((p) => (
                  <tr key={p.id} className="hover:bg-stone-50 transition-colors">
                    <td className="px-6 py-4 text-sm font-medium text-stone-950">
                      {p.name}
                    </td>
                    <td className="px-6 py-4 text-sm text-stone-500">
                      {p.sku ?? "-"}
                    </td>
                    <td className="px-6 py-4 text-sm text-right text-stone-700">
                      {Number(p.price_amount).toFixed(2)}
                    </td>
                    <td className="px-6 py-4 text-sm text-right text-stone-700">
                      {p.stock_quantity ?? "∞"}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          p.is_active
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-stone-200 text-stone-500"
                        }`}
                      >
                        {p.is_active ? "เปิดขาย" : "ปิด"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-3">
                        <Link
                          href={`/dashboard/products/${p.id}/edit`}
                          className="text-sm text-stone-600 hover:text-stone-950 hover:underline"
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
        </section>
      </div>
    </main>
  );
}
