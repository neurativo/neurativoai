-- Add AI fraud detection columns to user_payments table
-- Run this in your Supabase SQL Editor

-- Add new columns for AI analysis and fraud detection
ALTER TABLE user_payments 
ADD COLUMN IF NOT EXISTS image_hash TEXT,
ADD COLUMN IF NOT EXISTS ai_analysis JSONB,
ADD COLUMN IF NOT EXISTS ai_confidence DECIMAL(3,2) DEFAULT 0.0,
ADD COLUMN IF NOT EXISTS ai_status TEXT DEFAULT 'unclear',
ADD COLUMN IF NOT EXISTS fraud_score DECIMAL(3,2) DEFAULT 0.0,
ADD COLUMN IF NOT EXISTS auto_approved BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS needs_review BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS low_confidence BOOLEAN DEFAULT FALSE;

-- Create index on image_hash for duplicate detection
CREATE INDEX IF NOT EXISTS idx_user_payments_image_hash ON user_payments(image_hash);

-- Create index on transaction_reference for duplicate detection
CREATE INDEX IF NOT EXISTS idx_user_payments_transaction_ref ON user_payments(transaction_reference);

-- Create index on fraud_score for filtering
CREATE INDEX IF NOT EXISTS idx_user_payments_fraud_score ON user_payments(fraud_score);

-- Create index on ai_status for filtering
CREATE INDEX IF NOT EXISTS idx_user_payments_ai_status ON user_payments(ai_status);

-- Add constraints
ALTER TABLE user_payments 
ADD CONSTRAINT chk_ai_confidence CHECK (ai_confidence >= 0.0 AND ai_confidence <= 1.0),
ADD CONSTRAINT chk_fraud_score CHECK (fraud_score >= 0.0 AND fraud_score <= 1.0),
ADD CONSTRAINT chk_ai_status CHECK (ai_status IN ('valid', 'invalid', 'unclear'));

-- Add comments for documentation
COMMENT ON COLUMN user_payments.image_hash IS 'SHA256 hash of uploaded receipt image for duplicate detection';
COMMENT ON COLUMN user_payments.ai_analysis IS 'Complete AI analysis results including fraud indicators';
COMMENT ON COLUMN user_payments.ai_confidence IS 'AI confidence score (0.0 to 1.0)';
COMMENT ON COLUMN user_payments.ai_status IS 'AI validation status: valid, invalid, or unclear';
COMMENT ON COLUMN user_payments.fraud_score IS 'Calculated fraud risk score (0.0 to 1.0)';
COMMENT ON COLUMN user_payments.auto_approved IS 'Whether payment was auto-approved by AI';
COMMENT ON COLUMN user_payments.needs_review IS 'Whether payment needs admin review';
COMMENT ON COLUMN user_payments.low_confidence IS 'Whether AI has low confidence in analysis';
