-- =====================================================
-- DANCE APP DATABASE SCHEMA
-- =====================================================

-- Włącz niezbędne rozszerzenia
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";
CREATE EXTENSION IF NOT EXISTS "cube";
CREATE EXTENSION IF NOT EXISTS "earthdistance";

-- =====================================================
-- 1. TABELE PODSTAWOWE (CORE TABLES)
-- =====================================================

-- Użytkownicy - centralna tabela
CREATE TABLE users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    bio TEXT,
    profile_photo_url TEXT,
    birth_date DATE,
    height INTEGER,
    -- Lokalizacja
    location_lat NUMERIC(9,6),
    location_lng NUMERIC(9,6),
    city TEXT,
    search_radius_km INTEGER DEFAULT 50,
    -- Role i statusy
    is_trainer BOOLEAN DEFAULT false,
    is_school_owner BOOLEAN DEFAULT false,
    is_verified BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    is_banned BOOLEAN DEFAULT false,
    -- Preferencje
    show_age BOOLEAN DEFAULT true,
    show_exact_location BOOLEAN DEFAULT false,
    visibility TEXT DEFAULT 'public' CHECK (visibility IN ('public', 'friends', 'private')),
    -- Metadata
    last_seen_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Style tańca
CREATE TABLE dance_styles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT UNIQUE NOT NULL,
    category TEXT CHECK (category IN ('ballroom', 'latin', 'street', 'folk', 'other')),
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Umiejętności użytkowników
CREATE TABLE user_dance_styles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    dance_style_id UUID NOT NULL REFERENCES dance_styles(id) ON DELETE CASCADE,
    skill_level TEXT NOT NULL CHECK (skill_level IN ('beginner', 'intermediate', 'advanced', 'professional')),
    years_experience INTEGER,
    is_teaching BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(user_id, dance_style_id)
);

-- Zdjęcia użytkowników
CREATE TABLE user_photos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    photo_url TEXT NOT NULL,
    thumbnail_url TEXT,
    caption TEXT,
    is_primary BOOLEAN DEFAULT false,
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- 2. WYDARZENIA (EVENTS)
-- =====================================================

-- Wydarzenia
CREATE TABLE events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organizer_id UUID NOT NULL REFERENCES users(id),
    title TEXT NOT NULL,
    description TEXT,
    -- Typ i styl
    event_type TEXT NOT NULL CHECK (event_type IN ('lesson', 'workshop', 'social', 'competition', 'performance')),
    dance_style_id UUID REFERENCES dance_styles(id),
    -- Czas
    start_at TIMESTAMPTZ NOT NULL,
    end_at TIMESTAMPTZ NOT NULL,
    -- Cykl
    is_recurring BOOLEAN DEFAULT false,
    recurrence_rule JSONB,
    parent_event_id UUID REFERENCES events(id),
    -- Lokalizacja
    location_type TEXT NOT NULL CHECK (location_type IN ('physical', 'online', 'hybrid')),
    location_name TEXT,
    address TEXT,
    city TEXT,
    location_lat NUMERIC(9,6),
    location_lng NUMERIC(9,6),
    online_platform TEXT,
    online_link TEXT,
    -- Zewnętrzna strony wydarzenia
    website_url TEXT,
    registration_url TEXT,
    -- Uczestnicy i poziom
    min_participants INTEGER DEFAULT 1,
    max_participants INTEGER,
    participant_count INTEGER DEFAULT 0,
    skill_level_min TEXT CHECK (skill_level_min IN ('beginner', 'intermediate', 'advanced', 'professional')),
    skill_level_max TEXT CHECK (skill_level_max IN ('beginner', 'intermediate', 'advanced', 'professional')),
    -- Cena
    price NUMERIC(10,2) DEFAULT 0,
    currency TEXT DEFAULT 'PLN',
    early_bird_price NUMERIC(10,2),
    early_bird_deadline DATE,
    -- Wymagania
    requires_partner BOOLEAN DEFAULT false,
    age_min INTEGER,
    age_max INTEGER,
    -- Status
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'cancelled', 'completed')),
    visibility TEXT DEFAULT 'public' CHECK (visibility IN ('public', 'private', 'unlisted')),
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Uczestnicy wydarzeń
CREATE TABLE event_participants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id),
    -- Status i płatność
    status TEXT DEFAULT 'registered' CHECK (status IN ('registered', 'confirmed', 'waitlist', 'attended', 'cancelled')),
    paid_amount NUMERIC(10,2) DEFAULT 0,
    payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'refunded')),
    payment_method TEXT,
    -- Partner
    partner_id UUID REFERENCES users(id),
    -- Metadata
    notes TEXT,
    registered_at TIMESTAMPTZ DEFAULT now(),
    confirmed_at TIMESTAMPTZ,
    cancelled_at TIMESTAMPTZ,
    UNIQUE(event_id, user_id)
);

