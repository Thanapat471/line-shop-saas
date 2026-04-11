"use server";

import { revalidatePath } from "next/cache";
import { createAdminSupabaseClient } from "@/lib/supabase/server";
import { sendOrderStatusNotification, sendPaymentQr } from "@/lib/line/push";
import { generatePromptPayQr } from "@/lib/promptpay/qr";

export async function updateOrderStatus(orderId: string, newStatus: string) {
  const supabase = createAdminSupabaseClient();

  // โหลด order พร้อม customer, channel และ promptpay_number
  const { data: order } = await supabase
    .from("orders")
    .select(
      `order_number, status, total_amount,
       customers(line_user_id, line_display_name),
       line_channels(channel_access_token, promptpay_number)`,
    )
    .eq("id", orderId)
    .single();

  const { error } = await supabase
    .from("orders")
    .update({ status: newStatus })
    .eq("id", orderId);

  if (error) throw new Error(error.message);

  if (order) {
    await supabase.from("order_status_logs").insert({
      order_id: orderId,
      from_status: order.status,
      to_status: newStatus,
      changed_by_type: "merchant",
    });

    const customer = Array.isArray(order.customers)
      ? order.customers[0]
      : order.customers;
    const channel = Array.isArray(order.line_channels)
      ? order.line_channels[0]
      : order.line_channels;

    if (newStatus === "waiting_payment" && customer?.line_user_id && channel?.channel_access_token) {
      await handleWaitingPayment({
        orderId,
        orderNumber: order.order_number,
        totalAmount: order.total_amount,
        channelAccessToken: channel.channel_access_token,
        promptPayNumber: channel.promptpay_number ?? null,
        lineUserId: customer.line_user_id,
      });
    } else if (customer?.line_user_id && channel?.channel_access_token) {
      await sendOrderStatusNotification({
        channelAccessToken: channel.channel_access_token,
        lineUserId: customer.line_user_id,
        orderNumber: order.order_number,
        newStatus,
      });
    }
  }

  revalidatePath(`/dashboard/orders/${orderId}`);
  revalidatePath("/dashboard/orders");
}

async function handleWaitingPayment({
  orderId,
  orderNumber,
  totalAmount,
  channelAccessToken,
  promptPayNumber,
  lineUserId,
}: {
  orderId: string;
  orderNumber: string;
  totalAmount: number;
  channelAccessToken: string;
  promptPayNumber: string | null;
  lineUserId: string;
}) {
  if (!promptPayNumber) {
    // ยังไม่ได้ตั้งค่าเบอร์ PromptPay — ส่งแค่ text แจ้งลูกค้า
    await sendOrderStatusNotification({
      channelAccessToken,
      lineUserId,
      orderNumber,
      newStatus: "waiting_payment",
    });
    return;
  }

  try {
    const { qrImageUrl } = await generatePromptPayQr({
      promptPayNumber,
      amount: totalAmount,
      orderNumber,
    });

    // บันทึก order_payments
    const supabase = createAdminSupabaseClient();
    await supabase.from("order_payments").insert({
      order_id: orderId,
      provider: "promptpay",
      payment_method: "promptpay_qr",
      status: "pending",
      amount: totalAmount,
      currency: "THB",
      payment_slip_url: qrImageUrl,
    });

    await sendPaymentQr({
      channelAccessToken,
      lineUserId,
      orderNumber,
      qrImageUrl,
      amount: totalAmount,
    });
  } catch {
    // fallback เป็น text ถ้า QR ไม่สำเร็จ
    await sendOrderStatusNotification({
      channelAccessToken,
      lineUserId,
      orderNumber,
      newStatus: "waiting_payment",
    });
  }
}
