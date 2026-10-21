-- Solicitudes de pago manual de CinePlus Panamá.
-- Ejecutar en Supabase SQL Editor antes de desplegar create-manual-payment-request.
create table if not exists public.manual_payment_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete restrict,
  provider text not null check (provider in ('yappy','transfer','paypal')),
  amount numeric(10,2) not null default 3.00 check (amount = 3.00),
  currency text not null default 'USD' check (currency = 'USD'),
  payment_reference text not null check (char_length(payment_reference) between 3 and 120),
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  created_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by uuid references auth.users(id)
);
create index if not exists manual_payment_requests_pending_created_idx
  on public.manual_payment_requests (status, created_at desc);
alter table public.manual_payment_requests enable row level security;
revoke all on public.manual_payment_requests from anon, authenticated;
grant all on public.manual_payment_requests to service_role;
