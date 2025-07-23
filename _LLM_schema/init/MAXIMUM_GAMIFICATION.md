-- =====================================================
-- SYSTEM GAMIFIKACJI DLA APLIKACJI TANECZNEJ
-- =====================================================

-- =====================================================
-- 1. SYSTEM POZIOMÓW I DOŚWIADCZENIA
-- =====================================================

-- Definicje poziomów w systemie
CREATE TABLE experience_levels (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    level_number INTEGER UNIQUE NOT NULL,
    min_experience INTEGER NOT NULL,
    max_experience INTEGER NOT NULL,
    title TEXT NOT NULL, -- np. "Początkujący Tancerz", "Mistrz Parkietu"
    perks JSONB, -- {"max_photos": 15, "event_discount": 5}
    badge_icon_url TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Doświadczenie użytkowników
CREATE TABLE user_experience (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    total_xp INTEGER DEFAULT 0,
    current_level INTEGER DEFAULT 1,
    xp_to_next_level INTEGER,
    -- Statystyki po stylach
    dance_style_xp JSONB DEFAULT '{}', -- {"salsa": 500, "bachata": 300}
    -- Metadata
    last_xp_gained_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(user_id)
);

-- Historia zdobywania XP
CREATE TABLE xp_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    amount INTEGER NOT NULL,
    source_type TEXT NOT NULL CHECK (source_type IN (
        'event_attended', 'event_organized', 'review_received', 
        'challenge_completed', 'achievement_unlocked', 'daily_login',
        'profile_completed', 'first_match', 'skill_assessment'
    )),
    source_id UUID, -- ID wydarzenia, wyzwania, itp.
    dance_style_id UUID REFERENCES dance_styles(id),
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- 2. SYSTEM OSIĄGNIĘĆ (ACHIEVEMENTS)
-- =====================================================

-- Definicje osiągnięć
CREATE TABLE achievements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code TEXT UNIQUE NOT NULL, -- np. "FIRST_SALSA_CLASS"
    category TEXT NOT NULL CHECK (category IN (
        'beginner', 'social', 'learning', 'teaching', 
        'explorer', 'collector', 'competitor', 'special'
    )),
    -- Szczegóły
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    icon_url TEXT,
    -- Warunki
    criteria JSONB NOT NULL, -- {"event_count": 10, "dance_style": "salsa"}
    -- Nagrody
    xp_reward INTEGER DEFAULT 0,
    badge_reward BOOLEAN DEFAULT true,
    special_reward JSONB, -- {"title": "Salsa Master", "profile_frame": "gold"}
    -- Właściwości
    is_hidden BOOLEAN DEFAULT false, -- Ukryte do momentu odblokowania
    is_repeatable BOOLEAN DEFAULT false,
    max_progress INTEGER DEFAULT 1,
    -- Rzadkość
    rarity TEXT DEFAULT 'common' CHECK (rarity IN ('common', 'uncommon', 'rare', 'epic', 'legendary')),
    -- Status
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Osiągnięcia użytkowników
CREATE TABLE user_achievements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    achievement_id UUID NOT NULL REFERENCES achievements(id),
    -- Postęp
    current_progress INTEGER DEFAULT 0,
    completed_count INTEGER DEFAULT 0, -- Dla osiągnięć wielokrotnych
    -- Daty
    started_at TIMESTAMPTZ DEFAULT now(),
    completed_at TIMESTAMPTZ,
    last_progress_at TIMESTAMPTZ,
    -- Metadata
    UNIQUE(user_id, achievement_id)
);

-- =====================================================
-- 3. WYZWANIA (CHALLENGES)
-- =====================================================

