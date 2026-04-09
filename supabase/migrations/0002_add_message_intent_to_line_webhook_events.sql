alter table public.line_webhook_events
add column if not exists message_intent text
check (message_intent in ('chat', 'inquiry', 'order_intent'));
