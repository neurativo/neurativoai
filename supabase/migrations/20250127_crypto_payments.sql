-- Crypto Payment Verification System
-- Migration: 20250127_crypto_payments.sql

-- Create crypto_payment_methods table
CREATE TABLE IF NOT EXISTS public.crypto_payment_methods (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    symbol VARCHAR(10) NOT NULL,
    network VARCHAR(50) NOT NULL,
    contract_address VARCHAR(100),
    deposit_address VARCHAR(100) NOT NULL,
    min_amount DECIMAL(20, 8) NOT NULL DEFAULT 0.001,
    max_amount DECIMAL(20, 8),
    confirmation_blocks INTEGER NOT NULL DEFAULT 3,
    explorer_api_url VARCHAR(255) NOT NULL,
    explorer_api_key VARCHAR(255),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create crypto_payments table
CREATE TABLE IF NOT EXISTS public.crypto_payments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    payment_method_id UUID NOT NULL REFERENCES public.crypto_payment_methods(id),
    tx_id VARCHAR(255) NOT NULL,
    from_address VARCHAR(100),
    to_address VARCHAR(100) NOT NULL,
    amount DECIMAL(20, 8) NOT NULL,
    amount_usd DECIMAL(10, 2),
    plan_id UUID REFERENCES public.plans(id),
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'verifying', 'confirmed', 'failed', 'rejected', 'expired')),
    confirmation_count INTEGER DEFAULT 0,
    required_confirmations INTEGER NOT NULL,
    block_height BIGINT,
    block_hash VARCHAR(255),
    gas_fee DECIMAL(20, 8),
    verification_attempts INTEGER DEFAULT 0,
    last_verification_at TIMESTAMP WITH TIME ZONE,
    verified_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '24 hours'),
    admin_notes TEXT,
    admin_override BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create crypto_payment_verifications table for audit trail
CREATE TABLE IF NOT EXISTS public.crypto_payment_verifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    payment_id UUID NOT NULL REFERENCES public.crypto_payments(id) ON DELETE CASCADE,
    verification_type VARCHAR(20) NOT NULL CHECK (verification_type IN ('automatic', 'manual', 'admin_override')),
    status VARCHAR(20) NOT NULL CHECK (status IN ('success', 'failed', 'pending')),
    explorer_response JSONB,
    error_message TEXT,
    verified_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create admin_settings table for payment configuration
CREATE TABLE IF NOT EXISTS public.admin_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value JSONB NOT NULL,
    description TEXT,
    updated_by UUID REFERENCES auth.users(id),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default crypto payment methods
INSERT INTO public.crypto_payment_methods (name, symbol, network, deposit_address, min_amount, confirmation_blocks, explorer_api_url, is_active) VALUES
('Bitcoin', 'BTC', 'bitcoin', 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh', 0.0001, 3, 'https://blockstream.info/api', true),
('Ethereum', 'ETH', 'ethereum', '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6', 0.001, 12, 'https://api.etherscan.io/api', true),
('USDT (Ethereum)', 'USDT', 'ethereum', '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6', 10, 12, 'https://api.etherscan.io/api', true),
('USDC (Ethereum)', 'USDC', 'ethereum', '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6', 10, 12, 'https://api.etherscan.io/api', true)
ON CONFLICT DO NOTHING;

-- Insert default admin settings
INSERT INTO public.admin_settings (setting_key, setting_value, description) VALUES
('payment_verification_enabled', 'true', 'Enable automatic payment verification'),
('payment_timeout_hours', '24', 'Payment timeout in hours'),
('max_verification_attempts', '5', 'Maximum verification attempts per payment'),
('auto_approve_threshold_usd', '100', 'Auto-approve payments under this USD amount'),
('notification_webhook_url', '', 'Webhook URL for payment notifications')
ON CONFLICT (setting_key) DO NOTHING;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_crypto_payments_user_id ON public.crypto_payments(user_id);
CREATE INDEX IF NOT EXISTS idx_crypto_payments_status ON public.crypto_payments(status);
CREATE INDEX IF NOT EXISTS idx_crypto_payments_tx_id ON public.crypto_payments(tx_id);
CREATE INDEX IF NOT EXISTS idx_crypto_payments_created_at ON public.crypto_payments(created_at);
CREATE INDEX IF NOT EXISTS idx_crypto_payments_expires_at ON public.crypto_payments(expires_at);
CREATE INDEX IF NOT EXISTS idx_crypto_payment_verifications_payment_id ON public.crypto_payment_verifications(payment_id);

-- Create RLS policies
ALTER TABLE public.crypto_payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crypto_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crypto_payment_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_settings ENABLE ROW LEVEL SECURITY;

-- Users can view active payment methods
CREATE POLICY "Users can view active payment methods" ON public.crypto_payment_methods
    FOR SELECT USING (is_active = true);

-- Users can view their own payments
CREATE POLICY "Users can view own payments" ON public.crypto_payments
    FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own payments
CREATE POLICY "Users can insert own payments" ON public.crypto_payments
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own pending payments
CREATE POLICY "Users can update own pending payments" ON public.crypto_payments
    FOR UPDATE USING (auth.uid() = user_id AND status IN ('pending', 'verifying'));

-- Admins can view all payments
CREATE POLICY "Admins can view all payments" ON public.crypto_payments
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.subscriptions s
            WHERE s.user_id = auth.uid() 
            AND s.plan IN ('pro', 'special')
            AND s.status = 'active'
        )
    );

