-- Max IT TV Affiliation System - Initial Database Schema
-- Version: 1.0.0
-- Description: Complete database schema with tables, indexes, triggers, and functions

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "btree_gin";

-- Set timezone
SET timezone = 'UTC';

-- ============================================================================
-- ENUMS
-- ============================================================================

CREATE TYPE affiliate_status AS ENUM ('pending', 'active', 'suspended', 'banned');
CREATE TYPE affiliate_tier AS ENUM ('bronze', 'silver', 'gold', 'platinum', 'diamond');
CREATE TYPE subscription_status AS ENUM ('trial', 'active', 'cancelled', 'expired', 'suspended');
CREATE TYPE payment_status AS ENUM ('pending', 'processing', 'completed', 'failed', 'refunded');
CREATE TYPE payment_method AS ENUM ('orange_money', 'wave', 'mtn_momo', 'stripe', 'manual');
CREATE TYPE payout_status AS ENUM ('pending', 'processing', 'completed', 'failed', 'cancelled');
CREATE TYPE commission_type AS ENUM ('direct', 'level2', 'level3', 'bonus');
CREATE TYPE notification_type AS ENUM ('email', 'sms', 'push', 'system');
CREATE TYPE notification_status AS ENUM ('pending', 'sent', 'failed', 'delivered');

-- ============================================================================
-- TABLES
-- ============================================================================

-- Countries table
CREATE TABLE countries (
    id SERIAL PRIMARY KEY,
    code VARCHAR(2) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    currency_code VARCHAR(3) NOT NULL,
    currency_symbol VARCHAR(10) NOT NULL,
    phone_prefix VARCHAR(10) NOT NULL,
    is_supported BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Affiliates table
CREATE TABLE affiliates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    affiliate_code VARCHAR(50) UNIQUE NOT NULL,
    referral_code VARCHAR(50) UNIQUE,
    parent_affiliate_id UUID REFERENCES affiliates(id) ON DELETE SET NULL,
    country_id INTEGER REFERENCES countries(id) ON DELETE RESTRICT,
    status affiliate_status DEFAULT 'pending',
    tier affiliate_tier DEFAULT 'bronze',

    -- Address
    address TEXT,
    city VARCHAR(100),
    region VARCHAR(100),
    postal_code VARCHAR(20),

    -- Payment Information
    payment_method payment_method,
    payment_phone VARCHAR(50),
    payment_account_name VARCHAR(255),

    -- Statistics
    total_customers INTEGER DEFAULT 0,
    active_subscriptions INTEGER DEFAULT 0,
    total_earnings DECIMAL(15, 2) DEFAULT 0,
    available_balance DECIMAL(15, 2) DEFAULT 0,
    pending_balance DECIMAL(15, 2) DEFAULT 0,
    total_withdrawals DECIMAL(15, 2) DEFAULT 0,

    -- Verification
    email_verified BOOLEAN DEFAULT false,
    phone_verified BOOLEAN DEFAULT false,
    identity_verified BOOLEAN DEFAULT false,
    verification_token VARCHAR(255),
    verification_expires_at TIMESTAMP WITH TIME ZONE,

    -- Security
    password_reset_token VARCHAR(255),
    password_reset_expires_at TIMESTAMP WITH TIME ZONE,
    last_login_at TIMESTAMP WITH TIME ZONE,
    last_login_ip INET,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    suspended_at TIMESTAMP WITH TIME ZONE,
    banned_at TIMESTAMP WITH TIME ZONE,

    CONSTRAINT valid_email CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
    CONSTRAINT valid_phone CHECK (phone ~ '^\+[0-9]{10,15}$')
);

-- Customers table
CREATE TABLE customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    affiliate_id UUID NOT NULL REFERENCES affiliates(id) ON DELETE CASCADE,
    email VARCHAR(255),
    phone VARCHAR(50) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    country_id INTEGER REFERENCES countries(id) ON DELETE RESTRICT,

    -- External IDs
    maxittv_customer_id VARCHAR(100),

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT unique_customer_phone UNIQUE (affiliate_id, phone)
);

