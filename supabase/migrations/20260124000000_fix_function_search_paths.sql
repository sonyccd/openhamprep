-- Migration: Fix function search_path security warnings
-- Sets search_path = '' on all public functions to prevent search path injection attacks
-- See: https://supabase.com/docs/guides/database/database-linter?lint=0011_function_search_path_mutable

-- update_updated_at_column - generic timestamp updater
ALTER FUNCTION public.update_updated_at_column()
  SET search_path = '';

-- get_streak_info - retrieves user streak data
ALTER FUNCTION public.get_streak_info(UUID)
  SET search_path = '';

-- update_daily_streak - updates streak on activity
ALTER FUNCTION public.update_daily_streak()
  SET search_path = '';

-- increment_daily_activity - increments question/test counts
ALTER FUNCTION public.increment_daily_activity(UUID, DATE, INTEGER, INTEGER, INTEGER, INTEGER, INTEGER)
  SET search_path = '';

-- increment_mapbox_usage - tracks geocoding API usage
ALTER FUNCTION public.increment_mapbox_usage(TEXT)
  SET search_path = '';

-- get_chapter_question_counts - returns question counts per chapter
ALTER FUNCTION public.get_chapter_question_counts(TEXT)
  SET search_path = '';

-- cleanup_old_monitor_runs - removes old monitoring data
ALTER FUNCTION public.cleanup_old_monitor_runs()
  SET search_path = '';

-- Add comment explaining the security fix
COMMENT ON FUNCTION public.update_updated_at_column() IS 'Updates updated_at timestamp. search_path fixed for security.';
COMMENT ON FUNCTION public.get_streak_info(UUID) IS 'Gets streak info for a user. search_path fixed for security.';
COMMENT ON FUNCTION public.update_daily_streak() IS 'Trigger function to update streaks. search_path fixed for security.';
COMMENT ON FUNCTION public.increment_daily_activity(UUID, DATE, INTEGER, INTEGER, INTEGER, INTEGER, INTEGER) IS 'Increments daily activity counters. search_path fixed for security.';
COMMENT ON FUNCTION public.increment_mapbox_usage(TEXT) IS 'Tracks Mapbox API usage. search_path fixed for security.';
COMMENT ON FUNCTION public.get_chapter_question_counts(TEXT) IS 'Returns question counts per ARRL chapter. search_path fixed for security.';
COMMENT ON FUNCTION public.cleanup_old_monitor_runs() IS 'Cleans up old monitoring data. search_path fixed for security.';
