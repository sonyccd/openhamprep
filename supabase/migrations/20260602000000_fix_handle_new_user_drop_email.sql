-- Fix: handle_new_user() must not reference profiles.email.
--
-- Regression: migration 20251208191532 dropped profiles.email (PII reduction)
-- and updated handle_new_user() to stop inserting it. The later migration
-- 20260526000004_sanitize_display_name_trigger.sql re-created the function from
-- the ORIGINAL (20251207163731) body, which still inserted into
-- (id, email, display_name). Since profiles.email no longer exists, every signup
-- failed in the AFTER INSERT trigger with:
--   ERROR 42703: column "email" of relation "profiles" does not exist
-- which aborts the auth.users insert and surfaces as GoTrue 500
-- "Database error saving new user".
--
-- This restores the correct INSERT (id, display_name) while preserving the
-- display_name sanitization added in 20260526000004.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_raw_name TEXT;
  v_safe_name TEXT;
BEGIN
  v_raw_name := new.raw_user_meta_data ->> 'display_name';

  IF v_raw_name IS NOT NULL THEN
    -- Pass 1: strip literal HTML tags
    v_safe_name := regexp_replace(v_raw_name, '<[^>]*>', '', 'g');
    -- Pass 2: strip numeric/hex character references (&#60; &#x3C; &#X3c; etc.)
    v_safe_name := regexp_replace(v_safe_name, '&#[xX]?[0-9a-fA-F]+;', '', 'g');
    -- Pass 3: decode the four common named HTML entities so encoded payloads
    -- (&lt;script&gt;) can't survive as raw tags after decode
    v_safe_name := replace(replace(replace(replace(v_safe_name,
      '&lt;',  '<'),
      '&gt;',  '>'),
      '&amp;', '&'),
      '&quot;', '"');
    -- Pass 4: strip any tags revealed by entity decode, then cap at 100 chars
    v_safe_name := left(regexp_replace(v_safe_name, '<[^>]*>', '', 'g'), 100);
  END IF;

  INSERT INTO public.profiles (id, display_name)
  VALUES (new.id, v_safe_name);
  RETURN new;
END;
$$;
