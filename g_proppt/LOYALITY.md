-- =====================================================
-- MODUŁ LOJALNOŚCIOWY DLA DANCE APP
-- =====================================================

-- =====================================================
-- 1. PROGRAM LOJALNOŚCIOWY - KONFIGURACJA
-- =====================================================

-- Główna tabela konfiguracji programu lojalnościowego
CREATE TABLE loyalty_programs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    -- Typ programu
    program_type TEXT NOT NULL CHECK (program_type IN ('points', 'tiers', 'hybrid')),
    -- Status
    is_active BOOLEAN DEFAULT true,
    -- Reguły punktowe
    points_per_pln NUMERIC(10,2) DEFAULT 1, -- punkty za każdą wydaną złotówkę
    points_expiry_months INTEGER, -- null = punkty nie wygasają
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Poziomy w programie lojalnościowym
CREATE TABLE loyalty_tiers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    program_id UUID NOT NULL REFERENCES loyalty_programs(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    level INTEGER NOT NULL,
    -- Progi
    min_points INTEGER NOT NULL,
    min_events_attended INTEGER DEFAULT 0,
    min_months_active INTEGER DEFAULT 0,
    -- Benefity
    points_multiplier NUMERIC(3,2) DEFAULT 1.0, -- mnożnik punktów
    discount_percentage INTEGER DEFAULT 0,
    -- Wygląd
    badge_icon TEXT,
    badge_color TEXT,
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(program_id, level)
);

-- =====================================================
-- 2. PUNKTY I TRANSAKCJE
-- =====================================================

-- Saldo punktowe użytkowników
CREATE TABLE user_loyalty_accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    program_id UUID NOT NULL REFERENCES loyalty_programs(id),
    -- Punkty
    total_points_earned INTEGER DEFAULT 0,
    current_points_balance INTEGER DEFAULT 0,
    -- Poziom
    current_tier_id UUID REFERENCES loyalty_tiers(id),
    tier_achieved_at TIMESTAMPTZ,
    -- Statystyki
    total_events_attended INTEGER DEFAULT 0,
    total_amount_spent NUMERIC(10,2) DEFAULT 0,
    -- Metadata
    joined_at TIMESTAMPTZ DEFAULT now(),
    last_activity_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(user_id, program_id)
);

-- Historia transakcji punktowych
CREATE TABLE loyalty_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    account_id UUID NOT NULL REFERENCES user_loyalty_accounts(id) ON DELETE CASCADE,
    -- Typ transakcji
    transaction_type TEXT NOT NULL CHECK (transaction_type IN (
        'event_attendance', 'event_booking', 'referral', 'review', 
        'achievement', 'manual_adjustment', 'redemption', 'expiry'
    )),
    -- Powiązane obiekty
    event_id UUID REFERENCES events(id),
    review_id UUID REFERENCES reviews(id),
    referred_user_id UUID REFERENCES users(id),
    -- Punkty
    points_amount INTEGER NOT NULL, -- dodatnie = przychód, ujemne = wydatek
    points_balance_after INTEGER NOT NULL,
    -- Szczegóły
    description TEXT,
    metadata JSONB,
    -- Wygaśnięcie
    expires_at TIMESTAMPTZ,
    is_expired BOOLEAN DEFAULT false,
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- 3. NAGRODY I WYMIANA
-- =====================================================

