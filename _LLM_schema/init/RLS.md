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