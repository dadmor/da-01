-- Włączenie rozszerzeń potrzebnych w Supabase
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- Typy ENUM
CREATE TYPE user_type AS ENUM ('dancer', 'school');
CREATE TYPE skill_level AS ENUM ('beginner', 'intermediate', 'advanced', 'professional');
CREATE TYPE match_status AS ENUM ('pending', 'liked', 'disliked');
CREATE TYPE event_status AS ENUM ('planned', 'ongoing', 'completed', 'cancelled');
CREATE TYPE school_event_type AS ENUM ('workshop', 'party', 'competition', 'course');
CREATE TYPE participant_status AS ENUM ('registered', 'confirmed', 'attended', 'cancelled');
CREATE TYPE event_category AS ENUM ('outdoor', 'school');

-- 1. Tabela użytkowników (wspólna dla tancerzy i szkół)
CREATE TABLE users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    user_type user_type NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Profil tancerza
CREATE TABLE dancers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    bio TEXT,
    birth_date DATE,
    profile_photo_url TEXT,
    location_lat DECIMAL(10, 8),
    location_lng DECIMAL(11, 8),
    location_address TEXT,
    search_radius_km INTEGER DEFAULT 50,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id)
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
    phone TEXT,
    website TEXT,
    is_verified BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id)
);

-- 4. Słownik stylów tańca
CREATE TABLE dance_styles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT UNIQUE NOT NULL,
    category TEXT,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Style tańca tancerza
CREATE TABLE dancer_dance_styles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    dancer_id UUID NOT NULL REFERENCES dancers(id) ON DELETE CASCADE,
    dance_style_id UUID NOT NULL REFERENCES dance_styles(id) ON DELETE CASCADE,
    skill_level skill_level NOT NULL,
    years_experience INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(dancer_id, dance_style_id)
);

-- 6. Style nauczane w szkole
CREATE TABLE school_dance_styles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID NOT NULL REFERENCES dance_schools(id) ON DELETE CASCADE,
    dance_style_id UUID NOT NULL REFERENCES dance_styles(id) ON DELETE CASCADE,
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
    created_at TIMESTAMPTZ DEFAULT NOW()
);

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
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CHECK (dancer1_id < dancer2_id),
    UNIQUE(dancer1_id, dancer2_id)
);

