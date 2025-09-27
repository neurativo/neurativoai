-- Comprehensive usage limits for all quiz generation methods
-- This extends the existing user_usage system to track different source types

-- 1. Create plans table with comprehensive limits
create table if not exists public.plans (
  key text primary key,
  name text not null,
  monthly_quiz_generations integer not null default 20,
  daily_quiz_generations integer not null default 5,
  max_questions_per_quiz integer not null default 8,
  url_quiz_limit integer not null default 5,  -- URL-based quizzes per month
  text_quiz_limit integer not null default 10, -- Text-based quizzes per month  
  document_quiz_limit integer not null default 5, -- Document-based quizzes per month
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Insert default plans with comprehensive limits
insert into public.plans (key, name, monthly_quiz_generations, daily_quiz_generations, max_questions_per_quiz, url_quiz_limit, text_quiz_limit, document_quiz_limit) values
('free', 'Free', 20, 5, 8, 5, 10, 5),
('plus', 'Plus', 100, 20, 15, 50, 80, 30),
('premium', 'Premium', 300, 50, 25, 150, 250, 100),
('pro', 'Pro', 1000, 100, 50, 500, 800, 300)
on conflict (key) do update set
  name = excluded.name,
  monthly_quiz_generations = excluded.monthly_quiz_generations,
  daily_quiz_generations = excluded.daily_quiz_generations,
  max_questions_per_quiz = excluded.max_questions_per_quiz,
  url_quiz_limit = excluded.url_quiz_limit,
  text_quiz_limit = excluded.text_quiz_limit,
  document_quiz_limit = excluded.document_quiz_limit,
  updated_at = now();

-- 2. Create source-specific usage tracking table
create table if not exists public.user_source_usage (
  user_id uuid not null,
  month_start date not null,
  plan_id text not null,
  source_type text not null, -- 'url', 'text', 'document'
  used_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, month_start, source_type)
);

create index if not exists idx_user_source_usage_user on public.user_source_usage (user_id);
create index if not exists idx_user_source_usage_month on public.user_source_usage (month_start);
create index if not exists idx_user_source_usage_source on public.user_source_usage (source_type);

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end $$;

drop trigger if exists trg_user_source_usage_updated_at on public.user_source_usage;
create trigger trg_user_source_usage_updated_at before update on public.user_source_usage
for each row execute function public.set_updated_at();

alter table public.user_source_usage enable row level security;

-- RLS policies for user_source_usage
do $$ begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'user_source_usage' and policyname = 'user_source_usage_select_self'
  ) then
    create policy user_source_usage_select_self on public.user_source_usage
      for select using (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'user_source_usage' and policyname = 'user_source_usage_upsert_self'
  ) then
    create policy user_source_usage_upsert_self on public.user_source_usage
      for insert with check (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'user_source_usage' and policyname = 'user_source_usage_update_self'
  ) then
    create policy user_source_usage_update_self on public.user_source_usage
      for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
  end if;
end $$;

-- 3. Atomic claim RPC for source-specific usage
create or replace function public.user_source_usage_claim(
  p_user_id uuid,
  p_plan_id text,
  p_source_type text,
  p_source_limit integer
)
returns table(allowed boolean, source_used integer, source_limit integer, monthly_used integer, monthly_limit integer)
language plpgsql
security definer
as $$
declare
  v_month date := date_trunc('month', now())::date;
  v_source_used int;
  v_monthly_used int;
  v_monthly_limit int;
