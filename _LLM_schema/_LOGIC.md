# DATABASE TRIGGERS AND FUNCTIONS
Generated: 2025-07-23 12:06:29.321574+00

## TRIGGERS

### Trigger: trg_update_user_stats
- **Table**: progress
- **Timing**: AFTER UPDATE
- **Orientation**: ROW

```sql
CREATE TRIGGER trg_update_user_stats AFTER INSERT OR UPDATE ON public.progress FOR EACH ROW EXECUTE FUNCTION fn_update_user_stats()
```

### Trigger: trg_update_user_stats
- **Table**: progress
- **Timing**: AFTER INSERT
- **Orientation**: ROW

```sql
CREATE TRIGGER trg_update_user_stats AFTER INSERT OR UPDATE ON public.progress FOR EACH ROW EXECUTE FUNCTION fn_update_user_stats()
```


## FUNCTIONS

### Function: fn_calculate_user_streak(p_user_id uuid)
```sql
CREATE OR REPLACE FUNCTION public.fn_calculate_user_streak(p_user_id uuid)
 RETURNS integer
 LANGUAGE plpgsql
AS $function$
DECLARE
  activity_dates DATE[];
  current_streak INT := 0;
  i INT;
  prev_date DATE;
BEGIN
  -- Pobierz unikalne daty aktywności, posortowane malejąco
  SELECT array_agg(DISTINCT completed_at::date ORDER BY completed_at::date DESC)
  INTO activity_dates
  FROM progress 
  WHERE user_id = p_user_id;
  
  -- Jeśli brak aktywności
  IF activity_dates IS NULL OR array_length(activity_dates, 1) = 0 THEN
    RETURN 0;
  END IF;
  
  -- Sprawdź czy dzisiaj była aktywność
  IF activity_dates[1] != CURRENT_DATE THEN
    -- Jeśli wczoraj była aktywność, rozpocznij od wczoraj
    IF activity_dates[1] = CURRENT_DATE - INTERVAL '1 day' THEN
      current_streak := 1;
      prev_date := activity_dates[1];
      i := 2;
    ELSE
      RETURN 0; -- Przerwa w streak
    END IF;
  ELSE
    -- Dzisiaj była aktywność
    current_streak := 1;
    prev_date := activity_dates[1];
    i := 2;
  END IF;
  
  -- Sprawdź kolejne dni wstecz
  WHILE i <= array_length(activity_dates, 1) LOOP
    IF activity_dates[i] = prev_date - INTERVAL '1 day' THEN
      current_streak := current_streak + 1;
      prev_date := activity_dates[i];
    ELSE
      EXIT; -- Przerwa w streak
    END IF;
    i := i + 1;
  END LOOP;
  
  RETURN current_streak;
END;
$function$

```

### Function: fn_check_and_award_badges(p_user_id uuid)
```sql
CREATE OR REPLACE FUNCTION public.fn_check_and_award_badges(p_user_id uuid)
 RETURNS integer
 LANGUAGE plpgsql
AS $function$
DECLARE
  user_stats RECORD;
  badge_rec RECORD;
  awarded_count INT := 0;
BEGIN
  -- Pobierz aktualne statystyki użytkownika
  SELECT xp, level, streak INTO user_stats
  FROM users WHERE id = p_user_id;
  
  -- Sprawdź wszystkie kryteria odznak
  FOR badge_rec IN 
    SELECT bc.badge_id, b.name, bc.criteria_type, bc.criteria_value
    FROM badge_criteria bc
    JOIN badges b ON bc.badge_id = b.id
    WHERE NOT EXISTS (
      SELECT 1 FROM user_badges ub 
      WHERE ub.user_id = p_user_id AND ub.badge_id = bc.badge_id
    )
  LOOP
    -- Sprawdź czy użytkownik spełnia kryterium
    IF (badge_rec.criteria_type = 'level' AND user_stats.level >= badge_rec.criteria_value)
       OR (badge_rec.criteria_type = 'streak' AND user_stats.streak >= badge_rec.criteria_value)  
       OR (badge_rec.criteria_type = 'xp' AND user_stats.xp >= badge_rec.criteria_value) THEN
      
      -- Przyznaj odznakę
      INSERT INTO user_badges(user_id, badge_id)
      VALUES (p_user_id, badge_rec.badge_id);
      
      awarded_count := awarded_count + 1;
      
      RAISE NOTICE 'Przyznano odznakę "%" użytkownikowi %', badge_rec.name, p_user_id;
    END IF;
  END LOOP;
  
  RETURN awarded_count;
END;
$function$

```

