import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { createAdminSupabaseClient } from "@/lib/supabase/server";
import { updateProduct } from "../../actions";
import { ProductForm } from "../../ProductForm";

async function loadProduct(id: string) {
  const supabase = createAdminSupabaseClient();
  const { data } = await supabase
    .from("products")
    .select(
      "id, name, sku, description, price_amount, stock_quantity, is_active",
    )
    .eq("id", id)
    .single();
  return data;
}

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const product = await loadProduct(id);
  if (!product) notFound();

  return (
    <div className="p-8">
      <div className="mb-8 flex items-center gap-4">
        <Link
          href="/dashboard/products"
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-stone-200 bg-white text-stone-500 transition hover:border-stone-400 hover:text-stone-900"
        >
          <ChevronLeft size={18} />
        </Link>
        <h1 className="text-2xl font-bold text-stone-950">แก้ไขสินค้า</h1>
      </div>

      <div className="max-w-lg rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
        <ProductForm
          action={updateProduct.bind(null, id)}
          defaultValues={product}
          submitLabel="บันทึกการแก้ไข"
        />
      </div>
    </div>
  );
}
