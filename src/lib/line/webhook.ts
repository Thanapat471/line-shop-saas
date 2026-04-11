import { messagingApi, validateSignature } from "@line/bot-sdk";
import { createAdminSupabaseClient } from "@/lib/supabase/server";
import { verifySlipWithEasySlip } from "@/lib/easyslip/verify";
import { sendOrderStatusNotification, sendProductCatalog } from "@/lib/line/push";
import { parsePostbackData } from "@/lib/line/catalog";

type LineWebhookSource = {
  type?: string;
  userId?: string;
  groupId?: string;
};

type LineWebhookMessage = {
  type?: string;
  text?: string;
};

export type LineWebhookEvent = {
  type: string;
  replyToken?: string;
  webhookEventId?: string;
  timestamp?: number;
  source?: LineWebhookSource;
  message?: LineWebhookMessage;
  [key: string]: unknown;
};

export type LineWebhookBody = {
  destination?: string;
  events: LineWebhookEvent[];
};

type LineChannelRecord = {
  id: string;
  shop_id: string;
  channel_access_token: string;
};

type InsertedWebhookEventRecord = {
  id: string;
  event_id: string | null;
};

type MessageIntentCounts = Record<MessageIntent, number>;

type CustomerUpsertRecord = {
  shop_id: string;
  line_channel_id: string;
  line_user_id: string;
  last_message_at: string;
  line_display_name?: string;
  picture_url?: string;
  language?: string;
};

type CustomerRecord = {
  id: string;
  shop_id: string;
  line_user_id: string;
};

type OrderDraftInsert = {
  shop_id: string;
  customer_id: string;
  line_channel_id: string;
  order_number: string;
  source: "line_chat";
  status: "new";
  payment_status: "pending";
  fulfillment_status: "unfulfilled";
  notes: string;
  currency: "THB";
  subtotal_amount: number;
  discount_amount: number;
  shipping_amount: number;
  total_amount: number;
  placed_at: string;
};

type ProductRecord = {
  id: string;
  name: string;
  sku: string | null;
  price_amount: number;
};

type OrderItemInsert = {
  order_id: string;
  product_id: string;
  product_name_snapshot: string;
  sku_snapshot: string | null;
  unit_price_amount: number;
  quantity: number;
  line_total_amount: number;
};

type OrderDraftWithItems = {
  draft: OrderDraftInsert;
  items: Array<{
    product: ProductRecord;
    quantity: number;
  }>;
};

type MessageIntent = "chat" | "inquiry" | "order_intent";

const ORDER_INTENT_KEYWORDS = [
  "สั่ง",
  "เอา",
  "รับ",
  "ซื้อ",
  "cf",
  "จอง",
  "สนใจสั่ง",
  "ขอพรีออเดอร์",
  "preorder",
  "order",
] as const;

const INQUIRY_KEYWORDS = [
  "ราคา",
  "เท่าไหร่",
  "มีไหม",
  "มีของไหม",
  "ส่งยังไง",
  "ส่งได้ไหม",
  "ไซซ์",
  "สีอะไร",
  "รายละเอียด",
  "โปร",
  "ค่าส่ง",
] as const;

export function verifyLineSignature(rawBody: string, signature: string, secret: string) {
  return validateSignature(rawBody, secret, signature);
}

const REPLY_MESSAGES: Record<MessageIntent, string | null> = {
  order_intent: "รับออเดอร์แล้วค่ะ ทีมงานจะติดต่อกลับเพื่อยืนยันออเดอร์เร็วๆ นี้นะคะ",
  inquiry: "ขอบคุณที่สอบถามนะคะ ทีมงานจะตอบกลับเร็วๆ นี้ค่ะ",
  chat: null,
};

async function sendLineReply(
  replyToken: string,
  intent: MessageIntent,
  accessToken: string,
) {
  const text = REPLY_MESSAGES[intent];

  if (!text) {
    return;
  }

  const client = new messagingApi.MessagingApiClient({ channelAccessToken: accessToken });
  await client.replyMessage({
    replyToken,
    messages: [{ type: "text", text }],
  });
}

export function parseLineWebhookBody(rawBody: string): LineWebhookBody {
  const parsedBody = JSON.parse(rawBody) as Partial<LineWebhookBody>;

  if (!Array.isArray(parsedBody.events)) {
    throw new Error("Invalid LINE webhook payload: missing events array");
  }

  return {
    destination: parsedBody.destination,
    events: parsedBody.events,
  };
}

