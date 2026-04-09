# Order Intent Phase 1

This phase changes the webhook behavior from "every text becomes an order" to
"only messages that look like buying intent become an order draft."

## Goal

Reduce noisy draft orders from casual chat messages such as greetings, while
keeping the MVP simple and deterministic.

## Current Intent Types

- `chat`
- `inquiry`
- `order_intent`

## Rule-Based Detection

The current implementation marks a message as `order_intent` when at least one
of these is true:

- it contains a direct buy keyword such as `สั่ง`, `เอา`, `รับ`, `ซื้อ`, `cf`
- it contains quantity-like patterns together with enough text context

It marks a message as `inquiry` when it contains keywords such as:

- `ราคา`
- `เท่าไหร่`
- `มีไหม`
- `ค่าส่ง`
- `รายละเอียด`

Everything else is currently treated as `chat`.

## Effect On The System

- `chat` messages are stored in `line_webhook_events` with `message_intent = chat`
- `inquiry` messages are stored in `line_webhook_events` with `message_intent = inquiry`
- `order_intent` messages create draft rows in `orders`
- `order_intent` messages are also stored in `line_webhook_events` with `message_intent = order_intent`

## Why This Is The Right Next Step

- It keeps the order queue cleaner
- It avoids turning greetings into fake orders
- It creates a better base for future product parsing and conversational order intake

## Recommended Next Step

1. add order status update actions
2. send LINE replies from the app instead of relying on OA auto-replies
3. later map `order_intent` messages into structured `order_items`
