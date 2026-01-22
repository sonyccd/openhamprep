-- =============================================================================
-- Fix timezone handling in get_streak_info function
-- =============================================================================
--
-- Problem: The original get_streak_info only returned data for "today UTC",
-- but a user's local day can span two UTC days. For example, a PST user (UTC-8)
-- on Jan 21 local: 12am-4pm PST = Jan 21 UTC, 4pm-12am PST = Jan 22 UTC.
--
-- Solution: Return data for both today and yesterday UTC, along with the
-- current UTC date. The frontend can then compute the local day totals.
-- =============================================================================

-- Drop the old function and recreate with additional return columns
DROP FUNCTION IF EXISTS public.get_streak_info(UUID);

CREATE OR REPLACE FUNCTION public.get_streak_info(p_user_id UUID)
RETURNS TABLE (
  current_streak INTEGER,
  longest_streak INTEGER,
  last_activity_date DATE,
  -- Today UTC data
  today_qualifies BOOLEAN,
  questions_today INTEGER,
  questions_needed INTEGER,
  streak_at_risk BOOLEAN,
  -- NEW: Yesterday UTC data for timezone calculations
  yesterday_qualifies BOOLEAN,
  questions_yesterday INTEGER,
  -- NEW: Current UTC date so frontend knows the boundary
  today_utc DATE
) AS $$
DECLARE
  v_streak RECORD;
  v_today_activity RECORD;
  v_yesterday_activity RECORD;
  v_today DATE := CURRENT_DATE;
  v_yesterday DATE := CURRENT_DATE - 1;
BEGIN
  -- Get streak record
  SELECT ds.current_streak, ds.longest_streak, ds.last_activity_date
  INTO v_streak
  FROM public.daily_streaks ds
  WHERE ds.user_id = p_user_id;

  -- Get today's activity (UTC)
  SELECT da.qualifies_for_streak, da.questions_answered
  INTO v_today_activity
  FROM public.daily_activity da
  WHERE da.user_id = p_user_id AND da.activity_date = v_today;

  -- Get yesterday's activity (UTC)
  SELECT da.qualifies_for_streak, da.questions_answered
  INTO v_yesterday_activity
  FROM public.daily_activity da
  WHERE da.user_id = p_user_id AND da.activity_date = v_yesterday;

  -- Return computed values
  RETURN QUERY SELECT
    COALESCE(v_streak.current_streak, 0)::INTEGER,
    COALESCE(v_streak.longest_streak, 0)::INTEGER,
    v_streak.last_activity_date,
    -- Today UTC
    COALESCE(v_today_activity.qualifies_for_streak, false),
    COALESCE(v_today_activity.questions_answered, 0)::INTEGER,
    GREATEST(0, 5 - COALESCE(v_today_activity.questions_answered, 0))::INTEGER,
    -- Streak at risk: has a streak but hasn't qualified today (UTC)
    (COALESCE(v_streak.current_streak, 0) > 0 AND NOT COALESCE(v_today_activity.qualifies_for_streak, false))::BOOLEAN,
    -- Yesterday UTC
    COALESCE(v_yesterday_activity.qualifies_for_streak, false),
    COALESCE(v_yesterday_activity.questions_answered, 0)::INTEGER,
    -- Current UTC date
    v_today;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.get_streak_info(UUID) TO authenticated;

COMMENT ON FUNCTION public.get_streak_info IS 'Get streak information for a user. Returns both today and yesterday UTC data so frontend can compute local day totals.';
