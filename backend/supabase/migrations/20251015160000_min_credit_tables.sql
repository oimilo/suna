-- Minimal billing tables to avoid 42P01 when backend is ahead of DB
-- Safe/idempotent creation

create extension if not exists pgcrypto;

create table if not exists public.credit_accounts (
  account_id uuid primary key,
  balance numeric(12,4) not null default 0,
  tier text default 'none',
  trial_status text default 'none',
  trial_ends_at timestamptz,
  stripe_subscription_id text,
  last_grant_date timestamptz,
  billing_cycle_anchor timestamptz,
  next_credit_grant timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.credit_ledger (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null,
  amount numeric(12,4) not null,
  balance_after numeric(12,4) not null default 0,
  type text not null default 'usage',
  description text,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

alter table if exists public.credit_accounts enable row level security;
alter table if exists public.credit_ledger enable row level security;

do $$ begin
  create policy if not exists "sr manage credit_accounts" on public.credit_accounts
    for all using (auth.role() = 'service_role');
exception when others then null; end $$;

do $$ begin
  create policy if not exists "sr manage credit_ledger" on public.credit_ledger
    for all using (auth.role() = 'service_role');
exception when others then null; end $$;


