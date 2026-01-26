-- Max IT TV Affiliation System - Initial Data Seeds
-- Version: 1.0.0
-- Description: Seed data for countries, offers, and initial configuration

-- ============================================================================
-- SUPPORTED COUNTRIES
-- ============================================================================

INSERT INTO countries (code, name, currency_code, currency_symbol, phone_prefix, is_supported) VALUES
('SN', 'Sénégal', 'XOF', 'CFA', '+221', true),
('CI', 'Côte d''Ivoire', 'XOF', 'CFA', '+225', true),
('BF', 'Burkina Faso', 'XOF', 'CFA', '+226', true),
('ML', 'Mali', 'XOF', 'CFA', '+223', true),
('TG', 'Togo', 'XOF', 'CFA', '+228', true),
('BJ', 'Bénin', 'XOF', 'CFA', '+229', true),
('NE', 'Niger', 'XOF', 'CFA', '+227', true),
('GW', 'Guinée-Bissau', 'XOF', 'CFA', '+245', true),
('GN', 'Guinée', 'GNF', 'FG', '+224', true),
('CM', 'Cameroun', 'XAF', 'FCFA', '+237', true),
('GA', 'Gabon', 'XAF', 'FCFA', '+241', true),
('CG', 'Congo', 'XAF', 'FCFA', '+242', true),
('CD', 'RD Congo', 'CDF', 'FC', '+243', true),
('MA', 'Maroc', 'MAD', 'DH', '+212', true),
('DZ', 'Algérie', 'DZD', 'DA', '+213', true),
('TN', 'Tunisie', 'TND', 'DT', '+216', true),
('FR', 'France', 'EUR', '€', '+33', true),
('BE', 'Belgique', 'EUR', '€', '+32', true),
('CH', 'Suisse', 'CHF', 'CHF', '+41', true),
('CA', 'Canada', 'CAD', '$', '+1', true),
('US', 'États-Unis', 'USD', '$', '+1', true)
ON CONFLICT (code) DO NOTHING;

-- ============================================================================
-- SUBSCRIPTION OFFERS/PLANS
-- ============================================================================

INSERT INTO offers (
    name,
    slug,
    description,
    price,
    currency,
    duration_days,
    features,
    is_trial,
    trial_days,
    commission_rate,
    level2_commission_rate,
    level3_commission_rate,
    is_active,
    sort_order
) VALUES
(
    'Essai Gratuit',
    'free-trial',
    'Essayez Max IT TV gratuitement pendant 7 jours',
    0,
    'XOF',
    7,
    '["Accès à tous les contenus", "Qualité HD", "1 appareil simultané", "Support client"]'::jsonb,
    true,
    7,
    0.00,
    0.00,
    0.00,
    true,
    1
),
(
    'Starter Mensuel',
    'starter-monthly',
    'Formule idéale pour commencer avec Max IT TV',
    2500,
    'XOF',
    30,
    '["Accès à tous les contenus", "Qualité HD", "2 appareils simultanés", "Support client", "Téléchargement hors ligne"]'::jsonb,
    false,
    0,
    0.10,
    0.05,
    0.03,
    true,
    2
),
(
    'Premium Mensuel',
    'premium-monthly',
    'La formule la plus populaire avec tous les avantages',
    5000,
    'XOF',
    30,
    '["Accès à tous les contenus", "Qualité Full HD & 4K", "4 appareils simultanés", "Support prioritaire", "Téléchargement hors ligne", "Contenu exclusif"]'::jsonb,
    false,
    7,
    0.12,
    0.06,
    0.04,
    true,
    3
),
(
    'Famille Mensuel',
    'family-monthly',
    'Parfait pour toute la famille',
    7500,
    'XOF',
    30,
    '["Accès à tous les contenus", "Qualité Full HD & 4K", "6 appareils simultanés", "Profils multiples", "Contrôle parental", "Support prioritaire", "Téléchargement hors ligne", "Contenu exclusif"]'::jsonb,
    false,
    7,
    0.15,
    0.07,
    0.05,
    true,
    4
),
(
    'Starter Trimestriel',
    'starter-quarterly',
    'Abonnement trimestriel avec réduction',
    6500,
    'XOF',
    90,
    '["Accès à tous les contenus", "Qualité HD", "2 appareils simultanés", "Support client", "Téléchargement hors ligne", "Économie de 13%"]'::jsonb,
    false,
    7,
    0.10,
    0.05,
    0.03,
    true,
    5
),
(
    'Premium Trimestriel',
    'premium-quarterly',
    'Abonnement trimestriel premium',
    13000,
    'XOF',
    90,
    '["Accès à tous les contenus", "Qualité Full HD & 4K", "4 appareils simultanés", "Support prioritaire", "Téléchargement hors ligne", "Contenu exclusif", "Économie de 13%"]'::jsonb,
    false,
    7,
    0.12,
    0.06,
    0.04,
    true,
    6
),
(
    'Starter Annuel',
    'starter-annual',
    'Meilleur prix avec l''abonnement annuel',
    24000,
    'XOF',
    365,
    '["Accès à tous les contenus", "Qualité HD", "2 appareils simultanés", "Support client", "Téléchargement hors ligne", "Économie de 20%"]'::jsonb,
    false,
    14,
    0.10,
    0.05,
    0.03,
    true,
    7
),
(
    'Premium Annuel',
    'premium-annual',
    'L''expérience premium complète pour un an',
    48000,
    'XOF',
    365,
    '["Accès à tous les contenus", "Qualité Full HD & 4K", "4 appareils simultanés", "Support prioritaire", "Téléchargement hors ligne", "Contenu exclusif", "Économie de 20%"]'::jsonb,
    false,
    14,
    0.12,
    0.06,
    0.04,
    true,
    8
),
(
    'Famille Annuel',
    'family-annual',
    'La formule famille pour toute l''année',
    72000,
    'XOF',
    365,
    '["Accès à tous les contenus", "Qualité Full HD & 4K", "6 appareils simultanés", "Profils multiples", "Contrôle parental", "Support prioritaire", "Téléchargement hors ligne", "Contenu exclusif", "Économie de 20%"]'::jsonb,
    false,
    14,
    0.15,
    0.07,
    0.05,
    true,
    9
)
ON CONFLICT (slug) DO NOTHING;

