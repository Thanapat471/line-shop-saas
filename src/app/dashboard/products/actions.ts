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

async function uploadProductImage(file: File): Promise<string> {
  const supabase = createAdminSupabaseClient();
  const ext = file.name.split(".").pop() ?? "jpg";
  const fileName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

  const { error } = await supabase.storage
    .from("product-images")
    .upload(fileName, file, { contentType: file.type, upsert: false });

  if (error) throw new Error(`อัพโหลดรูปไม่สำเร็จ: ${error.message}`);

  const { data } = supabase.storage
    .from("product-images")
    .getPublicUrl(fileName);

  return data.publicUrl;
}

export async function createProduct(formData: FormData) {
  const shopId = await getFirstShopId();
  if (!shopId) throw new Error("No active shop found");

  const imageFile = formData.get("image") as File | null;
  let imageUrl: string | null = null;

  if (imageFile && imageFile.size > 0) {
    imageUrl = await uploadProductImage(imageFile);
  }

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
    image_url: imageUrl,
  });

  if (error) throw new Error(error.message);
  redirect("/dashboard/products");
}

export async function updateProduct(id: string, formData: FormData) {
  const supabase = createAdminSupabaseClient();

  const imageFile = formData.get("image") as File | null;
  const clearImage = formData.get("clear_image") === "1";

  // โหลด image_url เดิม
  const { data: existing } = await supabase
    .from("products")
    .select("image_url")
    .eq("id", id)
    .single();

  let imageUrl: string | null = existing?.image_url ?? null;

  if (clearImage) {
    imageUrl = null;
  } else if (imageFile && imageFile.size > 0) {
    imageUrl = await uploadProductImage(imageFile);
  }

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
      image_url: imageUrl,
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
