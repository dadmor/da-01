-- =====================================================
-- ROZSZERZENIE BAZY DANYCH - PRZYPIĘTE STYLE TAŃCA
-- =====================================================
-- Ten skrypt dodaje funkcjonalność przypinania preferowanych stylów tańca
-- Uruchom go na istniejącej bazie danych

-- 1. Dodaj kolumny do istniejącej tabeli user_dance_styles
ALTER TABLE user_dance_styles 
ADD COLUMN IF NOT EXISTS is_pinned BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS pinned_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS pin_order INTEGER DEFAULT 0;

-- 2. Utwórz tabelę dla preferencji stylów (style których user chce się nauczyć)
CREATE TABLE IF NOT EXISTS user_dance_preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    dance_style_id UUID NOT NULL REFERENCES dance_styles(id) ON DELETE CASCADE,
    preference_type TEXT NOT NULL CHECK (preference_type IN ('want_to_learn', 'favorite', 'looking_for_partner')),
    priority INTEGER DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(user_id, dance_style_id, preference_type)
);

-- 3. Dodaj indeksy dla wydajności
CREATE INDEX IF NOT EXISTS idx_user_dance_styles_pinned 
    ON user_dance_styles(user_id, is_pinned) 
    WHERE is_pinned = true;

CREATE INDEX IF NOT EXISTS idx_user_dance_styles_pin_order 
    ON user_dance_styles(user_id, pin_order) 
    WHERE is_pinned = true;

CREATE INDEX IF NOT EXISTS idx_user_dance_preferences_user_id 
    ON user_dance_preferences(user_id);

CREATE INDEX IF NOT EXISTS idx_user_dance_preferences_style_id 
    ON user_dance_preferences(dance_style_id);

CREATE INDEX IF NOT EXISTS idx_user_dance_preferences_type 
    ON user_dance_preferences(preference_type);

-- 4. Dodaj trigger dla updated_at
CREATE TRIGGER trg_user_dance_preferences_updated_at 
    BEFORE UPDATE ON user_dance_preferences 
    FOR EACH ROW 
    EXECUTE FUNCTION fn_update_updated_at();

-- 5. Funkcja sprawdzająca limit przypiętych stylów
CREATE OR REPLACE FUNCTION fn_check_pinned_styles_limit()
RETURNS TRIGGER AS $$
DECLARE
    pinned_count INTEGER;
    max_pinned_skills INTEGER := 5; -- Max 5 przypiętych umiejętności
    max_preferences INTEGER := 10; -- Max 10 preferencji na typ
BEGIN
    -- Sprawdzanie dla user_dance_styles
    IF TG_TABLE_NAME = 'user_dance_styles' THEN
        IF NEW.is_pinned = true THEN
            SELECT COUNT(*) INTO pinned_count 
            FROM user_dance_styles 
            WHERE user_id = NEW.user_id 
            AND is_pinned = true
            AND id != NEW.id;
            
            IF pinned_count >= max_pinned_skills THEN
                RAISE EXCEPTION 'Możesz przypiąć maksymalnie % stylów tańca które umiesz', max_pinned_skills;
            END IF;
        END IF;
    END IF;
    
    -- Sprawdzanie dla user_dance_preferences
    IF TG_TABLE_NAME = 'user_dance_preferences' THEN
        SELECT COUNT(*) INTO pinned_count 
        FROM user_dance_preferences 
        WHERE user_id = NEW.user_id 
        AND preference_type = NEW.preference_type
        AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid);
        
        IF pinned_count >= max_preferences THEN
            RAISE EXCEPTION 'Możesz mieć maksymalnie % preferencji typu %', max_preferences, NEW.preference_type;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 6. Dodaj triggery
CREATE TRIGGER trg_check_pinned_skills_limit
    BEFORE INSERT OR UPDATE ON user_dance_styles
    FOR EACH ROW
    WHEN (NEW.is_pinned = true)
    EXECUTE FUNCTION fn_check_pinned_styles_limit();

CREATE TRIGGER trg_check_preferences_limit
    BEFORE INSERT OR UPDATE ON user_dance_preferences
    FOR EACH ROW
    EXECUTE FUNCTION fn_check_pinned_styles_limit();

-- 7. Funkcja do automatycznego sortowania przypiętych stylów
CREATE OR REPLACE FUNCTION fn_reorder_pinned_styles(
    p_user_id UUID
) RETURNS VOID AS $$
DECLARE
    v_row RECORD;
    v_order INTEGER := 0;
