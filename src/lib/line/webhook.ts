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
    received_at:
      typeof event.timestamp === "number"
        ? new Date(event.timestamp).toISOString()
        : new Date().toISOString(),
    processing_status: "received",
  };
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
    return { count: 0 };
  }

  const { error } = await supabase.from("line_webhook_events").insert(records);

  if (error) {
    throw new Error(`Failed to save LINE webhook events: ${error.message}`);
  }

  return { count: records.length };
}
