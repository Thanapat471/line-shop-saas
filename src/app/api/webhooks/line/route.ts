import { NextResponse } from "next/server";
import { getRequiredLineEnv } from "@/lib/env";
import {
  parseLineWebhookBody,
  processLineWebhook,
  verifyLineSignature,
} from "@/lib/line/webhook";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({
    ok: true,
    route: "line-webhook",
  });
}

export async function POST(request: Request) {
  const signature = request.headers.get("x-line-signature");

  if (!signature) {
    return NextResponse.json(
      {
        ok: false,
        error: "Missing x-line-signature header",
      },
      { status: 400 },
    );
  }

  const rawBody = await request.text();
  const { lineChannelSecret } = getRequiredLineEnv();

  if (!verifyLineSignature(rawBody, signature, lineChannelSecret)) {
    return NextResponse.json(
      {
        ok: false,
        error: "Invalid LINE signature",
      },
      { status: 401 },
    );
  }

  try {
    const body = parseLineWebhookBody(rawBody);
    const result = await processLineWebhook(body, lineChannelSecret);

    return NextResponse.json({
      ok: true,
      received: result.received,
      customersUpserted: result.customersUpserted,
      orderDraftsCreated: result.orderDraftsCreated,
      intentCounts: result.intentCounts,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown webhook error";

    return NextResponse.json(
      {
        ok: false,
        error: message,
      },
      { status: 500 },
    );
  }
}
