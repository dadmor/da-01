# Polityki RLS (Row Level Security)
## Przykładowe polityki dla Supabase:

-- Tancerze mogą edytować tylko swój profil
CREATE POLICY "Dancers can update own profile" ON dancers
FOR UPDATE USING (user_id = auth.uid());

-- Wszyscy mogą przeglądać aktywne profile
CREATE POLICY "Anyone can view active dancers" ON dancers
FOR SELECT USING (is_active = true);

-- Tylko dopasowani tancerze mogą rozpocząć czat
CREATE POLICY "Matched dancers can chat" ON chat_messages
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM matches
    WHERE is_match = true
    AND ((dancer1_id = auth.uid() AND dancer2_id = sender_id)
    OR (dancer2_id = auth.uid() AND dancer1_id = sender_id))
  )
);


# Indeksy

-- Indeksy przestrzenne dla lokalizacji
CREATE INDEX idx_dancers_location ON dancers USING GIST (
  geography(ST_MakePoint(location_lng, location_lat))
);

CREATE INDEX idx_schools_location ON dance_schools USING GIST (
  geography(ST_MakePoint(location_lng, location_lat))
);

-- Indeksy dla dopasowań
CREATE INDEX idx_matches_dancer1 ON matches(dancer1_id, dancer1_status);
CREATE INDEX idx_matches_dancer2 ON matches(dancer2_id, dancer2_status);

-- Indeks dla wiadomości
CREATE INDEX idx_messages_conversation ON chat_messages(conversation_id, created_at);