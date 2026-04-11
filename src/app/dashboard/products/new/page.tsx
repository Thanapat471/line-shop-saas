import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { PageWrapper } from "@/components/dashboard/PageWrapper";
import { createProduct } from "../actions";
import { ProductForm } from "../ProductForm";

export default function NewProductPage() {
  return (
    <PageWrapper>
      <div className="mb-8 flex items-center gap-4">
        <Link
          href="/dashboard/products"
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-stone-200 bg-white text-stone-400 shadow-sm transition hover:border-stone-300 hover:text-stone-900"
        >
          <ChevronLeft size={18} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-stone-950">เพิ่มสินค้า</h1>
          <p className="mt-0.5 text-sm text-stone-400">กรอกข้อมูลสินค้าใหม่</p>
        </div>
      </div>

      <div className="max-w-lg rounded-2xl border border-stone-200 bg-white p-7 shadow-sm">
        <ProductForm action={createProduct} submitLabel="บันทึกสินค้า" />
      </div>
    </PageWrapper>
  );
}
