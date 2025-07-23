# ROW LEVEL SECURITY (RLS) POLICIES
Generated: 2025-07-23 16:35:35.716247+00

## 📊 RLS STATUS BY TABLE

| Table | RLS Status | Policies | Commands Covered |
|-------|------------|----------|------------------|
| conversation_participants | ✅ ENABLED | 4 | INSERT, SELECT |
| conversations | ✅ ENABLED | 1 | SELECT |
| dance_styles | ✅ ENABLED | 1 | SELECT |
| event_participants | ✅ ENABLED | 3 | INSERT, SELECT, UPDATE |
| events | ✅ ENABLED | 4 | DELETE, INSERT, SELECT, UPDATE |
| favorite_profiles | ✅ ENABLED | 0 | None |
| likes | ✅ ENABLED | 3 | DELETE, INSERT, SELECT |
| message_reads | ✅ ENABLED | 0 | None |
| messages | ✅ ENABLED | 2 | INSERT, SELECT |
| reviews | ✅ ENABLED | 3 | INSERT, SELECT, UPDATE |
| spatial_ref_sys | ❌ DISABLED | 0 | None |
| user_dance_styles | ✅ ENABLED | 2 | ALL, SELECT |
| user_photos | ✅ ENABLED | 2 | ALL, SELECT |
| user_reports | ✅ ENABLED | 2 | INSERT, SELECT |
| users | ✅ ENABLED | 3 | INSERT, SELECT, UPDATE |

## 🔐 POLICIES BY TABLE

## Table: `conversation_participants`
**RLS Status**: ✅ ENABLED

### Policy: `Users can view other participants in their conversations`
- **Command**: SELECT
- **Type**: PERMISSIVE
- **Roles**: PUBLIC
- **USING**: 
```sql
(conversation_id IN ( SELECT conversation_participants_1.conversation_id
   FROM conversation_participants conversation_participants_1
  WHERE conversation_participants_1.user_id = auth.uid()))
```

**Full Definition**:
```sql
CREATE POLICY "Users can view other participants in their conversations"
ON public.conversation_participants
AS PERMISSIVE
FOR SELECT
TO PUBLIC
USING ((conversation_id IN ( SELECT conversation_participants_1.conversation_id
   FROM conversation_participants conversation_participants_1
  WHERE conversation_participants_1.user_id = auth.uid())));
```

### Policy: `Users can view own participation`
- **Command**: SELECT
- **Type**: PERMISSIVE
- **Roles**: PUBLIC
- **USING**: 
```sql
user_id = auth.uid()
```

**Full Definition**:
```sql
CREATE POLICY "Users can view own participation"
ON public.conversation_participants
AS PERMISSIVE
FOR SELECT
TO PUBLIC
USING (user_id = auth.uid());
```

### Policy: `System can insert conversation participants`
- **Command**: INSERT
- **Type**: PERMISSIVE
- **Roles**: PUBLIC
- **USING**: 
```sql
true
```
- **WITH CHECK**: 
```sql
true
```

**Full Definition**:
```sql
CREATE POLICY "System can insert conversation participants"
ON public.conversation_participants
AS PERMISSIVE
FOR INSERT
TO PUBLIC
USING (true)
WITH CHECK (true);
```

### Policy: `Users can be added to conversations`
- **Command**: INSERT
- **Type**: PERMISSIVE
- **Roles**: PUBLIC
- **USING**: 
```sql
true
```
- **WITH CHECK**: 
```sql
user_id = auth.uid() OR (EXISTS ( SELECT 1
   FROM likes l1
     JOIN likes l2 ON l1.from_user_id = l2.to_user_id AND l1.to_user_id = l2.from_user_id
  WHERE l1.from_user_id = auth.uid() AND l1.to_user_id = conversation_participants.user_id OR l2.from_user_id = auth.uid() AND l2.to_user_id = conversation_participants.user_id))
```

**Full Definition**:
```sql
CREATE POLICY "Users can be added to conversations"
ON public.conversation_participants
AS PERMISSIVE
FOR INSERT
TO PUBLIC
USING (true)
WITH CHECK (user_id = auth.uid() OR (EXISTS ( SELECT 1
   FROM likes l1
     JOIN likes l2 ON l1.from_user_id = l2.to_user_id AND l1.to_user_id = l2.from_user_id
  WHERE l1.from_user_id = auth.uid() AND l1.to_user_id = conversation_participants.user_id OR l2.from_user_id = auth.uid() AND l2.to_user_id = conversation_participants.user_id)));
```

