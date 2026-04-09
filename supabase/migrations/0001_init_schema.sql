create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table public.shops (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  status text not null default 'active' check (status in ('active', 'trialing', 'suspended', 'archived')),
  default_currency text not null default 'THB',
  default_timezone text not null default 'Asia/Bangkok',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.users (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid not null unique,
  email text not null unique,
  display_name text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.shop_memberships (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  role text not null default 'staff' check (role in ('owner', 'admin', 'staff')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (shop_id, user_id)
);

create table public.line_channels (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops(id) on delete cascade,
  provider text not null default 'line_messaging_api' check (provider = 'line_messaging_api'),
  channel_id text not null,
  channel_secret text not null,
  channel_access_token text not null,
  basic_id text,
  display_name text,
  webhook_url text,
  is_active boolean not null default true,
  last_webhook_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (shop_id, channel_id)
);

create table public.customers (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops(id) on delete cascade,
  line_channel_id uuid references public.line_channels(id) on delete set null,
  line_user_id text not null,
  line_display_name text,
  picture_url text,
  language text,
  notes text,
  last_message_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (shop_id, line_user_id)
);

create table public.line_webhook_events (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid references public.shops(id) on delete cascade,
  line_channel_id uuid references public.line_channels(id) on delete set null,
  event_id text,
  event_type text not null,
  source_type text,
  source_user_id text,
  source_group_id text,
  reply_token text,
  message_type text,
  message_text text,
  raw_body jsonb not null default '{}'::jsonb,
  received_at timestamptz not null default now(),
  processed_at timestamptz,
  processing_status text not null default 'received' check (processing_status in ('received', 'processed', 'failed', 'ignored')),
  error_message text,
  created_at timestamptz not null default now(),
  unique (line_channel_id, event_id)
);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops(id) on delete cascade,
  name text not null,
  slug text,
  sku text,
  description text,
  image_url text,
  price_amount numeric(12,2) not null default 0 check (price_amount >= 0),
  currency text not null default 'THB',
  stock_quantity integer check (stock_quantity is null or stock_quantity >= 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (shop_id, sku),
  unique (shop_id, slug)
);

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops(id) on delete cascade,
  customer_id uuid not null references public.customers(id) on delete restrict,
  line_channel_id uuid references public.line_channels(id) on delete set null,
  order_number text not null,
  source text not null default 'line_chat' check (source in ('line_chat', 'liff', 'dashboard', 'manual')),
  status text not null default 'new' check (status in ('new', 'waiting_payment', 'paid', 'processing', 'shipped', 'completed', 'cancelled')),
  payment_status text not null default 'pending' check (payment_status in ('pending', 'paid', 'failed', 'refunded', 'voided')),
  fulfillment_status text not null default 'unfulfilled' check (fulfillment_status in ('unfulfilled', 'processing', 'shipped', 'completed', 'cancelled')),
  customer_name text,
  customer_phone text,
  shipping_recipient_name text,
  shipping_phone text,
  shipping_address text,
  shipping_postcode text,
  shipping_note text,
  notes text,
  subtotal_amount numeric(12,2) not null default 0 check (subtotal_amount >= 0),
  discount_amount numeric(12,2) not null default 0 check (discount_amount >= 0),
  shipping_amount numeric(12,2) not null default 0 check (shipping_amount >= 0),
  total_amount numeric(12,2) not null default 0 check (total_amount >= 0),
  currency text not null default 'THB',
  placed_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (shop_id, order_number)
);

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  product_name_snapshot text not null,
  sku_snapshot text,
  unit_price_amount numeric(12,2) not null default 0 check (unit_price_amount >= 0),
  quantity integer not null check (quantity > 0),
  line_total_amount numeric(12,2) not null default 0 check (line_total_amount >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.order_status_logs (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  from_status text,
  to_status text not null check (to_status in ('new', 'waiting_payment', 'paid', 'processing', 'shipped', 'completed', 'cancelled')),
  changed_by_type text not null check (changed_by_type in ('system', 'merchant', 'customer')),
  changed_by_user_id uuid references public.users(id) on delete set null,
  reason text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table public.order_payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  provider text not null check (provider in ('manual', 'gb_prime_pay', 'stripe')),
  payment_method text not null check (payment_method in ('promptpay_qr', 'bank_transfer', 'card', 'cash', 'other')),
  status text not null default 'pending' check (status in ('pending', 'paid', 'failed', 'cancelled', 'refunded')),
  amount numeric(12,2) not null default 0 check (amount >= 0),
  currency text not null default 'THB',
  provider_reference text,
  payment_slip_url text,
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops(id) on delete cascade,
  provider text not null check (provider in ('stripe', 'manual')),
  provider_subscription_id text,
  plan_code text not null,
  status text not null check (status in ('trialing', 'active', 'past_due', 'cancelled', 'paused', 'expired')),
  billing_cycle text not null default 'monthly' check (billing_cycle in ('monthly', 'yearly')),
  amount numeric(12,2) not null default 0 check (amount >= 0),
  currency text not null default 'THB',
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancelled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_shop_memberships_shop_id on public.shop_memberships (shop_id);
create index idx_shop_memberships_user_id on public.shop_memberships (user_id);
create index idx_line_channels_shop_id on public.line_channels (shop_id);
create index idx_customers_shop_id on public.customers (shop_id);
create index idx_customers_line_channel_id on public.customers (line_channel_id);
create index idx_line_webhook_events_shop_id on public.line_webhook_events (shop_id);
create index idx_line_webhook_events_channel_id on public.line_webhook_events (line_channel_id);
create index idx_line_webhook_events_received_at on public.line_webhook_events (received_at desc);
create index idx_products_shop_id on public.products (shop_id);
create index idx_orders_shop_id on public.orders (shop_id);
create index idx_orders_customer_id on public.orders (customer_id);
create index idx_orders_line_channel_id on public.orders (line_channel_id);
create index idx_orders_status on public.orders (shop_id, status);
create index idx_orders_placed_at on public.orders (shop_id, placed_at desc);
create index idx_order_items_order_id on public.order_items (order_id);
create index idx_order_status_logs_order_id on public.order_status_logs (order_id, created_at desc);
create index idx_order_payments_order_id on public.order_payments (order_id);
create index idx_subscriptions_shop_id on public.subscriptions (shop_id, created_at desc);

create trigger set_shops_updated_at
before update on public.shops
for each row
execute function public.set_updated_at();

create trigger set_users_updated_at
before update on public.users
for each row
execute function public.set_updated_at();

create trigger set_shop_memberships_updated_at
before update on public.shop_memberships
for each row
execute function public.set_updated_at();

create trigger set_line_channels_updated_at
before update on public.line_channels
for each row
execute function public.set_updated_at();

create trigger set_customers_updated_at
before update on public.customers
for each row
execute function public.set_updated_at();

create trigger set_products_updated_at
before update on public.products
for each row
execute function public.set_updated_at();

create trigger set_orders_updated_at
before update on public.orders
for each row
execute function public.set_updated_at();

create trigger set_order_items_updated_at
before update on public.order_items
for each row
execute function public.set_updated_at();

create trigger set_order_payments_updated_at
before update on public.order_payments
for each row
execute function public.set_updated_at();

create trigger set_subscriptions_updated_at
before update on public.subscriptions
for each row
execute function public.set_updated_at();
