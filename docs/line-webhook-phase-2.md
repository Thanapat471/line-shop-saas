# LINE Webhook Phase 2

This phase extends the webhook flow so LINE users start becoming real customer records in the database.

## Goal

When LINE sends a webhook event:

1. store the raw event
2. upsert the customer by `source.userId`
3. mark the webhook event as `processed` or `failed`

## Current Behavior

`POST /api/webhooks/line` now does the following:

1. verify the LINE signature
2. parse the webhook payload
3. insert rows into `line_webhook_events`
4. upsert rows into `customers`
5. update inserted webhook rows to `processed`

If customer processing fails after the raw event is saved, the route updates the inserted webhook rows to:

- `processing_status = failed`
- `error_message = <failure message>`

## Customer Upsert Rules

- only events with `source.userId` are used
- uniqueness is based on `(shop_id, line_user_id)`
- current phase only fills:
  - `shop_id`
  - `line_channel_id`
  - `line_user_id`
  - `last_message_at`

## Why This Phase Matters

This is the first point where the app starts building merchant-owned customer data from LINE traffic.
Once this is in place, the next phase can create orders against real `customer_id` values instead of trying to infer them on the fly.

## Recommended Next Step

1. create message intake rules for text events
2. create `orders`
3. create `order_items`
4. add a minimal order list dashboard
