"use client";

import { useState, useTransition } from "react";
import { updateOrderStatus } from "./actions";

const ORDER_STATUSES = [
  { value: "new", label: "ใหม่" },
  { value: "waiting_payment", label: "รอชำระ" },
  { value: "paid", label: "ชำระแล้ว" },
  { value: "processing", label: "กำลังเตรียม" },
  { value: "shipped", label: "จัดส่งแล้ว" },
  { value: "completed", label: "เสร็จสิ้น" },
  { value: "cancelled", label: "ยกเลิก" },
] as const;

export function StatusForm({
  orderId,
  currentStatus,
}: {
  orderId: string;
  currentStatus: string;
}) {
  const [status, setStatus] = useState(currentStatus);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      await updateOrderStatus(orderId, status);
    });
  }

  const changed = status !== currentStatus;

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <select
        value={status}
        onChange={(e) => setStatus(e.target.value)}
        className="rounded-xl border border-stone-200 bg-stone-50 px-3 py-2.5 text-sm text-stone-900 outline-none transition focus:border-stone-400 focus:bg-white"
      >
        {ORDER_STATUSES.map((s) => (
          <option key={s.value} value={s.value}>
            {s.label}
          </option>
        ))}
      </select>
      <button
        type="submit"
        disabled={isPending || !changed}
        className="rounded-xl bg-stone-950 py-2.5 text-sm font-semibold text-white transition hover:bg-stone-700 disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {isPending ? "กำลังบันทึก…" : "บันทึก"}
      </button>
    </form>
  );
}
