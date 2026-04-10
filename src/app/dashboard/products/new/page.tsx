import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { createProduct } from "../actions";
import { ProductForm } from "../ProductForm";

export default function NewProductPage() {
  return (
    <div className="p-8">
      <div className="mb-8 flex items-center gap-4">
        <Link
          href="/dashboard/products"
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-stone-200 bg-white text-stone-500 transition hover:border-stone-400 hover:text-stone-900"
        >
          <ChevronLeft size={18} />
        </Link>
        <h1 className="text-2xl font-bold text-stone-950">เพิ่มสินค้า</h1>
      </div>

      <div className="max-w-lg rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
        <ProductForm action={createProduct} submitLabel="บันทึก" />
      </div>
    </div>
  );
}
