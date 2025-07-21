-- Włączenie rozszerzeń potrzebnych w Supabase
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- Typy ENUM
CREATE TYPE user_type AS ENUM ('dancer', 'school');
CREATE TYPE skill_level AS ENUM ('beginner', 'intermediate', 'advanced', 'professional');
CREATE TYPE match_status AS ENUM ('pending', 'liked', 'disliked', 'blocked');
CREATE TYPE event_status AS ENUM ('planned', 'ongoing', 'completed', 'cancelled');
CREATE TYPE school_event_type AS ENUM ('workshop', 'party', 'competition', 'course', 'social');
CREATE TYPE participant_status AS ENUM ('registered', 'confirmed', 'attended', 'cancelled', 'waitlist');
CREATE TYPE event_category AS ENUM ('outdoor', 'school');
CREATE TYPE visibility_level AS ENUM ('public', 'matches_only', 'private');

-- ===========================================
-- TABELE PODSTAWOWE
-- ===========================================

-- 1. Tabela użytkowników (wspólna dla tancerzy i szkół)
CREATE TABLE users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    user_type user_type NOT NULL,
    is_active BOOLEAN DEFAULT true,
    is_banned BOOLEAN DEFAULT false,
    last_seen_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Profil tancerza
CREATE TABLE dancers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    bio TEXT,
    birth_date DATE NOT NULL,
    profile_photo_url TEXT,
    location_lat DECIMAL(10, 8),
    location_lng DECIMAL(11, 8),
    location_address TEXT,
    city TEXT,
    search_radius_km INTEGER DEFAULT 50 CHECK (search_radius_km BETWEEN 1 AND 200),
    visibility visibility_level DEFAULT 'public',
    show_age BOOLEAN DEFAULT true,
    show_exact_location BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id),
    CONSTRAINT chk_dancer_adult CHECK (birth_date <= CURRENT_DATE - INTERVAL '18 years'),
    CONSTRAINT chk_dancer_profile_photo_url CHECK (profile_photo_url IS NULL OR profile_photo_url ~ '^https?://.*\.(jpg|jpeg|png|webp)$'),
    CONSTRAINT chk_dancer_bio_length CHECK (LENGTH(bio) <= 500)
);

-- 3. Profil szkoły tańca
CREATE TABLE dance_schools (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    logo_url TEXT,
    location_lat DECIMAL(10, 8) NOT NULL,
    location_lng DECIMAL(11, 8) NOT NULL,
    address TEXT NOT NULL,
    city TEXT NOT NULL,
    postal_code TEXT,
    phone TEXT,
    website TEXT,
    email_contact TEXT,
    facebook_url TEXT,
    instagram_url TEXT,
    is_verified BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id),
    CONSTRAINT chk_school_logo_url CHECK (logo_url IS NULL OR logo_url ~ '^https?://.*\.(jpg|jpeg|png|webp|svg)$'),
    CONSTRAINT chk_school_website_url CHECK (website IS NULL OR website ~ '^https?://.*'),
    CONSTRAINT chk_school_facebook_url CHECK (facebook_url IS NULL OR facebook_url ~ '^https?://(www\.)?facebook\.com/.*'),
    CONSTRAINT chk_school_instagram_url CHECK (instagram_url IS NULL OR instagram_url ~ '^https?://(www\.)?instagram\.com/.*'),
    CONSTRAINT chk_school_description_length CHECK (LENGTH(description) <= 2000)
);

-- 4. Słownik stylów tańca
CREATE TABLE dance_styles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT UNIQUE NOT NULL,
    category TEXT NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===========================================
-- TABELE RELACYJNE - STYLE I PREFERENCJE
-- ===========================================

-- 5. Style tańca tancerza
CREATE TABLE dancer_dance_styles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    dancer_id UUID NOT NULL REFERENCES dancers(id) ON DELETE CASCADE,
    dance_style_id UUID NOT NULL REFERENCES dance_styles(id) ON DELETE CASCADE,
    skill_level skill_level NOT NULL,
    years_experience INTEGER CHECK (years_experience >= 0 AND years_experience <= 50),
    is_teaching BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(dancer_id, dance_style_id)
);

-- 6. Style nauczane w szkole
CREATE TABLE school_dance_styles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID NOT NULL REFERENCES dance_schools(id) ON DELETE CASCADE,
    dance_style_id UUID NOT NULL REFERENCES dance_styles(id) ON DELETE CASCADE,
    instructor_count INTEGER DEFAULT 1 CHECK (instructor_count > 0),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(school_id, dance_style_id)
);

-- 7. Preferencje muzyczne
CREATE TABLE music_preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    dancer_id UUID NOT NULL REFERENCES dancers(id) ON DELETE CASCADE,
    genre TEXT,
    artist TEXT,
    spotify_uri TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT chk_music_spotify_uri CHECK (spotify_uri IS NULL OR spotify_uri ~ '^spotify:(track|artist|album):[\w]+$')
);

