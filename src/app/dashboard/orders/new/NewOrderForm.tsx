"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";
import { createManualOrder } from "./actions";

type Customer = {
  id: string;
  line_display_name: string | null;
  line_user_id: string;
};

type Product = {
  id: string;
  name: string;
  sku: string | null;
  price_amount: number;
};

type LineItem = {
  product: Product;
  quantity: number;
};

const inputClass =
  "rounded-xl border border-stone-200 bg-stone-50 px-4 py-2.5 text-sm text-stone-950 outline-none transition placeholder:text-stone-300 focus:border-stone-400 focus:bg-white";

export function NewOrderForm({
  customers,
  products,
}: {
  customers: Customer[];
  products: Product[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [items, setItems] = useState<LineItem[]>([]);
  const [selectedProductId, setSelectedProductId] = useState("");
  const [error, setError] = useState<string | null>(null);

  const total = items.reduce(
    (sum, item) => sum + item.product.price_amount * item.quantity,
    0,
  );

  function addItem() {
    const product = products.find((p) => p.id === selectedProductId);
    if (!product) return;

    setItems((prev) => {
      const existing = prev.find((i) => i.product.id === product.id);
      if (existing) {
        return prev.map((i) =>
          i.product.id === product.id
            ? { ...i, quantity: i.quantity + 1 }
            : i,
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
    setSelectedProductId("");
  }

  function updateQty(productId: string, qty: number) {
    if (qty <= 0) {
      setItems((prev) => prev.filter((i) => i.product.id !== productId));
    } else {
      setItems((prev) =>
        prev.map((i) =>
          i.product.id === productId ? { ...i, quantity: qty } : i,
        ),
      );
    }
  }

  function removeItem(productId: string) {
    setItems((prev) => prev.filter((i) => i.product.id !== productId));
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (items.length === 0) {
      setError("กรุณาเลือกสินค้าอย่างน้อย 1 รายการ");
      return;
    }
    setError(null);

    const formData = new FormData(e.currentTarget);
    formData.set(
      "items",
      JSON.stringify(
        items.map((i) => ({
          product_id: i.product.id,
          quantity: i.quantity,
          unit_price: i.product.price_amount,
        })),
      ),
    );

    startTransition(async () => {
      try {
        await createManualOrder(formData);
      } catch (err) {
        setError(err instanceof Error ? err.message : "เกิดข้อผิดพลาด");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      )}

      {/* Customer */}
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-semibold text-stone-700">ลูกค้า</label>
        <select name="customer_id" required className={inputClass}>
          <option value="">— เลือกลูกค้า —</option>
          {customers.map((c) => (
            <option key={c.id} value={c.id}>
              {c.line_display_name ?? c.line_user_id}
            </option>
          ))}
        </select>
      </div>

      {/* Product picker */}
      <div className="flex flex-col gap-2">
        <label className="text-sm font-semibold text-stone-700">
          สินค้า <span className="text-rose-400">*</span>
        </label>
        <div className="flex gap-2">
          <select
            value={selectedProductId}
            onChange={(e) => setSelectedProductId(e.target.value)}
            className={`${inputClass} flex-1`}
          >
            <option value="">— เลือกสินค้า —</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
                {p.sku ? ` (${p.sku})` : ""} — ฿
                {Number(p.price_amount).toFixed(2)}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={addItem}
            disabled={!selectedProductId}
            className="flex items-center gap-1.5 rounded-xl bg-stone-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-stone-700 disabled:opacity-40"
          >
            <Plus size={15} />
            เพิ่ม
          </button>
        </div>
      </div>

      {/* Line items */}
      {items.length > 0 && (
        <div className="overflow-hidden rounded-xl border border-stone-200">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-stone-100 bg-stone-50/80 text-left text-xs font-semibold text-stone-400">
                <th className="px-4 py-2.5">สินค้า</th>
                <th className="px-4 py-2.5 text-right">ราคา/ชิ้น</th>
                <th className="px-4 py-2.5 text-center">จำนวน</th>
                <th className="px-4 py-2.5 text-right">รวม</th>
                <th className="px-4 py-2.5"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {items.map((item) => (
                <tr key={item.product.id}>
                  <td className="px-4 py-3 text-sm font-medium text-stone-900">
                    {item.product.name}
                    {item.product.sku && (
                      <span className="ml-1.5 font-mono text-xs text-stone-400">
                        {item.product.sku}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right text-sm text-stone-500">
                    ฿{Number(item.product.price_amount).toFixed(2)}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) =>
                        updateQty(item.product.id, Number(e.target.value))
                      }
                      className="w-16 rounded-lg border border-stone-200 bg-white px-2 py-1 text-center text-sm text-stone-900 outline-none focus:border-stone-400"
                    />
                  </td>
                  <td className="px-4 py-3 text-right text-sm font-bold text-stone-900">
                    ฿
                    {(item.product.price_amount * item.quantity).toFixed(2)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => removeItem(item.product.id)}
                      className="text-stone-300 transition hover:text-rose-400"
                    >
                      <Trash2 size={15} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t border-stone-200 bg-stone-50/80">
                <td
                  colSpan={3}
                  className="px-4 py-3 text-right text-sm font-semibold text-stone-700"
                >
                  ยอดรวม
                </td>
                <td className="px-4 py-3 text-right text-base font-bold text-stone-950">
                  ฿{total.toFixed(2)}
                </td>
                <td />
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      {/* Notes */}
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-semibold text-stone-700">หมายเหตุ</label>
        <textarea
          name="notes"
          rows={3}
          placeholder="เช่น รับทางโทรศัพท์, ที่อยู่จัดส่ง…"
          className={`${inputClass} resize-none`}
        />
      </div>

      {/* Actions */}
      <div className="flex gap-3 border-t border-stone-100 pt-2">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-xl bg-stone-950 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-stone-700 active:scale-[0.98] disabled:opacity-60"
        >
          {isPending ? "กำลังสร้าง…" : "สร้างออเดอร์"}
        </button>
        <button
          type="button"
          onClick={() => router.push("/dashboard/orders")}
          className="rounded-xl border border-stone-200 px-6 py-2.5 text-sm font-medium text-stone-500 transition hover:border-stone-400 hover:text-stone-900"
        >
          ยกเลิก
        </button>
      </div>
    </form>
  );
}