-- ============================================================================
-- SYSTEM CONFIGURATION
-- ============================================================================

INSERT INTO system_config (key, value, description, is_public) VALUES
(
    'commission_settings',
    '{
        "direct_rate": 0.10,
        "level2_rate": 0.05,
        "level3_rate": 0.03,
        "minimum_payout": 10000,
        "payout_day": 1,
        "processing_fee_rate": 0.02,
        "auto_payout_enabled": false
    }'::jsonb,
    'Commission calculation and payout settings',
    false
),
(
    'payment_providers',
    '{
        "orange_money": {
            "enabled": true,
            "fee_rate": 0.01,
            "countries": ["SN", "CI", "BF", "ML", "TG", "BJ", "NE"]
        },
        "wave": {
            "enabled": true,
            "fee_rate": 0.01,
            "countries": ["SN", "CI"]
        },
        "mtn_momo": {
            "enabled": true,
            "fee_rate": 0.015,
            "countries": ["CI", "CM", "BF", "GN"]
        },
        "stripe": {
            "enabled": true,
            "fee_rate": 0.029,
            "countries": ["FR", "BE", "CH", "CA", "US"]
        }
    }'::jsonb,
    'Available payment providers and their configurations',
    true
),
(
    'subscription_settings',
    '{
        "trial_days": 7,
        "reminder_days_before": 3,
        "grace_period_days": 2,
        "auto_renew_default": true,
        "cancellation_allowed": true
    }'::jsonb,
    'Subscription behavior settings',
    false
),
(
    'affiliate_settings',
    '{
        "code_length": 8,
        "min_withdrawal": 10000,
        "max_network_depth": 3,
        "verification_required": true,
        "auto_approve": false,
        "tiers": {
            "bronze": {"min_earnings": 0, "min_subscriptions": 0},
            "silver": {"min_earnings": 500000, "min_subscriptions": 50},
            "gold": {"min_earnings": 2000000, "min_subscriptions": 100},
            "platinum": {"min_earnings": 5000000, "min_subscriptions": 200},
            "diamond": {"min_earnings": 10000000, "min_subscriptions": 500}
        }
    }'::jsonb,
    'Affiliate program settings and tier requirements',
    true
),
(
    'notification_settings',
    '{
        "sms_enabled": true,
        "email_enabled": true,
        "push_enabled": false,
        "batch_size": 100,
        "retry_attempts": 3
    }'::jsonb,
    'Notification delivery settings',
    false
),
(
    'security_settings',
    '{
        "password_min_length": 8,
        "password_require_uppercase": true,
        "password_require_lowercase": true,
        "password_require_numbers": true,
        "password_require_special": false,
        "session_timeout_minutes": 1440,
        "max_login_attempts": 5,
        "lockout_duration_minutes": 30,
        "jwt_expiry_hours": 1,
        "refresh_token_expiry_days": 7
    }'::jsonb,
    'Security and authentication settings',
    false
),
(
    'rate_limiting',
    '{
        "api_requests_per_minute": 100,
        "auth_requests_per_hour": 10,
        "webhook_requests_per_minute": 50
    }'::jsonb,
    'API rate limiting configuration',
    false
),
(
    'features',
    '{
        "qr_codes": true,
        "multi_level_commission": true,
        "auto_payouts": false,
        "sms_notifications": true,
        "email_notifications": true,
        "referral_bonuses": false
    }'::jsonb,
    'Feature flags for the application',
    false
),
(
    'maintenance',
    '{
        "enabled": false,
        "message": "Système en maintenance. Retour prévu dans quelques instants.",
        "allowed_ips": []
    }'::jsonb,
    'Maintenance mode configuration',
    true
),
(
    'company_info',
    '{
        "name": "Max IT TV",
        "legal_name": "Max IT TV SARL",
        "address": "Dakar, Sénégal",
        "phone": "+221 XX XXX XXXX",
        "email": "contact@maxittv.com",
        "website": "https://maxittv.com",
        "support_email": "support@maxittv.com",
        "support_phone": "+221 XX XXX XXXX"
    }'::jsonb,
    'Company information',
    true
)
ON CONFLICT (key) DO NOTHING;