begin
  -- Ensure source usage row exists
  insert into public.user_source_usage (user_id, month_start, plan_id, source_type, used_count)
  values (p_user_id, v_month, coalesce(p_plan_id, 'unknown'), p_source_type, 0)
  on conflict (user_id, month_start, source_type) do nothing;

  -- Get current source usage
  select used_count into v_source_used
  from public.user_source_usage
  where user_id = p_user_id and month_start = v_month and source_type = p_source_type
  for update;

  -- Get monthly usage for overall limit
  select used_count into v_monthly_used
  from public.user_usage
  where user_id = p_user_id and month_start = v_month
  for update;

  -- Get monthly limit from plans
  select monthly_quiz_generations into v_monthly_limit
  from public.plans
  where key = p_plan_id;

  -- Check both source-specific and monthly limits
  if v_source_used < p_source_limit and v_monthly_used < coalesce(v_monthly_limit, 20) then
    -- Increment source usage
    update public.user_source_usage
    set used_count = used_count + 1, plan_id = coalesce(p_plan_id, plan_id)
    where user_id = p_user_id and month_start = v_month and source_type = p_source_type;
    
    -- Increment monthly usage
    update public.user_usage
    set used_count = used_count + 1, plan_id = coalesce(p_plan_id, plan_id)
    where user_id = p_user_id and month_start = v_month;
    
    return query
    select true as allowed, v_source_used + 1 as source_used, p_source_limit as source_limit, v_monthly_used + 1 as monthly_used, coalesce(v_monthly_limit, 20) as monthly_limit;
  else
    return query
    select false as allowed, v_source_used as source_used, p_source_limit as source_limit, v_monthly_used as monthly_used, coalesce(v_monthly_limit, 20) as monthly_limit;
  end if;
end $$;

revoke all on function public.user_source_usage_claim(uuid, text, text, integer) from public;
grant execute on function public.user_source_usage_claim(uuid, text, text, integer) to anon, authenticated, service_role;

-- 4. Daily usage tracking for source types
create table if not exists public.user_daily_source_usage (
  user_id uuid not null,
  day date not null,
  source_type text not null,
  used_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, day, source_type)
);

create index if not exists idx_user_daily_source_usage_user on public.user_daily_source_usage (user_id);
create index if not exists idx_user_daily_source_usage_day on public.user_daily_source_usage (day);

drop trigger if exists trg_user_daily_source_usage_updated_at on public.user_daily_source_usage;
create trigger trg_user_daily_source_usage_updated_at before update on public.user_daily_source_usage
for each row execute function public.set_updated_at();

alter table public.user_daily_source_usage enable row level security;

-- RLS policies for daily source usage
do $$ begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'user_daily_source_usage' and policyname = 'user_daily_source_usage_select_self'
  ) then
    create policy user_daily_source_usage_select_self on public.user_daily_source_usage
      for select using (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'user_daily_source_usage' and policyname = 'user_daily_source_usage_upsert_self'
  ) then
    create policy user_daily_source_usage_upsert_self on public.user_daily_source_usage
      for insert with check (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'user_daily_source_usage' and policyname = 'user_daily_source_usage_update_self'
  ) then
    create policy user_daily_source_usage_update_self on public.user_daily_source_usage
      for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
  end if;
end $$;

-- 5. Daily source usage claim RPC
create or replace function public.user_daily_source_usage_claim(
  p_user_id uuid,
  p_source_type text,
  p_daily_limit integer
)
returns table(allowed boolean, daily_used integer, daily_limit integer)
language plpgsql
security definer
as $$
declare
  v_today date := current_date;
  v_daily_used int;
begin
  -- Ensure daily source usage row exists
  insert into public.user_daily_source_usage (user_id, day, source_type, used_count)
  values (p_user_id, v_today, p_source_type, 0)
  on conflict (user_id, day, source_type) do nothing;

  -- Get current daily source usage
  select used_count into v_daily_used
  from public.user_daily_source_usage
  where user_id = p_user_id and day = v_today and source_type = p_source_type
  for update;

  -- Check daily source limit
  if v_daily_used < p_daily_limit then
    -- Increment daily source usage
    update public.user_daily_source_usage
    set used_count = used_count + 1
    where user_id = p_user_id and day = v_today and source_type = p_source_type;
    
    return query
    select true as allowed, v_daily_used + 1 as daily_used, p_daily_limit as daily_limit;
  else
    return query
    select false as allowed, v_daily_used as daily_used, p_daily_limit as daily_limit;
  end if;
end $$;

revoke all on function public.user_daily_source_usage_claim(uuid, text, integer) from public;
grant execute on function public.user_daily_source_usage_claim(uuid, text, integer) to anon, authenticated, service_role;
