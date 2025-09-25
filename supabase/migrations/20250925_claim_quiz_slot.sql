-- Monthly quiz usage schema and claim_quiz_slot RPC

-- 1) Table
create table if not exists public.monthly_quiz_usage (
  user_id uuid not null,
  period_start date not null,
  used_count integer not null default 0,
  plan_limit integer not null default 20,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, period_start)
);

create index if not exists idx_mqu_user_month on public.monthly_quiz_usage (user_id, period_start);
create index if not exists idx_mqu_user on public.monthly_quiz_usage (user_id);

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end $$;

drop trigger if exists trg_mqu_updated_at on public.monthly_quiz_usage;
create trigger trg_mqu_updated_at before update on public.monthly_quiz_usage
for each row execute function public.set_updated_at();

-- 2) RLS
alter table public.monthly_quiz_usage enable row level security;

do $$ begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'monthly_quiz_usage' and policyname = 'mqu_select_self'
  ) then
    create policy mqu_select_self on public.monthly_quiz_usage
      for select using (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'monthly_quiz_usage' and policyname = 'mqu_insert_self'
  ) then
    create policy mqu_insert_self on public.monthly_quiz_usage
      for insert with check (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'monthly_quiz_usage' and policyname = 'mqu_update_self'
  ) then
    create policy mqu_update_self on public.monthly_quiz_usage
      for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
  end if;
end $$;

-- 3) RPC: claim_quiz_slot
create or replace function public.claim_quiz_slot(p_user_id uuid, p_limit int)
returns table(allowed boolean, used_count int, plan_limit int, period_start date)
language plpgsql
security definer
as $$
declare
  v_period date := date_trunc('month', now())::date;
  v_used int;
  v_limit int;
begin
  insert into public.monthly_quiz_usage (user_id, period_start, used_count, plan_limit)
  values (p_user_id, v_period, 0, p_limit)
  on conflict (user_id, period_start)
  do update set plan_limit = greatest(public.monthly_quiz_usage.plan_limit, excluded.plan_limit)
  where public.monthly_quiz_usage.plan_limit <> greatest(public.monthly_quiz_usage.plan_limit, excluded.plan_limit);

  select used_count, plan_limit into v_used, v_limit
  from public.monthly_quiz_usage
  where user_id = p_user_id and period_start = v_period
  for update;

  if v_used < v_limit then
    update public.monthly_quiz_usage
    set used_count = used_count + 1
    where user_id = p_user_id and period_start = v_period;

    return query
    select true as allowed, v_used + 1 as used_count, v_limit as plan_limit, v_period as period_start;
  else
    return query
    select false as allowed, v_used as used_count, v_limit as plan_limit, v_period as period_start;
  end if;
end $$;

revoke all on function public.claim_quiz_slot(uuid, int) from public;
grant execute on function public.claim_quiz_slot(uuid, int) to anon, authenticated, service_role;

-- 4) Optional view for dashboard
create or replace view public.current_month_quiz_usage as
select user_id, period_start, used_count, plan_limit
from public.monthly_quiz_usage
where period_start = date_trunc('month', now())::date
with local check option;