-- =====================================================
-- 3. DOPASOWANIA (MATCHING)
-- =====================================================

-- Polubienia
CREATE TABLE likes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    from_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    to_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(from_user_id, to_user_id),
    CHECK (from_user_id != to_user_id)
);

-- Ulubione profile
CREATE TABLE favorite_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    favorite_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(user_id, favorite_user_id),
    CHECK (user_id != favorite_user_id)
);

-- =====================================================
-- 4. KOMUNIKACJA (MESSAGING)
-- =====================================================

-- Konwersacje
CREATE TABLE conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ DEFAULT now(),
    last_message_at TIMESTAMPTZ,
    last_message_preview TEXT
);

-- Uczestnicy konwersacji
CREATE TABLE conversation_participants (
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    -- Status
    unread_count INTEGER DEFAULT 0,
    last_read_at TIMESTAMPTZ,
    is_archived BOOLEAN DEFAULT false,
    is_muted BOOLEAN DEFAULT false,
    -- Metadata
    joined_at TIMESTAMPTZ DEFAULT now(),
    PRIMARY KEY (conversation_id, user_id)
);

-- Wiadomości
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES users(id),
    content TEXT NOT NULL,
    -- Status
    is_edited BOOLEAN DEFAULT false,
    edited_at TIMESTAMPTZ,
    is_deleted BOOLEAN DEFAULT false,
    deleted_at TIMESTAMPTZ,
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Status przeczytania wiadomości
CREATE TABLE message_reads (
    message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    read_at TIMESTAMPTZ DEFAULT now(),
    PRIMARY KEY (message_id, user_id)
);

-- =====================================================
-- 5. RECENZJE I OCENY (REVIEWS)
-- =====================================================

-- Recenzje
CREATE TABLE reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reviewer_id UUID NOT NULL REFERENCES users(id),
    reviewed_user_id UUID REFERENCES users(id),
    event_id UUID REFERENCES events(id),
    -- Oceny
    rating_overall INTEGER NOT NULL CHECK (rating_overall BETWEEN 1 AND 5),
    rating_teaching INTEGER CHECK (rating_teaching BETWEEN 1 AND 5),
    rating_atmosphere INTEGER CHECK (rating_atmosphere BETWEEN 1 AND 5),
    rating_organization INTEGER CHECK (rating_organization BETWEEN 1 AND 5),
    -- Treść
    content TEXT,
    -- Status
    is_visible BOOLEAN DEFAULT true,
    is_verified_booking BOOLEAN DEFAULT false,
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(reviewer_id, reviewed_user_id, event_id)
);

-- =====================================================
-- 6. ZGŁOSZENIA I MODERACJA (MODERATION)
-- =====================================================

-- Zgłoszenia użytkowników
CREATE TABLE user_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reporter_id UUID NOT NULL REFERENCES users(id),
    reported_user_id UUID REFERENCES users(id),
    reported_event_id UUID REFERENCES events(id),
    -- Szczegóły
    reason TEXT NOT NULL CHECK (reason IN ('spam', 'fake_profile', 'inappropriate_content', 'harassment', 'other')),
    description TEXT,
    -- Status
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewing', 'resolved', 'dismissed')),
    resolution_notes TEXT,
    resolved_by UUID REFERENCES users(id),
    resolved_at TIMESTAMPTZ,
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- 7. WIDOKI (VIEWS)
-- =====================================================

-- Widok dopasowań
CREATE VIEW v_matches AS
SELECT 
    l1.from_user_id as user1_id,
    l1.to_user_id as user2_id,
    l1.created_at as matched_at
FROM likes l1
INNER JOIN likes l2 
    ON l1.from_user_id = l2.to_user_id 
    AND l1.to_user_id = l2.from_user_id
