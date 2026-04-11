import { messagingApi } from "@line/bot-sdk";
import { buildProductCatalogMessage, buildLiffCatalogButton } from "./catalog";

type Product = {
  id: string;
  name: string;
  description: string | null;
  price_amount: number;
  image_url: string | null;
};

const STATUS_MESSAGES: Record<string, (orderNumber: string) => string> = {
  waiting_payment: (n) =>
    `ออเดอร์ #${n} รอการชำระเงินค่ะ\nกรุณาสแกน QR Code ด้านบนเพื่อชำระเงินนะคะ`,
  paid: (n) =>
    `ยืนยันการชำระเงินออเดอร์ #${n} แล้วค่ะ ขอบคุณนะคะ`,
  processing: (n) =>
    `ออเดอร์ #${n} กำลังเตรียมสินค้าค่ะ รอสักครู่นะคะ`,
  shipped: (n) =>
    `ออเดอร์ #${n} จัดส่งแล้วค่ะ รอรับสินค้าได้เลยนะคะ`,
  completed: (n) =>
    `ออเดอร์ #${n} เสร็จสิ้นแล้วค่ะ ขอบคุณที่ใช้บริการนะคะ`,
  cancelled: (n) =>
    `ออเดอร์ #${n} ถูกยกเลิกแล้วค่ะ หากมีข้อสงสัยติดต่อได้เลยนะคะ`,
};

function makeClient(channelAccessToken: string) {
  return new messagingApi.MessagingApiClient({ channelAccessToken });
}

export async function sendOrderStatusNotification({
  channelAccessToken,
  lineUserId,
  orderNumber,
  newStatus,
}: {
  channelAccessToken: string;
  lineUserId: string;
  orderNumber: string;
  newStatus: string;
}) {
  const getMessage = STATUS_MESSAGES[newStatus];
  if (!getMessage) return;

  const client = makeClient(channelAccessToken);
  await client.pushMessage({
    to: lineUserId,
    messages: [{ type: "text", text: getMessage(orderNumber) }],
  });
}

/**
 * ส่ง QR Code image + ข้อความอธิบายให้ลูกค้าทาง LINE
 * ใช้เมื่อ order status เปลี่ยนเป็น waiting_payment
 */
export async function sendPaymentQr({
  channelAccessToken,
  lineUserId,
  orderNumber,
  qrImageUrl,
  amount,
}: {
  channelAccessToken: string;
  lineUserId: string;
  orderNumber: string;
  qrImageUrl: string;
  amount: number;
}) {
  const client = makeClient(channelAccessToken);
  await client.pushMessage({
    to: lineUserId,
    messages: [
      {
        type: "image",
        originalContentUrl: qrImageUrl,
        previewImageUrl: qrImageUrl,
      },
      {
        type: "text",
        text: `สแกน QR Code เพื่อชำระเงิน ฿${amount.toLocaleString("th-TH", { minimumFractionDigits: 2 })} สำหรับออเดอร์ #${orderNumber}\n\nหลังชำระแล้วรอการยืนยันจากระบบสักครู่นะคะ`,
      },
    ],
  });
}

export async function sendLiffCatalogButton({
  channelAccessToken,
  lineUserId,
  liffId,
}: {
  channelAccessToken: string;
  lineUserId: string;
  liffId: string;
}) {
  const client = makeClient(channelAccessToken);
  await client.pushMessage({
    to: lineUserId,
    messages: [buildLiffCatalogButton(liffId)],
  });
}

export async function sendProductCatalog({
  channelAccessToken,
  lineUserId,
  products,
}: {
  channelAccessToken: string;
  lineUserId: string;
  products: Product[];
}) {
  const client = makeClient(channelAccessToken);
  const catalogMessage = buildProductCatalogMessage(products);
  await client.pushMessage({
    to: lineUserId,
    messages: [
      { type: "text", text: "นี่คือสินค้าของเราค่ะ กดสั่งซื้อได้เลยนะคะ" },
      catalogMessage,
    ],
  });
}

