"use client";

import { useState, useTransition } from "react";
import { updateOrderStatus } from "./actions";

const ORDER_STATUSES = [
  "new",
  "waiting_payment",
  "paid",
  "processing",
  "shipped",
  "completed",
  "cancelled",
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

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <select
        name="status"
        value={status}
        onChange={(e) => setStatus(e.target.value)}
        className="rounded-xl border border-stone-300 px-3 py-2 text-sm text-stone-950 outline-none focus:border-stone-900 focus:ring-2 focus:ring-stone-900/10"
      >
        {ORDER_STATUSES.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </select>
      <button
        type="submit"
        disabled={isPending || status === currentStatus}
        className="rounded-full bg-stone-950 py-2 text-sm font-medium text-stone-50 transition hover:bg-stone-700 disabled:opacity-40"
      >
        {isPending ? "กำลังบันทึก…" : "บันทึก"}
      </button>
    </form>
  );
}
