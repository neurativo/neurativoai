-- New user_usage model and atomic claim RPC

-- 1) Plans assumed to exist with id and monthly_limit
--    For reference, we will join plans(key->id) in app layer and pass limit into RPC.

-- 2) user_usage table (one row per user per month)
create table if not exists public.user_usage (
  user_id uuid not null,
  month_start date not null,
  plan_id text not null,
  used_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, month_start)
);

create index if not exists idx_user_usage_user on public.user_usage (user_id);
create index if not exists idx_user_usage_month on public.user_usage (month_start);

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end $$;

drop trigger if exists trg_user_usage_updated_at on public.user_usage;
create trigger trg_user_usage_updated_at before update on public.user_usage
for each row execute function public.set_updated_at();

alter table public.user_usage enable row level security;

do $$ begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'user_usage' and policyname = 'user_usage_select_self'
  ) then
    create policy user_usage_select_self on public.user_usage
      for select using (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'user_usage' and policyname = 'user_usage_upsert_self'
  ) then
    create policy user_usage_upsert_self on public.user_usage
      for insert with check (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'user_usage' and policyname = 'user_usage_update_self'
  ) then
    create policy user_usage_update_self on public.user_usage
      for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
  end if;
end $$;

-- 3) Atomic claim RPC: increments used_count if under limit
--    p_plan_limit is passed from app after reading plans table.
create or replace function public.user_usage_claim(
  p_user_id uuid,
  p_plan_id text,
  p_plan_limit integer
)
returns table(allowed boolean, monthly_used integer, monthly_limit integer, month_start date)
language plpgsql
security definer
as $$
declare
  v_month date := date_trunc('month', now())::date;
  v_used int;
begin
  insert into public.user_usage (user_id, month_start, plan_id, used_count)
  values (p_user_id, v_month, coalesce(p_plan_id, 'unknown'), 0)
  on conflict (user_id, month_start) do nothing;

  select used_count into v_used
  from public.user_usage
  where user_id = p_user_id and month_start = v_month
  for update;

  if v_used < p_plan_limit then
    update public.user_usage
    set used_count = used_count + 1, plan_id = coalesce(p_plan_id, plan_id)
    where user_id = p_user_id and month_start = v_month;
    return query
    select true as allowed, v_used + 1 as monthly_used, p_plan_limit as monthly_limit, v_month as month_start;
  else
    return query
    select false as allowed, v_used as monthly_used, p_plan_limit as monthly_limit, v_month as month_start;
  end if;
end $$;

revoke all on function public.user_usage_claim(uuid, text, integer) from public;
grant execute on function public.user_usage_claim(uuid, text, integer) to anon, authenticated, service_role;


