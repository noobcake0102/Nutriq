-- Run in Supabase SQL editor
-- Creates food_logs and daily_targets tables with RLS mirroring saved_meals

create table if not exists daily_targets (
  user_id    uuid primary key references auth.users on delete cascade,
  calories   int not null default 2000,
  protein_g  int not null default 150,
  carbs_g    int not null default 200,
  fat_g      int not null default 65,
  updated_at timestamptz not null default now()
);
alter table daily_targets enable row level security;
create policy "users own their daily_targets"
  on daily_targets for all
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create table if not exists food_logs (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users on delete cascade,
  logged_at   timestamptz not null default now(),
  log_date    date not null,
  meal        text not null check (meal in ('breakfast','lunch','dinner','snack')),
  source      text not null default 'manual',
  barcode     text,
  name        text not null,
  serving_qty numeric not null default 1,
  serving_unit text not null default 'serving',
  calories    numeric not null default 0,
  protein_g   numeric not null default 0,
  carbs_g     numeric not null default 0,
  fat_g       numeric not null default 0
);
alter table food_logs enable row level security;
create policy "users own their food_logs"
  on food_logs for all
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index if not exists food_logs_user_date on food_logs (user_id, log_date);
