-- Check AI Analysis for Latest Payment
-- This query checks if the latest payment has AI analysis data

-- Check the latest payment with AI analysis fields
SELECT 
    'LATEST PAYMENT WITH AI ANALYSIS' as check_type,
    id,
    user_id,
    plan,
    method,
    amount_cents,
    currency,
    transaction_reference,
    proof_url,
    status,
    created_at,
    -- Check if AI analysis columns exist and have data
    CASE 
        WHEN ai_analysis IS NOT NULL THEN 'HAS AI ANALYSIS'
        ELSE 'NO AI ANALYSIS'
    END as ai_analysis_status,
    ai_confidence,
    ai_status,
    fraud_score,
    auto_approved,
    needs_review,
    low_confidence,
    image_hash
FROM payments
ORDER BY created_at DESC
LIMIT 1;

-- Check if AI analysis columns exist in the payments table
SELECT 
    'COLUMN CHECK' as check_type,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'payments' 
AND column_name LIKE 'ai_%'
ORDER BY column_name;

-- Check all payments with their AI analysis status
SELECT 
    'ALL PAYMENTS AI STATUS' as check_type,
    id,
    user_id,
    plan,
    status,
    created_at,
    CASE 
        WHEN ai_analysis IS NOT NULL THEN 'HAS AI ANALYSIS'
        ELSE 'NO AI ANALYSIS'
    END as ai_analysis_status,
    ai_confidence,
    ai_status,
    fraud_score
FROM payments
ORDER BY created_at DESC
LIMIT 5;
