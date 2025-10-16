-- Add payment method specific fields to payments table
-- This script adds columns for bank transfer and binance payment details

-- Add bank transfer specific fields
ALTER TABLE payments 
ADD COLUMN IF NOT EXISTS account_name TEXT,
ADD COLUMN IF NOT EXISTS account_number TEXT,
ADD COLUMN IF NOT EXISTS bank_name TEXT;

-- Add binance specific fields
ALTER TABLE payments 
ADD COLUMN IF NOT EXISTS binance_id TEXT;

-- Add comments for documentation
COMMENT ON COLUMN payments.account_name IS 'Account holder name for bank transfers';
COMMENT ON COLUMN payments.account_number IS 'Bank account number for bank transfers';
COMMENT ON COLUMN payments.bank_name IS 'Bank name for bank transfers';
COMMENT ON COLUMN payments.binance_id IS 'Binance ID for cryptocurrency payments';

-- Update the method column to include new payment methods
-- First, let's see what values currently exist
-- SELECT DISTINCT method FROM payments;

-- If needed, we can update existing records or add constraints
-- For now, the application will handle 'bank' and 'binance' as valid methods