-- Katalog nagród
CREATE TABLE loyalty_rewards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    program_id UUID NOT NULL REFERENCES loyalty_programs(id) ON DELETE CASCADE,
    -- Podstawowe informacje
    name TEXT NOT NULL,
    description TEXT,
    category TEXT CHECK (category IN ('discount', 'free_event', 'merchandise', 'partner_offer', 'exclusive_access')),
    -- Koszt i dostępność
    points_cost INTEGER NOT NULL,
    min_tier_id UUID REFERENCES loyalty_tiers(id), -- minimalna ranga do wykupienia
    -- Limity
    quantity_available INTEGER, -- null = unlimited
    quantity_redeemed INTEGER DEFAULT 0,
    per_user_limit INTEGER DEFAULT 1,
    -- Ważność
    valid_from TIMESTAMPTZ DEFAULT now(),
    valid_until TIMESTAMPTZ,
    redemption_validity_days INTEGER DEFAULT 30, -- ile dni na wykorzystanie po wykupieniu
    -- Szczegóły nagrody
    discount_percentage INTEGER,
    discount_amount NUMERIC(10,2),
    partner_name TEXT,
    partner_logo_url TEXT,
    -- Status
    is_active BOOLEAN DEFAULT true,
    is_featured BOOLEAN DEFAULT false,
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Wykupione nagrody
CREATE TABLE loyalty_redemptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    account_id UUID NOT NULL REFERENCES user_loyalty_accounts(id),
    reward_id UUID NOT NULL REFERENCES loyalty_rewards(id),
    transaction_id UUID NOT NULL REFERENCES loyalty_transactions(id),
    -- Kod i status
    redemption_code TEXT UNIQUE DEFAULT substr(md5(random()::text), 1, 8),
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'used', 'expired', 'cancelled')),
    -- Wykorzystanie
    used_at TIMESTAMPTZ,
    used_for_event_id UUID REFERENCES events(id),
    expires_at TIMESTAMPTZ NOT NULL,
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- 4. OSIĄGNIĘCIA I GAMIFIKACJA
-- =====================================================

-- Definicje osiągnięć
CREATE TABLE achievements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    -- Podstawowe informacje
    code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    category TEXT CHECK (category IN ('events', 'social', 'skills', 'loyalty', 'special')),
    -- Warunki
    criteria_type TEXT NOT NULL CHECK (criteria_type IN ('counter', 'milestone', 'streak', 'collection')),
    criteria_config JSONB NOT NULL, -- np. {"event_count": 10} lub {"dance_styles": 5}
    -- Nagroda
    points_reward INTEGER DEFAULT 0,
    -- Wygląd
    icon_url TEXT,
    badge_style JSONB, -- kolory, animacje itp.
    -- Rzadkość
    rarity TEXT DEFAULT 'common' CHECK (rarity IN ('common', 'rare', 'epic', 'legendary')),
    -- Status
    is_active BOOLEAN DEFAULT true,
    is_secret BOOLEAN DEFAULT false, -- ukryte dopóki nie zdobyte
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Zdobyte osiągnięcia
CREATE TABLE user_achievements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    achievement_id UUID NOT NULL REFERENCES achievements(id),
    -- Postęp
    progress_data JSONB,
    progress_percentage INTEGER DEFAULT 0,
    -- Status
    unlocked_at TIMESTAMPTZ,
    points_awarded INTEGER DEFAULT 0,
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(user_id, achievement_id)
);

-- =====================================================
-- 5. WYZWANIA I MISJE
-- =====================================================

-- Wyzwania czasowe
CREATE TABLE challenges (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    -- Podstawowe informacje
    name TEXT NOT NULL,
    description TEXT,
    challenge_type TEXT CHECK (challenge_type IN ('daily', 'weekly', 'monthly', 'seasonal', 'special')),
    -- Czas trwania
    start_at TIMESTAMPTZ NOT NULL,
    end_at TIMESTAMPTZ NOT NULL,
    -- Warunki
    requirements JSONB NOT NULL, -- np. {"attend_events": 3, "dance_styles": ["salsa", "bachata"]}
    -- Nagrody
    points_reward INTEGER DEFAULT 0,
    tier_bonus_multiplier NUMERIC(3,2) DEFAULT 1.0,
    reward_id UUID REFERENCES loyalty_rewards(id),
    -- Status
    is_active BOOLEAN DEFAULT true,
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Postęp w wyzwaniach
CREATE TABLE user_challenges (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    challenge_id UUID NOT NULL REFERENCES challenges(id),
    -- Postęp
    progress_data JSONB DEFAULT '{}',
    is_completed BOOLEAN DEFAULT false,
    completed_at TIMESTAMPTZ,
    -- Nagroda
    points_claimed INTEGER DEFAULT 0,
    reward_claimed BOOLEAN DEFAULT false,
    -- Metadata
    started_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(user_id, challenge_id)
);

-- =====================================================
-- 6. PROGRAM POLECEŃ
-- =====================================================

-- Polecenia
CREATE TABLE referrals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    referrer_id UUID NOT NULL REFERENCES users(id),
    referred_id UUID NOT NULL REFERENCES users(id),
    -- Status
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'expired')),
    -- Kody
    referral_code TEXT UNIQUE DEFAULT substr(md5(random()::text), 1, 6),
    -- Nagrody
    referrer_points_awarded INTEGER DEFAULT 0,
    referred_points_awarded INTEGER DEFAULT 0,
    -- Warunki aktywacji
    activation_requirement TEXT, -- np. "attend_first_event"
    activated_at TIMESTAMPTZ,
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT now(),
    expires_at TIMESTAMPTZ DEFAULT (now() + interval '30 days'),
    UNIQUE(referrer_id, referred_id)
);