async function findLineChannelBySecret(secret: string): Promise<LineChannelRecord | null> {
  const supabase = createAdminSupabaseClient();
  const { data, error } = await supabase
    .from("line_channels")
    .select("id, shop_id, channel_access_token")
    .eq("channel_secret", secret)
    .eq("is_active", true)
    .maybeSingle<LineChannelRecord>();

  if (error) {
    throw new Error(`Failed to look up LINE channel: ${error.message}`);
  }

  return data;
}

function getEventTimestamp(event: LineWebhookEvent) {
  return typeof event.timestamp === "number"
    ? new Date(event.timestamp).toISOString()
    : new Date().toISOString();
}

export function classifyMessageIntent(messageText: string): MessageIntent {
  const normalized = messageText.trim().toLowerCase();

  if (!normalized) {
    return "chat";
  }

  const hasOrderKeyword = ORDER_INTENT_KEYWORDS.some((keyword) =>
    normalized.includes(keyword),
  );
  const hasInquiryKeyword = INQUIRY_KEYWORDS.some((keyword) =>
    normalized.includes(keyword),
  );
  const hasQuantityPattern =
    /\b\d+\b/.test(normalized) ||
    /[0-9]+ ?(ชิ้น|ตัว|อัน|กล่อง|แพ็ก|คู่|ชุด|kg|โล|ใบ)/i.test(normalized);

  if (hasOrderKeyword || (hasQuantityPattern && normalized.length >= 6)) {
    return "order_intent";
  }

  if (hasInquiryKeyword) {
    return "inquiry";
  }

  return "chat";
}

function classifyWebhookEventIntent(event: LineWebhookEvent): MessageIntent | null {
  if (!isTextMessageEvent(event)) {
    return null;
  }

  const messageText = event.message?.text?.trim();

  if (!messageText) {
    return "chat";
  }

  return classifyMessageIntent(messageText);
}

function buildIntentCounts(events: LineWebhookEvent[]): MessageIntentCounts {
  const counts: MessageIntentCounts = {
    chat: 0,
    inquiry: 0,
    order_intent: 0,
  };

  for (const event of events) {
    const intent = classifyWebhookEventIntent(event);

    if (!intent) {
      continue;
    }

    counts[intent] += 1;
  }

  return counts;
}

function buildWebhookInsertRecord(
  event: LineWebhookEvent,
  rawBody: LineWebhookBody,
  lineChannel: LineChannelRecord | null,
) {
  return {
    shop_id: lineChannel?.shop_id ?? null,
    line_channel_id: lineChannel?.id ?? null,
    event_id: event.webhookEventId ?? null,
    event_type: event.type,
    source_type: event.source?.type ?? null,
    source_user_id: event.source?.userId ?? null,
    source_group_id: event.source?.groupId ?? null,
    reply_token: event.replyToken ?? null,
    message_type: event.message?.type ?? null,
    message_text: event.message?.text ?? null,
    message_intent: classifyWebhookEventIntent(event),
    raw_body: {
      destination: rawBody.destination ?? null,
      event,
    },
    received_at: getEventTimestamp(event),
    processing_status: "received",
  };
}

function buildCustomerUpsertRecords(
  events: LineWebhookEvent[],
  lineChannel: LineChannelRecord | null,
) {
  if (!lineChannel) {
    return [];
  }

  const dedupedRecords = new Map<string, CustomerUpsertRecord>();

  for (const event of events) {
    const lineUserId = event.source?.userId;

    if (!lineUserId) {
      continue;
    }

    dedupedRecords.set(lineUserId, {
      shop_id: lineChannel.shop_id,
      line_channel_id: lineChannel.id,
      line_user_id: lineUserId,
      last_message_at: getEventTimestamp(event),
    });
  }

  return Array.from(dedupedRecords.values());
}

async function fetchLineUserProfiles(
  lineUserIds: string[],
  accessToken: string,
): Promise<Map<string, { displayName: string; pictureUrl?: string; language?: string }>> {
  const client = new messagingApi.MessagingApiClient({ channelAccessToken: accessToken });

  const results = await Promise.allSettled(
    lineUserIds.map((userId) => client.getProfile(userId).then((p) => ({ userId, profile: p }))),
  );

  const profileMap = new Map<string, { displayName: string; pictureUrl?: string; language?: string }>();

  for (const result of results) {
    if (result.status === "fulfilled") {
      const { userId, profile } = result.value;
      profileMap.set(userId, {
        displayName: profile.displayName,
        pictureUrl: profile.pictureUrl,
        language: profile.language,
      });
    }
  }

  return profileMap;
}

