-- CinePlus Panamá: órdenes de pago pendientes.
-- Ejecutar en Supabase SQL Editor antes de desplegar create-card-checkout.
create table if not exists public.payment_orders (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete restrict,
  provider text not null check (provider = 'paguelofacil'),
  amount numeric(10,2) not null check (amount > 0),
  currency text not null default 'USD' check (currency = 'USD'),
  status text not null default 'pending' check (status in ('pending','paid','failed','refunded','cancelled')),
  provider_code text,
  provider_operation text,
  created_at timestamptz not null default now(),
  paid_at timestamptz
);
alter table public.payment_orders enable row level security;
-- No se crean políticas para clientes. Solo la service_role del backend puede escribir/leer.
revoke all on public.payment_orders from anon, authenticated;
grant all on public.payment_orders to service_role;
