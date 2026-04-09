# Backend Foundation Checklist

This checklist prepares the project for the next implementation phase after database schema design.

## Goal

Set up the minimum backend foundation needed before building the LINE webhook flow and merchant dashboard.

## What Must Exist First

- Supabase project created
- SQL migration from `supabase/migrations/0001_init_schema.sql` applied
- environment variables filled in from `.env.example`

## Supabase Setup

1. Create a new Supabase project.
2. Run the initial schema in [supabase/migrations/0001_init_schema.sql](E:\Line OA\line-oa\supabase\migrations\0001_init_schema.sql).
3. Confirm these tables exist:
   - `shops`
   - `users`
   - `shop_memberships`
   - `line_channels`
   - `customers`
   - `line_webhook_events`
   - `products`
   - `orders`
   - `order_items`
   - `order_status_logs`
   - `order_payments`
   - `subscriptions`
4. Enable Realtime for `orders`.
5. Optionally enable Realtime for `order_status_logs`.

## Environment Variables

Required now:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `LINE_CHANNEL_SECRET`
- `LINE_CHANNEL_ACCESS_TOKEN`

Needed later:

- `STRIPE_SECRET_KEY`
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `RESEND_API_KEY`
- `RESEND_FROM_EMAIL`
- `GB_PRIME_PAY_PUBLIC_KEY`
- `GB_PRIME_PAY_SECRET_KEY`

## Recommended Next Build Order

1. Install and configure `@supabase/supabase-js`
2. Add shared Supabase client helpers for server and browser
3. Build the LINE webhook route
4. Save incoming LINE events into `line_webhook_events`
5. Upsert `customers`
6. Create `orders`

## Guardrails

- Do not build payment flows before webhook and order creation work.
- Do not rely only on logs; persist raw LINE events in `line_webhook_events`.
- Do not mix merchant subscription records with customer order payments.
- Keep secrets out of committed source files.
