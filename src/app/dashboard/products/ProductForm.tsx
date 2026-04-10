import Link from "next/link";

type ProductFormProps = {
  action: (formData: FormData) => Promise<void>;
  defaultValues?: {
    name?: string;
    sku?: string | null;
    description?: string | null;
    price_amount?: number;
    stock_quantity?: number | null;
    is_active?: boolean;
  };
  submitLabel: string;
};

export function ProductForm({ action, defaultValues, submitLabel }: ProductFormProps) {
  return (
    <form action={action} className="flex flex-col gap-5">
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-stone-700">
          ชื่อสินค้า <span className="text-rose-500">*</span>
        </label>
        <input
          name="name"
          required
          defaultValue={defaultValues?.name ?? ""}
          className="rounded-xl border border-stone-200 bg-stone-50 px-4 py-2.5 text-sm text-stone-950 outline-none transition focus:border-stone-400 focus:bg-white focus:ring-0"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-stone-700">SKU</label>
        <input
          name="sku"
          defaultValue={defaultValues?.sku ?? ""}
          placeholder="เช่น PROD-001"
          className="rounded-xl border border-stone-200 bg-stone-50 px-4 py-2.5 font-mono text-sm text-stone-950 outline-none transition focus:border-stone-400 focus:bg-white"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-stone-700">
            ราคา (฿) <span className="text-rose-500">*</span>
          </label>
          <input
            name="price_amount"
            type="number"
            min="0"
            step="0.01"
            required
            defaultValue={defaultValues?.price_amount ?? 0}
            className="rounded-xl border border-stone-200 bg-stone-50 px-4 py-2.5 text-sm text-stone-950 outline-none transition focus:border-stone-400 focus:bg-white"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-stone-700">คงเหลือ</label>
          <input
            name="stock_quantity"
            type="number"
            min="0"
            defaultValue={
              defaultValues?.stock_quantity != null
                ? defaultValues.stock_quantity
                : ""
            }
            placeholder="ว่างไว้ = ไม่จำกัด"
            className="rounded-xl border border-stone-200 bg-stone-50 px-4 py-2.5 text-sm text-stone-950 outline-none transition focus:border-stone-400 focus:bg-white"
          />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-stone-700">คำอธิบาย</label>
        <textarea
          name="description"
          rows={3}
          defaultValue={defaultValues?.description ?? ""}
          className="resize-none rounded-xl border border-stone-200 bg-stone-50 px-4 py-2.5 text-sm text-stone-950 outline-none transition focus:border-stone-400 focus:bg-white"
        />
      </div>

      <label className="flex cursor-pointer items-center gap-2.5">
        <input
          name="is_active"
          type="checkbox"
          defaultChecked={defaultValues?.is_active ?? true}
          className="h-4 w-4 rounded accent-stone-950"
        />
        <span className="text-sm font-medium text-stone-700">เปิดขาย</span>
      </label>

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          className="rounded-xl bg-stone-950 px-6 py-2.5 text-sm font-medium text-white transition hover:bg-stone-700"
        >
          {submitLabel}
        </button>
        <Link
          href="/dashboard/products"
          className="rounded-xl border border-stone-200 px-6 py-2.5 text-sm font-medium text-stone-600 transition hover:border-stone-400"
        >
          ยกเลิก
        </Link>
      </div>
    </form>
  );
}
