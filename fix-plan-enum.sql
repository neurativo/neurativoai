-- Fix plan_t enum to include new plan types
-- Run this in your Supabase SQL Editor

-- 1. Add new plan values to the plan_t enum
ALTER TYPE plan_t ADD VALUE IF NOT EXISTS 'professional';
ALTER TYPE plan_t ADD VALUE IF NOT EXISTS 'mastery';
ALTER TYPE plan_t ADD VALUE IF NOT EXISTS 'innovation';

-- 2. Insert the new plans into the plans table
INSERT INTO public.plans (
    key,
    name,
    monthly_quiz_generations,
    daily_quiz_generations,
    max_questions_per_quiz,
    url_quiz_limit,
    text_quiz_limit,
    document_quiz_limit,
    ai_hints,
    ai_explanations,
    priority_generation,
    created_at,
    updated_at
) VALUES 
    ('professional'::plan_t, 'Professional', 50, 10, 15, 25, 40, 15, true, true, false, now(), now()),
    ('mastery'::plan_t, 'Mastery', 150, 30, 25, 75, 120, 50, true, true, true, now(), now()),
    ('innovation'::plan_t, 'Innovation', 500, 100, 50, 200, 300, 100, true, true, true, now(), now())
ON CONFLICT (key) DO UPDATE SET
    name = EXCLUDED.name,
    monthly_quiz_generations = EXCLUDED.monthly_quiz_generations,
    daily_quiz_generations = EXCLUDED.daily_quiz_generations,
    max_questions_per_quiz = EXCLUDED.max_questions_per_quiz,
    url_quiz_limit = EXCLUDED.url_quiz_limit,
    text_quiz_limit = EXCLUDED.text_quiz_limit,
    document_quiz_limit = EXCLUDED.document_quiz_limit,
    ai_hints = EXCLUDED.ai_hints,
    ai_explanations = EXCLUDED.ai_explanations,
    priority_generation = EXCLUDED.priority_generation,
    updated_at = now();

-- 3. Verify the plans were added
SELECT key, name, monthly_quiz_generations, daily_quiz_generations 
FROM public.plans 
WHERE key IN ('professional', 'mastery', 'innovation')
ORDER BY key;