-- =====================================================
-- 7. KOMUNIKACJA I POWIADOMIENIA
-- =====================================================

-- Szablony powiadomień lojalnościowych
CREATE TABLE loyalty_notification_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    -- Typ powiadomienia
    trigger_type TEXT NOT NULL CHECK (trigger_type IN (
        'points_earned', 'tier_upgrade', 'achievement_unlocked',
        'reward_available', 'points_expiring', 'challenge_reminder'
    )),
    -- Treść
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    -- Kanały
    send_push BOOLEAN DEFAULT true,
    send_email BOOLEAN DEFAULT false,
    send_in_app BOOLEAN DEFAULT true,
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Historia powiadomień lojalnościowych
CREATE TABLE loyalty_notifications_sent (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id),
    template_id UUID REFERENCES loyalty_notification_templates(id),
    -- Szczegóły
    trigger_type TEXT NOT NULL,
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    data JSONB,
    -- Status
    is_read BOOLEAN DEFAULT false,
    read_at TIMESTAMPTZ,
    -- Metadata
    sent_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- 8. WIDOKI ANALITYCZNE
-- =====================================================

-- Ranking użytkowników
CREATE VIEW v_loyalty_leaderboard AS
SELECT 
    u.id as user_id,
    u.name,
    u.profile_photo_url,
    ula.current_points_balance,
    ula.total_points_earned,
    lt.name as tier_name,
    lt.level as tier_level,
    lt.badge_icon,
    lt.badge_color,
    COUNT(DISTINCT ua.achievement_id) as achievements_count,
    RANK() OVER (ORDER BY ula.total_points_earned DESC) as global_rank,
    RANK() OVER (PARTITION BY u.city ORDER BY ula.total_points_earned DESC) as city_rank
FROM users u
JOIN user_loyalty_accounts ula ON u.id = ula.user_id
LEFT JOIN loyalty_tiers lt ON ula.current_tier_id = lt.id
LEFT JOIN user_achievements ua ON u.id = ua.user_id AND ua.unlocked_at IS NOT NULL
WHERE u.is_active = true AND u.is_banned = false
GROUP BY u.id, ula.id, lt.id;

-- Statystyki programu lojalnościowego
CREATE VIEW v_loyalty_program_stats AS
SELECT 
    lp.id as program_id,
    lp.name as program_name,
    COUNT(DISTINCT ula.user_id) as total_members,
    COUNT(DISTINCT ula.user_id) FILTER (WHERE ula.last_activity_at > now() - interval '30 days') as active_members,
    SUM(ula.current_points_balance) as total_points_in_circulation,
    AVG(ula.current_points_balance)::INTEGER as avg_points_per_user,
    COUNT(DISTINCT lr.id) as total_redemptions,
    SUM(lr.points_cost) as total_points_redeemed
FROM loyalty_programs lp
LEFT JOIN user_loyalty_accounts ula ON lp.id = ula.program_id
LEFT JOIN loyalty_redemptions lr ON ula.id = lr.account_id
GROUP BY lp.id;