WHERE l1.from_user_id < l1.to_user_id;

-- Widok publicznych profili tancerzy
CREATE VIEW v_public_dancers AS
SELECT 
    u.id,
    u.name,
    u.bio,
    CASE 
        WHEN u.show_age THEN DATE_PART('year', AGE(u.birth_date))::INTEGER 
        ELSE NULL 
    END as age,
    u.height,  -- Dodane pole wzrostu
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
    ARRAY_AGG(
        DISTINCT jsonb_build_object(
            'style_id', ds.id,
            'style_name', ds.name,
            'skill_level', uds.skill_level,
            'is_teaching', uds.is_teaching
        )
    ) FILTER (WHERE ds.id IS NOT NULL) as dance_styles
FROM users u
LEFT JOIN user_dance_styles uds ON u.id = uds.user_id
LEFT JOIN dance_styles ds ON uds.dance_style_id = ds.id
WHERE u.is_active = true 
    AND u.is_banned = false 
    AND u.visibility = 'public'
GROUP BY u.id;

-- Widok wydarzeń z dodatkowymi informacjami
CREATE VIEW v_events_detailed AS
SELECT 
    e.*,
    u.name as organizer_name,
    u.profile_photo_url as organizer_photo,
    u.is_verified as organizer_verified,
    ds.name as dance_style_name,
    ds.category as dance_style_category,
    COUNT(DISTINCT ep.user_id) FILTER (WHERE ep.status IN ('confirmed', 'attended')) as confirmed_participants,
    COUNT(DISTINCT r.id) as review_count,
    AVG(r.rating_overall)::NUMERIC(3,2) as average_rating
FROM events e
JOIN users u ON e.organizer_id = u.id
LEFT JOIN dance_styles ds ON e.dance_style_id = ds.id
LEFT JOIN event_participants ep ON e.id = ep.event_id
LEFT JOIN reviews r ON e.id = r.event_id AND r.is_visible = true
GROUP BY e.id, u.id, ds.id;

-- Widok statystyk trenerów
CREATE VIEW v_trainer_stats AS
SELECT 
    u.id as trainer_id,
    u.name,
    COUNT(DISTINCT e.id) as total_events,
    COUNT(DISTINCT ep.user_id) as unique_students,
    AVG(e.participant_count)::NUMERIC(5,2) as avg_participants,
    SUM(ep.paid_amount) as total_revenue,
    COUNT(DISTINCT r.id) as review_count,
    AVG(r.rating_overall)::NUMERIC(3,2) as average_rating,
    ARRAY_AGG(DISTINCT ds.name) FILTER (WHERE uds.is_teaching = true) as teaching_styles
FROM users u
LEFT JOIN events e ON u.id = e.organizer_id AND e.status = 'completed'
LEFT JOIN event_participants ep ON e.id = ep.event_id AND ep.status = 'attended'
LEFT JOIN reviews r ON u.id = r.reviewed_user_id AND r.is_visible = true
LEFT JOIN user_dance_styles uds ON u.id = uds.user_id AND uds.is_teaching = true
LEFT JOIN dance_styles ds ON uds.dance_style_id = ds.id
WHERE u.is_trainer = true
GROUP BY u.id;

-- =====================================================
-- 8. FUNKCJE (FUNCTIONS)
-- =====================================================

-- Funkcja aktualizująca updated_at
CREATE OR REPLACE FUNCTION fn_update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Funkcja aktualizująca licznik uczestników
CREATE OR REPLACE FUNCTION fn_update_event_participant_count()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE events 
    SET participant_count = (
        SELECT COUNT(*) 
        FROM event_participants 
        WHERE event_id = COALESCE(NEW.event_id, OLD.event_id)
        AND status IN ('registered', 'confirmed', 'attended')
    )
    WHERE id = COALESCE(NEW.event_id, OLD.event_id);
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Funkcja aktualizująca ostatnią wiadomość w konwersacji
CREATE OR REPLACE FUNCTION fn_update_conversation_last_message()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE conversations
    SET 
        last_message_at = NEW.created_at,
        last_message_preview = LEFT(NEW.content, 100)
    WHERE id = NEW.conversation_id;
    
    -- Zwiększ licznik nieprzeczytanych dla wszystkich oprócz nadawcy
    UPDATE conversation_participants
    SET unread_count = unread_count + 1
    WHERE conversation_id = NEW.conversation_id
        AND user_id != NEW.sender_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Funkcja resetująca licznik nieprzeczytanych
