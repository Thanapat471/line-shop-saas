import { validateSignature } from "@line/bot-sdk";
import { createAdminSupabaseClient } from "@/lib/supabase/server";

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
};

type InsertedWebhookEventRecord = {
  id: string;
  event_id: string | null;
};

type CustomerUpsertRecord = {
  shop_id: string;
  line_channel_id: string;
  line_user_id: string;
  last_message_at: string;
};

export function verifyLineSignature(rawBody: string, signature: string, secret: string) {
  return validateSignature(rawBody, secret, signature);
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
    .select("id, shop_id")
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

  const supabase = createAdminSupabaseClient();
  const { error } = await supabase.from("customers").upsert(customerRecords, {
    onConflict: "shop_id,line_user_id",
  });

  if (error) {
    throw new Error(`Failed to upsert LINE customers: ${error.message}`);
  }

  return { count: customerRecords.length };
}

export async function processLineWebhook(body: LineWebhookBody, channelSecret: string) {
  const persisted = await persistLineWebhookEvents(body, channelSecret);

  try {
    const customers = await upsertLineCustomers(body, persisted.lineChannel);
    await markWebhookEventsProcessed(persisted.insertedEvents);

    return {
      received: persisted.count,
      customersUpserted: customers.count,
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown customer processing error";

    await markWebhookEventsProcessed(persisted.insertedEvents, message);
    throw error;
  }
}