-- Popularne nagrody
CREATE VIEW v_popular_rewards AS
SELECT 
    lr.id,
    lr.name,
    lr.category,
    lr.points_cost,
    lt.name as min_tier_name,
    COUNT(DISTINCT lred.id) as redemption_count,
    lr.quantity_available - lr.quantity_redeemed as remaining_quantity,
    AVG(EXTRACT(EPOCH FROM (lred.used_at - lred.created_at))/3600)::INTEGER as avg_hours_to_use
FROM loyalty_rewards lr
LEFT JOIN loyalty_tiers lt ON lr.min_tier_id = lt.id
LEFT JOIN loyalty_redemptions lred ON lr.id = lred.reward_id
WHERE lr.is_active = true
GROUP BY lr.id, lt.id
ORDER BY redemption_count DESC;

-- =====================================================
-- 9. FUNKCJE POMOCNICZE
-- =====================================================

-- Funkcja obliczająca punkty za wydarzenie
CREATE OR REPLACE FUNCTION fn_calculate_event_points(
    p_event_id UUID,
    p_user_id UUID
) RETURNS INTEGER AS $$
DECLARE
    v_base_points INTEGER;
    v_multiplier NUMERIC;
    v_tier_multiplier NUMERIC;
    v_special_bonus INTEGER DEFAULT 0;
BEGIN
    -- Oblicz bazowe punkty na podstawie ceny wydarzenia
    SELECT 
        COALESCE(e.price * lp.points_per_pln, 0)::INTEGER
    INTO v_base_points
    FROM events e
    CROSS JOIN loyalty_programs lp
    WHERE e.id = p_event_id AND lp.is_active = true
    LIMIT 1;
    
    -- Pobierz mnożnik z poziomu użytkownika
    SELECT COALESCE(lt.points_multiplier, 1.0)
    INTO v_tier_multiplier
    FROM user_loyalty_accounts ula
    JOIN loyalty_tiers lt ON ula.current_tier_id = lt.id
    WHERE ula.user_id = p_user_id;
    
    -- Sprawdź bonusy specjalne (np. pierwsze zajęcia w nowym stylu)
    IF NOT EXISTS (
        SELECT 1 FROM event_participants ep
        JOIN events e2 ON ep.event_id = e2.id
        WHERE ep.user_id = p_user_id
        AND e2.dance_style_id = (SELECT dance_style_id FROM events WHERE id = p_event_id)
        AND ep.status = 'attended'
    ) THEN
        v_special_bonus := 50; -- bonus za nowy styl tańca
    END IF;
    
    RETURN (v_base_points * COALESCE(v_tier_multiplier, 1.0))::INTEGER + v_special_bonus;
END;
$$ LANGUAGE plpgsql;

-- Funkcja aktualizująca poziom użytkownika
CREATE OR REPLACE FUNCTION fn_update_user_tier() 
RETURNS TRIGGER AS $$
DECLARE
    v_new_tier_id UUID;
BEGIN
    -- Znajdź odpowiedni poziom na podstawie punktów i innych kryteriów
    SELECT id INTO v_new_tier_id
    FROM loyalty_tiers
    WHERE program_id = NEW.program_id
    AND NEW.total_points_earned >= min_points
    AND NEW.total_events_attended >= min_events_attended
    ORDER BY level DESC
    LIMIT 1;
    
    -- Aktualizuj poziom jeśli się zmienił
    IF v_new_tier_id IS DISTINCT FROM NEW.current_tier_id THEN
        NEW.current_tier_id := v_new_tier_id;
        NEW.tier_achieved_at := now();
        
        -- Możesz tutaj dodać logikę wysyłania powiadomienia
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Funkcja sprawdzająca postęp w osiągnięciach
CREATE OR REPLACE FUNCTION fn_check_achievement_progress(
    p_user_id UUID,
    p_trigger_type TEXT,
    p_trigger_data JSONB
) RETURNS VOID AS $$
DECLARE
    v_achievement RECORD;
    v_progress JSONB;
    v_is_completed BOOLEAN;