CREATE OR REPLACE FUNCTION fn_reset_unread_count()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE conversation_participants
    SET 
        unread_count = 0,
        last_read_at = NEW.read_at
    WHERE conversation_id = (
        SELECT conversation_id FROM messages WHERE id = NEW.message_id
    )
    AND user_id = NEW.user_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Funkcja sprawdzająca limit zdjęć
CREATE OR REPLACE FUNCTION fn_check_photo_limit()
RETURNS TRIGGER AS $$
DECLARE
    photo_count INTEGER;
    max_photos INTEGER := 10;
BEGIN
    SELECT COUNT(*) INTO photo_count 
    FROM user_photos 
    WHERE user_id = NEW.user_id;
    
    IF photo_count >= max_photos THEN
        RAISE EXCEPTION 'Przekroczono limit % zdjęć', max_photos;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Funkcja tworząca konwersację dla dopasowania
CREATE OR REPLACE FUNCTION fn_create_match_conversation()
RETURNS TRIGGER AS $$
DECLARE
    v_conversation_id UUID;
BEGIN
    -- Sprawdź czy to dopasowanie (wzajemne polubienie)
    IF EXISTS (
        SELECT 1 FROM likes 
        WHERE from_user_id = NEW.to_user_id 
        AND to_user_id = NEW.from_user_id
    ) THEN
        -- Utwórz konwersację
        INSERT INTO conversations (id) 
        VALUES (uuid_generate_v4()) 
        RETURNING id INTO v_conversation_id;
        
        -- Dodaj uczestników
        INSERT INTO conversation_participants (conversation_id, user_id)
        VALUES 
            (v_conversation_id, NEW.from_user_id),
            (v_conversation_id, NEW.to_user_id);
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 9. TRIGGERY (TRIGGERS)
-- =====================================================

-- Trigger dla updated_at
CREATE TRIGGER trg_users_updated_at 
    BEFORE UPDATE ON users 
    FOR EACH ROW 
    EXECUTE FUNCTION fn_update_updated_at();

CREATE TRIGGER trg_user_dance_styles_updated_at 
    BEFORE UPDATE ON user_dance_styles 
    FOR EACH ROW 
    EXECUTE FUNCTION fn_update_updated_at();

CREATE TRIGGER trg_events_updated_at 
    BEFORE UPDATE ON events 
    FOR EACH ROW 
    EXECUTE FUNCTION fn_update_updated_at();

CREATE TRIGGER trg_reviews_updated_at 
    BEFORE UPDATE ON reviews 
    FOR EACH ROW 
    EXECUTE FUNCTION fn_update_updated_at();

-- Trigger dla licznika uczestników
CREATE TRIGGER trg_update_participant_count
    AFTER INSERT OR UPDATE OR DELETE ON event_participants
    FOR EACH ROW
    EXECUTE FUNCTION fn_update_event_participant_count();

-- Trigger dla ostatniej wiadomości
CREATE TRIGGER trg_update_conversation_on_message
    AFTER INSERT ON messages
    FOR EACH ROW
    EXECUTE FUNCTION fn_update_conversation_last_message();

-- Trigger dla resetu nieprzeczytanych
CREATE TRIGGER trg_reset_unread_on_read
    AFTER INSERT ON message_reads
    FOR EACH ROW
    EXECUTE FUNCTION fn_reset_unread_count();

-- Trigger dla limitu zdjęć
CREATE TRIGGER trg_check_photo_limit
    BEFORE INSERT ON user_photos
    FOR EACH ROW
    EXECUTE FUNCTION fn_check_photo_limit();

-- Trigger dla tworzenia konwersacji przy dopasowaniu
CREATE TRIGGER trg_create_match_conversation
    AFTER INSERT ON likes
    FOR EACH ROW
    EXECUTE FUNCTION fn_create_match_conversation();

-- =====================================================
-- 10. POLITYKI RLS (ROW LEVEL SECURITY)
-- =====================================================

-- Włącz RLS dla wszystkich tabel
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE dance_styles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_dance_styles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorite_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_reads ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_reports ENABLE ROW LEVEL SECURITY;

