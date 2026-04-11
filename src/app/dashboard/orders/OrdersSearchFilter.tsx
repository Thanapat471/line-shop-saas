"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useCallback, useTransition } from "react";
import { Search } from "lucide-react";

const DATE_OPTIONS = [
  { value: "", label: "ทุกช่วงเวลา" },
  { value: "today", label: "วันนี้" },
  { value: "week", label: "สัปดาห์นี้" },
  { value: "month", label: "เดือนนี้" },
];

export function OrdersSearchFilter() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  const q = searchParams.get("q") ?? "";
  const date = searchParams.get("date") ?? "";
  const status = searchParams.get("status") ?? "";

  const updateParam = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      startTransition(() => {
        router.push(`${pathname}?${params.toString()}`);
      });
    },
    [router, pathname, searchParams],
  );

  return (
    <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center">
      {/* Search box */}
      <div className="relative flex-1">
        <Search
          size={15}
          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400"
        />
        <input
          type="text"
          placeholder="ค้นหาหมายเลขออเดอร์ หรือ ชื่อลูกค้า…"
          defaultValue={q}
          onChange={(e) => updateParam("q", e.target.value)}
          className="w-full rounded-xl border border-stone-200 bg-white py-2.5 pl-9 pr-4 text-sm text-stone-950 outline-none placeholder:text-stone-300 focus:border-stone-400"
        />
      </div>

      {/* Date range */}
      <div className="flex gap-2">
        {DATE_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => updateParam("date", opt.value)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
              date === opt.value
                ? "bg-stone-950 text-white"
                : "border border-stone-200 bg-white text-stone-500 hover:border-stone-400 hover:text-stone-900"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Clear all filters */}
      {(q || date || status) && (
        <button
          onClick={() => {
            startTransition(() => {
              router.push(pathname);
            });
          }}
          className="whitespace-nowrap text-sm text-stone-400 transition hover:text-stone-900"
        >
          ล้างตัวกรอง
        </button>
      )}
    </div>
  );
}