## Table: `conversations`
**RLS Status**: ✅ ENABLED

### Policy: `Users can view own conversations`
- **Command**: SELECT
- **Type**: PERMISSIVE
- **Roles**: PUBLIC
- **USING**: 
```sql
(id IN ( SELECT conversation_participants.conversation_id
   FROM conversation_participants
  WHERE conversation_participants.user_id = auth.uid()))
```

**Full Definition**:
```sql
CREATE POLICY "Users can view own conversations"
ON public.conversations
AS PERMISSIVE
FOR SELECT
TO PUBLIC
USING ((id IN ( SELECT conversation_participants.conversation_id
   FROM conversation_participants
  WHERE conversation_participants.user_id = auth.uid())));
```

## Table: `dance_styles`
**RLS Status**: ✅ ENABLED

### Policy: `Dance styles are viewable by all`
- **Command**: SELECT
- **Type**: PERMISSIVE
- **Roles**: PUBLIC
- **USING**: 
```sql
is_active = true
```

**Full Definition**:
```sql
CREATE POLICY "Dance styles are viewable by all"
ON public.dance_styles
AS PERMISSIVE
FOR SELECT
TO PUBLIC
USING (is_active = true);
```

## Table: `event_participants`
**RLS Status**: ✅ ENABLED

### Policy: `Participants can view event participants`
- **Command**: SELECT
- **Type**: PERMISSIVE
- **Roles**: PUBLIC
- **USING**: 
```sql
user_id = auth.uid() OR (EXISTS ( SELECT 1
   FROM events
  WHERE events.id = event_participants.event_id AND events.organizer_id = auth.uid()))
```

**Full Definition**:
```sql
CREATE POLICY "Participants can view event participants"
ON public.event_participants
AS PERMISSIVE
FOR SELECT
TO PUBLIC
USING (user_id = auth.uid() OR (EXISTS ( SELECT 1
   FROM events
  WHERE events.id = event_participants.event_id AND events.organizer_id = auth.uid())));
```

### Policy: `Users can register for events`
- **Command**: INSERT
- **Type**: PERMISSIVE
- **Roles**: PUBLIC
- **USING**: 
```sql
true
```
- **WITH CHECK**: 
```sql
user_id = auth.uid() AND (EXISTS ( SELECT 1
   FROM events
  WHERE events.id = event_participants.event_id AND events.visibility = 'public'::text AND events.status = 'published'::text))
```

**Full Definition**:
```sql
CREATE POLICY "Users can register for events"
ON public.event_participants
AS PERMISSIVE
FOR INSERT
TO PUBLIC
USING (true)
WITH CHECK (user_id = auth.uid() AND (EXISTS ( SELECT 1
   FROM events
  WHERE events.id = event_participants.event_id AND events.visibility = 'public'::text AND events.status = 'published'::text)));
```

### Policy: `Users can update own participation`
- **Command**: UPDATE
- **Type**: PERMISSIVE
- **Roles**: PUBLIC
- **USING**: 
```sql
user_id = auth.uid()
```
- **WITH CHECK**: 
```sql
user_id = auth.uid()
```

**Full Definition**:
```sql
CREATE POLICY "Users can update own participation"
ON public.event_participants
AS PERMISSIVE
FOR UPDATE
TO PUBLIC
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());
```

## Table: `events`
**RLS Status**: ✅ ENABLED

### Policy: `Events select policy`
- **Command**: SELECT
- **Type**: PERMISSIVE
- **Roles**: PUBLIC
- **USING**: 
```sql
visibility = 'public'::text OR organizer_id = auth.uid()
```

**Full Definition**:
```sql
CREATE POLICY "Events select policy"
ON public.events
AS PERMISSIVE
FOR SELECT
TO PUBLIC
USING (visibility = 'public'::text OR organizer_id = auth.uid());
```

### Policy: `Events insert policy`
- **Command**: INSERT
- **Type**: PERMISSIVE
- **Roles**: PUBLIC
- **USING**: 
```sql
true
```
- **WITH CHECK**: 
```sql
organizer_id = auth.uid()
```

