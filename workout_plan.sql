-- Run in Supabase SQL editor
-- Creates user_workout_profile, workout_plans, workout_logs with RLS

create table if not exists user_workout_profile (
  user_id          uuid primary key references auth.users(id) on delete cascade,
  age              int,
  sex              text,
  height_cm        numeric,
  current_weight   numeric,
  target_weight    numeric,
  goal             text, -- 'lose_weight' | 'build_muscle' | 'maintain' | 'performance'
  experience_level text, -- 'beginner' | 'intermediate' | 'advanced'
  equipment_access text, -- 'full_gym' | 'home_equipment' | 'bodyweight' | 'mixed'
  preferred_styles text[],
  days_per_week    int default 4,
  injuries_notes   text,
  updated_at       timestamptz default now()
);
alter table user_workout_profile enable row level security;
create policy "users own their workout profile"
  on user_workout_profile for all
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create table if not exists workout_plans (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  week_start_date date not null,
  plan_json       jsonb not null,
  source          text not null default 'ai_generated',
  created_at      timestamptz default now()
);
alter table workout_plans enable row level security;
create policy "users own their workout plans"
  on workout_plans for all
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create table if not exists workout_logs (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  plan_id      uuid references workout_plans(id) on delete cascade,
  day_key      text not null,
  completed    boolean default false,
  notes        text,
  completed_at timestamptz
);
alter table workout_logs enable row level security;
create policy "users own their workout logs"
  on workout_logs for all
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index if not exists workout_logs_user_plan on workout_logs(user_id, plan_id);
create index if not exists workout_plans_user_week on workout_plans(user_id, week_start_date);
