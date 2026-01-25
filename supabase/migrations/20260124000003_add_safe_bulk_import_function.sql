-- Migration: Add safe bulk import function for exam sessions
-- Handles the entire import operation atomically to prevent race conditions
-- where users could save targets referencing sessions about to be deleted

-- Create a type for the session input data
CREATE TYPE exam_session_input AS (
  title TEXT,
  exam_date DATE,
  sponsor TEXT,
  exam_time TEXT,
  walk_ins_allowed BOOLEAN,
  public_contact TEXT,
  phone TEXT,
  email TEXT,
  vec TEXT,
  location_name TEXT,
  address TEXT,
  address_2 TEXT,
  address_3 TEXT,
  city TEXT,
  state TEXT,
  zip TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION
);

-- Create the safe bulk import function
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
  v_target RECORD;
  v_session JSONB;
BEGIN
  -- Step 1: Convert all user_target_exam rows that reference sessions
  -- to use custom_exam_date instead. This preserves the user's target date.
  FOR v_target IN
    SELECT
      ute.id,
      es.exam_date
    FROM public.user_target_exam ute
    JOIN public.exam_sessions es ON es.id = ute.exam_session_id
    WHERE ute.exam_session_id IS NOT NULL
  LOOP
    UPDATE public.user_target_exam
    SET
      custom_exam_date = v_target.exam_date,
      exam_session_id = NULL,
      updated_at = now()
    WHERE id = v_target.id;

    v_converted_count := v_converted_count + 1;
  END LOOP;

  -- Step 2: Delete all existing sessions
  DELETE FROM public.exam_sessions;
  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;

  -- Step 3: Insert new sessions from JSON array
  FOR v_session IN SELECT * FROM jsonb_array_elements(sessions_data)
  LOOP
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
    ) VALUES (
      v_session->>'title',
      (v_session->>'exam_date')::DATE,
      v_session->>'sponsor',
      v_session->>'exam_time',
      COALESCE((v_session->>'walk_ins_allowed')::BOOLEAN, false),
      v_session->>'public_contact',
      v_session->>'phone',
      v_session->>'email',
      v_session->>'vec',
      v_session->>'location_name',
      v_session->>'address',
      v_session->>'address_2',
      v_session->>'address_3',
      v_session->>'city',
      v_session->>'state',
      v_session->>'zip',
      (v_session->>'latitude')::DOUBLE PRECISION,
      (v_session->>'longitude')::DOUBLE PRECISION
    );

    v_inserted_count := v_inserted_count + 1;
  END LOOP;

  RETURN QUERY SELECT v_converted_count, v_deleted_count, v_inserted_count;
END;
$$;

-- Grant execute to service_role and admins only
REVOKE ALL ON FUNCTION public.bulk_import_exam_sessions_safe(JSONB) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.bulk_import_exam_sessions_safe(JSONB) TO service_role;

-- Add comment
COMMENT ON FUNCTION public.bulk_import_exam_sessions_safe(JSONB) IS
  'Atomically imports exam sessions: converts user targets to custom dates, deletes old sessions, inserts new ones. Prevents race conditions.';