-- Admins can manage payment methods
CREATE POLICY "Admins can manage payment methods" ON public.crypto_payment_methods
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.subscriptions s
            WHERE s.user_id = auth.uid() 
            AND s.plan IN ('pro', 'special')
            AND s.status = 'active'
        )
    );

-- Admins can manage admin settings
CREATE POLICY "Admins can manage settings" ON public.admin_settings
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.subscriptions s
            WHERE s.user_id = auth.uid() 
            AND s.plan IN ('pro', 'special')
            AND s.status = 'active'
        )
    );

-- Create functions for payment verification
CREATE OR REPLACE FUNCTION public.verify_crypto_payment(payment_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    payment_record RECORD;
    verification_result JSONB;
BEGIN
    -- Get payment details
    SELECT * INTO payment_record
    FROM public.crypto_payments
    WHERE id = payment_id AND status IN ('pending', 'verifying');
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Payment not found or not verifiable');
    END IF;
    
    -- Update verification attempts
    UPDATE public.crypto_payments
    SET verification_attempts = verification_attempts + 1,
        last_verification_at = NOW(),
        status = 'verifying'
    WHERE id = payment_id;
    
    -- Return payment details for external verification
    RETURN jsonb_build_object(
        'success', true,
        'payment', row_to_json(payment_record)
    );
END;
$$;

-- Create function to update payment status
CREATE OR REPLACE FUNCTION public.update_payment_status(
    payment_id UUID,
    new_status VARCHAR(20),
    confirmation_count INTEGER DEFAULT NULL,
    block_height BIGINT DEFAULT NULL,
    block_hash VARCHAR(255) DEFAULT NULL,
    admin_notes TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result JSONB;
BEGIN
    UPDATE public.crypto_payments
    SET status = new_status,
        confirmation_count = COALESCE(confirmation_count, crypto_payments.confirmation_count),
        block_height = COALESCE(block_height, crypto_payments.block_height),
        block_hash = COALESCE(block_hash, crypto_payments.block_hash),
        admin_notes = COALESCE(admin_notes, crypto_payments.admin_notes),
        verified_at = CASE WHEN new_status = 'confirmed' THEN NOW() ELSE verified_at END,
        updated_at = NOW()
    WHERE id = payment_id;
    
    -- Insert verification record
    INSERT INTO public.crypto_payment_verifications (
        payment_id, verification_type, status, verified_by
    ) VALUES (
        payment_id, 'manual', new_status, auth.uid()
    );
    
    RETURN jsonb_build_object('success', true, 'status', new_status);
END;
$$;

-- Create function to get payment statistics
CREATE OR REPLACE FUNCTION public.get_payment_stats()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    stats JSONB;
BEGIN
    SELECT jsonb_build_object(
        'total_payments', COUNT(*),
        'pending_payments', COUNT(*) FILTER (WHERE status = 'pending'),
        'confirmed_payments', COUNT(*) FILTER (WHERE status = 'confirmed'),
        'failed_payments', COUNT(*) FILTER (WHERE status = 'failed'),
        'total_amount_usd', COALESCE(SUM(amount_usd), 0),
        'today_payments', COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE),
        'today_amount_usd', COALESCE(SUM(amount_usd) FILTER (WHERE created_at >= CURRENT_DATE), 0)
    ) INTO stats
    FROM public.crypto_payments;
    
    RETURN stats;
END;
$$;
