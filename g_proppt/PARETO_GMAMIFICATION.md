-- 8. FUNKCJA DLA ORGANIZATORA DO POTWIERDZANIA UCZESTNICTWA
CREATE OR REPLACE FUNCTION fn_confirm_attendance(
    p_event_id UUID,
    p_user_ids UUID[]
) RETURNS VOID AS $
BEGIN
    -- Organizator potwierdza uczestnictwo wielu osób naraz
    UPDATE event_participants
    SET 
        status = 'attended',
        attended_at = now()
    WHERE event_id = p_event_id
        AND user_id = ANY(p_user_ids)
        AND status IN ('registered', 'confirmed');
END;
$ LANGUAGE plpgsql;

-- 9. WIDOK DLA ORGANIZATORA - LISTA DO POTWIERDZENIA
CREATE VIEW v_event_attendance_list AS
SELECT 
    ep.id,
    ep.event_id,
    e.title as event_title,
    e.start_at as event_date,
    u.id as user_id,
    u.name as user_name,
    u.profile_photo_url,
    ep.status,
    ep.attended_at,
    ep.payment_status,
    CASE 
        WHEN ep.attended_at IS NOT NULL THEN 'confirmed'
        WHEN ep.status = 'attended' THEN 'pending_confirmation'
        ELSE 'not_attended'
    END as attendance_status
FROM event_participants ep
JOIN events e ON ep.event_id = e.id
JOIN users u ON ep.user_id = u.id
WHERE e.end_at < now()  -- Wydarzenie już się zakończyło
ORDER BY e.start_at DESC, u.name;

-- =====================================================
-- MINIMALISTYCZNY SYSTEM WYZWAŃ DLA APLIKACJI TANECZNEJ
-- =====================================================

-- 1. PODSTAWOWA TABELA WYZWAŃ
CREATE TABLE challenges (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    creator_id UUID NOT NULL REFERENCES users(id),
    
    -- Podstawowe info
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    emoji TEXT DEFAULT '🎯', -- Ikona wyzwania
    
    -- Warunek do spełnienia (prosty i weryfikowalny)
    challenge_type TEXT NOT NULL CHECK (challenge_type IN (
        'attend_events',      -- Weź udział w X wydarzeniach
        'try_dance_style',    -- Spróbuj stylu Y
        'dance_with_people',  -- Zatańcz z X różnymi osobami
        'practice_days',      -- Ćwicz przez X dni
        'get_reviews',        -- Zbierz X pozytywnych recenzji
        'complete_series',    -- Ukończ serię wydarzeń
        'maintain_streak'     -- Utrzymaj streak uczestnictwa
    )),
    
    -- Parametry wyzwania
    target_value INTEGER NOT NULL, -- np. 5 wydarzeń
    target_style_id UUID REFERENCES dance_styles(id), -- opcjonalnie dla 'try_dance_style'
    
    -- Parametry dla serii (opcjonalne)
    series_frequency TEXT CHECK (series_frequency IN ('weekly', 'biweekly', 'twice_weekly')),
    series_min_weeks INTEGER, -- minimalna liczba tygodni uczestnictwa
    
    -- Czas trwania
    duration_days INTEGER NOT NULL DEFAULT 7, -- 7, 14, 30 dni
    expires_at TIMESTAMPTZ NOT NULL,
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    participant_count INTEGER DEFAULT 0,
    
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. UCZESTNICY WYZWAŃ
CREATE TABLE challenge_participants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    challenge_id UUID NOT NULL REFERENCES challenges(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id),
    
    -- Postęp (automatycznie aktualizowany)
    current_progress INTEGER DEFAULT 0,
    completed BOOLEAN DEFAULT false,
    completed_at TIMESTAMPTZ,
    
    -- Dla serii - śledzenie streak'a
    current_streak_weeks INTEGER DEFAULT 0,
    longest_streak_weeks INTEGER DEFAULT 0,
    last_attendance_week INTEGER, -- numer tygodnia ostatniej aktywności
    missed_weeks INTEGER DEFAULT 0,
    
    joined_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(challenge_id, user_id)
);

