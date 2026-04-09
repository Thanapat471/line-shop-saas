# Dashboard Phase 1

This phase adds the first merchant-facing page for validating the LINE order flow.

## Route

- `/dashboard/orders`

## Goal

Show incoming draft orders created from LINE webhook messages so the team can verify the end-to-end loop:

- LINE message
- webhook event
- customer upsert
- order draft creation
- merchant-visible dashboard row

## Current Behavior

- loads the latest 50 orders from Supabase
- shows order number, LINE user id, incoming message text, timestamp, amount, and status
- shows a setup message instead of crashing when env or DB setup is incomplete

## Why This Matters

This is the first page that makes the backend flow tangible.
Even before product parsing, payment, or status actions exist, the merchant can already see proof that LINE traffic is turning into order records.

## Recommended Next Step

1. add order detail view
2. add merchant status update actions
3. push LINE status messages back to customers