BEGIN
    FOR v_row IN 
        SELECT id 
        FROM user_dance_styles 
        WHERE user_id = p_user_id 
        AND is_pinned = true 
        ORDER BY pinned_at ASC
    LOOP
        UPDATE user_dance_styles 
        SET pin_order = v_order 
        WHERE id = v_row.id;
        
        v_order := v_order + 1;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- 8. Włącz RLS dla nowej tabeli
ALTER TABLE user_dance_preferences ENABLE ROW LEVEL SECURITY;

-- 9. Polityki RLS dla user_dance_preferences
CREATE POLICY "User preferences viewable based on user visibility" 
    ON user_dance_preferences
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM users u 
            WHERE u.id = user_id 
            AND (u.visibility = 'public' OR u.id = auth.uid())
        )
    );

CREATE POLICY "Users can manage own preferences" 
    ON user_dance_preferences
    FOR ALL
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- 10. Rozszerz widok v_public_dancers o przypięte style
DROP VIEW IF EXISTS v_public_dancers CASCADE;

CREATE VIEW v_public_dancers AS
SELECT 
    u.id,
    u.name,
    u.bio,
    CASE 
        WHEN u.show_age THEN DATE_PART('year', AGE(u.birth_date))::INTEGER 
        ELSE NULL 
    END as age,
    u.height,
    u.profile_photo_url,
    CASE 
        WHEN u.show_exact_location THEN u.location_lat 
        ELSE NULL 
    END as location_lat,
    CASE 
        WHEN u.show_exact_location THEN u.location_lng 
        ELSE NULL 
    END as location_lng,
    u.city,
    u.is_trainer,
    u.is_verified,
    u.created_at,
    -- Wszystkie style tańca
    ARRAY_AGG(
        DISTINCT jsonb_build_object(
            'style_id', ds.id,
            'style_name', ds.name,
            'skill_level', uds.skill_level,
            'is_teaching', uds.is_teaching,
            'is_pinned', uds.is_pinned,
            'pin_order', uds.pin_order
        )
    ) FILTER (WHERE ds.id IS NOT NULL) as dance_styles,
    -- Tylko przypięte style (dla łatwego dostępu)
    ARRAY_AGG(
        DISTINCT jsonb_build_object(
            'style_id', ds.id,
            'style_name', ds.name,
            'skill_level', uds.skill_level,
            'is_teaching', uds.is_teaching
        ) ORDER BY uds.pin_order
    ) FILTER (WHERE ds.id IS NOT NULL AND uds.is_pinned = true) as pinned_styles,
    -- Preferencje
    jsonb_object_agg(
        DISTINCT udp.preference_type,
        ARRAY_AGG(
            DISTINCT jsonb_build_object(
                'style_id', ds2.id,
                'style_name', ds2.name,
                'priority', udp.priority
            ) ORDER BY udp.priority DESC
        )
    ) FILTER (WHERE udp.id IS NOT NULL) as dance_preferences
FROM users u
LEFT JOIN user_dance_styles uds ON u.id = uds.user_id
LEFT JOIN dance_styles ds ON uds.dance_style_id = ds.id
LEFT JOIN user_dance_preferences udp ON u.id = udp.user_id
LEFT JOIN dance_styles ds2 ON udp.dance_style_id = ds2.id
WHERE u.is_active = true 
    AND u.is_banned = false 
    AND u.visibility = 'public'
GROUP BY u.id;

-- 11. Widok dla dopasowań po preferencjach
CREATE VIEW v_preference_matches AS
WITH user_preferences AS (
    SELECT 
        user_id,
        ARRAY_AGG(DISTINCT dance_style_id) as preferred_styles
    FROM (
        SELECT user_id, dance_style_id 
        FROM user_dance_styles 
        WHERE is_pinned = true
        UNION
        SELECT user_id, dance_style_id 
        FROM user_dance_preferences 
        WHERE preference_type IN ('favorite', 'want_to_learn')
    ) combined
    GROUP BY user_id
)
SELECT 
    u1.user_id as user_id,
    u2.user_id as matched_user_id,
    ARRAY_LENGTH(
        ARRAY(
            SELECT UNNEST(u1.preferred_styles) 
            INTERSECT 
            SELECT UNNEST(u2.preferred_styles)
        ), 
        1
    ) as common_styles_count,
    ARRAY(
        SELECT UNNEST(u1.preferred_styles) 
        INTERSECT 
        SELECT UNNEST(u2.preferred_styles)
    ) as common_style_ids