-- ===========================================
-- TABELE DOPASOWAŃ I RELACJI
-- ===========================================

-- 8. Dopasowania między tancerzami
CREATE TABLE matches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    dancer1_id UUID NOT NULL REFERENCES dancers(id) ON DELETE CASCADE,
    dancer2_id UUID NOT NULL REFERENCES dancers(id) ON DELETE CASCADE,
    dancer1_status match_status DEFAULT 'pending',
    dancer2_status match_status DEFAULT 'pending',
    is_match BOOLEAN GENERATED ALWAYS AS (
        CASE WHEN dancer1_status = 'liked' AND dancer2_status = 'liked' 
        THEN true ELSE false END
    ) STORED,
    matched_at TIMESTAMPTZ,
    last_interaction_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CHECK (dancer1_id < dancer2_id),
    UNIQUE(dancer1_id, dancer2_id)
);

-- ===========================================
-- TABELE WYDARZEŃ
-- ===========================================

-- 9. Wydarzenia plenerowe tancerzy
CREATE TABLE outdoor_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organizer_id UUID NOT NULL REFERENCES dancers(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    dance_style_id UUID REFERENCES dance_styles(id) ON DELETE SET NULL,
    event_date TIMESTAMPTZ NOT NULL,
    duration_minutes INTEGER CHECK (duration_minutes BETWEEN 15 AND 480),
    location_lat DECIMAL(10, 8) NOT NULL,
    location_lng DECIMAL(11, 8) NOT NULL,
    address TEXT NOT NULL,
    meeting_point_details TEXT,
    max_participants INTEGER CHECK (max_participants BETWEEN 2 AND 100),
    current_participants INTEGER DEFAULT 0,
    min_skill_level skill_level,
    is_public BOOLEAN DEFAULT true,
    requires_partner BOOLEAN DEFAULT false,
    status event_status DEFAULT 'planned',
    cancelled_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT chk_outdoor_event_date CHECK (event_date > NOW()),
    CONSTRAINT chk_outdoor_event_participants CHECK (current_participants <= max_participants),
    CONSTRAINT chk_outdoor_event_title_length CHECK (LENGTH(title) BETWEEN 3 AND 100),
    CONSTRAINT chk_outdoor_event_description_length CHECK (LENGTH(description) <= 1000)
);

-- 10. Wydarzenia w szkołach
CREATE TABLE school_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID NOT NULL REFERENCES dance_schools(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    event_type school_event_type NOT NULL,
    dance_style_id UUID REFERENCES dance_styles(id) ON DELETE SET NULL,
    instructor_name TEXT,
    start_date TIMESTAMPTZ NOT NULL,
    end_date TIMESTAMPTZ NOT NULL,
    recurrence_pattern TEXT, -- RRULE format
    price DECIMAL(10, 2) CHECK (price >= 0),
    member_price DECIMAL(10, 2) CHECK (member_price >= 0),
    max_participants INTEGER CHECK (max_participants > 0),
    current_participants INTEGER DEFAULT 0,
    min_skill_level skill_level,
    max_skill_level skill_level,
    registration_deadline DATE,
    early_bird_deadline DATE,
    early_bird_discount DECIMAL(5, 2) CHECK (early_bird_discount BETWEEN 0 AND 100),
    status event_status DEFAULT 'planned',
    cancelled_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT chk_school_event_dates CHECK (end_date >= start_date),
    CONSTRAINT chk_school_event_start_date CHECK (start_date > NOW()),
    CONSTRAINT chk_school_event_participants CHECK (current_participants <= max_participants),
    CONSTRAINT chk_school_event_skill_levels CHECK (max_skill_level IS NULL OR min_skill_level IS NULL OR max_skill_level >= min_skill_level),
    CONSTRAINT chk_school_event_prices CHECK (member_price IS NULL OR member_price <= price),
    CONSTRAINT chk_school_event_title_length CHECK (LENGTH(title) BETWEEN 3 AND 100),
    CONSTRAINT chk_school_event_description_length CHECK (LENGTH(description) <= 2000)
);

-- 11. Uczestnicy wydarzeń
CREATE TABLE event_participants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID NOT NULL,
    event_type event_category NOT NULL,
    participant_id UUID NOT NULL REFERENCES dancers(id) ON DELETE CASCADE,
    partner_id UUID REFERENCES dancers(id) ON DELETE SET NULL,
    status participant_status DEFAULT 'registered',
    payment_status TEXT,
    registered_at TIMESTAMPTZ DEFAULT NOW(),
    confirmed_at TIMESTAMPTZ,
    cancelled_at TIMESTAMPTZ,
    attended_at TIMESTAMPTZ,
    notes TEXT,
    UNIQUE(event_id, event_type, participant_id),
    CONSTRAINT chk_event_participant_partner CHECK (partner_id IS NULL OR partner_id != participant_id)
);