-- Polityki dla tabeli users
CREATE POLICY "Users can view public profiles" ON users
    FOR SELECT
    USING (
        visibility = 'public' 
        OR id = auth.uid()
        OR EXISTS (
            SELECT 1 FROM v_matches 
            WHERE (user1_id = auth.uid() AND user2_id = id)
               OR (user2_id = auth.uid() AND user1_id = id)
        )
    );

CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE
    USING (id = auth.uid())
    WITH CHECK (id = auth.uid());

CREATE POLICY "Users can insert own profile" ON users
    FOR INSERT
    WITH CHECK (id = auth.uid());

-- Polityki dla dance_styles (publiczne)
CREATE POLICY "Dance styles are viewable by all" ON dance_styles
    FOR SELECT
    USING (is_active = true);

-- Polityki dla user_dance_styles
CREATE POLICY "User dance styles viewable based on user visibility" ON user_dance_styles
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM users u 
            WHERE u.id = user_id 
            AND (u.visibility = 'public' OR u.id = auth.uid())
        )
    );

CREATE POLICY "Users can manage own dance styles" ON user_dance_styles
    FOR ALL
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- Polityki dla user_photos
CREATE POLICY "User photos viewable based on user visibility" ON user_photos
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM users u 
            WHERE u.id = user_id 
            AND (u.visibility = 'public' OR u.id = auth.uid())
        )
    );

CREATE POLICY "Users can manage own photos" ON user_photos
    FOR ALL
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- Polityki dla events
CREATE POLICY "Public events viewable by all" ON events
    FOR SELECT
    USING (
        visibility = 'public' 
        OR organizer_id = auth.uid()
        OR EXISTS (
            SELECT 1 FROM event_participants 
            WHERE event_id = id AND user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create events" ON events
    FOR INSERT
    WITH CHECK (organizer_id = auth.uid());

CREATE POLICY "Organizers can update own events" ON events
    FOR UPDATE
    USING (organizer_id = auth.uid())
    WITH CHECK (organizer_id = auth.uid());

CREATE POLICY "Organizers can delete own events" ON events
    FOR DELETE
    USING (organizer_id = auth.uid());

-- Polityki dla event_participants
CREATE POLICY "Participants can view event participants" ON event_participants
    FOR SELECT
    USING (
        user_id = auth.uid()
        OR EXISTS (
            SELECT 1 FROM events 
            WHERE id = event_id AND organizer_id = auth.uid()
        )
    );

CREATE POLICY "Users can register for events" ON event_participants
    FOR INSERT
    WITH CHECK (
        user_id = auth.uid()
        AND EXISTS (
            SELECT 1 FROM events 
            WHERE id = event_id 
            AND visibility = 'public'
            AND status = 'published'
        )
    );

CREATE POLICY "Users can update own participation" ON event_participants
    FOR UPDATE
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- Polityki dla likes
CREATE POLICY "Users can view own likes" ON likes
    FOR SELECT
    USING (from_user_id = auth.uid() OR to_user_id = auth.uid());

CREATE POLICY "Users can create likes" ON likes
    FOR INSERT
    WITH CHECK (from_user_id = auth.uid());

CREATE POLICY "Users can delete own likes" ON likes
    FOR DELETE
    USING (from_user_id = auth.uid());

-- Polityki dla conversations i messages
CREATE POLICY "Users can view own conversations" ON conversations
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM conversation_participants 
            WHERE conversation_id = id AND user_id = auth.uid()
        )
    );

CREATE POLICY "Participants can view conversation participants" ON conversation_participants
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM conversation_participants cp 
            WHERE cp.conversation_id = conversation_id 
            AND cp.user_id = auth.uid()
        )
    );

CREATE POLICY "Participants can view messages" ON messages
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM conversation_participants 
            WHERE conversation_id = messages.conversation_id 
            AND user_id = auth.uid()
        )
    );

CREATE POLICY "Users can send messages to own conversations" ON messages
    FOR INSERT
    WITH CHECK (
        sender_id = auth.uid()
        AND EXISTS (
            SELECT 1 FROM conversation_participants 
            WHERE conversation_id = messages.conversation_id 
            AND user_id = auth.uid()
        )
    );

-- Polityki dla reviews
CREATE POLICY "Reviews are publicly viewable" ON reviews
    FOR SELECT
    USING (is_visible = true);