-- Definicje wyzwań
CREATE TABLE challenges (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    creator_id UUID REFERENCES users(id), -- NULL dla wyzwań systemowych
    -- Podstawowe dane
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    rules TEXT,
    cover_image_url TEXT,
    -- Typ i kategoria
    challenge_type TEXT NOT NULL CHECK (challenge_type IN (
        'solo', 'versus', 'team', 'community'
    )),
    dance_style_id UUID REFERENCES dance_styles(id),
    -- Czas trwania
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    -- Warunki uczestnictwa
    min_participants INTEGER DEFAULT 1,
    max_participants INTEGER,
    entry_fee NUMERIC(10,2) DEFAULT 0,
    skill_level_required TEXT CHECK (skill_level_required IN ('beginner', 'intermediate', 'advanced', 'professional')),
    -- Cel wyzwania
    goal_type TEXT NOT NULL CHECK (goal_type IN (
        'event_attendance', 'practice_hours', 'video_submissions',
        'new_moves_learned', 'teaching_hours', 'social_dancing'
    )),
    goal_target INTEGER NOT NULL,
    goal_unit TEXT NOT NULL, -- "events", "hours", "videos", etc.
    -- Nagrody
    xp_reward INTEGER DEFAULT 100,
    winner_rewards JSONB, -- {"1st": {"xp": 500, "badge": "champion"}, "2nd": {...}}
    -- Status
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'completed', 'cancelled')),
    visibility TEXT DEFAULT 'public' CHECK (visibility IN ('public', 'private', 'friends')),
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Uczestnicy wyzwań
CREATE TABLE challenge_participants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    challenge_id UUID NOT NULL REFERENCES challenges(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    team_id UUID, -- Dla wyzwań zespołowych
    -- Postęp
    current_progress INTEGER DEFAULT 0,
    last_update_at TIMESTAMPTZ,
    -- Status
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'withdrawn')),
    rank INTEGER, -- Pozycja w rankingu
    -- Nagrody
    rewards_claimed BOOLEAN DEFAULT false,
    -- Metadata
    joined_at TIMESTAMPTZ DEFAULT now(),
    completed_at TIMESTAMPTZ,
    UNIQUE(challenge_id, user_id)
);

-- Aktualizacje postępu w wyzwaniach
CREATE TABLE challenge_progress_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    participant_id UUID NOT NULL REFERENCES challenge_participants(id) ON DELETE CASCADE,
    progress_increment INTEGER NOT NULL,
    evidence_type TEXT CHECK (evidence_type IN ('event_id', 'video_url', 'manual', 'verified')),
    evidence_data JSONB,
    verified_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- 4. DRZEWKA UMIEJĘTNOŚCI (SKILL TREES)
-- =====================================================

-- Węzły drzewka umiejętności
CREATE TABLE skill_tree_nodes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    dance_style_id UUID NOT NULL REFERENCES dance_styles(id),
    parent_node_id UUID REFERENCES skill_tree_nodes(id),
    -- Dane węzła
    name TEXT NOT NULL,
    description TEXT,
    icon_url TEXT,
    -- Pozycja w drzewie
    tree_level INTEGER NOT NULL, -- 1, 2, 3...
    position_x INTEGER NOT NULL,
    position_y INTEGER NOT NULL,
    -- Wymagania
    required_level INTEGER DEFAULT 1,
    required_xp INTEGER DEFAULT 0,
    prerequisite_nodes UUID[], -- Array ID węzłów wymaganych
    -- Korzyści
    benefits JSONB, -- {"event_discount": 10, "unlock_moves": ["basic_spin"]}
    -- Status
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Postęp użytkowników w drzewkach
CREATE TABLE user_skill_nodes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    node_id UUID NOT NULL REFERENCES skill_tree_nodes(id),
    -- Status
    status TEXT DEFAULT 'locked' CHECK (status IN ('locked', 'available', 'in_progress', 'completed')),
    -- Postęp
    current_progress INTEGER DEFAULT 0,
    max_progress INTEGER DEFAULT 100,
    -- Daty
    unlocked_at TIMESTAMPTZ,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    -- Metadata
    UNIQUE(user_id, node_id)
);

-- =====================================================
-- 5. RANKINGI I TABELE WYNIKÓW
-- =====================================================

