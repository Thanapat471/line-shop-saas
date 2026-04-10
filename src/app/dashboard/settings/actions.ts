"use server";

import { revalidatePath } from "next/cache";
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

export async function createLineChannel(formData: FormData) {
  const shopId = await getFirstShopId();
  if (!shopId) throw new Error("No active shop found");

  const supabase = createAdminSupabaseClient();
  const { error } = await supabase.from("line_channels").insert({
    shop_id: shopId,
    channel_id: formData.get("channel_id") as string,
    channel_secret: formData.get("channel_secret") as string,
    channel_access_token: formData.get("channel_access_token") as string,
    display_name: (formData.get("display_name") as string) || null,
    webhook_url: (formData.get("webhook_url") as string) || null,
    is_active: true,
  });

  if (error) throw new Error(error.message);
  revalidatePath("/dashboard/settings");
}

export async function updateLineChannel(id: string, formData: FormData) {
  const supabase = createAdminSupabaseClient();
  const { error } = await supabase
    .from("line_channels")
    .update({
      display_name: (formData.get("display_name") as string) || null,
      channel_secret: formData.get("channel_secret") as string,
      channel_access_token: formData.get("channel_access_token") as string,
      webhook_url: (formData.get("webhook_url") as string) || null,
      is_active: formData.get("is_active") === "on",
    })
    .eq("id", id);

  if (error) throw new Error(error.message);
  revalidatePath("/dashboard/settings");
}