-- ===========================================
-- TABELE KOMUNIKACJI
-- ===========================================

-- 12. Konwersacje czatu
CREATE TABLE chat_conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    participant1_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    participant2_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    last_message_at TIMESTAMPTZ,
    last_message_preview TEXT,
    participant1_unread_count INTEGER DEFAULT 0,
    participant2_unread_count INTEGER DEFAULT 0,
    is_archived_by_participant1 BOOLEAN DEFAULT false,
    is_archived_by_participant2 BOOLEAN DEFAULT false,
    is_blocked_by_participant1 BOOLEAN DEFAULT false,
    is_blocked_by_participant2 BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CHECK (participant1_id < participant2_id),
    UNIQUE(participant1_id, participant2_id)
);

-- 13. Wiadomości czatu
CREATE TABLE chat_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID NOT NULL REFERENCES chat_conversations(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    message_text TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    read_at TIMESTAMPTZ,
    is_edited BOOLEAN DEFAULT false,
    edited_at TIMESTAMPTZ,
    is_deleted BOOLEAN DEFAULT false,
    deleted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT chk_chat_message_length CHECK (LENGTH(message_text) BETWEEN 1 AND 1000)
);

-- ===========================================
-- TABELE MULTIMEDIÓW
-- ===========================================

-- 14. Dodatkowe zdjęcia tancerzy
CREATE TABLE dancer_photos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    dancer_id UUID NOT NULL REFERENCES dancers(id) ON DELETE CASCADE,
    photo_url TEXT NOT NULL,
    thumbnail_url TEXT,
    caption TEXT,
    is_primary BOOLEAN DEFAULT false,
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT chk_dancer_photo_url CHECK (photo_url ~ '^https?://.*\.(jpg|jpeg|png|webp)$'),
    CONSTRAINT chk_dancer_photo_thumbnail_url CHECK (thumbnail_url IS NULL OR thumbnail_url ~ '^https?://.*\.(jpg|jpeg|png|webp)$'),
    CONSTRAINT chk_dancer_photo_caption_length CHECK (LENGTH(caption) <= 200)
);

-- 15. Galeria szkół
CREATE TABLE school_photos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID NOT NULL REFERENCES dance_schools(id) ON DELETE CASCADE,
    photo_url TEXT NOT NULL,
    thumbnail_url TEXT,
    caption TEXT,
    is_featured BOOLEAN DEFAULT false,
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT chk_school_photo_url CHECK (photo_url ~ '^https?://.*\.(jpg|jpeg|png|webp)$'),
    CONSTRAINT chk_school_photo_thumbnail_url CHECK (thumbnail_url IS NULL OR thumbnail_url ~ '^https?://.*\.(jpg|jpeg|png|webp)$'),
    CONSTRAINT chk_school_photo_caption_length CHECK (LENGTH(caption) <= 200)
);

-- ===========================================
-- TABELE DODATKOWE
-- ===========================================

-- 16. Ulubione profile
CREATE TABLE favorite_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    favorite_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, favorite_user_id),
    CONSTRAINT chk_favorite_not_self CHECK (user_id != favorite_user_id)
);

-- 17. Zgłoszenia i blokady
CREATE TABLE user_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reporter_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reported_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reason TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'pending',
    reviewed_at TIMESTAMPTZ,
    reviewed_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT chk_report_not_self CHECK (reporter_id != reported_user_id)
);

-- ===========================================
-- INDEKSY
-- ===========================================

-- Indeksy przestrzenne dla lokalizacji
CREATE INDEX idx_dancers_location ON dancers 
    USING GIST (ST_MakePoint(location_lng, location_lat))
    WHERE is_active = true;

CREATE INDEX idx_schools_location ON dance_schools 
    USING GIST (ST_MakePoint(location_lng, location_lat))
    WHERE is_active = true;

CREATE INDEX idx_outdoor_events_location ON outdoor_events 
    USING GIST (ST_MakePoint(location_lng, location_lat))
    WHERE status = 'planned';

-- Indeksy dla użytkowników
CREATE INDEX idx_users_type_active ON users(user_type, is_active);
CREATE INDEX idx_users_email ON users(email);

-- Indeksy dla tancerzy
CREATE INDEX idx_dancers_user_id ON dancers(user_id);
CREATE INDEX idx_dancers_city ON dancers(city) WHERE is_active = true;
CREATE INDEX idx_dancers_active ON dancers(is_active, visibility);

-- Indeksy dla szkół
CREATE INDEX idx_schools_user_id ON dance_schools(user_id);
CREATE INDEX idx_schools_city ON dance_schools(city) WHERE is_active = true;
CREATE INDEX idx_schools_verified ON dance_schools(is_verified) WHERE is_active = true;