-- Offers/Plans table
CREATE TABLE offers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'XOF',

    -- Plan details
    duration_days INTEGER NOT NULL,
    features JSONB DEFAULT '[]',
    is_trial BOOLEAN DEFAULT false,
    trial_days INTEGER DEFAULT 0,

    -- Commissions
    commission_rate DECIMAL(5, 4) NOT NULL DEFAULT 0.10,
    level2_commission_rate DECIMAL(5, 4) DEFAULT 0.05,
    level3_commission_rate DECIMAL(5, 4) DEFAULT 0.03,

    -- Status
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT positive_price CHECK (price >= 0),
    CONSTRAINT positive_duration CHECK (duration_days > 0)
);

-- Subscriptions table
CREATE TABLE subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    affiliate_id UUID NOT NULL REFERENCES affiliates(id) ON DELETE CASCADE,
    offer_id INTEGER NOT NULL REFERENCES offers(id) ON DELETE RESTRICT,

    -- Subscription details
    status subscription_status DEFAULT 'trial',
    start_date TIMESTAMP WITH TIME ZONE NOT NULL,
    end_date TIMESTAMP WITH TIME ZONE NOT NULL,
    trial_end_date TIMESTAMP WITH TIME ZONE,
    auto_renew BOOLEAN DEFAULT true,

    -- Pricing
    amount DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'XOF',

    -- External IDs
    maxittv_subscription_id VARCHAR(100),

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    cancelled_at TIMESTAMP WITH TIME ZONE,
    expired_at TIMESTAMP WITH TIME ZONE,

    CONSTRAINT positive_amount CHECK (amount >= 0)
);

-- Payments table
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    subscription_id UUID NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    affiliate_id UUID NOT NULL REFERENCES affiliates(id) ON DELETE CASCADE,

    -- Payment details
    amount DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'XOF',
    payment_method payment_method NOT NULL,
    status payment_status DEFAULT 'pending',

    -- External references
    external_transaction_id VARCHAR(255),
    payment_phone VARCHAR(50),

    -- Metadata
    metadata JSONB DEFAULT '{}',
    error_message TEXT,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP WITH TIME ZONE,
    failed_at TIMESTAMP WITH TIME ZONE,

    CONSTRAINT positive_payment_amount CHECK (amount > 0)
);

-- Commissions table
CREATE TABLE commissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    affiliate_id UUID NOT NULL REFERENCES affiliates(id) ON DELETE CASCADE,
    subscription_id UUID NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
    payment_id UUID REFERENCES payments(id) ON DELETE SET NULL,

    -- Commission details
    type commission_type NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'XOF',
    rate DECIMAL(5, 4) NOT NULL,

    -- Source affiliate (for multi-level)
    source_affiliate_id UUID REFERENCES affiliates(id) ON DELETE CASCADE,
    level INTEGER DEFAULT 1,

    -- Status
    is_paid BOOLEAN DEFAULT false,
    paid_at TIMESTAMP WITH TIME ZONE,
    payout_id UUID,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT positive_commission_amount CHECK (amount >= 0),
    CONSTRAINT valid_level CHECK (level BETWEEN 1 AND 3)
);

-- Payouts table
CREATE TABLE payouts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    affiliate_id UUID NOT NULL REFERENCES affiliates(id) ON DELETE CASCADE,

    -- Payout details
    amount DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'XOF',
    payment_method payment_method NOT NULL,
    payment_phone VARCHAR(50) NOT NULL,
    payment_account_name VARCHAR(255),
    status payout_status DEFAULT 'pending',

    -- Processing
    processing_fee DECIMAL(10, 2) DEFAULT 0,
    net_amount DECIMAL(10, 2) NOT NULL,
    external_transaction_id VARCHAR(255),

    -- Metadata
    commission_ids UUID[] DEFAULT '{}',
    notes TEXT,
    error_message TEXT,

    -- Timestamps
    requested_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    processed_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    failed_at TIMESTAMP WITH TIME ZONE,
    cancelled_at TIMESTAMP WITH TIME ZONE,

    CONSTRAINT positive_payout_amount CHECK (amount > 0),
    CONSTRAINT positive_net_amount CHECK (net_amount > 0)
);

-- Notifications table
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    affiliate_id UUID REFERENCES affiliates(id) ON DELETE CASCADE,

    -- Notification details
    type notification_type NOT NULL,
    status notification_status DEFAULT 'pending',
    recipient VARCHAR(255) NOT NULL,
    subject VARCHAR(255),
    message TEXT NOT NULL,

    -- Delivery
    provider VARCHAR(50),
    external_id VARCHAR(255),
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    sent_at TIMESTAMP WITH TIME ZONE,
    delivered_at TIMESTAMP WITH TIME ZONE,
    failed_at TIMESTAMP WITH TIME ZONE
);

