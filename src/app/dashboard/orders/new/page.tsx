import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { createAdminSupabaseClient } from "@/lib/supabase/server";
import { PageWrapper } from "@/components/dashboard/PageWrapper";
import { NewOrderForm } from "./NewOrderForm";

async function loadFormData() {
  const supabase = createAdminSupabaseClient();

  const [{ data: customers }, { data: products }] = await Promise.all([
    supabase
      .from("customers")
      .select("id, line_display_name, line_user_id")
      .order("line_display_name", { ascending: true }),
    supabase
      .from("products")
      .select("id, name, sku, price_amount")
      .eq("is_active", true)
      .order("name", { ascending: true }),
  ]);

  return {
    customers: customers ?? [],
    products: products ?? [],
  };
}

export default async function NewOrderPage() {
  const { customers, products } = await loadFormData();

  return (
    <PageWrapper>
      <div className="mb-8 flex items-center gap-4">
        <Link
          href="/dashboard/orders"
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-stone-200 bg-white text-stone-400 shadow-sm transition hover:border-stone-300 hover:text-stone-900"
        >
          <ChevronLeft size={18} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-stone-950">สร้างออเดอร์ใหม่</h1>
          <p className="mt-0.5 text-sm text-stone-400">
            สำหรับออเดอร์ที่รับทาง phone หรือช่องทางอื่น
          </p>
        </div>
      </div>

      <div className="max-w-2xl rounded-2xl border border-stone-200 bg-white p-7 shadow-sm">
        <NewOrderForm customers={customers} products={products} />
      </div>
    </PageWrapper>
  );
}
