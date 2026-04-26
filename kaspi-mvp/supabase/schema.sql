-- Enable Row Level Security backed by Supabase Auth

create table if not exists public.transactions (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null check (type in ('expense', 'transfer', 'income')),
  amount numeric not null,
  commission numeric not null default 0,
  available_balance numeric,
  note text not null default '',
  date date not null,
  account_id text not null,
  account_name text not null,
  category_id text not null,
  category_name text not null,
  subcategory text not null default '',
  source text not null default 'kaspi',
  raw_text text not null,
  created_at timestamptz not null default now()
);

create index if not exists transactions_user_created_idx
  on public.transactions (user_id, created_at desc);

alter table public.transactions enable row level security;

drop policy if exists "Users can read own transactions" on public.transactions;
create policy "Users can read own transactions"
  on public.transactions
  for select
  using (auth.uid() = user_id);

drop policy if exists "Users can write own transactions" on public.transactions;
create policy "Users can write own transactions"
  on public.transactions
  for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own transactions" on public.transactions;
create policy "Users can update own transactions"
  on public.transactions
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete own transactions" on public.transactions;
create policy "Users can delete own transactions"
  on public.transactions
  for delete
  using (auth.uid() = user_id);

create table if not exists public.user_catalogs (
  user_id uuid primary key references auth.users(id) on delete cascade,
  catalog jsonb not null default '{"accounts":[],"categories":[],"rules":[]}'::jsonb,
  updated_at timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists user_catalogs_set_updated_at on public.user_catalogs;
create trigger user_catalogs_set_updated_at
before update on public.user_catalogs
for each row
execute function public.set_updated_at();

alter table public.user_catalogs enable row level security;

drop policy if exists "Users can read own catalog" on public.user_catalogs;
create policy "Users can read own catalog"
  on public.user_catalogs
  for select
  using (auth.uid() = user_id);

drop policy if exists "Users can write own catalog" on public.user_catalogs;
create policy "Users can write own catalog"
  on public.user_catalogs
  for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own catalog" on public.user_catalogs;
create policy "Users can update own catalog"
  on public.user_catalogs
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete own catalog" on public.user_catalogs;
create policy "Users can delete own catalog"
  on public.user_catalogs
  for delete
  using (auth.uid() = user_id);
