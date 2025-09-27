-- Add 'special' plan to plan_t enum type
-- This migration adds the 'special' plan type to support Live Lecture Assistant features

-- First, add 'special' to the plan_t enum type
ALTER TYPE plan_t ADD VALUE IF NOT EXISTS 'special';

-- Insert the special plan into the plans table
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
    priority_generation,
    created_at,
    updated_at
) VALUES (
    'special'::plan_t,
    'Special',
    500,
    50,
    25,
    200,
    300,
    100,
    true,
    true,
    now(),
    now()
) ON CONFLICT (key) DO UPDATE SET
    name = EXCLUDED.name,
    monthly_quiz_generations = EXCLUDED.monthly_quiz_generations,
    daily_quiz_generations = EXCLUDED.daily_quiz_generations,
    max_questions_per_quiz = EXCLUDED.max_questions_per_quiz,
    url_quiz_limit = EXCLUDED.url_quiz_limit,
    text_quiz_limit = EXCLUDED.text_quiz_limit,
    document_quiz_limit = EXCLUDED.document_quiz_limit,
    ai_hints = EXCLUDED.ai_hints,
    priority_generation = EXCLUDED.priority_generation,
    updated_at = now();

-- Verify the plan was added
SELECT key, name, monthly_quiz_generations, daily_quiz_generations 
FROM public.plans 
WHERE key = 'special';
