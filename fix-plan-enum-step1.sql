-- STEP 1: Add new plan values to the plan_t enum
-- Run this FIRST in your Supabase SQL Editor and wait for it to complete

ALTER TYPE plan_t ADD VALUE IF NOT EXISTS 'professional';
ALTER TYPE plan_t ADD VALUE IF NOT EXISTS 'mastery';
ALTER TYPE plan_t ADD VALUE IF NOT EXISTS 'innovation';