BEGIN
    -- Sprawdź wszystkie aktywne osiągnięcia
    FOR v_achievement IN 
        SELECT a.* 
        FROM achievements a
        LEFT JOIN user_achievements ua ON a.id = ua.achievement_id AND ua.user_id = p_user_id
        WHERE a.is_active = true
        AND (ua.unlocked_at IS NULL OR ua.id IS NULL)
    LOOP
        -- Tutaj dodaj logikę sprawdzania postępu dla różnych typów osiągnięć
        -- To jest uproszczony przykład
        
        -- Utwórz lub zaktualizuj postęp
        INSERT INTO user_achievements (user_id, achievement_id, progress_data)
        VALUES (p_user_id, v_achievement.id, '{}')
        ON CONFLICT (user_id, achievement_id) 
        DO UPDATE SET 
            updated_at = now();
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 10. TRIGGERY
-- =====================================================

-- Trigger przyznający punkty za uczestnictwo w wydarzeniu
CREATE OR REPLACE FUNCTION fn_award_event_points()
RETURNS TRIGGER AS $$
DECLARE
    v_points INTEGER;
    v_account_id UUID;
BEGIN
    IF NEW.status = 'attended' AND OLD.status != 'attended' THEN
        -- Pobierz konto lojalnościowe użytkownika
        SELECT id INTO v_account_id
        FROM user_loyalty_accounts
        WHERE user_id = NEW.user_id;
        
        IF v_account_id IS NOT NULL THEN
            -- Oblicz punkty
            v_points := fn_calculate_event_points(NEW.event_id, NEW.user_id);
            
            -- Dodaj transakcję
            INSERT INTO loyalty_transactions (
                account_id, 
                transaction_type, 
                event_id,
                points_amount, 
                points_balance_after,
                description
            )
            SELECT 
                v_account_id,
                'event_attendance',
                NEW.event_id,
                v_points,
                current_points_balance + v_points,
                'Uczestnictwo w wydarzeniu'
            FROM user_loyalty_accounts
            WHERE id = v_account_id;
            
            -- Aktualizuj saldo
            UPDATE user_loyalty_accounts
            SET 
                current_points_balance = current_points_balance + v_points,
                total_points_earned = total_points_earned + v_points,
                total_events_attended = total_events_attended + 1,
                last_activity_at = now()
            WHERE id = v_account_id;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_award_event_points
    AFTER UPDATE ON event_participants
    FOR EACH ROW
    EXECUTE FUNCTION fn_award_event_points();

-- Trigger aktualizujący poziom po zmianie punktów
CREATE TRIGGER trg_update_tier
    BEFORE UPDATE ON user_loyalty_accounts
    FOR EACH ROW
    WHEN (NEW.total_points_earned != OLD.total_points_earned)
    EXECUTE FUNCTION fn_update_user_tier();

-- Trigger przyznający punkty za recenzję
CREATE OR REPLACE FUNCTION fn_award_review_points()
RETURNS TRIGGER AS $$
DECLARE
    v_points INTEGER := 10; -- bazowe punkty za recenzję
    v_account_id UUID;
BEGIN
    -- Pobierz konto lojalnościowe
    SELECT id INTO v_account_id
    FROM user_loyalty_accounts
    WHERE user_id = NEW.reviewer_id;
    
    IF v_account_id IS NOT NULL THEN
        -- Bonus za szczegółową recenzję
        IF LENGTH(NEW.content) > 100 THEN
            v_points := v_points + 10;
        END IF;
        
        -- Dodaj transakcję
        INSERT INTO loyalty_transactions (
            account_id, 
            transaction_type, 
            review_id,
            points_amount, 
            points_balance_after,
            description
        )
        SELECT 
            v_account_id,
            'review',
            NEW.id,
            v_points,
            current_points_balance + v_points,
            'Dodanie recenzji'
        FROM user_loyalty_accounts
        WHERE id = v_account_id;
        
        -- Aktualizuj saldo
        UPDATE user_loyalty_accounts
        SET 
            current_points_balance = current_points_balance + v_points,
            total_points_earned = total_points_earned + v_points,
            last_activity_at = now()
        WHERE id = v_account_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_award_review_points
    AFTER INSERT ON reviews
    FOR EACH ROW
    EXECUTE FUNCTION fn_award_review_points();

