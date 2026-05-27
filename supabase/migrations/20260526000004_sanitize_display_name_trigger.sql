-- L4: Sanitize display_name in handle_new_user trigger.
-- raw_user_meta_data->>'display_name' is user-controlled at signup.
-- Cap length to 100 chars and strip HTML tags as defense-in-depth.
-- React escapes by default, but this prevents raw DB values from being
-- rendered unsafely in any server-side or non-React context.

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
    -- Strip HTML tags and truncate to 100 chars
    v_safe_name := left(regexp_replace(v_raw_name, '<[^>]*>', '', 'g'), 100);
  END IF;

  INSERT INTO public.profiles (id, email, display_name)
  VALUES (new.id, new.email, v_safe_name);
  RETURN new;
END;
$$;
