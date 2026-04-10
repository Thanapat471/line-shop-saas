import { notFound } from "next/navigation";
import { createAdminSupabaseClient } from "@/lib/supabase/server";
import { updateProduct } from "../../actions";
import { ProductForm } from "../../ProductForm";

async function loadProduct(id: string) {
  const supabase = createAdminSupabaseClient();
  const { data } = await supabase
    .from("products")
    .select("id, name, sku, description, price_amount, stock_quantity, is_active")
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
    <main className="min-h-screen bg-stone-100 px-6 py-10 text-stone-950">
      <div className="mx-auto w-full max-w-lg">
        <h1 className="mb-6 text-xl font-semibold">แก้ไขสินค้า</h1>
        <div className="rounded-[24px] border border-stone-200 bg-white p-6 shadow-[0_8px_32px_rgba(28,25,23,0.06)]">
          <ProductForm
            action={updateProduct.bind(null, id)}
            defaultValues={product}
            submitLabel="บันทึกการแก้ไข"
          />
        </div>
      </div>
    </main>
  );
}
