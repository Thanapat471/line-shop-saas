# LINE Webhook Phase 3

This phase creates the first order draft records from incoming LINE text messages.

## Goal

Turn a text message from a LINE user into a lightweight order draft so the merchant side can start displaying real order rows.

## Current Behavior

For each valid text message event:

1. save the raw webhook event
2. upsert the customer
3. create an `orders` row with:
   - `status = new`
   - `source = line_chat`
   - `notes = incoming message text`
   - amount fields set to `0`

## Draft Logic

- only LINE events of type `message`
- only message subtype `text`
- only events with `source.userId`
- one incoming text event creates one draft order

## Why This Is Good For MVP

- It gets the merchant-facing order queue moving quickly.
- It avoids premature message parsing complexity.
- It lets us test the full chain from LINE to database before building NLP or menu-aware intake.

## Important Limitation

This phase does not yet:

- parse quantities
- match products
- create `order_items`
- send LINE replies
- merge multiple messages into one order session

## Recommended Next Step

1. add a minimal order list page
2. show `orders` in the dashboard
3. let the merchant change status