-- 3. FUNKCJA WERYFIKUJĄCA POSTĘP
CREATE OR REPLACE FUNCTION fn_verify_challenge_progress(
    p_participant_id UUID
) RETURNS VOID AS $$
DECLARE
    v_challenge challenges%ROWTYPE;
    v_participant challenge_participants%ROWTYPE;
    v_progress INTEGER;
BEGIN
    -- Pobierz dane
    SELECT cp.*, c.* INTO v_participant, v_challenge
    FROM challenge_participants cp
    JOIN challenges c ON cp.challenge_id = c.id
    WHERE cp.id = p_participant_id;
    
    -- Oblicz postęp w zależności od typu
    CASE v_challenge.challenge_type
        WHEN 'attend_events' THEN
            -- Policz wydarzenia od dołączenia do wyzwania
            SELECT COUNT(*) INTO v_progress
            FROM event_participants ep
            WHERE ep.user_id = v_participant.user_id
                AND ep.status = 'attended'
                AND ep.confirmed_at >= v_participant.joined_at;
                
        WHEN 'try_dance_style' THEN
            -- Sprawdź czy uczestniczył w wydarzeniu z danym stylem
            SELECT COUNT(DISTINCT e.id) INTO v_progress
            FROM event_participants ep
            JOIN events e ON ep.event_id = e.id
            WHERE ep.user_id = v_participant.user_id
                AND ep.status = 'attended'
                AND ep.attended_at IS NOT NULL  -- Organizator potwierdził uczestnictwo
                AND e.dance_style_id = v_challenge.target_style_id
                AND ep.attended_at >= v_participant.joined_at;
                
        WHEN 'dance_with_people' THEN
            -- Policz unikalne osoby z którymi tańczył (przez dopasowania)
            SELECT COUNT(*) INTO v_progress
            FROM (
                SELECT DISTINCT 
                    CASE 
                        WHEN l.from_user_id = v_participant.user_id THEN l.to_user_id
                        ELSE l.from_user_id
                    END as partner_id
                FROM likes l
                WHERE (l.from_user_id = v_participant.user_id OR l.to_user_id = v_participant.user_id)
                    AND l.created_at >= v_participant.joined_at
                    AND EXISTS (
                        -- Sprawdź czy jest dopasowanie (obie strony polubiły)
                        SELECT 1 FROM likes l2 
                        WHERE l2.from_user_id = l.to_user_id 
                        AND l2.to_user_id = l.from_user_id
                    )
            ) matches;
            
        WHEN 'get_reviews' THEN
            -- Policz pozytywne recenzje (4+)
            SELECT COUNT(*) INTO v_progress
            FROM reviews r
            WHERE r.reviewed_user_id = v_participant.user_id
                AND r.rating_overall >= 4
                AND r.created_at >= v_participant.joined_at;
                
        WHEN 'complete_series' THEN
            -- Sprawdź uczestnictwo w serii wydarzeń
            WITH series_attendance AS (
                SELECT 
                    DATE_PART('week', ep.attended_at) as week_number,
                    COUNT(*) as events_in_week
                FROM event_participants ep
                JOIN events e ON ep.event_id = e.id
                WHERE ep.user_id = v_participant.user_id
                    AND ep.status = 'attended'
                    AND ep.attended_at IS NOT NULL
                    AND ep.attended_at >= v_participant.joined_at
                    AND e.parent_event_id IS NOT NULL  -- Wydarzenia należące do serii
                GROUP BY DATE_PART('week', ep.attended_at)
            )
            SELECT COUNT(DISTINCT week_number) INTO v_progress
            FROM series_attendance
            WHERE events_in_week >= CASE 
                WHEN v_challenge.series_frequency = 'twice_weekly' THEN 2
                ELSE 1
            END;
            
        WHEN 'maintain_streak' THEN
            -- Oblicz aktualny streak (kolejne tygodnie bez przerwy)
            WITH weekly_attendance AS (
                SELECT DISTINCT
                    DATE_PART('week', ep.attended_at) as week_number,
                    DATE_PART('year', ep.attended_at) as year_number
                FROM event_participants ep
                WHERE ep.user_id = v_participant.user_id
                    AND ep.status = 'attended'
                    AND ep.attended_at IS NOT NULL
                    AND ep.attended_at >= v_participant.joined_at
                ORDER BY year_number DESC, week_number DESC
            ),
            streak_calc AS (
                SELECT 
                    week_number,
                    year_number,
                    week_number - ROW_NUMBER() OVER (ORDER BY year_number, week_number) as streak_group
                FROM weekly_attendance
            )
            SELECT COUNT(*) INTO v_progress
            FROM streak_calc
            WHERE streak_group = (SELECT MAX(streak_group) FROM streak_calc);
            
        WHEN 'practice_days' THEN
            -- Policz dni z aktywnością
            SELECT COUNT(DISTINCT DATE(ep.attended_at)) INTO v_progress
            FROM event_participants ep
            WHERE ep.user_id = v_participant.user_id
                AND ep.status = 'attended'
                AND ep.attended_at IS NOT NULL
                AND ep.attended_at >= v_participant.joined_at;
    END CASE;
    
    -- Aktualizuj postęp
    UPDATE challenge_participants
    SET 
        current_progress = v_progress,
        completed = (v_progress >= v_challenge.target_value),
        completed_at = CASE 
            WHEN v_progress >= v_challenge.target_value AND completed = false 
            THEN now() 
            ELSE completed_at 
        END
    WHERE id = p_participant_id;
    
