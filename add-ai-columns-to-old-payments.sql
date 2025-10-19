-- Add AI Analysis Columns to Old Payments Table
-- This script adds AI analysis columns to the existing 'payments' table

-- Add AI analysis columns to the payments table
ALTER TABLE payments 
ADD COLUMN IF NOT EXISTS ai_analysis JSONB,
ADD COLUMN IF NOT EXISTS ai_confidence DECIMAL(5,2),
ADD COLUMN IF NOT EXISTS ai_status VARCHAR(20) CHECK (ai_status IN ('valid', 'invalid', 'unclear')),
ADD COLUMN IF NOT EXISTS fraud_score DECIMAL(5,2),
ADD COLUMN IF NOT EXISTS auto_approved BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS needs_review BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS low_confidence BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS image_hash VARCHAR(64);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_payments_ai_status ON payments(ai_status);
CREATE INDEX IF NOT EXISTS idx_payments_fraud_score ON payments(fraud_score);
CREATE INDEX IF NOT EXISTS idx_payments_auto_approved ON payments(auto_approved);
CREATE INDEX IF NOT EXISTS idx_payments_needs_review ON payments(needs_review);
CREATE INDEX IF NOT EXISTS idx_payments_low_confidence ON payments(low_confidence);

-- Check if columns were added successfully
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'payments' 
AND column_name LIKE 'ai_%'
ORDER BY column_name;
