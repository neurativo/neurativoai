-- Complete migration for comprehensive source-specific usage limits
-- This handles all missing columns and creates the complete system

-- 1. Fix plans table by adding all missing columns
do $$ begin
  -- Add updated_at column if it doesn't exist
  if not exists (select 1 from information_schema.columns where table_name = 'plans' and column_name = 'updated_at') then
    alter table public.plans add column updated_at timestamptz not null default now();
  end if;
  
  -- Add created_at column if it doesn't exist
  if not exists (select 1 from information_schema.columns where table_name = 'plans' and column_name = 'created_at') then
    alter table public.plans add column created_at timestamptz not null default now();
  end if;
  
  -- Add url_quiz_limit column if it doesn't exist
  if not exists (select 1 from information_schema.columns where table_name = 'plans' and column_name = 'url_quiz_limit') then
    alter table public.plans add column url_quiz_limit integer not null default 5;
  end if;
  
  -- Add text_quiz_limit column if it doesn't exist
  if not exists (select 1 from information_schema.columns where table_name = 'plans' and column_name = 'text_quiz_limit') then
    alter table public.plans add column text_quiz_limit integer not null default 10;
  end if;
  
  -- Add document_quiz_limit column if it doesn't exist
  if not exists (select 1 from information_schema.columns where table_name = 'plans' and column_name = 'document_quiz_limit') then
    alter table public.plans add column document_quiz_limit integer not null default 5;
  end if;
  
  -- Add daily_quiz_generations column if it doesn't exist
  if not exists (select 1 from information_schema.columns where table_name = 'plans' and column_name = 'daily_quiz_generations') then
    alter table public.plans add column daily_quiz_generations integer not null default 5;
  end if;
end $$;

-- 2. Update existing plans with new column values instead of inserting
-- First, let's see what columns exist and update them safely
update public.plans set 
  url_quiz_limit = case 
    when key = 'free' then 5
    when key = 'plus' then 50
    when key = 'premium' then 150
    when key = 'pro' then 500
    else url_quiz_limit
  end,
  text_quiz_limit = case 
    when key = 'free' then 10
    when key = 'plus' then 80
    when key = 'premium' then 250
    when key = 'pro' then 800
    else text_quiz_limit
  end,
  document_quiz_limit = case 
    when key = 'free' then 5
    when key = 'plus' then 30
    when key = 'premium' then 100
    when key = 'pro' then 300
    else document_quiz_limit
  end,
  daily_quiz_generations = case 
    when key = 'free' then 5
    when key = 'plus' then 20
    when key = 'premium' then 50
    when key = 'pro' then 100
    else daily_quiz_generations
  end,
  updated_at = now()
where key in ('free', 'plus', 'premium', 'pro');

-- 3. Insert new plans only if they don't exist, with all required columns
insert into public.plans (key, name, monthly_quiz_generations, max_questions_per_quiz, ai_hints, priority_generation, url_quiz_limit, text_quiz_limit, document_quiz_limit, daily_quiz_generations) 
select 'free', 'Free', 20, 8, false, false, 5, 10, 5, 5
where not exists (select 1 from public.plans where key = 'free')
union all
select 'plus', 'Plus', 100, 15, true, true, 50, 80, 30, 20
where not exists (select 1 from public.plans where key = 'plus')
union all
select 'premium', 'Premium', 300, 25, true, true, 150, 250, 100, 50
where not exists (select 1 from public.plans where key = 'premium')
union all
select 'pro', 'Pro', 1000, 50, true, true, 500, 800, 300, 100
where not exists (select 1 from public.plans where key = 'pro');

-- 3. Create source-specific usage tracking table
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

-- 4. Create updated_at trigger function if it doesn't exist
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end $$;

-- 5. Create trigger for user_source_usage
drop trigger if exists trg_user_source_usage_updated_at on public.user_source_usage;
create trigger trg_user_source_usage_updated_at before update on public.user_source_usage
for each row execute function public.set_updated_at();

-- 6. Enable RLS for user_source_usage
alter table public.user_source_usage enable row level security;

-- 7. Create RLS policies for user_source_usage
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

-- 8. Create atomic claim RPC for source-specific usage
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

-- 9. Grant permissions for user_source_usage_claim
revoke all on function public.user_source_usage_claim(uuid, text, text, integer) from public;
grant execute on function public.user_source_usage_claim(uuid, text, text, integer) to anon, authenticated, service_role;

-- 10. Create daily source usage tracking table
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

-- 11. Create trigger for daily source usage
drop trigger if exists trg_user_daily_source_usage_updated_at on public.user_daily_source_usage;
create trigger trg_user_daily_source_usage_updated_at before update on public.user_daily_source_usage
for each row execute function public.set_updated_at();

-- 12. Enable RLS for daily source usage
alter table public.user_daily_source_usage enable row level security;

-- 13. Create RLS policies for daily source usage
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

-- 14. Create daily source usage claim RPC
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

-- 15. Grant permissions for daily source usage claim
revoke all on function public.user_daily_source_usage_claim(uuid, text, integer) from public;
grant execute on function public.user_daily_source_usage_claim(uuid, text, integer) to anon, authenticated, service_role;