-- Tabele rankingowe
CREATE TABLE leaderboards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    -- Zakres
    scope TEXT NOT NULL CHECK (scope IN ('global', 'country', 'city', 'dance_style')),
    scope_value TEXT, -- np. "PL" dla kraju, "salsa" dla stylu
    -- Typ rankingu
    metric_type TEXT NOT NULL CHECK (metric_type IN (
        'total_xp', 'monthly_xp', 'events_attended', 
        'challenges_won', 'teaching_hours', 'achievement_points'
    )),
    -- Okres
    period TEXT NOT NULL CHECK (period IN ('all_time', 'yearly', 'monthly', 'weekly', 'daily')),
    period_start DATE,
    period_end DATE,
    -- Status
    is_active BOOLEAN DEFAULT true,
    last_calculated_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Pozycje w rankingach
CREATE TABLE leaderboard_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    leaderboard_id UUID NOT NULL REFERENCES leaderboards(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    -- Pozycja i wynik
    rank INTEGER NOT NULL,
    score NUMERIC NOT NULL,
    previous_rank INTEGER,
    -- Dodatkowe dane
    metadata JSONB, -- {"events_count": 15, "avg_rating": 4.8}
    -- Metadata
    calculated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(leaderboard_id, user_id)
);

-- =====================================================
-- 6. SYSTEM ODZNAK I KOLEKCJI
-- =====================================================