### Function: fn_process_lesson_answers(p_user_id uuid, p_lesson_id uuid, p_answers jsonb)
```sql
CREATE OR REPLACE FUNCTION public.fn_process_lesson_answers(p_user_id uuid, p_lesson_id uuid, p_answers jsonb)
 RETURNS TABLE(score integer, total_tasks integer, correct_tasks integer, xp_earned integer, streak_bonus integer)
 LANGUAGE plpgsql
AS $function$DECLARE
  answer_rec RECORD;
  task_rec RECORD;
  correct_count INT := 0;
  total_count INT := 0;
  lesson_score INT;
  base_xp INT := 0;
  current_streak INT;
  streak_bonus_val INT := 0;
  final_xp INT;
BEGIN
  -- Walidacja struktury JSON
  IF jsonb_typeof(p_answers) != 'array' OR jsonb_array_length(p_answers) = 0 THEN
    RAISE EXCEPTION 'Answers musi być niepustą tablicą JSON';
  END IF;
  
  -- Pobierz aktualny streak użytkownika
  SELECT users.streak INTO current_streak 
  FROM users WHERE id = p_user_id;
  
  -- Oblicz bonus za streak (5 punktów za każdy dzień, max 50)
  streak_bonus_val := LEAST(COALESCE(current_streak, 0) * 5, 50);
  
  -- Przejdź przez wszystkie odpowiedzi
  FOR answer_rec IN 
    SELECT 
      (answer_item->>'task_id')::UUID as task_id,
      answer_item->>'answer' as user_answer
    FROM jsonb_array_elements(p_answers) as answer_item
  LOOP
    -- Walidacja struktury pojedynczej odpowiedzi
    IF answer_rec.task_id IS NULL OR answer_rec.user_answer IS NULL THEN
      RAISE EXCEPTION 'Każda odpowiedź musi zawierać task_id i answer';
    END IF;
    
    total_count := total_count + 1;
    
    -- Pobierz dane zadania i sprawdź czy należy do lekcji
    SELECT correct_answer, xp_reward 
    INTO task_rec 
    FROM tasks 
    WHERE id = answer_rec.task_id AND lesson_id = p_lesson_id;
    
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Zadanie % nie należy do lekcji %', answer_rec.task_id, p_lesson_id;
    END IF;
    
    IF answer_rec.user_answer = task_rec.correct_answer THEN
      -- Poprawna odpowiedź
      correct_count := correct_count + 1;
      base_xp := base_xp + task_rec.xp_reward;
    ELSE
      -- Błędna odpowiedź - zapisz do analizy
      INSERT INTO incorrect_answers (user_id, task_id, lesson_id, given_answer)
      VALUES (p_user_id, answer_rec.task_id, p_lesson_id, answer_rec.user_answer);
    END IF;
  END LOOP;
  
  -- Oblicz wynik procentowy
  lesson_score := CASE 
    WHEN total_count > 0 THEN ROUND((correct_count::DECIMAL / total_count) * 100)
    ELSE 0 
  END;
  
  final_xp := base_xp + streak_bonus_val;
  
  -- Zapisz lub zaktualizuj progress
  INSERT INTO progress (user_id, lesson_id, score, total_tasks, correct_tasks, streak_bonus)
  VALUES (p_user_id, p_lesson_id, lesson_score, total_count, correct_count, streak_bonus_val)
  ON CONFLICT (user_id, lesson_id) 
  DO UPDATE SET
    score = GREATEST(progress.score, EXCLUDED.score),  -- Zachowaj lepszy wynik
    total_tasks = EXCLUDED.total_tasks,
    correct_tasks = EXCLUDED.correct_tasks,
    attempts_count = progress.attempts_count + 1,
    streak_bonus = EXCLUDED.streak_bonus,
    completed_at = NOW();
  
  -- Zwróć wyniki
  RETURN QUERY SELECT lesson_score, total_count, correct_count, final_xp, streak_bonus_val;
  
  RAISE NOTICE 'Przetworzono lekcję % dla użytkownika %: %/% (Score: %, XP: %)', 
    p_lesson_id, p_user_id, correct_count, total_count, lesson_score, final_xp;
END;$function$

```