-- 9. Wydarzenia plenerowe tancerzy
CREATE TABLE outdoor_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organizer_id UUID NOT NULL REFERENCES dancers(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    dance_style_id UUID REFERENCES dance_styles(id) ON DELETE SET NULL,
    event_date TIMESTAMPTZ NOT NULL,
    location_lat DECIMAL(10, 8) NOT NULL,
    location_lng DECIMAL(11, 8) NOT NULL,
    address TEXT NOT NULL,
    max_participants INTEGER,
    is_public BOOLEAN DEFAULT true,
    status event_status DEFAULT 'planned',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. Wydarzenia w szkołach
CREATE TABLE school_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID NOT NULL REFERENCES dance_schools(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    event_type school_event_type NOT NULL,
    dance_style_id UUID REFERENCES dance_styles(id) ON DELETE SET NULL,
    start_date TIMESTAMPTZ NOT NULL,
    end_date TIMESTAMPTZ NOT NULL,
    price DECIMAL(10, 2),
    max_participants INTEGER,
    registration_deadline DATE,
    status event_status DEFAULT 'planned',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. Uczestnicy wydarzeń
CREATE TABLE event_participants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID NOT NULL,
    event_type event_category NOT NULL,
    participant_id UUID NOT NULL REFERENCES dancers(id) ON DELETE CASCADE,
    status participant_status DEFAULT 'registered',
    registered_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(event_id, event_type, participant_id)
);

-- 12. Konwersacje czatu
CREATE TABLE chat_conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    participant1_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    participant2_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    last_message_at TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT true,
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
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 14. Dodatkowe zdjęcia tancerzy
CREATE TABLE dancer_photos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    dancer_id UUID NOT NULL REFERENCES dancers(id) ON DELETE CASCADE,
    photo_url TEXT NOT NULL,
    is_primary BOOLEAN DEFAULT false,
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 15. Galeria szkół
CREATE TABLE school_photos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID NOT NULL REFERENCES dance_schools(id) ON DELETE CASCADE,
    photo_url TEXT NOT NULL,
    caption TEXT,
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indeksy przestrzenne dla lokalizacji
CREATE INDEX idx_dancers_location ON dancers 
USING GIST (ST_MakePoint(location_lng, location_lat));

CREATE INDEX idx_schools_location ON dance_schools 
USING GIST (ST_MakePoint(location_lng, location_lat));

CREATE INDEX idx_outdoor_events_location ON outdoor_events 
USING GIST (ST_MakePoint(location_lng, location_lat));

-- Indeksy dla dopasowań
CREATE INDEX idx_matches_dancer1 ON matches(dancer1_id, dancer1_status);
CREATE INDEX idx_matches_dancer2 ON matches(dancer2_id, dancer2_status);
CREATE INDEX idx_matches_is_match ON matches(is_match) WHERE is_match = true;

-- Indeksy dla wiadomości
CREATE INDEX idx_messages_conversation ON chat_messages(conversation_id, created_at);
CREATE INDEX idx_messages_unread ON chat_messages(conversation_id, is_read) WHERE is_read = false;

-- Indeksy dla wydarzeń
CREATE INDEX idx_outdoor_events_date ON outdoor_events(event_date);
CREATE INDEX idx_school_events_dates ON school_events(start_date, end_date);
CREATE INDEX idx_event_participants_event ON event_participants(event_id, event_type);

-- Triggery do aktualizacji updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_dancers_updated_at BEFORE UPDATE ON dancers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_dance_schools_updated_at BEFORE UPDATE ON dance_schools
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_matches_updated_at BEFORE UPDATE ON matches
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_outdoor_events_updated_at BEFORE UPDATE ON outdoor_events
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_school_events_updated_at BEFORE UPDATE ON school_events
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger do ustawiania matched_at
CREATE OR REPLACE FUNCTION set_matched_at()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.is_match = true AND OLD.is_match = false THEN
        NEW.matched_at = NOW();
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER set_matched_at_trigger BEFORE UPDATE ON matches
    FOR EACH ROW EXECUTE FUNCTION set_matched_at();

-- Przykładowe polityki RLS (Row Level Security)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE dancers ENABLE ROW LEVEL SECURITY;
ALTER TABLE dance_schools ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_conversations ENABLE ROW LEVEL SECURITY;

-- Użytkownicy mogą czytać swoje dane
CREATE POLICY "Users can view own record" ON users
    FOR SELECT USING (auth.uid() = id);

-- Tancerze mogą aktualizować swój profil
CREATE POLICY "Dancers can update own profile" ON dancers
    FOR UPDATE USING (user_id = auth.uid());

-- Wszyscy mogą przeglądać aktywne profile tancerzy
CREATE POLICY "Anyone can view active dancers" ON dancers
    FOR SELECT USING (is_active = true);

-- Wszyscy mogą przeglądać aktywne szkoły
CREATE POLICY "Anyone can view active schools" ON dance_schools
    FOR SELECT USING (is_active = true);

-- Tylko dopasowani tancerze mogą rozpocząć czat
CREATE POLICY "Matched dancers can start conversations" ON chat_conversations
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM matches m
            JOIN dancers d1 ON m.dancer1_id = d1.id
            JOIN dancers d2 ON m.dancer2_id = d2.id
            WHERE m.is_match = true
            AND ((d1.user_id = auth.uid() AND d2.user_id = participant2_id)
                OR (d2.user_id = auth.uid() AND d1.user_id = participant1_id))
        )
    );

-- Użytkownicy mogą wysyłać wiadomości tylko w swoich konwersacjach
CREATE POLICY "Users can send messages in their conversations" ON chat_messages
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM chat_conversations
            WHERE id = conversation_id
            AND (participant1_id = auth.uid() OR participant2_id = auth.uid())
        )
    );

-- Wstawianie przykładowych danych do słownika stylów tańca
INSERT INTO dance_styles (name, category, description) VALUES
    ('Salsa', 'latin', 'Energiczny taniec latynoamerykański'),
    ('Bachata', 'latin', 'Romantyczny taniec z Dominikany'),
    ('Tango Argentyńskie', 'latin', 'Namiętny taniec z Buenos Aires'),
    ('Walc Wiedeński', 'standard', 'Klasyczny taniec towarzyski'),
    ('Hip-Hop', 'street', 'Nowoczesny taniec uliczny'),
    ('Jazz', 'modern', 'Ekspresyjny taniec sceniczny'),
    ('Ballet', 'classical', 'Klasyczny taniec baletowy'),
    ('Contemporary', 'modern', 'Współczesny taniec ekspresyjny'),
    ('Swing', 'social', 'Taniec towarzyski z lat 20-40'),
    ('Kizomba', 'african', 'Zmysłowy taniec z Angoli');