-- Indeksy dla stylów tańca
CREATE INDEX idx_dancer_styles_dancer ON dancer_dance_styles(dancer_id);
CREATE INDEX idx_dancer_styles_style ON dancer_dance_styles(dance_style_id);
CREATE INDEX idx_dancer_styles_level ON dancer_dance_styles(skill_level);
CREATE INDEX idx_school_styles_school ON school_dance_styles(school_id);
CREATE INDEX idx_school_styles_style ON school_dance_styles(dance_style_id);

-- Indeksy dla dopasowań
CREATE INDEX idx_matches_dancer1 ON matches(dancer1_id, dancer1_status);
CREATE INDEX idx_matches_dancer2 ON matches(dancer2_id, dancer2_status);
CREATE INDEX idx_matches_is_match ON matches(is_match) WHERE is_match = true;
CREATE INDEX idx_matches_created ON matches(created_at DESC);

-- Indeksy dla wydarzeń
CREATE INDEX idx_outdoor_events_date ON outdoor_events(event_date) WHERE status = 'planned';
CREATE INDEX idx_outdoor_events_organizer ON outdoor_events(organizer_id);
CREATE INDEX idx_outdoor_events_style ON outdoor_events(dance_style_id);
CREATE INDEX idx_school_events_dates ON school_events(start_date, end_date) WHERE status = 'planned';
CREATE INDEX idx_school_events_school ON school_events(school_id);
CREATE INDEX idx_school_events_type ON school_events(event_type);
CREATE INDEX idx_event_participants_event ON event_participants(event_id, event_type);
CREATE INDEX idx_event_participants_dancer ON event_participants(participant_id);
CREATE INDEX idx_event_participants_status ON event_participants(status);

-- Indeksy dla czatu
CREATE INDEX idx_conversations_participant1 ON chat_conversations(participant1_id);
CREATE INDEX idx_conversations_participant2 ON chat_conversations(participant2_id);
CREATE INDEX idx_conversations_last_message ON chat_conversations(last_message_at DESC);
CREATE INDEX idx_messages_conversation ON chat_messages(conversation_id, created_at DESC);
CREATE INDEX idx_messages_unread ON chat_messages(conversation_id, is_read) 
    WHERE is_read = false AND is_deleted = false;

-- Indeksy dla zdjęć
CREATE INDEX idx_dancer_photos_dancer ON dancer_photos(dancer_id, order_index);
CREATE INDEX idx_school_photos_school ON school_photos(school_id, order_index);

-- Indeksy dla ulubionych
CREATE INDEX idx_favorites_user ON favorite_profiles(user_id);
CREATE INDEX idx_favorites_favorite ON favorite_profiles(favorite_user_id);

-- ===========================================
-- FUNKCJE Z PREFIXEM fn_
-- ===========================================

-- Funkcja do aktualizacji updated_at
CREATE OR REPLACE FUNCTION fn_update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Funkcja do ustawiania matched_at
CREATE OR REPLACE FUNCTION fn_set_matched_at()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.is_match = true AND OLD.is_match = false THEN
        NEW.matched_at = NOW();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Funkcja do aktualizacji last_message w konwersacji
CREATE OR REPLACE FUNCTION fn_update_conversation_last_message()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE chat_conversations
    SET 
        last_message_at = NEW.created_at,
        last_message_preview = LEFT(NEW.message_text, 100),
        participant1_unread_count = CASE 
            WHEN NEW.sender_id = participant1_id THEN participant1_unread_count
            ELSE participant1_unread_count + 1
        END,
        participant2_unread_count = CASE 
            WHEN NEW.sender_id = participant2_id THEN participant2_unread_count
            ELSE participant2_unread_count + 1
        END
    WHERE id = NEW.conversation_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Funkcja do resetowania licznika nieprzeczytanych
CREATE OR REPLACE FUNCTION fn_reset_unread_count()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.is_read = true AND OLD.is_read = false THEN
        UPDATE chat_conversations
        SET 
            participant1_unread_count = CASE 
                WHEN NEW.sender_id = participant2_id THEN 0
                ELSE participant1_unread_count
            END,
            participant2_unread_count = CASE 
                WHEN NEW.sender_id = participant1_id THEN 0
                ELSE participant2_unread_count
            END
        WHERE id = NEW.conversation_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Funkcja do sprawdzania limitu zdjęć
CREATE OR REPLACE FUNCTION fn_check_photo_limit()
RETURNS TRIGGER AS $$
DECLARE
    photo_count INTEGER;
    max_photos INTEGER := 10;
BEGIN
    SELECT COUNT(*) INTO photo_count 
    FROM dancer_photos 
    WHERE dancer_id = NEW.dancer_id;
    
    IF photo_count >= max_photos THEN
        RAISE EXCEPTION 'Przekroczono limit % zdjęć', max_photos;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Funkcja do sprawdzania limitu zdjęć szkoły
