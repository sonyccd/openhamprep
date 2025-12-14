-- Add onboarding_completed column to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN NOT NULL DEFAULT false;

-- Add comment for documentation
COMMENT ON COLUMN public.profiles.onboarding_completed IS 'Whether the user has completed or skipped the onboarding tour';
