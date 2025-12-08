-- Remove email column from profiles table to reduce PII exposure
-- Email is already available in auth.users and accessible via auth context

-- First update the trigger to not insert email
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (new.id, new.raw_user_meta_data ->> 'display_name');
  RETURN new;
END;
$function$;

-- Then remove the email column
ALTER TABLE public.profiles DROP COLUMN IF EXISTS email;