CREATE OR REPLACE FUNCTION fn_check_school_photo_limit()
RETURNS TRIGGER AS $$
DECLARE
    photo_count INTEGER;
    max_photos INTEGER := 20;
BEGIN
    SELECT COUNT(*) INTO photo_count 
    FROM school_photos 
    WHERE school_id = NEW.school_id;
    
    IF photo_count >= max_photos THEN
        RAISE EXCEPTION 'Przekroczono limit % zdjęć', max_photos;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Funkcja do aktualizacji liczby uczestników wydarzenia
CREATE OR REPLACE FUNCTION fn_update_event_participant_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' AND NEW.status IN ('registered', 'confirmed') THEN
        IF NEW.event_type = 'outdoor' THEN
            UPDATE outdoor_events 
            SET current_participants = current_participants + 1
            WHERE id = NEW.event_id;
        ELSIF NEW.event_type = 'school' THEN
            UPDATE school_events 
            SET current_participants = current_participants + 1
            WHERE id = NEW.event_id;
        END IF;
    ELSIF TG_OP = 'UPDATE' THEN
        IF OLD.status IN ('registered', 'confirmed') AND NEW.status NOT IN ('registered', 'confirmed') THEN
            IF NEW.event_type = 'outdoor' THEN
                UPDATE outdoor_events 
                SET current_participants = GREATEST(0, current_participants - 1)
                WHERE id = NEW.event_id;
            ELSIF NEW.event_type = 'school' THEN
                UPDATE school_events 
                SET current_participants = GREATEST(0, current_participants - 1)
                WHERE id = NEW.event_id;
            END IF;
        ELSIF OLD.status NOT IN ('registered', 'confirmed') AND NEW.status IN ('registered', 'confirmed') THEN
            IF NEW.event_type = 'outdoor' THEN
                UPDATE outdoor_events 
                SET current_participants = current_participants + 1
                WHERE id = NEW.event_id;
            ELSIF NEW.event_type = 'school' THEN
                UPDATE school_events 
                SET current_participants = current_participants + 1
                WHERE id = NEW.event_id;
            END IF;
        END IF;
    ELSIF TG_OP = 'DELETE' AND OLD.status IN ('registered', 'confirmed') THEN
        IF OLD.event_type = 'outdoor' THEN
            UPDATE outdoor_events 
            SET current_participants = GREATEST(0, current_participants - 1)
            WHERE id = OLD.event_id;
        ELSIF OLD.event_type = 'school' THEN
            UPDATE school_events 
            SET current_participants = GREATEST(0, current_participants - 1)
            WHERE id = OLD.event_id;
        END IF;
    END IF;
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Funkcja do walidacji referencji wydarzenia
CREATE OR REPLACE FUNCTION fn_validate_event_reference()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.event_type = 'outdoor' THEN
        IF NOT EXISTS (SELECT 1 FROM outdoor_events WHERE id = NEW.event_id) THEN
            RAISE EXCEPTION 'Wydarzenie plenerowe o ID % nie istnieje', NEW.event_id;
        END IF;
    ELSIF NEW.event_type = 'school' THEN
        IF NOT EXISTS (SELECT 1 FROM school_events WHERE id = NEW.event_id) THEN
            RAISE EXCEPTION 'Wydarzenie szkolne o ID % nie istnieje', NEW.event_id;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ===========================================
-- TRIGGERY Z PREFIXEM trg_
-- ===========================================

-- Triggery dla updated_at
CREATE TRIGGER trg_users_updated_at 
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION fn_update_updated_at_column();

CREATE TRIGGER trg_dancers_updated_at 
    BEFORE UPDATE ON dancers
    FOR EACH ROW EXECUTE FUNCTION fn_update_updated_at_column();

CREATE TRIGGER trg_dance_schools_updated_at 
    BEFORE UPDATE ON dance_schools
    FOR EACH ROW EXECUTE FUNCTION fn_update_updated_at_column();

CREATE TRIGGER trg_dancer_dance_styles_updated_at 
    BEFORE UPDATE ON dancer_dance_styles
    FOR EACH ROW EXECUTE FUNCTION fn_update_updated_at_column();

CREATE TRIGGER trg_matches_updated_at 
    BEFORE UPDATE ON matches
    FOR EACH ROW EXECUTE FUNCTION fn_update_updated_at_column();

CREATE TRIGGER trg_outdoor_events_updated_at 
    BEFORE UPDATE ON outdoor_events
    FOR EACH ROW EXECUTE FUNCTION fn_update_updated_at_column();

CREATE TRIGGER trg_school_events_updated_at 
    BEFORE UPDATE ON school_events
    FOR EACH ROW EXECUTE FUNCTION fn_update_updated_at_column();

