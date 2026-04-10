"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createAdminSupabaseClient } from "@/lib/supabase/server";

async function getFirstShopId() {
  const supabase = createAdminSupabaseClient();
  const { data } = await supabase
    .from("shops")
    .select("id")
    .eq("status", "active")
    .limit(1)
    .single();
  return data?.id ?? null;
}

export async function createProduct(formData: FormData) {
  const shopId = await getFirstShopId();
  if (!shopId) throw new Error("No active shop found");

  const supabase = createAdminSupabaseClient();
  const { error } = await supabase.from("products").insert({
    shop_id: shopId,
    name: formData.get("name") as string,
    sku: (formData.get("sku") as string) || null,
    description: (formData.get("description") as string) || null,
    price_amount: Number(formData.get("price_amount") ?? 0),
    stock_quantity: formData.get("stock_quantity")
      ? Number(formData.get("stock_quantity"))
      : null,
    is_active: formData.get("is_active") === "on",
  });

  if (error) throw new Error(error.message);
  redirect("/dashboard/products");
}

export async function updateProduct(id: string, formData: FormData) {
  const supabase = createAdminSupabaseClient();
  const { error } = await supabase
    .from("products")
    .update({
      name: formData.get("name") as string,
      sku: (formData.get("sku") as string) || null,
      description: (formData.get("description") as string) || null,
      price_amount: Number(formData.get("price_amount") ?? 0),
      stock_quantity: formData.get("stock_quantity")
        ? Number(formData.get("stock_quantity"))
        : null,
      is_active: formData.get("is_active") === "on",
    })
    .eq("id", id);

  if (error) throw new Error(error.message);
  revalidatePath("/dashboard/products");
  redirect("/dashboard/products");
}

export async function deleteProduct(id: string) {
  const supabase = createAdminSupabaseClient();
  await supabase.from("products").delete().eq("id", id);
  revalidatePath("/dashboard/products");
}
