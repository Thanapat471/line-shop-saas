# LINE Webhook Phase 1

This phase implements the first working LINE webhook endpoint for the project.

## Goal

Receive webhook calls from LINE, verify the request signature, and store raw events in the database before any order parsing logic is introduced.

## Route

- `GET /api/webhooks/line`
- `POST /api/webhooks/line`

## Current Behavior

### `GET`

Returns a small JSON response to confirm the route exists.

### `POST`

1. Reads the raw request body
2. Verifies `x-line-signature`
3. Parses the LINE webhook payload
4. Looks up the active `line_channels` row by `channel_secret`
5. Inserts raw event rows into `line_webhook_events`
6. Returns `{ ok: true, received: number }`

## Required Environment Variables

- `LINE_CHANNEL_SECRET`
- `LINE_CHANNEL_ACCESS_TOKEN`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

## Important Notes

- This phase does not create customers or orders yet.
- This phase does not send LINE replies yet.
- `LINE_CHANNEL_ACCESS_TOKEN` is already required in env so the next phase can add outbound LINE actions without changing the contract again.
- The route expects the SQL schema from [supabase/migrations/0001_init_schema.sql](E:\Line OA\line-oa\supabase\migrations\0001_init_schema.sql) to exist first.

## Recommended Next Step

After this route is deployed and verified:

1. upsert customers from `source.userId`
2. map text messages into order intake logic
3. create `orders`
4. create `order_items`