-- Trigger dla matched_at
CREATE TRIGGER trg_set_matched_at 
    BEFORE UPDATE ON matches
    FOR EACH ROW EXECUTE FUNCTION fn_set_matched_at();

-- Triggery dla czatu
CREATE TRIGGER trg_update_conversation_on_message 
    AFTER INSERT ON chat_messages
    FOR EACH ROW EXECUTE FUNCTION fn_update_conversation_last_message();

CREATE TRIGGER trg_reset_unread_on_read 
    AFTER UPDATE OF is_read ON chat_messages
    FOR EACH ROW EXECUTE FUNCTION fn_reset_unread_count();

-- Triggery dla limitów zdjęć
CREATE TRIGGER trg_check_dancer_photo_limit 
    BEFORE INSERT ON dancer_photos
    FOR EACH ROW EXECUTE FUNCTION fn_check_photo_limit();

CREATE TRIGGER trg_check_school_photo_limit 
    BEFORE INSERT ON school_photos
    FOR EACH ROW EXECUTE FUNCTION fn_check_school_photo_limit();

-- Triggery dla uczestników wydarzeń
CREATE TRIGGER trg_update_participant_count 
    AFTER INSERT OR UPDATE OR DELETE ON event_participants
    FOR EACH ROW EXECUTE FUNCTION fn_update_event_participant_count();

CREATE TRIGGER trg_validate_event_reference 
    BEFORE INSERT OR UPDATE ON event_participants
    FOR EACH ROW EXECUTE FUNCTION fn_validate_event_reference();

-- ===========================================
-- POLITYKI RLS (Row Level Security)
-- ===========================================

-- Włączenie RLS dla wszystkich tabel
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE dancers ENABLE ROW LEVEL SECURITY;
ALTER TABLE dance_schools ENABLE ROW LEVEL SECURITY;
ALTER TABLE dancer_dance_styles ENABLE ROW LEVEL SECURITY;
ALTER TABLE school_dance_styles ENABLE ROW LEVEL SECURITY;
ALTER TABLE music_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE outdoor_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE school_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE dancer_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE school_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorite_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_reports ENABLE ROW LEVEL SECURITY;

-- Polityki dla users
CREATE POLICY "pol_users_select_own" ON users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "pol_users_update_own" ON users
    FOR UPDATE USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id AND NOT is_banned);

-- Polityki dla dancers
CREATE POLICY "pol_dancers_select_own" ON dancers
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "pol_dancers_select_public_basic" ON dancers
    FOR SELECT USING (
        is_active = true 
        AND visibility = 'public'
        AND user_id != auth.uid()
    );

CREATE POLICY "pol_dancers_select_matched_full" ON dancers
    FOR SELECT USING (
        is_active = true
        AND user_id != auth.uid()
        AND (
            visibility = 'public'
            OR (visibility = 'matches_only' AND EXISTS (
                SELECT 1 FROM matches m
                JOIN dancers d ON (m.dancer1_id = d.id OR m.dancer2_id = d.id)
                WHERE m.is_match = true
                AND d.user_id = auth.uid()
                AND (m.dancer1_id = dancers.id OR m.dancer2_id = dancers.id)
            ))
        )
    );

CREATE POLICY "pol_dancers_insert_own" ON dancers
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "pol_dancers_update_own" ON dancers
    FOR UPDATE USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- Polityki dla dance_schools
CREATE POLICY "pol_schools_select_active" ON dance_schools
    FOR SELECT USING (is_active = true OR user_id = auth.uid());

CREATE POLICY "pol_schools_insert_own" ON dance_schools
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "pol_schools_update_own" ON dance_schools
    FOR UPDATE USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- Polityki dla dancer_dance_styles
CREATE POLICY "pol_dancer_styles_select_public" ON dancer_dance_styles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM dancers 
            WHERE id = dancer_id 
            AND (user_id = auth.uid() OR (is_active = true AND visibility = 'public'))
        )
    );

CREATE POLICY "pol_dancer_styles_manage_own" ON dancer_dance_styles
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM dancers 
            WHERE id = dancer_id AND user_id = auth.uid()
        )
    );

-- Polityki dla school_dance_styles
CREATE POLICY "pol_school_styles_select_all" ON school_dance_styles
    FOR SELECT USING (true);

CREATE POLICY "pol_school_styles_manage_own" ON school_dance_styles
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM dance_schools 
            WHERE id = school_id AND user_id = auth.uid()
        )
    );

-- Polityki dla matches
CREATE POLICY "pol_matches_select_own" ON matches
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM dancers 
            WHERE user_id = auth.uid() 
            AND (id = dancer1_id OR id = dancer2_id)
        )
    );