-- ============================================================================
-- DEMO/TEST ADMIN AFFILIATE (OPTIONAL - Remove in production)
-- ============================================================================

-- Password: Admin@123 (hashed with bcrypt, 12 rounds)
-- WARNING: Change this password immediately in production!
INSERT INTO affiliates (
    email,
    phone,
    password_hash,
    first_name,
    last_name,
    affiliate_code,
    referral_code,
    country_id,
    status,
    tier,
    email_verified,
    phone_verified,
    identity_verified
) VALUES (
    'admin@maxittv.com',
    '+221700000000',
    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYIu0RYZzWC',
    'Admin',
    'System',
    'ADMIN001',
    'ADMIN-REF',
    (SELECT id FROM countries WHERE code = 'SN' LIMIT 1),
    'active',
    'diamond',
    true,
    true,
    true
)
ON CONFLICT (email) DO NOTHING;

-- ============================================================================
-- INITIAL STATISTICS REFRESH
-- ============================================================================

-- Refresh materialized views
REFRESH MATERIALIZED VIEW affiliate_stats;

-- ============================================================================
-- VERIFICATION QUERIES (for testing)
-- ============================================================================

-- Verify countries
DO $$
DECLARE
    country_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO country_count FROM countries;
    RAISE NOTICE 'Loaded % countries', country_count;
END $$;

-- Verify offers
DO $$
DECLARE
    offer_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO offer_count FROM offers;
    RAISE NOTICE 'Loaded % offers', offer_count;
END $$;

-- Verify config
DO $$
DECLARE
    config_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO config_count FROM system_config;
    RAISE NOTICE 'Loaded % configuration entries', config_count;
END $$;

-- Verify admin affiliate
DO $$
DECLARE
    admin_exists BOOLEAN;
BEGIN
    SELECT EXISTS(SELECT 1 FROM affiliates WHERE email = 'admin@maxittv.com') INTO admin_exists;
    IF admin_exists THEN
        RAISE NOTICE 'Admin affiliate created successfully';
        RAISE NOTICE 'Email: admin@maxittv.com';
        RAISE NOTICE 'Password: Admin@123 (CHANGE THIS IN PRODUCTION!)';
    END IF;
END $$;

-- ============================================================================
-- END OF SEEDS
-- ============================================================================

-- Display completion message
DO $$
BEGIN
    RAISE NOTICE '=============================================================';
    RAISE NOTICE 'Max IT TV Affiliation System - Database seeded successfully!';
    RAISE NOTICE '=============================================================';
    RAISE NOTICE 'Next steps:';
    RAISE NOTICE '1. Review and update system configuration';
    RAISE NOTICE '2. Configure payment provider credentials';
    RAISE NOTICE '3. Update SMS provider settings';
    RAISE NOTICE '4. Change default admin password';
    RAISE NOTICE '5. Configure environment variables';
    RAISE NOTICE '=============================================================';
END $$;
