-- Fix plans table by adding missing columns if they don't exist
-- This handles the case where plans table exists but lacks the new columns

-- Add missing columns to plans table if they don't exist
do $$ begin
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

-- Insert or update plans with comprehensive limits
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
