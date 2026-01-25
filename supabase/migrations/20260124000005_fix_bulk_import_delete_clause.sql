-- Migration: Fix bulk import DELETE statement
-- Supabase blocks DELETE without WHERE clause as a safety feature
-- Adding WHERE true to explicitly confirm we want to delete all rows

CREATE OR REPLACE FUNCTION public.bulk_import_exam_sessions_safe(
  sessions_data JSONB
)
RETURNS TABLE (
  converted_targets_count INTEGER,
  deleted_sessions_count INTEGER,
  inserted_sessions_count INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_converted_count INTEGER := 0;
  v_deleted_count INTEGER := 0;
  v_inserted_count INTEGER := 0;
BEGIN
  -- Security check: Only admins can perform bulk imports
  -- This is defense-in-depth; the UI also restricts access to admin pages
  IF NOT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = (SELECT auth.uid()) AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Only admins can bulk import exam sessions';
  END IF;

  -- Step 1: Convert all user_target_exam rows that reference sessions
  -- to use custom_exam_date instead. This preserves the user's target date.
  WITH updated AS (
    UPDATE public.user_target_exam ute
    SET
      custom_exam_date = es.exam_date,
      exam_session_id = NULL,
      updated_at = now()
    FROM public.exam_sessions es
    WHERE ute.exam_session_id = es.id
      AND ute.exam_session_id IS NOT NULL
    RETURNING ute.id
  )
  SELECT count(*) INTO v_converted_count FROM updated;

  -- Step 2: Delete all existing sessions
  -- Using WHERE true because Supabase blocks DELETE without WHERE clause
  DELETE FROM public.exam_sessions WHERE true;
  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;

  -- Step 3: Insert new sessions using batch INSERT (more efficient than row-by-row)
  WITH inserted AS (
    INSERT INTO public.exam_sessions (
      title,
      exam_date,
      sponsor,
      exam_time,
      walk_ins_allowed,
      public_contact,
      phone,
      email,
      vec,
      location_name,
      address,
      address_2,
      address_3,
      city,
      state,
      zip,
      latitude,
      longitude
    )
    SELECT
      elem->>'title',
      (elem->>'exam_date')::DATE,
      elem->>'sponsor',
      elem->>'exam_time',
      COALESCE((elem->>'walk_ins_allowed')::BOOLEAN, false),
      elem->>'public_contact',
      elem->>'phone',
      elem->>'email',
      elem->>'vec',
      elem->>'location_name',
      elem->>'address',
      elem->>'address_2',
      elem->>'address_3',
      elem->>'city',
      elem->>'state',
      elem->>'zip',
      (elem->>'latitude')::DOUBLE PRECISION,
      (elem->>'longitude')::DOUBLE PRECISION
    FROM jsonb_array_elements(sessions_data) AS elem
    RETURNING id
  )
  SELECT count(*) INTO v_inserted_count FROM inserted;

  RETURN QUERY SELECT v_converted_count, v_deleted_count, v_inserted_count;
END;
$$;

COMMENT ON FUNCTION public.bulk_import_exam_sessions_safe(JSONB) IS
  'Atomically imports exam sessions: converts user targets to custom dates, deletes old sessions, inserts new ones. Prevents race conditions.';