**Full Definition**:
```sql
CREATE POLICY "Events insert policy"
ON public.events
AS PERMISSIVE
FOR INSERT
TO PUBLIC
USING (true)
WITH CHECK (organizer_id = auth.uid());
```

### Policy: `Events update policy`
- **Command**: UPDATE
- **Type**: PERMISSIVE
- **Roles**: PUBLIC
- **USING**: 
```sql
organizer_id = auth.uid()
```
- **WITH CHECK**: 
```sql
organizer_id = auth.uid()
```

**Full Definition**:
```sql
CREATE POLICY "Events update policy"
ON public.events
AS PERMISSIVE
FOR UPDATE
TO PUBLIC
USING (organizer_id = auth.uid())
WITH CHECK (organizer_id = auth.uid());
```

### Policy: `Events delete policy`
- **Command**: DELETE
- **Type**: PERMISSIVE
- **Roles**: PUBLIC
- **USING**: 
```sql
organizer_id = auth.uid()
```

**Full Definition**:
```sql
CREATE POLICY "Events delete policy"
ON public.events
AS PERMISSIVE
FOR DELETE
TO PUBLIC
USING (organizer_id = auth.uid());
```

## Table: `likes`
**RLS Status**: ✅ ENABLED

### Policy: `Users can view own likes`
- **Command**: SELECT
- **Type**: PERMISSIVE
- **Roles**: PUBLIC
- **USING**: 
```sql
from_user_id = auth.uid() OR to_user_id = auth.uid()
```

**Full Definition**:
```sql
CREATE POLICY "Users can view own likes"
ON public.likes
AS PERMISSIVE
FOR SELECT
TO PUBLIC
USING (from_user_id = auth.uid() OR to_user_id = auth.uid());
```

### Policy: `Users can create likes`
- **Command**: INSERT
- **Type**: PERMISSIVE
- **Roles**: PUBLIC
- **USING**: 
```sql
true
```
- **WITH CHECK**: 
```sql
from_user_id = auth.uid()
```

**Full Definition**:
```sql
CREATE POLICY "Users can create likes"
ON public.likes
AS PERMISSIVE
FOR INSERT
TO PUBLIC
USING (true)
WITH CHECK (from_user_id = auth.uid());
```

### Policy: `Users can delete own likes`
- **Command**: DELETE
- **Type**: PERMISSIVE
- **Roles**: PUBLIC
- **USING**: 
```sql
from_user_id = auth.uid()
```

**Full Definition**:
```sql
CREATE POLICY "Users can delete own likes"
ON public.likes
AS PERMISSIVE
FOR DELETE
TO PUBLIC
USING (from_user_id = auth.uid());
```

## Table: `messages`
**RLS Status**: ✅ ENABLED

### Policy: `Participants can view messages`
- **Command**: SELECT
- **Type**: PERMISSIVE
- **Roles**: PUBLIC
- **USING**: 
```sql
(EXISTS ( SELECT 1
   FROM conversation_participants
  WHERE conversation_participants.conversation_id = messages.conversation_id AND conversation_participants.user_id = auth.uid()))
```

**Full Definition**:
```sql
CREATE POLICY "Participants can view messages"
ON public.messages
AS PERMISSIVE
FOR SELECT
TO PUBLIC
USING ((EXISTS ( SELECT 1
   FROM conversation_participants
  WHERE conversation_participants.conversation_id = messages.conversation_id AND conversation_participants.user_id = auth.uid())));
```

### Policy: `Users can send messages to own conversations`
- **Command**: INSERT
- **Type**: PERMISSIVE
- **Roles**: PUBLIC
- **USING**: 
```sql
true
```
- **WITH CHECK**: 
```sql
sender_id = auth.uid() AND (EXISTS ( SELECT 1
   FROM conversation_participants
  WHERE conversation_participants.conversation_id = messages.conversation_id AND conversation_participants.user_id = auth.uid()))
```

**Full Definition**:
```sql
CREATE POLICY "Users can send messages to own conversations"
ON public.messages
AS PERMISSIVE
FOR INSERT
TO PUBLIC
USING (true)
WITH CHECK (sender_id = auth.uid() AND (EXISTS ( SELECT 1
   FROM conversation_participants
  WHERE conversation_participants.conversation_id = messages.conversation_id AND conversation_participants.user_id = auth.uid())));
```