async function markWebhookEventsProcessed(
  insertedEvents: InsertedWebhookEventRecord[],
  errorMessage?: string,
) {
  if (insertedEvents.length === 0) {
    return;
  }

  const supabase = createAdminSupabaseClient();
  const insertedIds = insertedEvents.map((event) => event.id);
  const payload = errorMessage
    ? {
        processing_status: "failed",
        error_message: errorMessage,
      }
    : {
        processing_status: "processed",
        processed_at: new Date().toISOString(),
        error_message: null,
      };

  const { error } = await supabase
    .from("line_webhook_events")
    .update(payload)
    .in("id", insertedIds);

  if (error) {
    throw new Error(`Failed to update LINE webhook events: ${error.message}`);
  }
}

function isTextMessageEvent(event: LineWebhookEvent) {
  return event.type === "message" && event.message?.type === "text";
}

function isImageMessageEvent(event: LineWebhookEvent) {
  return event.type === "message" && event.message?.type === "image";
}

async function downloadLineImage(
  messageId: string,
  channelAccessToken: string,
): Promise<string | null> {
  try {
    const res = await fetch(
      `https://api-data.line.me/v2/bot/message/${messageId}/content`,
      { headers: { Authorization: `Bearer ${channelAccessToken}` } },
    );
    if (!res.ok) return null;
    const buffer = await res.arrayBuffer();
    return Buffer.from(buffer).toString("base64");
  } catch {
    return null;
  }
}

