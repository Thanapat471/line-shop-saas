"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

// Component นี้ไม่ render อะไร — subscribe realtime แล้ว refresh page เมื่อมี order ใหม่
export function OrdersRealtimeRefresh() {
  const router = useRouter();

  useEffect(() => {
    let supabase: ReturnType<typeof createBrowserSupabaseClient>;
    try {
      supabase = createBrowserSupabaseClient();
    } catch {
      // env vars ไม่ครบ — ไม่ subscribe realtime
      return;
    }

    const channel = supabase
      .channel("orders-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders" },
        () => {
          router.refresh();
        },
      )
      .subscribe();

    return () => {
      supabase!.removeChannel(channel);
    };
  }, [router]);

  return null;
}