## Table: `reviews`
**RLS Status**: ✅ ENABLED

### Policy: `Reviews are publicly viewable`
- **Command**: SELECT
- **Type**: PERMISSIVE
- **Roles**: PUBLIC
- **USING**: 
```sql
is_visible = true
```

**Full Definition**:
```sql
CREATE POLICY "Reviews are publicly viewable"
ON public.reviews
AS PERMISSIVE
FOR SELECT
TO PUBLIC
USING (is_visible = true);
```

### Policy: `Users can create reviews`
- **Command**: INSERT
- **Type**: PERMISSIVE
- **Roles**: PUBLIC
- **USING**: 
```sql
true
```
- **WITH CHECK**: 
```sql
reviewer_id = auth.uid() AND (EXISTS ( SELECT 1
   FROM event_participants
  WHERE event_participants.user_id = auth.uid() AND event_participants.event_id = reviews.event_id AND event_participants.status = 'attended'::text))
```

**Full Definition**:
```sql
CREATE POLICY "Users can create reviews"
ON public.reviews
AS PERMISSIVE
FOR INSERT
TO PUBLIC
USING (true)
WITH CHECK (reviewer_id = auth.uid() AND (EXISTS ( SELECT 1
   FROM event_participants
  WHERE event_participants.user_id = auth.uid() AND event_participants.event_id = reviews.event_id AND event_participants.status = 'attended'::text)));
```

### Policy: `Users can update own reviews`
- **Command**: UPDATE
- **Type**: PERMISSIVE
- **Roles**: PUBLIC
- **USING**: 
```sql
reviewer_id = auth.uid()
```
- **WITH CHECK**: 
```sql
reviewer_id = auth.uid()
```

**Full Definition**:
```sql
CREATE POLICY "Users can update own reviews"
ON public.reviews
AS PERMISSIVE
FOR UPDATE
TO PUBLIC
USING (reviewer_id = auth.uid())
WITH CHECK (reviewer_id = auth.uid());
```

## Table: `user_dance_styles`
**RLS Status**: ✅ ENABLED

### Policy: `User dance styles viewable based on user visibility`
- **Command**: SELECT
- **Type**: PERMISSIVE
- **Roles**: PUBLIC
- **USING**: 
```sql
(EXISTS ( SELECT 1
   FROM users u
  WHERE u.id = user_dance_styles.user_id AND (u.visibility = 'public'::text OR u.id = auth.uid())))
```

**Full Definition**:
```sql
CREATE POLICY "User dance styles viewable based on user visibility"
ON public.user_dance_styles
AS PERMISSIVE
FOR SELECT
TO PUBLIC
USING ((EXISTS ( SELECT 1
   FROM users u
  WHERE u.id = user_dance_styles.user_id AND (u.visibility = 'public'::text OR u.id = auth.uid()))));
```

### Policy: `Users can manage own dance styles`
- **Command**: ALL
- **Type**: PERMISSIVE
- **Roles**: PUBLIC
- **USING**: 
```sql
user_id = auth.uid()
```
- **WITH CHECK**: 
```sql
user_id = auth.uid()
```

**Full Definition**:
```sql
CREATE POLICY "Users can manage own dance styles"
ON public.user_dance_styles
AS PERMISSIVE
FOR ALL
TO PUBLIC
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());
```

## Table: `user_photos`
**RLS Status**: ✅ ENABLED

### Policy: `User photos viewable based on user visibility`
- **Command**: SELECT
- **Type**: PERMISSIVE
- **Roles**: PUBLIC
- **USING**: 
```sql
(EXISTS ( SELECT 1
   FROM users u
  WHERE u.id = user_photos.user_id AND (u.visibility = 'public'::text OR u.id = auth.uid())))
```

**Full Definition**:
```sql
CREATE POLICY "User photos viewable based on user visibility"
ON public.user_photos
AS PERMISSIVE
FOR SELECT
TO PUBLIC
USING ((EXISTS ( SELECT 1
   FROM users u
  WHERE u.id = user_photos.user_id AND (u.visibility = 'public'::text OR u.id = auth.uid()))));
```

