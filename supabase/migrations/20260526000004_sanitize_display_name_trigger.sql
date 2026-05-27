-- L4: Sanitize display_name in handle_new_user trigger.
-- raw_user_meta_data->>'display_name' is user-controlled at signup.
-- Cap length to 100 chars and strip HTML tags as defense-in-depth.
-- React escapes by default, but this prevents raw DB values from being
-- rendered unsafely in any server-side or non-React context.
--
-- Sanitization passes (in order):
--   1. Strip literal HTML tags (<[^>]*>)
--   2. Strip numeric/hex character references (&#60; &#x3C; etc.)
--   3. Decode the four common named HTML entities so entity-encoded
--      payloads (&lt;script&gt;) cannot survive as raw tags after decode
--   4. Strip literal tags again (catches anything revealed by step 3)
--   5. Cap at 100 chars
--
-- Known limitation: multi-level or mixed encodings (e.g. &amp;lt;) are
-- not fully resolved. This is intentional — the goal is defense-in-depth
-- for a display_name field, not a general-purpose HTML sanitizer.

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

  INSERT INTO public.profiles (id, email, display_name)
  VALUES (new.id, new.email, v_safe_name);
  RETURN new;
END;
$$;