FROM user_preferences u1
CROSS JOIN user_preferences u2
WHERE u1.user_id != u2.user_id
AND u1.preferred_styles && u2.preferred_styles; -- Mają wspólne elementy

-- 12. Funkcje pomocnicze

-- Przypnij styl tańca
CREATE OR REPLACE FUNCTION fn_pin_dance_style(
    p_user_id UUID,
    p_dance_style_id UUID
) RETURNS BOOLEAN AS $$
DECLARE
    v_exists BOOLEAN;
BEGIN
    -- Sprawdź czy użytkownik ma ten styl
    SELECT EXISTS(
        SELECT 1 FROM user_dance_styles 
        WHERE user_id = p_user_id 
        AND dance_style_id = p_dance_style_id
    ) INTO v_exists;
    
    IF NOT v_exists THEN
        RAISE EXCEPTION 'Nie możesz przypiąć stylu, którego nie masz w profilu';
    END IF;
    
    -- Przypnij styl
    UPDATE user_dance_styles 
    SET is_pinned = true, 
        pinned_at = now(),
        pin_order = (
            SELECT COALESCE(MAX(pin_order), -1) + 1 
            FROM user_dance_styles 
            WHERE user_id = p_user_id 
            AND is_pinned = true
        )
    WHERE user_id = p_user_id 
    AND dance_style_id = p_dance_style_id;
    
    RETURN true;
END;
$$ LANGUAGE plpgsql;

-- Odepnij styl tańca
CREATE OR REPLACE FUNCTION fn_unpin_dance_style(
    p_user_id UUID,
    p_dance_style_id UUID
) RETURNS BOOLEAN AS $$
BEGIN
    UPDATE user_dance_styles 
    SET is_pinned = false, 
        pinned_at = NULL,
        pin_order = 0
    WHERE user_id = p_user_id 
    AND dance_style_id = p_dance_style_id;
    
    -- Przeorganizuj kolejność pozostałych
    PERFORM fn_reorder_pinned_styles(p_user_id);
    
    RETURN true;
END;
$$ LANGUAGE plpgsql;

-- Znajdź użytkowników z podobnymi preferencjami
CREATE OR REPLACE FUNCTION fn_find_similar_users(
    p_user_id UUID,
    p_limit INTEGER DEFAULT 20
) RETURNS TABLE (
    user_id UUID,
    name TEXT,
    profile_photo_url TEXT,
    city TEXT,
    common_styles INTEGER,
    similarity_score NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    WITH my_preferences AS (
        SELECT ARRAY_AGG(DISTINCT dance_style_id) as styles
        FROM (
            SELECT dance_style_id FROM user_dance_styles 
            WHERE user_id = p_user_id AND is_pinned = true
            UNION
            SELECT dance_style_id FROM user_dance_preferences 
            WHERE user_id = p_user_id
        ) p
    )
    SELECT 
        u.id,
        u.name,
        u.profile_photo_url,
        u.city,
        pm.common_styles_count,
        -- Oblicz wynik podobieństwa (0-100)
        ROUND(
            (pm.common_styles_count::NUMERIC / 
            GREATEST(ARRAY_LENGTH(mp.styles, 1), 1)::NUMERIC) * 100, 
            2
        ) as similarity_score
    FROM users u
    INNER JOIN v_preference_matches pm ON u.id = pm.matched_user_id
    CROSS JOIN my_preferences mp
    WHERE pm.user_id = p_user_id
    AND u.is_active = true
    AND u.is_banned = false
    AND u.visibility = 'public'
    ORDER BY pm.common_styles_count DESC, u.last_seen_at DESC NULLS LAST
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- 13. Przykłady użycia

/*
-- Przypnij styl dla bieżącego użytkownika
SELECT fn_pin_dance_style(auth.uid(), 'salsa-style-id');

-- Dodaj preferencję "chcę się nauczyć"
INSERT INTO user_dance_preferences (user_id, dance_style_id, preference_type, priority)
VALUES (auth.uid(), 'bachata-style-id', 'want_to_learn', 1);

-- Znajdź podobnych użytkowników
SELECT * FROM fn_find_similar_users(auth.uid(), 10);

-- Pobierz przypięte style użytkownika
SELECT 
    ds.name,
    ds.category,
    uds.skill_level,
    uds.pin_order
FROM user_dance_styles uds
JOIN dance_styles ds ON uds.dance_style_id = ds.id
WHERE uds.user_id = auth.uid()
AND uds.is_pinned = true
ORDER BY uds.pin_order;
*/