-- =====================================================
-- 11. POLITYKI RLS
-- =====================================================

-- Włącz RLS
ALTER TABLE loyalty_programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE loyalty_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_loyalty_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE loyalty_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE loyalty_rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE loyalty_redemptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;

-- Przykładowe polityki RLS

-- Użytkownicy mogą widzieć swoje konto lojalnościowe
CREATE POLICY "Users can view own loyalty account" ON user_loyalty_accounts
    FOR SELECT
    USING (user_id = auth.uid());

-- Użytkownicy mogą widzieć swoje transakcje
CREATE POLICY "Users can view own transactions" ON loyalty_transactions
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM user_loyalty_accounts
            WHERE id = account_id AND user_id = auth.uid()
        )
    );

-- Wszyscy mogą widzieć aktywne nagrody
CREATE POLICY "Anyone can view active rewards" ON loyalty_rewards
    FOR SELECT
    USING (is_active = true AND (valid_until IS NULL OR valid_until > now()));

-- Użytkownicy mogą wykupywać nagrody
CREATE POLICY "Users can redeem rewards" ON loyalty_redemptions
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM user_loyalty_accounts
            WHERE id = account_id AND user_id = auth.uid()
        )
    );

-- =====================================================
-- 12. DANE POCZĄTKOWE
-- =====================================================

-- Przykładowy program lojalnościowy
INSERT INTO loyalty_programs (name, description, program_type, points_per_pln)
VALUES ('Dance Rewards', 'Zbieraj punkty i wymieniaj na nagrody!', 'hybrid', 1);

-- Przykładowe poziomy
INSERT INTO loyalty_tiers (program_id, name, level, min_points, points_multiplier, discount_percentage, badge_color)
SELECT 
    id,
    tier_name,
    level,
    min_points,
    multiplier,
    discount,
    color
FROM loyalty_programs,
LATERAL (VALUES
    ('Początkujący', 1, 0, 1.0, 0, '#808080'),
    ('Brązowy', 2, 100, 1.1, 5, '#CD7F32'),
    ('Srebrny', 3, 500, 1.2, 10, '#C0C0C0'),
    ('Złoty', 4, 1500, 1.5, 15, '#FFD700'),
    ('Platynowy', 5, 5000, 2.0, 20, '#E5E4E2')
) AS tiers(tier_name, level, min_points, multiplier, discount, color)
WHERE loyalty_programs.name = 'Dance Rewards';

-- Przykładowe osiągnięcia
INSERT INTO achievements (code, name, description, category, criteria_type, criteria_config, points_reward, rarity)
VALUES 
    ('first_dance', 'Pierwszy Krok', 'Weź udział w pierwszych zajęciach', 'events', 'counter', '{"event_count": 1}', 50, 'common'),
    ('style_explorer', 'Odkrywca Stylów', 'Spróbuj 5 różnych stylów tańca', 'skills', 'collection', '{"unique_styles": 5}', 100, 'rare'),
    ('social_butterfly', 'Motyl Towarzyski', 'Zatańcz z 10 różnymi partnerami', 'social', 'counter', '{"unique_partners": 10}', 150, 'rare'),
    ('dedication', 'Wytrwałość', 'Uczestniczy w zajęciach przez 30 dni z rzędu', 'events', 'streak', '{"days": 30}', 500, 'epic'),
    ('master_dancer', 'Mistrz Tańca', 'Osiągnij poziom zaawansowany w 3 stylach', 'skills', 'collection', '{"advanced_styles": 3}', 1000, 'legendary');

-- =====================================================
-- KONIEC MODUŁU LOJALNOŚCIOWEGO
-- =====================================================