END;
$$ LANGUAGE plpgsql;

-- 4. TRIGGER AUTOMATYCZNEJ WERYFIKACJI
CREATE OR REPLACE FUNCTION fn_auto_verify_challenges()
RETURNS TRIGGER AS $$
BEGIN
    -- Znajdź aktywne wyzwania użytkownika i zweryfikuj postęp
    PERFORM fn_verify_challenge_progress(cp.id)
    FROM challenge_participants cp
    JOIN challenges c ON cp.challenge_id = c.id
    WHERE cp.user_id = COALESCE(NEW.user_id, NEW.reviewed_user_id, NEW.from_user_id)
        AND cp.completed = false
        AND c.is_active = true
        AND c.expires_at > now();
        
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. PODŁĄCZ TRIGGERY DO ISTNIEJĄCYCH TABEL
CREATE TRIGGER trg_verify_on_event_attendance
    AFTER UPDATE OF status, attended_at ON event_participants
    FOR EACH ROW
    WHEN (NEW.status = 'attended' AND NEW.attended_at IS NOT NULL)
    EXECUTE FUNCTION fn_auto_verify_challenges();

CREATE TRIGGER trg_verify_on_new_like
    AFTER INSERT ON likes
    FOR EACH ROW
    EXECUTE FUNCTION fn_auto_verify_challenges();

CREATE TRIGGER trg_verify_on_new_review
    AFTER INSERT ON reviews
    FOR EACH ROW
    EXECUTE FUNCTION fn_auto_verify_challenges();

-- 6. WIDOK AKTYWNYCH WYZWAŃ
CREATE VIEW v_active_challenges AS
SELECT 
    c.*,
    u.name as creator_name,
    u.profile_photo_url as creator_photo,
    ds.name as target_style_name,
    COUNT(cp.id) as participant_count,
    COUNT(cp.id) FILTER (WHERE cp.completed) as completed_count,
    ROUND(100.0 * COUNT(cp.id) FILTER (WHERE cp.completed) / NULLIF(COUNT(cp.id), 0), 0) as completion_rate