CREATE POLICY "pol_matches_insert_own" ON matches
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM dancers 
            WHERE user_id = auth.uid() 
            AND (id = dancer1_id OR id = dancer2_id)
        )
    );

CREATE POLICY "pol_matches_update_own" ON matches
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM dancers 
            WHERE user_id = auth.uid() 
            AND (id = dancer1_id OR id = dancer2_id)
        )
    );

-- Polityki dla outdoor_events
CREATE POLICY "pol_outdoor_events_select_public" ON outdoor_events
    FOR SELECT USING (
        is_public = true 
        OR organizer_id IN (SELECT id FROM dancers WHERE user_id = auth.uid())
    );

CREATE POLICY "pol_outdoor_events_manage_own" ON outdoor_events
    FOR ALL USING (
        organizer_id IN (SELECT id FROM dancers WHERE user_id = auth.uid())
    );

-- Polityki dla school_events
CREATE POLICY "pol_school_events_select_active" ON school_events
    FOR SELECT USING (
        status != 'cancelled'
        OR school_id IN (SELECT id FROM dance_schools WHERE user_id = auth.uid())
    );

CREATE POLICY "pol_school_events_manage_own" ON school_events
    FOR ALL USING (
        school_id IN (SELECT id FROM dance_schools WHERE user_id = auth.uid())
    );

-- Polityki dla event_participants
CREATE POLICY "pol_event_participants_select_relevant" ON event_participants
    FOR SELECT USING (
        participant_id IN (SELECT id FROM dancers WHERE user_id = auth.uid())
        OR (
            event_type = 'outdoor' 
            AND event_id IN (
                SELECT id FROM outdoor_events 
                WHERE organizer_id IN (SELECT id FROM dancers WHERE user_id = auth.uid())
            )
        )
        OR (
            event_type = 'school' 
            AND event_id IN (
                SELECT id FROM school_events 
                WHERE school_id IN (SELECT id FROM dance_schools WHERE user_id = auth.uid())
            )
        )
    );

CREATE POLICY "pol_event_participants_insert_own" ON event_participants
    FOR INSERT WITH CHECK (
        participant_id IN (SELECT id FROM dancers WHERE user_id = auth.uid())
    );

CREATE POLICY "pol_event_participants_update_own" ON event_participants
    FOR UPDATE USING (
        participant_id IN (SELECT id FROM dancers WHERE user_id = auth.uid())
        OR (
            event_type = 'outdoor' 
            AND event_id IN (
                SELECT id FROM outdoor_events 
                WHERE organizer_id IN (SELECT id FROM dancers WHERE user_id = auth.uid())
            )
        )
        OR (
            event_type = 'school' 
            AND event_id IN (
                SELECT id FROM school_events 
                WHERE school_id IN (SELECT id FROM dance_schools WHERE user_id = auth.uid())
            )
        )
    );

-- Polityki dla chat_conversations
CREATE POLICY "pol_conversations_select_own" ON chat_conversations
    FOR SELECT USING (
        participant1_id = auth.uid() OR participant2_id = auth.uid()
    );

CREATE POLICY "pol_conversations_insert_authorized" ON chat_conversations
    FOR INSERT WITH CHECK (
        (participant1_id = auth.uid() OR participant2_id = auth.uid())
        AND (
            -- Dopasowani tancerze
            EXISTS (
                SELECT 1 FROM matches m
                JOIN dancers d1 ON m.dancer1_id = d1.id
                JOIN dancers d2 ON m.dancer2_id = d2.id
                WHERE m.is_match = true
                AND ((d1.user_id = participant1_id AND d2.user_id = participant2_id)
                    OR (d2.user_id = participant1_id AND d1.user_id = participant2_id))
            )
            OR
            -- Tancerz zapisany na wydarzenie szkoły
            EXISTS (
                SELECT 1 FROM event_participants ep
                JOIN school_events se ON ep.event_id = se.id
                JOIN dance_schools ds ON se.school_id = ds.id
                JOIN dancers d ON ep.participant_id = d.id
                WHERE ep.event_type = 'school'
                AND ep.status IN ('registered', 'confirmed')
                AND ((d.user_id = participant1_id AND ds.user_id = participant2_id)
                    OR (d.user_id = participant2_id AND ds.user_id = participant1_id))
            )
        )
    );

-- Polityki dla chat_messages
CREATE POLICY "pol_messages_select_own_conversations" ON chat_messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM chat_conversations
            WHERE id = conversation_id
            AND (participant1_id = auth.uid() OR participant2_id = auth.uid())
        )
    );

CREATE POLICY "pol_messages_insert_own" ON chat_messages
    FOR INSERT WITH CHECK (
        sender_id = auth.uid()
        AND EXISTS (
            SELECT 1 FROM chat_conversations
            WHERE id = conversation_id
            AND (participant1_id = auth.uid() OR participant2_id = auth.uid())
            AND NOT (
                (participant1_id = auth.uid() AND is_blocked_by_participant2 = true)
                OR (participant2_id = auth.uid() AND is_blocked_by_participant1 = true)
            )
        )
    );

