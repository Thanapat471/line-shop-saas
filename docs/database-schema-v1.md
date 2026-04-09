# Database Schema V1

This document defines the first production-oriented database schema for LINE Shop SaaS.
It is designed for:

- multi-tenant SaaS from day one
- Thai merchants selling through LINE OA
- chat-driven order intake
- real-time order dashboard
- merchant subscription billing kept separate from customer order payments

## Design Principles

- Every business record belongs to a single `shop`.
- A shop can connect one or more LINE channels over time.
- Merchant authentication is handled separately from customer identity.
- Customer order payment and merchant SaaS subscription are different domains and use different tables.
- Order history must be auditable, so status changes are append-only in a dedicated log table.
- The schema should support MVP now and leave room for LIFF, richer automation, and analytics later.

## Core Entities

### Tenant and Merchant

- `shops`: the merchant business account in the SaaS
- `users`: merchant users who can access the dashboard
- `shop_memberships`: maps users to shops and roles
- `line_channels`: LINE Messaging API credentials and connection state for each shop

### Commerce

- `customers`: end customers who message a shop on LINE
- `line_webhook_events`: raw LINE events for debugging, replay-safe processing, and audit
- `products`: items a shop can sell
- `orders`: order header with customer, totals, and status
- `order_items`: line items inside an order
- `order_status_logs`: append-only history of status changes

### Billing and Payment

- `order_payments`: customer-facing payments for product orders
- `subscriptions`: merchant SaaS plan and billing state

## Status Model

Recommended MVP statuses:

- `new`
- `waiting_payment`
- `paid`
- `processing`
- `shipped`
- `completed`
- `cancelled`

Recommended MVP transition style:

- system-driven: `new`, `waiting_payment`
- merchant-driven: `paid`, `processing`, `shipped`, `completed`, `cancelled`

## Relationship Summary

- one `shop` has many `shop_memberships`
- one `shop_membership` belongs to one `user`
- one `shop` has many `line_channels`
- one `shop` has many `customers`
- one `line_channel` has many `line_webhook_events`
- one `shop` has many `products`
- one `shop` has many `orders`
- one `customer` can have many `orders`
- one `order` has many `order_items`
- one `order` has many `order_status_logs`
- one `order` can have many `order_payments`
- one `shop` can have many `subscriptions` over time

## Key Field Decisions

### `shops`

Important fields:

- `id`
- `name`
- `slug`
- `status`
- `default_currency`
- `default_timezone`

Why:

- `slug` is useful for URLs and dashboard routing.
- `status` allows future access control such as active, suspended, trialing.
- Currency and timezone are needed for reporting and billing.

### `users`

Important fields:

- `id`
- `email`
- `display_name`
- `auth_user_id`

Why:

- `auth_user_id` should map to the Supabase Auth user id.
- Keeping an app-level user table makes role and profile management easier.

### `shop_memberships`

Important fields:

- `shop_id`
- `user_id`
- `role`

Why:

- A user may belong to multiple shops in the future.
- Roles such as `owner`, `admin`, `staff` should not live directly on `users`.

### `line_channels`

Important fields:

- `shop_id`
- `channel_id`
- `channel_secret`
- `channel_access_token`
- `basic_id`
- `is_active`

Why:

- LINE credentials belong to a shop, not to a user.
- Future token rotation is easier when credentials are isolated in their own table.

Security note:

- Secrets and access tokens are sensitive. In production, consider storing encrypted values or moving them to a secret manager pattern.

### `customers`

Important fields:

- `shop_id`
- `line_user_id`
- `display_name`
- `picture_url`
- `last_message_at`

Why:

- A LINE user may exist across different shops, so uniqueness should be per shop.
- `last_message_at` helps order queues and CRM-like views later.

### `products`

Important fields:

- `shop_id`
- `name`
- `sku`
- `price_amount`
- `is_active`
- `stock_quantity`

Why:

- Product catalogs must be isolated per shop.
- `stock_quantity` can be optional for MVP but is useful even for simple inventory later.

### `line_webhook_events`

Important fields:

- `line_channel_id`
- `shop_id`
- `event_id`
- `event_type`
- `source_type`
- `source_user_id`
- `reply_token`
- `message_type`
- `message_text`
- `raw_body`
- `processed_at`

Why:

- Storing raw LINE events helps with debugging webhook issues.
- It creates a safe place to inspect incoming payloads before order parsing grows more complex.
- `event_id` allows replay protection and idempotent handling later.

### `orders`

Important fields:

- `shop_id`
- `customer_id`
- `order_number`
- `status`
- `subtotal_amount`
- `discount_amount`
- `shipping_amount`
- `total_amount`
- `payment_status`
- `fulfillment_status`
- `shipping_address`
- `notes`
- `placed_at`

Why:

- `order_number` should be merchant-friendly and unique per shop.
- Keep `status`, `payment_status`, and `fulfillment_status` separate to avoid overloading one field.
- Address and notes are needed for social commerce flows.

### `order_items`

Important fields:

- `order_id`
- `product_id`
- `product_name_snapshot`
- `sku_snapshot`
- `unit_price_amount`
- `quantity`
- `line_total_amount`

Why:

- Snapshot fields preserve history even if the product is edited later.

### `order_status_logs`

Important fields:

- `order_id`
- `from_status`
- `to_status`
- `changed_by_type`
- `changed_by_user_id`
- `reason`

Why:

- This creates a reliable audit trail for merchant actions and system automation.

### `order_payments`

Important fields:

- `order_id`
- `provider`
- `payment_method`
- `status`
- `amount`
- `provider_reference`
- `paid_at`

Why:

- Customer payments must support manual confirmation first, with room for later provider webhook integration.

### `subscriptions`

Important fields:

- `shop_id`
- `provider`
- `plan_code`
- `status`
- `billing_cycle`
- `current_period_start`
- `current_period_end`

Why:

- Subscription history should be preserved over time, not overwritten in the shop record.

## Notes For Supabase

- Use UUID primary keys for all core tables.
- Add `created_at` and `updated_at` timestamps to all mutable tables.
- Use row-level security later with `shop_memberships` as the main authorization pivot.
- Enable realtime at least for `orders` and optionally `order_status_logs`.
- Keep `line_webhook_events` out of realtime unless there is a strong debugging need.

## Deliverables In This Phase

- SQL schema file for initial setup
- clear data model for MVP
- ready foundation for Supabase table creation and future RLS rules