FROM challenges c
JOIN users u ON c.creator_id = u.id
LEFT JOIN dance_styles ds ON c.target_style_id = ds.id
LEFT JOIN challenge_participants cp ON c.id = cp.challenge_id
WHERE c.is_active = true AND c.expires_at > now()
GROUP BY c.id, u.id, ds.id;

-- 7. PRZYKŁADOWE WYZWANIA
INSERT INTO challenges (creator_id, title, description, challenge_type, target_value, duration_days, expires_at) VALUES
-- (użyj rzeczywistego UUID użytkownika)
('00000000-0000-0000-0000-000000000000', 
 '5 Tańców w Tydzień', 
 'Weź udział w 5 wydarzeniach tanecznych w ciągu tygodnia!', 
 'attend_events', 
 5, 
 7, 
 now() + INTERVAL '7 days');

-- Przykład wyzwania serii
INSERT INTO challenges (creator_id, title, description, challenge_type, target_value, series_frequency, series_min_weeks, duration_days, expires_at, emoji) VALUES
('00000000-0000-0000-0000-000000000000',
 'Kurs Bachaty - 8 tygodni',
 'Ukończ pełny kurs bachaty - minimum 1 zajęcia tygodniowo przez 8 tygodni',
 'complete_series',
 8,  -- 8 tygodni
 'weekly',
 8,
 56, -- 8 tygodni
 now() + INTERVAL '56 days',
 '💃');

-- Przykład wyzwania streak
INSERT INTO challenges (creator_id, title, description, challenge_type, target_value, series_frequency, duration_days, expires_at, emoji) VALUES
('00000000-0000-0000-0000-000000000000',
 'Mistrz Regularności',
 'Utrzymaj streak 4 tygodni regularnych treningów - minimum 2 razy w tygodniu!',
 'maintain_streak',
 4,  -- 4 tygodnie streak
 'twice_weekly',
 30,
 now() + INTERVAL '30 days',
 '🔥');

-- =====================================================
-- INSTRUKCJA IMPLEMENTACJI
-- =====================================================

/*
IMPLEMENTACJA W APLIKACJI:

1. TWORZENIE WYZWANIA (UI):
   - Formularz z:
     * Tytuł (max 50 znaków)
     * Opis (max 200 znaków)
     * Typ wyzwania (dropdown z 5 opcji)
     * Wartość docelowa (slider/input)
     * Czas trwania (7, 14, 30 dni)
   
2. DOŁĄCZANIE DO WYZWANIA:
   - Przycisk "Dołącz" → INSERT INTO challenge_participants
   - Automatyczne sprawdzenie postępu co godzinę lub przy każdej akcji

3. WYŚWIETLANIE POSTĘPU:
   - Progress bar: current_progress / target_value * 100%
   - Lista uczestników z ich postępem
   - Badge/animacja przy ukończeniu

4. FLOW UŻYTKOWNIKA:
   a) User A tworzy wyzwanie "5 wydarzeń Salsa w 2 tygodnie"
   b) Users B, C, D dołączają
   c) System automatycznie śledzi ich uczestnictwo w wydarzeniach
   d) Po każdym wydarzeniu aktualizuje się progress bar
   e) Po osiągnięciu celu - gratulacje i znaczek ukończenia

5. OGRANICZENIA:
   - Max 3 aktywne wyzwania na użytkownika
   - Min 5 uczestników żeby wyzwanie się rozpoczęło
   - Wyzwania nie mogą być edytowane po rozpoczęciu

6. NOTYFIKACJE:
   - Push gdy ktoś dołącza do Twojego wyzwania
   - Push gdy ukończysz wyzwanie
   - Przypomnienie gdy zostało 24h do końca

7. SOCIAL PROOF:
   - Feed z aktywnościami: "Anna ukończyła wyzwanie X"
   - Możliwość udostępnienia ukończonego wyzwania
*/