-- Activity logs table
CREATE TABLE activity_logs (
    id BIGSERIAL PRIMARY KEY,
    affiliate_id UUID REFERENCES affiliates(id) ON DELETE CASCADE,

    -- Activity details
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50),
    entity_id VARCHAR(255),
    description TEXT,

    -- Request details
    ip_address INET,
    user_agent TEXT,
    metadata JSONB DEFAULT '{}',

    -- Timestamp
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- API Keys table (for external integrations)
CREATE TABLE api_keys (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    affiliate_id UUID NOT NULL REFERENCES affiliates(id) ON DELETE CASCADE,

    -- Key details
    name VARCHAR(100) NOT NULL,
    key_hash VARCHAR(255) NOT NULL,
    key_prefix VARCHAR(20) NOT NULL,

    -- Permissions
    scopes TEXT[] DEFAULT '{}',

    -- Status
    is_active BOOLEAN DEFAULT true,
    last_used_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    revoked_at TIMESTAMP WITH TIME ZONE
);

-- System configuration table
CREATE TABLE system_config (
    key VARCHAR(100) PRIMARY KEY,
    value JSONB NOT NULL,
    description TEXT,
    is_public BOOLEAN DEFAULT false,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Affiliates indexes
CREATE INDEX idx_affiliates_email ON affiliates(email);
CREATE INDEX idx_affiliates_phone ON affiliates(phone);
CREATE INDEX idx_affiliates_code ON affiliates(affiliate_code);
CREATE INDEX idx_affiliates_referral ON affiliates(referral_code);
CREATE INDEX idx_affiliates_parent ON affiliates(parent_affiliate_id);
CREATE INDEX idx_affiliates_status ON affiliates(status);
CREATE INDEX idx_affiliates_created ON affiliates(created_at DESC);

-- Customers indexes
CREATE INDEX idx_customers_affiliate ON customers(affiliate_id);
CREATE INDEX idx_customers_phone ON customers(phone);
CREATE INDEX idx_customers_email ON customers(email);
CREATE INDEX idx_customers_created ON customers(created_at DESC);

-- Subscriptions indexes
CREATE INDEX idx_subscriptions_customer ON subscriptions(customer_id);
CREATE INDEX idx_subscriptions_affiliate ON subscriptions(affiliate_id);
CREATE INDEX idx_subscriptions_offer ON subscriptions(offer_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
CREATE INDEX idx_subscriptions_end_date ON subscriptions(end_date);
CREATE INDEX idx_subscriptions_created ON subscriptions(created_at DESC);

-- Payments indexes
CREATE INDEX idx_payments_subscription ON payments(subscription_id);
CREATE INDEX idx_payments_customer ON payments(customer_id);
CREATE INDEX idx_payments_affiliate ON payments(affiliate_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_method ON payments(payment_method);
CREATE INDEX idx_payments_external ON payments(external_transaction_id);
CREATE INDEX idx_payments_created ON payments(created_at DESC);

-- Commissions indexes
CREATE INDEX idx_commissions_affiliate ON commissions(affiliate_id);
CREATE INDEX idx_commissions_subscription ON commissions(subscription_id);
CREATE INDEX idx_commissions_payment ON commissions(payment_id);
CREATE INDEX idx_commissions_source ON commissions(source_affiliate_id);
CREATE INDEX idx_commissions_type ON commissions(type);
CREATE INDEX idx_commissions_paid ON commissions(is_paid);
CREATE INDEX idx_commissions_payout ON commissions(payout_id);
CREATE INDEX idx_commissions_created ON commissions(created_at DESC);

-- Payouts indexes
CREATE INDEX idx_payouts_affiliate ON payouts(affiliate_id);
CREATE INDEX idx_payouts_status ON payouts(status);
CREATE INDEX idx_payouts_requested ON payouts(requested_at DESC);

-- Notifications indexes
CREATE INDEX idx_notifications_affiliate ON notifications(affiliate_id);
CREATE INDEX idx_notifications_type ON notifications(type);
CREATE INDEX idx_notifications_status ON notifications(status);
CREATE INDEX idx_notifications_created ON notifications(created_at DESC);

-- Activity logs indexes
CREATE INDEX idx_activity_logs_affiliate ON activity_logs(affiliate_id);
CREATE INDEX idx_activity_logs_action ON activity_logs(action);
CREATE INDEX idx_activity_logs_entity ON activity_logs(entity_type, entity_id);
CREATE INDEX idx_activity_logs_created ON activity_logs(created_at DESC);

-- Full-text search indexes
CREATE INDEX idx_affiliates_name_trgm ON affiliates USING gin ((first_name || ' ' || last_name) gin_trgm_ops);
CREATE INDEX idx_customers_name_trgm ON customers USING gin ((first_name || ' ' || last_name) gin_trgm_ops);

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate affiliate tier based on performance
CREATE OR REPLACE FUNCTION calculate_affiliate_tier(
    p_total_earnings DECIMAL,
    p_active_subscriptions INTEGER
) RETURNS affiliate_tier AS $$
BEGIN
    IF p_total_earnings >= 10000000 OR p_active_subscriptions >= 500 THEN
        RETURN 'diamond';
    ELSIF p_total_earnings >= 5000000 OR p_active_subscriptions >= 200 THEN
        RETURN 'platinum';
    ELSIF p_total_earnings >= 2000000 OR p_active_subscriptions >= 100 THEN
        RETURN 'gold';
    ELSIF p_total_earnings >= 500000 OR p_active_subscriptions >= 50 THEN
        RETURN 'silver';
    ELSE
        RETURN 'bronze';
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to get affiliate network hierarchy
CREATE OR REPLACE FUNCTION get_affiliate_network(p_affiliate_id UUID, p_max_depth INTEGER DEFAULT 3)
RETURNS TABLE (
    affiliate_id UUID,
    level INTEGER,
    path UUID[]
) AS $$
BEGIN
    RETURN QUERY
    WITH RECURSIVE network AS (
        SELECT
            id,
            1 as level,
            ARRAY[id] as path
        FROM affiliates
        WHERE id = p_affiliate_id

        UNION ALL

        SELECT
            a.id,
            n.level + 1,
            n.path || a.id
        FROM affiliates a
        INNER JOIN network n ON a.parent_affiliate_id = n.affiliate_id
        WHERE n.level < p_max_depth
    )
    SELECT
        network.affiliate_id,
        network.level,
        network.path
    FROM network
    ORDER BY level, affiliate_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Updated_at triggers
CREATE TRIGGER update_affiliates_updated_at BEFORE UPDATE ON affiliates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON customers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON subscriptions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON payments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_offers_updated_at BEFORE UPDATE ON offers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_countries_updated_at BEFORE UPDATE ON countries
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Commission creation trigger
CREATE OR REPLACE FUNCTION create_commissions_for_payment()
RETURNS TRIGGER AS $$
DECLARE
    v_affiliate_id UUID;
    v_subscription_id UUID;
    v_offer RECORD;
    v_parent_affiliate_id UUID;
    v_grandparent_affiliate_id UUID;
BEGIN
    -- Only process completed payments
    IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
        -- Get subscription and offer details
        SELECT s.id, s.affiliate_id, s.offer_id
        INTO v_subscription_id, v_affiliate_id, NEW.subscription_id
        FROM subscriptions s
        WHERE s.id = NEW.subscription_id;

        SELECT * INTO v_offer FROM offers WHERE id = (SELECT offer_id FROM subscriptions WHERE id = v_subscription_id);

        -- Create direct commission (Level 1)
        INSERT INTO commissions (
            affiliate_id,
            subscription_id,
            payment_id,
            type,
            amount,
            currency,
            rate,
            source_affiliate_id,
            level
        ) VALUES (
            v_affiliate_id,
            v_subscription_id,
            NEW.id,
            'direct',
            NEW.amount * v_offer.commission_rate,
            NEW.currency,
            v_offer.commission_rate,
            v_affiliate_id,
            1
        );

        -- Update affiliate balance
        UPDATE affiliates
        SET
            available_balance = available_balance + (NEW.amount * v_offer.commission_rate),
            total_earnings = total_earnings + (NEW.amount * v_offer.commission_rate)
        WHERE id = v_affiliate_id;

        -- Get parent affiliate for Level 2 commission
        SELECT parent_affiliate_id INTO v_parent_affiliate_id
        FROM affiliates WHERE id = v_affiliate_id;

        IF v_parent_affiliate_id IS NOT NULL AND v_offer.level2_commission_rate > 0 THEN
            INSERT INTO commissions (
                affiliate_id,
                subscription_id,
                payment_id,
                type,
                amount,
                currency,
                rate,
                source_affiliate_id,
                level
            ) VALUES (
                v_parent_affiliate_id,
                v_subscription_id,
                NEW.id,
                'level2',
                NEW.amount * v_offer.level2_commission_rate,
                NEW.currency,
                v_offer.level2_commission_rate,
                v_affiliate_id,
                2
            );

            UPDATE affiliates
            SET
                available_balance = available_balance + (NEW.amount * v_offer.level2_commission_rate),
                total_earnings = total_earnings + (NEW.amount * v_offer.level2_commission_rate)
            WHERE id = v_parent_affiliate_id;

            -- Get grandparent affiliate for Level 3 commission
            SELECT parent_affiliate_id INTO v_grandparent_affiliate_id
            FROM affiliates WHERE id = v_parent_affiliate_id;

            IF v_grandparent_affiliate_id IS NOT NULL AND v_offer.level3_commission_rate > 0 THEN
                INSERT INTO commissions (
                    affiliate_id,
                    subscription_id,
                    payment_id,
                    type,
                    amount,
                    currency,
                    rate,
                    source_affiliate_id,
                    level
                ) VALUES (
                    v_grandparent_affiliate_id,
                    v_subscription_id,
                    NEW.id,
                    'level3',
                    NEW.amount * v_offer.level3_commission_rate,
                    NEW.currency,
                    v_offer.level3_commission_rate,
                    v_affiliate_id,
                    3
                );

                UPDATE affiliates
                SET
                    available_balance = available_balance + (NEW.amount * v_offer.level3_commission_rate),
                    total_earnings = total_earnings + (NEW.amount * v_offer.level3_commission_rate)
                WHERE id = v_grandparent_affiliate_id;
            END IF;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_create_commissions
AFTER UPDATE ON payments
FOR EACH ROW
EXECUTE FUNCTION create_commissions_for_payment();

-- ============================================================================
-- MATERIALIZED VIEWS
-- ============================================================================

-- Affiliate statistics view
CREATE MATERIALIZED VIEW affiliate_stats AS
SELECT
    a.id as affiliate_id,
    a.email,
    a.first_name,
    a.last_name,
    a.status,
    a.tier,
    COUNT(DISTINCT c.id) as total_customers,
    COUNT(DISTINCT CASE WHEN s.status = 'active' THEN s.id END) as active_subscriptions,
    COALESCE(SUM(CASE WHEN com.is_paid = false THEN com.amount ELSE 0 END), 0) as pending_commissions,
    COALESCE(SUM(CASE WHEN com.is_paid = true THEN com.amount ELSE 0 END), 0) as paid_commissions,
    COALESCE(SUM(com.amount), 0) as total_commissions,
    a.available_balance,
    a.created_at
FROM affiliates a
LEFT JOIN customers c ON c.affiliate_id = a.id
LEFT JOIN subscriptions s ON s.affiliate_id = a.id
LEFT JOIN commissions com ON com.affiliate_id = a.id
GROUP BY a.id;

CREATE UNIQUE INDEX idx_affiliate_stats_id ON affiliate_stats(affiliate_id);
CREATE INDEX idx_affiliate_stats_total_commissions ON affiliate_stats(total_commissions DESC);

-- Refresh function for materialized views
CREATE OR REPLACE FUNCTION refresh_affiliate_stats()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY affiliate_stats;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================

-- Grant permissions to application user (adjust username as needed)
-- GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO maxittv_user;
-- GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO maxittv_user;
-- GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO maxittv_user;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE affiliates IS 'Affiliate partners who promote Max IT TV services';
COMMENT ON TABLE customers IS 'Customers referred by affiliates';
COMMENT ON TABLE subscriptions IS 'Active and historical subscriptions';
COMMENT ON TABLE payments IS 'Payment transactions for subscriptions';
COMMENT ON TABLE commissions IS 'Commission earnings for affiliates';
COMMENT ON TABLE payouts IS 'Payout requests and transactions';
COMMENT ON TABLE notifications IS 'System notifications (email, SMS, push)';
COMMENT ON TABLE activity_logs IS 'Audit log of all system activities';
COMMENT ON MATERIALIZED VIEW affiliate_stats IS 'Aggregated statistics for each affiliate';

-- ============================================================================
-- END OF SCHEMA
-- ============================================================================
