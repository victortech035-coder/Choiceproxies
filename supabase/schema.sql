-- Choiceproxies starter schema.
-- Run in Supabase SQL Editor. Review policies and test with separate accounts before production.
create extension if not exists pgcrypto;

create type public.order_status as enum (
  'pending_payment', 'paid', 'processing', 'fulfilled', 'failed',
  'cancelled', 'refund_pending', 'refunded'
);

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.user_roles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'customer' check (role in ('customer','admin')),
  created_at timestamptz not null default now()
);

create table if not exists public.proxy_products (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  proxy_type text not null,
  description text not null default '',
  location_label text not null default 'Multiple locations',
  protocols text[] not null default array['HTTP(S)'],
  duration_days integer not null check (duration_days > 0),
  price numeric(12,2) not null check (price >= 0),
  currency text not null default 'USD',
  is_active boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete restrict,
  status public.order_status not null default 'pending_payment',
  currency text not null default 'USD',
  total numeric(12,2) not null check (total >= 0),
  payment_provider text,
  provider_reference text unique,
  idempotency_key text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid references public.proxy_products(id) on delete set null,
  product_snapshot jsonb not null,
  quantity integer not null default 1 check (quantity > 0),
  unit_price numeric(12,2) not null check (unit_price >= 0),
  created_at timestamptz not null default now()
);

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete restrict,
  provider text not null,
  provider_transaction_id text unique,
  amount numeric(12,2) not null check (amount >= 0),
  currency text not null default 'USD',
  status text not null default 'pending' check (status in ('pending','succeeded','failed','cancelled','refunded')),
  verified_at timestamptz,
  provider_payload jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete restrict,
  order_item_id uuid not null references public.order_items(id) on delete restrict,
  provider_subscription_ref text,
  status text not null default 'pending' check (status in ('pending','active','expired','cancelled','failed')),
  starts_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.proxy_assignments (
  id uuid primary key default gen_random_uuid(),
  subscription_id uuid not null references public.subscriptions(id) on delete cascade,
  provider_ref text,
  host text,
  port integer check (port between 1 and 65535),
  protocol text,
  location_label text,
  credential_secret_ref text,
  status text not null default 'pending' check (status in ('pending','active','revoked','failed')),
  created_at timestamptz not null default now()
);

create table if not exists public.support_tickets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete restrict,
  subject text not null,
  message text not null,
  status text not null default 'open' check (status in ('open','in_progress','closed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists orders_user_created_idx on public.orders(user_id, created_at desc);
create index if not exists subscriptions_user_status_idx on public.subscriptions(user_id, status);
create index if not exists order_items_order_idx on public.order_items(order_id);

alter table public.profiles enable row level security;
alter table public.user_roles enable row level security;
alter table public.proxy_products enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.payments enable row level security;
alter table public.subscriptions enable row level security;
alter table public.proxy_assignments enable row level security;
alter table public.support_tickets enable row level security;

-- Customers can read/update their own profile, but not choose their own role.
create policy "profiles_select_own" on public.profiles for select to authenticated using (auth.uid() = id);
create policy "profiles_update_own" on public.profiles for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);
create policy "roles_select_own" on public.user_roles for select to authenticated using (auth.uid() = user_id);

-- Only products explicitly activated by an administrator are publicly readable.
create policy "active_products_read" on public.proxy_products for select to anon, authenticated using (is_active = true);

create policy "orders_read_own" on public.orders for select to authenticated using (auth.uid() = user_id);
create policy "items_read_own_order" on public.order_items for select to authenticated using (
  exists (select 1 from public.orders o where o.id = order_id and o.user_id = auth.uid())
);
create policy "payments_read_own_order" on public.payments for select to authenticated using (
  exists (select 1 from public.orders o where o.id = order_id and o.user_id = auth.uid())
);
create policy "subscriptions_read_own" on public.subscriptions for select to authenticated using (auth.uid() = user_id);
create policy "assignments_read_own_subscription" on public.proxy_assignments for select to authenticated using (
  exists (select 1 from public.subscriptions s where s.id = subscription_id and s.user_id = auth.uid())
);
create policy "tickets_read_own" on public.support_tickets for select to authenticated using (auth.uid() = user_id);
create policy "tickets_insert_own" on public.support_tickets for insert to authenticated with check (auth.uid() = user_id);

-- Important: do not permit customers to insert/update orders or payments directly.
-- Create orders and confirm payment via a trusted server-side API using the service role key,
-- which must never be exposed to browser code. Add administrator policies only after implementing
-- a trusted server-side role check and a controlled admin provisioning process.

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data ->> 'full_name')
  on conflict (id) do nothing;
  insert into public.user_roles (user_id, role)
  values (new.id, 'customer')
  on conflict (user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();
