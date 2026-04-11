import generatePayload from "promptpay-qr";
import QRCode from "qrcode";
import { createAdminSupabaseClient } from "@/lib/supabase/server";

export async function generatePromptPayQr({
  promptPayNumber,
  amount,
  orderNumber,
}: {
  promptPayNumber: string;
  amount: number;
  orderNumber: string;
}): Promise<{ qrImageUrl: string }> {
  const payload = generatePayload(promptPayNumber, { amount });

  const qrBuffer = await QRCode.toBuffer(payload, {
    type: "png",
    width: 600,
    margin: 2,
    color: { dark: "#000000", light: "#ffffff" },
  });

  const supabase = createAdminSupabaseClient();
  const fileName = `qr-${orderNumber}-${Date.now()}.png`;

  const { error } = await supabase.storage
    .from("order-qr-codes")
    .upload(fileName, qrBuffer, { contentType: "image/png", upsert: true });

  if (error) throw new Error(`Upload QR failed: ${error.message}`);

  const {
    data: { publicUrl },
  } = supabase.storage.from("order-qr-codes").getPublicUrl(fileName);

  return { qrImageUrl: publicUrl };
}