async function handleSlipImages(
  events: LineWebhookEvent[],
  lineChannel: LineChannelRecord | null,
) {
  if (!lineChannel) return;

  const imageEvents = events.filter(isImageMessageEvent);
  if (imageEvents.length === 0) return;

  const supabase = createAdminSupabaseClient();

  for (const event of imageEvents) {
    const lineUserId = event.source?.userId;
    const messageId = (event.message as { id?: string })?.id;
    if (!lineUserId || !messageId) continue;

    // โหลด customer จาก lineUserId
    const { data: customer } = await supabase
      .from("customers")
      .select("id")
      .eq("shop_id", lineChannel.shop_id)
      .eq("line_user_id", lineUserId)
      .maybeSingle();

    if (!customer) continue;

    // หา order ที่รอชำระเงินของลูกค้านี้
    const { data: order } = await supabase
      .from("orders")
      .select("id, order_number, total_amount, status")
      .eq("shop_id", lineChannel.shop_id)
      .eq("customer_id", customer.id)
      .eq("status", "waiting_payment")
      .order("placed_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!order) continue;

    // ดาวน์โหลดรูป slip จาก LINE
    const imageBase64 = await downloadLineImage(
      messageId,
      lineChannel.channel_access_token,
    );
    if (!imageBase64) continue;

    // ส่ง slip ไป EasySlip เพื่อ verify
    const slipResult = await verifySlipWithEasySlip(imageBase64);

    // ถ้า verify สำเร็จและยอดเงินตรง (±1 บาท)
    if (
      slipResult &&
      Math.abs(slipResult.amount - order.total_amount) <= 1
    ) {
      // อัพเดท order → paid
      await supabase
        .from("orders")
        .update({ status: "paid", payment_status: "paid" })
        .eq("id", order.id);

      await supabase.from("order_status_logs").insert({
        order_id: order.id,
        from_status: order.status,
        to_status: "paid",
        changed_by_type: "system",
        notes: `EasySlip verified: ${slipResult.transRef}`,
      });

      // อัพเดท order_payments ถ้ามี
      await supabase
        .from("order_payments")
        .update({ status: "paid", paid_at: new Date().toISOString() })
        .eq("order_id", order.id)
        .eq("status", "pending");

      // แจ้งลูกค้าว่ายืนยันรับ slip แล้ว
      await sendOrderStatusNotification({
        channelAccessToken: lineChannel.channel_access_token,
        lineUserId,
        orderNumber: order.order_number,
        newStatus: "paid",
      });
    }
  }
}

async function fetchShopProducts(shopId: string): Promise<ProductRecord[]> {
  const supabase = createAdminSupabaseClient();
  const { data, error } = await supabase
    .from("products")
    .select("id, name, sku, price_amount")
    .eq("shop_id", shopId)
    .eq("is_active", true);

  if (error) {
    throw new Error(`Failed to fetch products: ${error.message}`);
  }

  return (data ?? []) as ProductRecord[];
}

function extractQuantityFromText(text: string): number {
  const unitPattern = /(\d+)\s*(ชิ้น|ตัว|อัน|กล่อง|แพ็ก|คู่|ชุด|kg|โล|ใบ)/i;
  const unitMatch = unitPattern.exec(text);
  if (unitMatch) {
    return parseInt(unitMatch[1], 10);
  }

  const numberMatch = /\b(\d+)\b/.exec(text);
  if (numberMatch) {
    const n = parseInt(numberMatch[1], 10);
    if (n >= 1 && n <= 999) {
      return n;
    }
  }

  return 1;
}

function matchProductsInText(
  text: string,
  products: ProductRecord[],
): Array<{ product: ProductRecord; quantity: number }> {
  const normalized = text.toLowerCase();
  const quantity = extractQuantityFromText(text);
  const matched: Array<{ product: ProductRecord; quantity: number }> = [];

  for (const product of products) {
    const nameMatch = normalized.includes(product.name.toLowerCase());
    const skuMatch = product.sku
      ? normalized.includes(product.sku.toLowerCase())
      : false;

    if (nameMatch || skuMatch) {
      matched.push({ product, quantity });
    }
  }

  return matched;
}

async function findCustomersByLineUserIds(
  lineChannel: LineChannelRecord | null,
  lineUserIds: string[],
) {
  if (!lineChannel || lineUserIds.length === 0) {
    return new Map<string, CustomerRecord>();
  }

  const supabase = createAdminSupabaseClient();
  const { data, error } = await supabase
    .from("customers")
    .select("id, shop_id, line_user_id")
    .eq("shop_id", lineChannel.shop_id)
    .in("line_user_id", lineUserIds);

  if (error) {
    throw new Error(`Failed to load LINE customers: ${error.message}`);
  }

  const customerMap = new Map<string, CustomerRecord>();

  for (const customer of (data ?? []) as CustomerRecord[]) {
    customerMap.set(customer.line_user_id, customer);
  }

  return customerMap;
}

function buildOrderDraftWithItems(
  events: LineWebhookEvent[],
  lineChannel: LineChannelRecord | null,
  customersByLineUserId: Map<string, CustomerRecord>,
  products: ProductRecord[],
): OrderDraftWithItems[] {
  if (!lineChannel) {
    return [];
  }

  const results: OrderDraftWithItems[] = [];

  for (const event of events) {
    if (!isTextMessageEvent(event)) {
      continue;
    }

    const lineUserId = event.source?.userId;
    const messageText = event.message?.text?.trim();

    if (!lineUserId || !messageText) {
      continue;
    }

    if (classifyMessageIntent(messageText) !== "order_intent") {
      continue;
    }

    const customer = customersByLineUserId.get(lineUserId);

    if (!customer) {
      continue;
    }

    const matchedItems = matchProductsInText(messageText, products);
    const subtotal = matchedItems.reduce(
      (sum, { product, quantity }) => sum + product.price_amount * quantity,
      0,
    );

    results.push({
      draft: {
        shop_id: lineChannel.shop_id,
        customer_id: customer.id,
        line_channel_id: lineChannel.id,
        order_number: `DRAFT-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
        source: "line_chat",
        status: "new",
        payment_status: "pending",
        fulfillment_status: "unfulfilled",
        notes: messageText,
        currency: "THB",
        subtotal_amount: subtotal,
        discount_amount: 0,
        shipping_amount: 0,
        total_amount: subtotal,
        placed_at: getEventTimestamp(event),
      },
      items: matchedItems,
    });
  }

  return results;
}

export async function persistLineWebhookEvents(
  body: LineWebhookBody,
  channelSecret: string,
) {
  const supabase = createAdminSupabaseClient();
  const lineChannel = await findLineChannelBySecret(channelSecret);
  const records = body.events.map((event) =>
    buildWebhookInsertRecord(event, body, lineChannel),
  );

  if (records.length === 0) {
    return { count: 0, lineChannel: null, insertedEvents: [] };
  }

  const { data, error } = await supabase
    .from("line_webhook_events")
    .insert(records)
    .select("id, event_id");

  if (error) {
    throw new Error(`Failed to save LINE webhook events: ${error.message}`);
  }

  return {
    count: records.length,
    lineChannel,
    insertedEvents: (data ?? []) as InsertedWebhookEventRecord[],
  };
}

export async function upsertLineCustomers(
  body: LineWebhookBody,
  lineChannel: LineChannelRecord | null,
) {
  const customerRecords = buildCustomerUpsertRecords(body.events, lineChannel);

  if (customerRecords.length === 0) {
    return { count: 0 };
  }

  const lineUserIds = customerRecords.map((r) => r.line_user_id);
  const profiles = lineChannel
    ? await fetchLineUserProfiles(lineUserIds, lineChannel.channel_access_token)
    : new Map();

  const recordsWithProfiles = customerRecords.map((record) => {
    const profile = profiles.get(record.line_user_id);
    if (!profile) return record;
    return {
      ...record,
      line_display_name: profile.displayName,
      picture_url: profile.pictureUrl,
      language: profile.language,
    };
  });

  const supabase = createAdminSupabaseClient();
  const { error } = await supabase.from("customers").upsert(recordsWithProfiles, {
    onConflict: "shop_id,line_user_id",
  });

  if (error) {
    throw new Error(`Failed to upsert LINE customers: ${error.message}`);
  }

  return { count: customerRecords.length };
}

export async function createOrderDraftsFromLineMessages(
  body: LineWebhookBody,
  lineChannel: LineChannelRecord | null,
) {
  if (!lineChannel) {
    return { count: 0 };
  }

  const lineUserIds = Array.from(
    new Set(
      body.events
        .map((event) => event.source?.userId)
        .filter((lineUserId): lineUserId is string => Boolean(lineUserId)),
    ),
  );

  const [customersByLineUserId, products] = await Promise.all([
    findCustomersByLineUserIds(lineChannel, lineUserIds),
    fetchShopProducts(lineChannel.shop_id),
  ]);

  const draftsWithItems = buildOrderDraftWithItems(
    body.events,
    lineChannel,
    customersByLineUserId,
    products,
  );

  if (draftsWithItems.length === 0) {
    return { count: 0 };
  }

  const supabase = createAdminSupabaseClient();
  const { data: insertedOrders, error: ordersError } = await supabase
    .from("orders")
    .insert(draftsWithItems.map(({ draft }) => draft))
    .select("id");

  if (ordersError) {
    throw new Error(`Failed to create order drafts: ${ordersError.message}`);
  }

  const orderItems: OrderItemInsert[] = (insertedOrders ?? []).flatMap(
    (order, i) => {
      const { items } = draftsWithItems[i];
      return items.map(({ product, quantity }) => ({
        order_id: order.id,
        product_id: product.id,
        product_name_snapshot: product.name,
        sku_snapshot: product.sku,
        unit_price_amount: product.price_amount,
        quantity,
        line_total_amount: product.price_amount * quantity,
      }));
    },
  );

  if (orderItems.length > 0) {
    const { error: itemsError } = await supabase
      .from("order_items")
      .insert(orderItems);

    if (itemsError) {
      throw new Error(`Failed to create order items: ${itemsError.message}`);
    }
  }

  return { count: draftsWithItems.length };
}

const CATALOG_KEYWORDS = ["เมนู", "สินค้า", "ดูของ", "catalog", "menu", "ของมีอะไร", "มีอะไรบ้าง"];

function isCatalogRequest(text: string): boolean {
  const normalized = text.trim().toLowerCase();
  return CATALOG_KEYWORDS.some((kw) => normalized.includes(kw));
}

function isPostbackEvent(event: LineWebhookEvent): boolean {
  return event.type === "postback";
}

async function handleCatalogRequests(
  events: LineWebhookEvent[],
  lineChannel: LineChannelRecord | null,
) {
  if (!lineChannel) return;

  const supabase = createAdminSupabaseClient();
  const { data: products } = await supabase
    .from("products")
    .select("id, name, description, price_amount, image_url")
    .eq("shop_id", lineChannel.shop_id)
    .eq("is_active", true)
    .order("created_at", { ascending: true })
    .limit(10);

  if (!products || products.length === 0) return;

  const catalogEvents = events.filter(
    (e) => isTextMessageEvent(e) && isCatalogRequest(e.message?.text ?? ""),
  );

  await Promise.allSettled(
    catalogEvents.map((event) => {
      const lineUserId = event.source?.userId;
      if (!lineUserId) return Promise.resolve();
      return sendProductCatalog({
        channelAccessToken: lineChannel.channel_access_token,
        lineUserId,
        products,
      });
    }),
  );
}

async function handlePostbackEvents(
  events: LineWebhookEvent[],
  lineChannel: LineChannelRecord | null,
) {
  if (!lineChannel) return;

  const postbacks = events.filter(isPostbackEvent);
  if (postbacks.length === 0) return;

  const supabase = createAdminSupabaseClient();

  for (const event of postbacks) {
    const lineUserId = event.source?.userId;
    const data = (event as { postback?: { data?: string } }).postback?.data;
    if (!lineUserId || !data) continue;

    const params = parsePostbackData(data);
    if (params.action !== "order" || !params.productId) continue;

    // โหลด product
    const { data: product } = await supabase
      .from("products")
      .select("id, name, price_amount, sku")
      .eq("id", params.productId)
      .eq("shop_id", lineChannel.shop_id)
      .maybeSingle();

    if (!product) continue;

    // โหลด customer
    const { data: customer } = await supabase
      .from("customers")
      .select("id")
      .eq("shop_id", lineChannel.shop_id)
      .eq("line_user_id", lineUserId)
      .maybeSingle();

    if (!customer) continue;

    // สร้าง order draft
    const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
    const { data: insertedOrder } = await supabase
      .from("orders")
      .insert({
        shop_id: lineChannel.shop_id,
        customer_id: customer.id,
        line_channel_id: lineChannel.id,
        order_number: orderNumber,
        source: "line_chat",
        status: "new",
        payment_status: "pending",
        fulfillment_status: "unfulfilled",
        notes: `ลูกค้ากดสั่ง: ${product.name}`,
        currency: "THB",
        subtotal_amount: product.price_amount,
        discount_amount: 0,
        shipping_amount: 0,
        total_amount: product.price_amount,
        placed_at: new Date().toISOString(),
      })
      .select("id")
      .single();

    if (!insertedOrder) continue;

    // สร้าง order_item
    await supabase.from("order_items").insert({
      order_id: insertedOrder.id,
      product_id: product.id,
      product_name_snapshot: product.name,
      sku_snapshot: product.sku ?? null,
      unit_price_amount: product.price_amount,
      quantity: 1,
      line_total_amount: product.price_amount,
    });

    // แจ้งลูกค้า
    const client = new messagingApi.MessagingApiClient({
      channelAccessToken: lineChannel.channel_access_token,
    });
    await client.pushMessage({
      to: lineUserId,
      messages: [
        {
          type: "text",
          text: `รับออเดอร์ ${product.name} แล้วค่ะ ราคา ฿${Number(product.price_amount).toLocaleString("th-TH")}\n\nทีมงานจะติดต่อยืนยันและส่งช่องทางชำระเงินให้เร็วๆ นี้นะคะ`,
        },
      ],
    });
  }
}

async function replyToTextMessageEvents(
  events: LineWebhookEvent[],
  lineChannel: LineChannelRecord | null,
) {
  if (!lineChannel) {
    return;
  }

  // ไม่ตอบ events ที่เป็น catalog request (จะส่ง catalog แทน)
  const replies = events
    .filter(isTextMessageEvent)
    .filter((event) => event.replyToken)
    .filter((event) => !isCatalogRequest(event.message?.text ?? ""))
    .map((event) => {
      const intent = classifyMessageIntent(event.message!.text!.trim());
      return sendLineReply(event.replyToken!, intent, lineChannel.channel_access_token);
    });

  await Promise.allSettled(replies);
}

export async function processLineWebhook(
  body: LineWebhookBody,
  channelSecret: string,
) {
  const persisted = await persistLineWebhookEvents(body, channelSecret);
  const intentCounts = buildIntentCounts(body.events);

  try {
    const customers = await upsertLineCustomers(body, persisted.lineChannel);
    const orders = await createOrderDraftsFromLineMessages(
      body,
      persisted.lineChannel,
    );
    await handleSlipImages(body.events, persisted.lineChannel);
    await handleCatalogRequests(body.events, persisted.lineChannel);
    await handlePostbackEvents(body.events, persisted.lineChannel);
    await markWebhookEventsProcessed(persisted.insertedEvents);
    await replyToTextMessageEvents(body.events, persisted.lineChannel);

    return {
      received: persisted.count,
      customersUpserted: customers.count,
      orderDraftsCreated: orders.count,
      intentCounts,
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown customer processing error";

    await markWebhookEventsProcessed(persisted.insertedEvents, message);
    throw error;
  }
}