-- Polityki dla dancer_photos
CREATE POLICY "pol_dancer_photos_select_authorized" ON dancer_photos
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM dancers d
            WHERE d.id = dancer_id
            AND (
                d.user_id = auth.uid()
                OR (d.is_active = true AND d.visibility = 'public')
                OR (d.is_active = true AND EXISTS (
                    SELECT 1 FROM matches m
                    JOIN dancers my_d ON (m.dancer1_id = my_d.id OR m.dancer2_id = my_d.id)
                    WHERE m.is_match = true
                    AND my_d.user_id = auth.uid()
                    AND (m.dancer1_id = dancer_id OR m.dancer2_id = dancer_id)
                ))
            )
        )
    );

CREATE POLICY "pol_dancer_photos_manage_own" ON dancer_photos
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM dancers 
            WHERE id = dancer_id AND user_id = auth.uid()
        )
    );

-- Polityki dla school_photos
CREATE POLICY "pol_school_photos_select_all" ON school_photos
    FOR SELECT USING (true);

CREATE POLICY "pol_school_photos_manage_own" ON school_photos
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM dance_schools 
            WHERE id = school_id AND user_id = auth.uid()
        )
    );

-- Polityki dla favorite_profiles
CREATE POLICY "pol_favorites_manage_own" ON favorite_profiles
    FOR ALL USING (user_id = auth.uid());

-- Polityki dla user_reports
CREATE POLICY "pol_reports_insert_authenticated" ON user_reports
    FOR INSERT WITH CHECK (
        reporter_id = auth.uid() 
        AND reporter_id != reported_user_id
    );

CREATE POLICY "pol_reports_select_own" ON user_reports
    FOR SELECT USING (reporter_id = auth.uid());

-- ===========================================
-- WIDOKI (VIEWS) Z PREFIXEM vw_
-- ===========================================

-- Widok publicznych danych tancerzy (bez wrażliwych danych)
CREATE OR REPLACE VIEW vw_public_dancers AS
SELECT 
    d.id,
    d.name,
    d.bio,
    CASE 
        WHEN d.show_age = true THEN DATE_PART('year', AGE(d.birth_date))::INTEGER
        ELSE NULL
    END as age,
    d.profile_photo_url,
    CASE 
        WHEN d.show_exact_location = true THEN d.location_lat
        ELSE ROUND(d.location_lat::numeric, 2)
    END as location_lat,
    CASE 
        WHEN d.show_exact_location = true THEN d.location_lng
        ELSE ROUND(d.location_lng::numeric, 2)
    END as location_lng,
    d.city,
    d.created_at,
    array_agg(DISTINCT 
        jsonb_build_object(
            'style_name', ds.name,
            'skill_level', dds.skill_level,
            'is_teaching', dds.is_teaching
        )
    ) FILTER (WHERE ds.id IS NOT NULL) as dance_styles
FROM dancers d
LEFT JOIN dancer_dance_styles dds ON d.id = dds.dancer_id
LEFT JOIN dance_styles ds ON dds.dance_style_id = ds.id
WHERE d.is_active = true AND d.visibility = 'public'
GROUP BY d.id;

-- Widok nadchodzących wydarzeń
CREATE OR REPLACE VIEW vw_upcoming_events AS
SELECT 
    'outdoor' as event_type,
    oe.id,
    oe.title,
    oe.description,
    oe.event_date as start_date,
    oe.event_date + (oe.duration_minutes || ' minutes')::interval as end_date,
    oe.location_lat,
    oe.location_lng,
    oe.address,
    oe.max_participants,
    oe.current_participants,
    ds.name as dance_style_name,
    d.name as organizer_name,
    d.profile_photo_url as organizer_photo,
    'dancer' as organizer_type
FROM outdoor_events oe
JOIN dancers d ON oe.organizer_id = d.id
LEFT JOIN dance_styles ds ON oe.dance_style_id = ds.id
WHERE oe.status = 'planned' AND oe.event_date > NOW()

UNION ALL

SELECT 
    'school' as event_type,
    se.id,
    se.title,
    se.description,
    se.start_date,
    se.end_date,
    ds_loc.location_lat,
    ds_loc.location_lng,
    ds_loc.address,
    se.max_participants,
    se.current_participants,
    ds.name as dance_style_name,
    ds_loc.name as organizer_name,
    ds_loc.logo_url as organizer_photo,
    'school' as organizer_type
FROM school_events se
JOIN dance_schools ds_loc ON se.school_id = ds_loc.id
LEFT JOIN dance_styles ds ON se.dance_style_id = ds.id
WHERE se.status = 'planned' AND se.start_date > NOW();

