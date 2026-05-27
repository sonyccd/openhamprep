-- M5: Add auth.uid() defense-in-depth to SECURITY DEFINER triggers.
-- Both triggers propagate NEW.user_id from the source row into derived tables.
-- The guard below rejects rows where the session user doesn't match user_id.
-- The IS NOT NULL check allows service_role (which has null auth.uid()) to pass,
-- because Edge Functions use service_role to insert into these tables.

CREATE OR REPLACE FUNCTION public.update_question_mastery()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NOT NULL AND auth.uid() <> NEW.user_id THEN
    RAISE EXCEPTION 'update_question_mastery: user_id mismatch (session=%, row=%)', auth.uid(), NEW.user_id;
  END IF;

  INSERT INTO public.question_mastery (
    user_id,
    question_id,
    total_attempts,
    correct_attempts,
    incorrect_attempts,
    first_attempt_at,
    last_attempt_at,
    updated_at
  )
  VALUES (
    NEW.user_id,
    NEW.question_id,
    1,
    CASE WHEN NEW.is_correct THEN 1 ELSE 0 END,
    CASE WHEN NEW.is_correct THEN 0 ELSE 1 END,
    NEW.attempted_at,
    NEW.attempted_at,
    now()
  )
  ON CONFLICT (user_id, question_id) DO UPDATE SET
    total_attempts = question_mastery.total_attempts + 1,
    correct_attempts = question_mastery.correct_attempts + CASE WHEN NEW.is_correct THEN 1 ELSE 0 END,
    incorrect_attempts = question_mastery.incorrect_attempts + CASE WHEN NEW.is_correct THEN 0 ELSE 1 END,
    last_attempt_at = NEW.attempted_at,
    updated_at = now();

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_daily_streak()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_yesterday DATE := NEW.activity_date - 1;
  v_had_activity_yesterday BOOLEAN;
  v_current_streak INTEGER;
BEGIN
  IF auth.uid() IS NOT NULL AND auth.uid() <> NEW.user_id THEN
    RAISE EXCEPTION 'update_daily_streak: user_id mismatch (session=%, row=%)', auth.uid(), NEW.user_id;
  END IF;

  -- Only process when activity qualifies for streak
  IF NOT NEW.qualifies_for_streak THEN
    RETURN NEW;
  END IF;

  -- Check if yesterday had qualifying activity
  SELECT qualifies_for_streak INTO v_had_activity_yesterday
  FROM public.daily_activity
  WHERE user_id = NEW.user_id AND activity_date = v_yesterday;

  -- Upsert streak record
  INSERT INTO public.daily_streaks (user_id, current_streak, longest_streak, last_activity_date)
  VALUES (
    NEW.user_id,
    1,
    1,
    NEW.activity_date
  )
  ON CONFLICT (user_id) DO UPDATE SET
    current_streak = CASE
      WHEN daily_streaks.last_activity_date = NEW.activity_date THEN daily_streaks.current_streak
      WHEN daily_streaks.last_activity_date = v_yesterday THEN daily_streaks.current_streak + 1
      ELSE 1
    END,
    longest_streak = GREATEST(
      daily_streaks.longest_streak,
      CASE
        WHEN daily_streaks.last_activity_date = NEW.activity_date THEN daily_streaks.current_streak
        WHEN daily_streaks.last_activity_date = v_yesterday THEN daily_streaks.current_streak + 1
        ELSE 1
      END
    ),
    last_activity_date = NEW.activity_date,
    updated_at = now();

  RETURN NEW;
END;
$$;
