# DATABASE TRIGGERS AND FUNCTIONS
Generated: 2025-07-23 16:35:26.570234+00
Filter: Only triggers with prefix "trg_" and functions with prefix "fn_"

## TRIGGERS (prefix: trg_)

### Trigger: trg_update_participant_count
- **Table**: event_participants
- **Timing**: AFTER UPDATE
- **Orientation**: ROW

```sql
CREATE TRIGGER trg_update_participant_count AFTER INSERT OR DELETE OR UPDATE ON public.event_participants FOR EACH ROW EXECUTE FUNCTION fn_update_event_participant_count()
```

### Trigger: trg_update_participant_count
- **Table**: event_participants
- **Timing**: AFTER INSERT
- **Orientation**: ROW

```sql
CREATE TRIGGER trg_update_participant_count AFTER INSERT OR DELETE OR UPDATE ON public.event_participants FOR EACH ROW EXECUTE FUNCTION fn_update_event_participant_count()
```

### Trigger: trg_update_participant_count
- **Table**: event_participants
- **Timing**: AFTER DELETE
- **Orientation**: ROW

```sql
CREATE TRIGGER trg_update_participant_count AFTER INSERT OR DELETE OR UPDATE ON public.event_participants FOR EACH ROW EXECUTE FUNCTION fn_update_event_participant_count()
```

### Trigger: trg_events_updated_at
- **Table**: events
- **Timing**: BEFORE UPDATE
- **Orientation**: ROW

```sql
CREATE TRIGGER trg_events_updated_at BEFORE UPDATE ON public.events FOR EACH ROW EXECUTE FUNCTION fn_update_updated_at()
```

### Trigger: trg_create_match_conversation
- **Table**: likes
- **Timing**: AFTER INSERT
- **Orientation**: ROW

```sql
CREATE TRIGGER trg_create_match_conversation AFTER INSERT ON public.likes FOR EACH ROW EXECUTE FUNCTION fn_create_match_conversation()
```

### Trigger: trg_reset_unread_on_read
- **Table**: message_reads
- **Timing**: AFTER INSERT
- **Orientation**: ROW

```sql
CREATE TRIGGER trg_reset_unread_on_read AFTER INSERT ON public.message_reads FOR EACH ROW EXECUTE FUNCTION fn_reset_unread_count()
```

### Trigger: trg_update_conversation_on_message
- **Table**: messages
- **Timing**: AFTER INSERT
- **Orientation**: ROW

```sql
CREATE TRIGGER trg_update_conversation_on_message AFTER INSERT ON public.messages FOR EACH ROW EXECUTE FUNCTION fn_update_conversation_last_message()
```

### Trigger: trg_reviews_updated_at
- **Table**: reviews
- **Timing**: BEFORE UPDATE
- **Orientation**: ROW

```sql
CREATE TRIGGER trg_reviews_updated_at BEFORE UPDATE ON public.reviews FOR EACH ROW EXECUTE FUNCTION fn_update_updated_at()
```

### Trigger: trg_user_dance_styles_updated_at
- **Table**: user_dance_styles
- **Timing**: BEFORE UPDATE
- **Orientation**: ROW

```sql
CREATE TRIGGER trg_user_dance_styles_updated_at BEFORE UPDATE ON public.user_dance_styles FOR EACH ROW EXECUTE FUNCTION fn_update_updated_at()
```

### Trigger: trg_check_photo_limit
- **Table**: user_photos
- **Timing**: BEFORE INSERT
- **Orientation**: ROW

```sql
CREATE TRIGGER trg_check_photo_limit BEFORE INSERT ON public.user_photos FOR EACH ROW EXECUTE FUNCTION fn_check_photo_limit()
```

### Trigger: trg_users_location_earth
- **Table**: users
- **Timing**: BEFORE INSERT
- **Orientation**: ROW

```sql
CREATE TRIGGER trg_users_location_earth BEFORE INSERT OR UPDATE OF location_lat, location_lng ON public.users FOR EACH ROW EXECUTE FUNCTION fn_update_location_earth()
```

### Trigger: trg_users_location_earth
- **Table**: users
- **Timing**: BEFORE UPDATE
- **Orientation**: ROW

```sql
CREATE TRIGGER trg_users_location_earth BEFORE INSERT OR UPDATE OF location_lat, location_lng ON public.users FOR EACH ROW EXECUTE FUNCTION fn_update_location_earth()
```

### Trigger: trg_users_updated_at
- **Table**: users
- **Timing**: BEFORE UPDATE
- **Orientation**: ROW

```sql
CREATE TRIGGER trg_users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION fn_update_updated_at()
```


## FUNCTIONS (prefix: fn_)

### Function: fn_check_photo_limit()
```sql
CREATE OR REPLACE FUNCTION public.fn_check_photo_limit()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
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
$function$

```

### Function: fn_create_match_conversation()
```sql
CREATE OR REPLACE FUNCTION public.fn_create_match_conversation()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
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
$function$

```

### Function: fn_find_users_within_radius(p_user_id uuid, p_radius_km integer)
```sql
CREATE OR REPLACE FUNCTION public.fn_find_users_within_radius(p_user_id uuid, p_radius_km integer DEFAULT NULL::integer)
 RETURNS TABLE(user_id uuid, distance_km numeric)
 LANGUAGE plpgsql
AS $function$
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
$function$

```

### Function: fn_handle_new_user()
```sql
CREATE OR REPLACE FUNCTION public.fn_handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
    INSERT INTO public.users (id, email, name, is_active)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)), -- użyj nazwy z metadanych lub część przed @ z emaila
        true
    );
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        -- Loguj błąd ale nie przerywaj rejestracji
        RAISE WARNING 'Error creating user profile: %', SQLERRM;
        RETURN NEW;
END;
$function$

```

### Function: fn_reset_unread_count()
```sql
CREATE OR REPLACE FUNCTION public.fn_reset_unread_count()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
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
$function$

```

### Function: fn_update_conversation_last_message()
```sql
CREATE OR REPLACE FUNCTION public.fn_update_conversation_last_message()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
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
$function$

```

### Function: fn_update_event_participant_count()
```sql
CREATE OR REPLACE FUNCTION public.fn_update_event_participant_count()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
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
$function$

```

### Function: fn_update_location_earth()
```sql
CREATE OR REPLACE FUNCTION public.fn_update_location_earth()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    IF NEW.location_lat IS NOT NULL AND NEW.location_lng IS NOT NULL THEN
        NEW.location_earth = ll_to_earth(NEW.location_lat, NEW.location_lng);
    ELSE
        NEW.location_earth = NULL;
    END IF;
    RETURN NEW;
END;
$function$

```

### Function: fn_update_updated_at()
```sql
CREATE OR REPLACE FUNCTION public.fn_update_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$function$

```

