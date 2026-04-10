"use client";

import { deleteProduct } from "./actions";

export function DeleteButton({ id, name }: { id: string; name: string }) {
  async function handleDelete() {
    if (!confirm(`ลบ "${name}" ใช่ไหม?`)) return;
    await deleteProduct(id);
  }

  return (
    <button
      type="button"
      onClick={handleDelete}
      className="text-sm text-rose-500 hover:text-rose-700 hover:underline"
    >
      ลบ
    </button>
  );
}