-- Odznaki specjalne
CREATE TABLE badges (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    -- Wygląd
    icon_url TEXT,
    icon_animated_url TEXT,
    background_color TEXT,
    -- Kategoria
    category TEXT NOT NULL CHECK (category IN (
        'achievement', 'event', 'seasonal', 'special', 'partner', 'milestone'
    )),
    -- Rzadkość
    rarity TEXT DEFAULT 'common' CHECK (rarity IN ('common', 'uncommon', 'rare', 'epic', 'legendary')),
    -- Właściwości
    is_tradeable BOOLEAN DEFAULT false,
    is_displayable BOOLEAN DEFAULT true,
    display_priority INTEGER DEFAULT 0,
    -- Status
    is_active BOOLEAN DEFAULT true,
    valid_from DATE,
    valid_until DATE,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Kolekcja odznak użytkownika
CREATE TABLE user_badges (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    badge_id UUID NOT NULL REFERENCES badges(id),
    -- Źródło otrzymania
    source_type TEXT,
    source_id UUID,
    -- Display
    is_displayed BOOLEAN DEFAULT false,
    display_order INTEGER,
    -- Metadata
    earned_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(user_id, badge_id)
);

-- =====================================================
-- 7. WIDOKI DLA GAMIFIKACJI
-- =====================================================

-- Widok profilu gracza z gamifikacją
CREATE VIEW v_user_game_profile AS
SELECT 
    u.id,
    u.name,
    u.profile_photo_url,
    -- Poziom i XP
    ue.total_xp,
    ue.current_level,
    el.title as level_title,
    ue.xp_to_next_level,
    -- Statystyki
    COUNT(DISTINCT ua.achievement_id) as achievements_count,
    COUNT(DISTINCT ub.badge_id) as badges_count,
    COUNT(DISTINCT cp.challenge_id) FILTER (WHERE cp.status = 'completed') as challenges_completed,
    -- Top odznaki
    ARRAY_AGG(
        DISTINCT jsonb_build_object(
            'badge_id', b.id,
            'badge_name', b.name,
            'badge_icon', b.icon_url,
            'rarity', b.rarity
        ) ORDER BY b.display_priority DESC
    ) FILTER (WHERE ub.is_displayed) as displayed_badges
FROM users u
LEFT JOIN user_experience ue ON u.id = ue.user_id
LEFT JOIN experience_levels el ON ue.current_level = el.level_number
LEFT JOIN user_achievements ua ON u.id = ua.user_id AND ua.completed_at IS NOT NULL
LEFT JOIN user_badges ub ON u.id = ub.user_id
LEFT JOIN badges b ON ub.badge_id = b.id
LEFT JOIN challenge_participants cp ON u.id = cp.user_id
WHERE u.is_active = true
GROUP BY u.id, ue.total_xp, ue.current_level, el.title, ue.xp_to_next_level;

-- Widok postępu w wyzwaniach
CREATE VIEW v_active_challenges AS
SELECT 
    c.*,
    COUNT(DISTINCT cp.user_id) as participant_count,
    AVG(cp.current_progress)::NUMERIC(5,2) as avg_progress,
    CASE 
        WHEN c.end_date < CURRENT_DATE THEN 'ended'
        WHEN c.start_date > CURRENT_DATE THEN 'upcoming'
        ELSE 'active'
    END as time_status,
    -- Top 3 uczestników
    ARRAY_AGG(
        jsonb_build_object(
            'user_id', u.id,
            'user_name', u.name,
            'progress', cp.current_progress,
            'rank', cp.rank
        ) ORDER BY cp.current_progress DESC
        LIMIT 3
    ) as top_participants
FROM challenges c
LEFT JOIN challenge_participants cp ON c.id = cp.challenge_id
LEFT JOIN users u ON cp.user_id = u.id
WHERE c.status = 'active'
GROUP BY c.id;

-- =====================================================
-- 8. FUNKCJE POMOCNICZE
-- =====================================================

-- Funkcja przyznająca XP
CREATE OR REPLACE FUNCTION fn_award_xp(
    p_user_id UUID,
    p_amount INTEGER,
    p_source_type TEXT,
    p_source_id UUID DEFAULT NULL,
    p_dance_style_id UUID DEFAULT NULL
) RETURNS VOID AS $$
DECLARE
    v_new_total_xp INTEGER;
    v_new_level INTEGER;
BEGIN
    -- Dodaj transakcję XP
    INSERT INTO xp_transactions (user_id, amount, source_type, source_id, dance_style_id)
    VALUES (p_user_id, p_amount, p_source_type, p_source_id, p_dance_style_id);
    
    -- Zaktualizuj całkowite XP
    UPDATE user_experience
    SET 
        total_xp = total_xp + p_amount,
        last_xp_gained_at = now(),
        dance_style_xp = CASE 
            WHEN p_dance_style_id IS NOT NULL THEN
                jsonb_set(
                    COALESCE(dance_style_xp, '{}'::jsonb),
                    ARRAY[p_dance_style_id::text],
                    to_jsonb(COALESCE((dance_style_xp->>p_dance_style_id::text)::INTEGER, 0) + p_amount)
                )
            ELSE dance_style_xp
        END
    WHERE user_id = p_user_id
    RETURNING total_xp INTO v_new_total_xp;
    
    -- Sprawdź czy awansował poziom
    SELECT level_number INTO v_new_level
    FROM experience_levels
    WHERE min_experience <= v_new_total_xp
    ORDER BY level_number DESC
    LIMIT 1;
    
    -- Zaktualizuj poziom jeśli się zmienił
    UPDATE user_experience
    SET current_level = v_new_level
    WHERE user_id = p_user_id AND current_level != v_new_level;
    
END;
$$ LANGUAGE plpgsql;

-- Funkcja sprawdzająca osiągnięcia
CREATE OR REPLACE FUNCTION fn_check_achievements(p_user_id UUID) 
RETURNS TABLE (achievement_id UUID, completed BOOLEAN) AS $$
BEGIN
    -- Tu logika sprawdzająca różne warunki osiągnięć
    -- Przykład dla osiągnięcia "Pierwszy taniec"
    RETURN QUERY
    WITH user_stats AS (
        SELECT 
            COUNT(DISTINCT ep.event_id) as events_attended,
            COUNT(DISTINCT e.dance_style_id) as styles_tried
        FROM event_participants ep
        JOIN events e ON ep.event_id = e.id
        WHERE ep.user_id = p_user_id AND ep.status = 'attended'
    )
    SELECT 
        a.id,
        CASE 
            WHEN a.criteria->>'event_count' IS NOT NULL 
                AND (SELECT events_attended FROM user_stats) >= (a.criteria->>'event_count')::INTEGER
            THEN true
            ELSE false
        END as completed
    FROM achievements a
    WHERE a.is_active = true;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 9. TRIGGERY DLA GAMIFIKACJI
-- =====================================================

-- Trigger przyznający XP za uczestnictwo w wydarzeniu
CREATE OR REPLACE FUNCTION fn_award_event_xp()
RETURNS TRIGGER AS $$
DECLARE
    v_xp_amount INTEGER;
    v_dance_style_id UUID;
BEGIN
    IF NEW.status = 'attended' AND OLD.status != 'attended' THEN
        -- Bazowe XP za uczestnictwo
        v_xp_amount := 50;
        
        -- Bonus za pierwsze wydarzenie w stylu
        SELECT dance_style_id INTO v_dance_style_id
        FROM events WHERE id = NEW.event_id;
        
        -- Przyznaj XP
        PERFORM fn_award_xp(
            NEW.user_id, 
            v_xp_amount, 
            'event_attended', 
            NEW.event_id,
            v_dance_style_id
        );
        
        -- Sprawdź osiągnięcia
        PERFORM fn_check_achievements(NEW.user_id);
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_award_event_xp
    AFTER UPDATE ON event_participants
    FOR EACH ROW
    EXECUTE FUNCTION fn_award_event_xp();

-- =====================================================
-- 10. PRZYKŁADOWE DANE POCZĄTKOWE
-- =====================================================

-- Poziomy doświadczenia
INSERT INTO experience_levels (level_number, min_experience, max_experience, title) VALUES
    (1, 0, 99, 'Początkujący Tancerz'),
    (2, 100, 249, 'Uczeń Tańca'),
    (3, 250, 499, 'Amator Parkietu'),
    (4, 500, 999, 'Zaawansowany Tancerz'),
    (5, 1000, 1999, 'Mistrz Kroków'),
    (6, 2000, 3499, 'Wirtuoz Tańca'),
    (7, 3500, 5999, 'Ambasador Parkietu'),
    (8, 6000, 9999, 'Legenda Tańca'),
    (9, 10000, 19999, 'Arcymistrz'),
    (10, 20000, 999999, 'Żywa Legenda');

-- Przykładowe osiągnięcia
INSERT INTO achievements (code, category, name, description, criteria, xp_reward, rarity) VALUES
    ('FIRST_DANCE', 'beginner', 'Pierwszy Krok', 'Weź udział w swoim pierwszym wydarzeniu', '{"event_count": 1}', 100, 'common'),
    ('SALSA_STARTER', 'learning', 'Salsa Starter', 'Ukończ 5 wydarzeń Salsa', '{"event_count": 5, "dance_style": "salsa"}', 200, 'uncommon'),
    ('SOCIAL_BUTTERFLY', 'social', 'Motyl Towarzyski', 'Zdobądź 10 dopasowań', '{"matches_count": 10}', 300, 'rare'),
    ('TEACHER_DEBUT', 'teaching', 'Debiut Nauczyciela', 'Zorganizuj swoje pierwsze wydarzenie', '{"events_organized": 1}', 500, 'rare'),
    ('STYLE_EXPLORER', 'explorer', 'Odkrywca Stylów', 'Spróbuj 5 różnych stylów tańca', '{"unique_styles": 5}', 400, 'uncommon');

-- Przykładowe wyzwanie
INSERT INTO challenges (title, description, challenge_type, start_date, end_date, goal_type, goal_target, goal_unit, xp_reward) VALUES
    ('30 Dni Tańca', 'Weź udział w wydarzeniu tanecznym każdego dnia przez 30 dni!', 'solo', CURRENT_DATE, CURRENT_DATE + INTERVAL '30 days', 'event_attendance', 30, 'events', 1000);

-- =====================================================
-- KONIEC SYSTEMU GAMIFIKACJI
-- =====================================================