CREATE POLICY "Users can create reviews" ON reviews
    FOR INSERT
    WITH CHECK (
        reviewer_id = auth.uid()
        AND EXISTS (
            SELECT 1 FROM event_participants 
            WHERE user_id = auth.uid() 
            AND event_id = reviews.event_id
            AND status = 'attended'
        )
    );

CREATE POLICY "Users can update own reviews" ON reviews
    FOR UPDATE
    USING (reviewer_id = auth.uid())
    WITH CHECK (reviewer_id = auth.uid());

-- Polityki dla user_reports
CREATE POLICY "Users can create reports" ON user_reports
    FOR INSERT
    WITH CHECK (reporter_id = auth.uid());

CREATE POLICY "Users can view own reports" ON user_reports
    FOR SELECT
    USING (reporter_id = auth.uid());

-- =====================================================
-- 11. INDEKSY (INDEXES)
-- =====================================================

-- Indeksy dla wydajności
CREATE INDEX idx_users_city ON users(city);
CREATE INDEX idx_users_is_trainer ON users(is_trainer) WHERE is_trainer = true;

-- Indeks przestrzenny dla lokalizacji (używając earthdistance)
-- Najpierw utwórz kolumnę z typem earth
ALTER TABLE users ADD COLUMN location_earth earth;
UPDATE users SET location_earth = ll_to_earth(location_lat, location_lng) WHERE location_lat IS NOT NULL AND location_lng IS NOT NULL;
CREATE INDEX idx_users_location ON users USING gist(location_earth);

-- Trigger do automatycznej aktualizacji location_earth
CREATE OR REPLACE FUNCTION fn_update_location_earth()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.location_lat IS NOT NULL AND NEW.location_lng IS NOT NULL THEN
        NEW.location_earth = ll_to_earth(NEW.location_lat, NEW.location_lng);
    ELSE
        NEW.location_earth = NULL;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_location_earth
    BEFORE INSERT OR UPDATE OF location_lat, location_lng ON users
    FOR EACH ROW
    EXECUTE FUNCTION fn_update_location_earth();

-- Pozostałe indeksy
CREATE INDEX idx_events_start_at ON events(start_at);
CREATE INDEX idx_events_organizer_id ON events(organizer_id);
CREATE INDEX idx_events_status ON events(status);
CREATE INDEX idx_events_dance_style_id ON events(dance_style_id);

CREATE INDEX idx_event_participants_event_id ON event_participants(event_id);
CREATE INDEX idx_event_participants_user_id ON event_participants(user_id);
CREATE INDEX idx_event_participants_status ON event_participants(status);

CREATE INDEX idx_likes_from_user_id ON likes(from_user_id);
CREATE INDEX idx_likes_to_user_id ON likes(to_user_id);

CREATE INDEX idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX idx_messages_created_at ON messages(created_at);

CREATE INDEX idx_reviews_reviewed_user_id ON reviews(reviewed_user_id);
CREATE INDEX idx_reviews_event_id ON reviews(event_id);

-- =====================================================
-- 12. PRZYKŁADOWE FUNKCJE POMOCNICZE
-- =====================================================

-- Funkcja wyszukująca użytkowników w promieniu
CREATE OR REPLACE FUNCTION fn_find_users_within_radius(
    p_user_id UUID,
    p_radius_km INTEGER DEFAULT NULL
)
RETURNS TABLE (
    user_id UUID,
    distance_km NUMERIC
) AS $$
DECLARE
    v_user_location earth;
    v_search_radius INTEGER;
BEGIN
    -- Pobierz lokalizację i promień użytkownika
    SELECT location_earth, COALESCE(p_radius_km, search_radius_km)
    INTO v_user_location, v_search_radius
    FROM users
    WHERE id = p_user_id;
    
    IF v_user_location IS NULL THEN
        RETURN;
    END IF;
    
    RETURN QUERY
    SELECT 
        u.id as user_id,
        ROUND((earth_distance(v_user_location, u.location_earth) / 1000)::NUMERIC, 2) as distance_km
    FROM users u
    WHERE u.id != p_user_id
        AND u.location_earth IS NOT NULL
        AND u.is_active = true
        AND u.is_banned = false
        AND u.visibility = 'public'
        AND earth_distance(v_user_location, u.location_earth) <= v_search_radius * 1000
    ORDER BY distance_km;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- KONIEC SKRYPTU
-- =====================================================