### Function: fn_rebuild_user_stats(p_user_id uuid)
```sql
CREATE OR REPLACE FUNCTION public.fn_rebuild_user_stats(p_user_id uuid DEFAULT NULL::uuid)
 RETURNS void
 LANGUAGE plpgsql
AS $function$
DECLARE
  user_rec RECORD;
BEGIN
  FOR user_rec IN 
    SELECT id FROM users 
    WHERE (p_user_id IS NULL OR id = p_user_id)
      AND role = 'student'
  LOOP
    -- Wywołaj aktualizację stats poprzez dummy update
    UPDATE progress 
    SET completed_at = completed_at 
    WHERE user_id = user_rec.id;
  END LOOP;
  
  RAISE NOTICE 'Przebudowano statystyki dla użytkowników';
END;
$function$

```

### Function: fn_update_user_stats()
```sql
CREATE OR REPLACE FUNCTION public.fn_update_user_stats()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
DECLARE
  total_xp INT;
  new_level INT;
  new_streak INT;
  awarded_badges INT;
BEGIN
  -- Oblicz całkowity XP na podstawie progress
  SELECT COALESCE(SUM(score + streak_bonus), 0) 
  INTO total_xp
  FROM progress 
  WHERE user_id = NEW.user_id;
  
  -- Oblicz nowy poziom (każdy 1000 XP = +1 poziom, start od 1)
  new_level := FLOOR(total_xp / 1000) + 1;
  
  -- Oblicz aktualny streak
  new_streak := fn_calculate_user_streak(NEW.user_id);
  
  -- Aktualizuj statystyki użytkownika
  UPDATE users 
  SET 
    xp = total_xp,
    level = new_level,
    streak = new_streak
  WHERE id = NEW.user_id;
  
  -- Sprawdź i przyznaj odznaki
  awarded_badges := fn_check_and_award_badges(NEW.user_id);
  
  RAISE NOTICE 'Zaktualizowano stats dla użytkownika %: XP=%, Level=%, Streak=%, Nowe odznaki=%', 
    NEW.user_id, total_xp, new_level, new_streak, awarded_badges;
  
  RETURN NEW;
END;
$function$

```

### Function: fn_verify_data_integrity()
```sql
CREATE OR REPLACE FUNCTION public.fn_verify_data_integrity()
 RETURNS TABLE(user_id uuid, username text, stored_xp integer, calculated_xp integer, xp_diff integer, stored_streak integer, calculated_streak integer, streak_diff integer)
 LANGUAGE plpgsql
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    u.id,
    u.username,
    u.xp as stored_xp,
    COALESCE(SUM(p.score + p.streak_bonus), 0)::INT as calculated_xp,
    (u.xp - COALESCE(SUM(p.score + p.streak_bonus), 0))::INT as xp_diff,
    u.streak as stored_streak,
    fn_calculate_user_streak(u.id) as calculated_streak,
    (u.streak - fn_calculate_user_streak(u.id))::INT as streak_diff
  FROM users u
  LEFT JOIN progress p ON u.id = p.user_id
  WHERE u.role = 'student'
  GROUP BY u.id, u.username, u.xp, u.streak
  HAVING u.xp != COALESCE(SUM(p.score + p.streak_bonus), 0)
     OR u.streak != fn_calculate_user_streak(u.id);
END;
$function$

```

### Function: handle_new_user()
```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'auth'
AS $function$
BEGIN
  INSERT INTO public.users (id, email, username, role, created_at)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    'student'::public.user_role,  -- Pełna ścieżka do typu
    new.created_at
  );
  RETURN new;
END;
$function$

```

