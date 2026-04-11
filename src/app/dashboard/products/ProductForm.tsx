"use client";

import { useState } from "react";
import Link from "next/link";
import { ImageIcon } from "lucide-react";

type ProductFormProps = {
  action: (formData: FormData) => Promise<void>;
  defaultValues?: {
    name?: string;
    sku?: string | null;
    description?: string | null;
    price_amount?: number;
    stock_quantity?: number | null;
    is_active?: boolean;
    image_url?: string | null;
  };
  submitLabel: string;
};

const inputClass =
  "rounded-xl border border-stone-200 bg-stone-50 px-4 py-2.5 text-sm text-stone-950 outline-none transition placeholder:text-stone-300 focus:border-stone-400 focus:bg-white";

export function ProductForm({ action, defaultValues, submitLabel }: ProductFormProps) {
  const [preview, setPreview] = useState<string | null>(
    defaultValues?.image_url ?? null,
  );

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) {
      setPreview(defaultValues?.image_url ?? null);
      return;
    }
    setPreview(URL.createObjectURL(file));
  }

  return (
    <form action={action} className="flex flex-col gap-5">
      {/* Image upload */}
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-semibold text-stone-700">รูปสินค้า</label>
        <div className="flex items-start gap-4">
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={preview}
              alt="preview"
              className="h-24 w-24 shrink-0 rounded-xl object-cover ring-1 ring-stone-200"
            />
          ) : (
            <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-xl border border-dashed border-stone-300 bg-stone-50 text-stone-300">
              <ImageIcon size={28} />
            </div>
          )}
          <div className="flex flex-1 flex-col gap-2 pt-2">
            <input
              type="file"
              name="image"
              accept="image/*"
              onChange={handleFileChange}
              className="text-sm text-stone-500 file:mr-3 file:cursor-pointer file:rounded-lg file:border-0 file:bg-stone-100 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-stone-700 file:transition hover:file:bg-stone-200"
            />
            <p className="text-xs text-stone-400">PNG, JPG, WEBP ไม่เกิน 5MB</p>
            {preview && (
              <button
                type="button"
                onClick={() => setPreview(null)}
                className="text-left text-xs text-rose-400 transition hover:text-rose-600"
              >
                ลบรูป
              </button>
            )}
          </div>
        </div>
        {/* ส่งค่า clear_image=1 เมื่อลูกค้ากด "ลบรูป" */}
        <input type="hidden" name="clear_image" value={preview ? "0" : "1"} />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-semibold text-stone-700">
          ชื่อสินค้า <span className="text-rose-400">*</span>
        </label>
        <input
          name="name"
          required
          defaultValue={defaultValues?.name ?? ""}
          placeholder="เช่น เสื้อยืดสีขาว"
          className={inputClass}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-semibold text-stone-700">SKU</label>
        <input
          name="sku"
          defaultValue={defaultValues?.sku ?? ""}
          placeholder="เช่น SHIRT-WHITE-M"
          className={`${inputClass} font-mono`}
        />
        <p className="text-xs text-stone-400">
          ระบบใช้ SKU จับคู่กับข้อความที่ลูกค้าส่งมาทาง LINE
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold text-stone-700">
            ราคา (฿) <span className="text-rose-400">*</span>
          </label>
          <input
            name="price_amount"
            type="number"
            min="0"
            step="0.01"
            required
            defaultValue={defaultValues?.price_amount ?? 0}
            className={inputClass}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold text-stone-700">จำนวนคงเหลือ</label>
          <input
            name="stock_quantity"
            type="number"
            min="0"
            defaultValue={
              defaultValues?.stock_quantity != null ? defaultValues.stock_quantity : ""
            }
            placeholder="ว่างไว้ = ไม่จำกัด"
            className={inputClass}
          />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-semibold text-stone-700">คำอธิบาย</label>
        <textarea
          name="description"
          rows={3}
          defaultValue={defaultValues?.description ?? ""}
          className={`${inputClass} resize-none`}
        />
      </div>

      <label className="flex cursor-pointer items-center gap-2.5">
        <input
          name="is_active"
          type="checkbox"
          defaultChecked={defaultValues?.is_active ?? true}
          className="h-4 w-4 rounded accent-stone-950"
        />
        <span className="text-sm font-semibold text-stone-700">เปิดขาย</span>
      </label>

      <div className="flex gap-3 border-t border-stone-100 pt-5">
        <button
          type="submit"
          className="rounded-xl bg-stone-950 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-stone-700 active:scale-[0.98]"
        >
          {submitLabel}
        </button>
        <Link
          href="/dashboard/products"
          className="rounded-xl border border-stone-200 px-6 py-2.5 text-sm font-medium text-stone-500 transition hover:border-stone-400 hover:text-stone-900"
        >
          ยกเลิก
        </Link>
      </div>
    </form>
  );
}
