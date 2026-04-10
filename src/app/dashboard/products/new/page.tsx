import { createProduct } from "../actions";
import { ProductForm } from "../ProductForm";

export default function NewProductPage() {
  return (
    <main className="min-h-screen bg-stone-100 px-6 py-10 text-stone-950">
      <div className="mx-auto w-full max-w-lg">
        <h1 className="mb-6 text-xl font-semibold">เพิ่มสินค้า</h1>
        <div className="rounded-[24px] border border-stone-200 bg-white p-6 shadow-[0_8px_32px_rgba(28,25,23,0.06)]">
          <ProductForm action={createProduct} submitLabel="บันทึก" />
        </div>
      </div>
    </main>
  );
}