### Policy: `Users can manage own photos`
- **Command**: ALL
- **Type**: PERMISSIVE
- **Roles**: PUBLIC
- **USING**: 
```sql
user_id = auth.uid()
```
- **WITH CHECK**: 
```sql
user_id = auth.uid()
```

**Full Definition**:
```sql
CREATE POLICY "Users can manage own photos"
ON public.user_photos
AS PERMISSIVE
FOR ALL
TO PUBLIC
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());
```

## Table: `user_reports`
**RLS Status**: ✅ ENABLED

### Policy: `Users can view own reports`
- **Command**: SELECT
- **Type**: PERMISSIVE
- **Roles**: PUBLIC
- **USING**: 
```sql
reporter_id = auth.uid()
```

**Full Definition**:
```sql
CREATE POLICY "Users can view own reports"
ON public.user_reports
AS PERMISSIVE
FOR SELECT
TO PUBLIC
USING (reporter_id = auth.uid());
```

### Policy: `Users can create reports`
- **Command**: INSERT
- **Type**: PERMISSIVE
- **Roles**: PUBLIC
- **USING**: 
```sql
true
```
- **WITH CHECK**: 
```sql
reporter_id = auth.uid()
```

**Full Definition**:
```sql
CREATE POLICY "Users can create reports"
ON public.user_reports
AS PERMISSIVE
FOR INSERT
TO PUBLIC
USING (true)
WITH CHECK (reporter_id = auth.uid());
```

## Table: `users`
**RLS Status**: ✅ ENABLED

### Policy: `Users can view public profiles`
- **Command**: SELECT
- **Type**: PERMISSIVE
- **Roles**: PUBLIC
- **USING**: 
```sql
visibility = 'public'::text OR id = auth.uid() OR (EXISTS ( SELECT 1
   FROM v_matches
  WHERE v_matches.user1_id = auth.uid() AND v_matches.user2_id = users.id OR v_matches.user2_id = auth.uid() AND v_matches.user1_id = users.id))
```

**Full Definition**:
```sql
CREATE POLICY "Users can view public profiles"
ON public.users
AS PERMISSIVE
FOR SELECT
TO PUBLIC
USING (visibility = 'public'::text OR id = auth.uid() OR (EXISTS ( SELECT 1
   FROM v_matches
  WHERE v_matches.user1_id = auth.uid() AND v_matches.user2_id = users.id OR v_matches.user2_id = auth.uid() AND v_matches.user1_id = users.id)));
```

### Policy: `Users can insert own profile`
- **Command**: INSERT
- **Type**: PERMISSIVE
- **Roles**: PUBLIC
- **USING**: 
```sql
true
```
- **WITH CHECK**: 
```sql
id = auth.uid()
```

**Full Definition**:
```sql
CREATE POLICY "Users can insert own profile"
ON public.users
AS PERMISSIVE
FOR INSERT
TO PUBLIC
USING (true)
WITH CHECK (id = auth.uid());
```

### Policy: `Users can update own profile`
- **Command**: UPDATE
- **Type**: PERMISSIVE
- **Roles**: PUBLIC
- **USING**: 
```sql
id = auth.uid()
```
- **WITH CHECK**: 
```sql
id = auth.uid()
```

**Full Definition**:
```sql
CREATE POLICY "Users can update own profile"
ON public.users
AS PERMISSIVE
FOR UPDATE
TO PUBLIC
USING (id = auth.uid())
WITH CHECK (id = auth.uid());
```

## 📝 NOTES

- **PERMISSIVE**: Policies are combined with OR (at least one must pass)
- **RESTRICTIVE**: Policies are combined with AND (all must pass)
- **USING**: Determines which rows can be seen/affected
- **WITH CHECK**: Additional check for INSERT/UPDATE operations
- **FORCED**: RLS applies even to table owner and superusers

## 🚀 QUICK COMMANDS

```sql
-- Enable RLS on a table
ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;

-- Force RLS (even for owner)
ALTER TABLE table_name FORCE ROW LEVEL SECURITY;

-- Disable RLS
ALTER TABLE table_name DISABLE ROW LEVEL SECURITY;

-- Drop all policies on a table
DROP POLICY IF EXISTS policy_name ON table_name;
```
