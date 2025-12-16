-- Add OAuth 2.1 support for Discourse SSO integration
-- This migration adds:
-- 1. forum_username column to profiles (for privacy - separate from display_name)
-- 2. oauth_consents table (for "remember this decision" functionality)

-- Add forum_username column to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS forum_username TEXT UNIQUE;

-- Add comment for documentation
COMMENT ON COLUMN public.profiles.forum_username IS 'Username displayed on the Open Ham Prep forum (separate from display_name for privacy)';

-- Create oauth_consents table to track user consent decisions
CREATE TABLE IF NOT EXISTS public.oauth_consents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id TEXT NOT NULL,
  scopes TEXT[] NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, client_id)
);

-- Add comments for documentation
COMMENT ON TABLE public.oauth_consents IS 'Tracks OAuth consent decisions for "remember this decision" functionality';
COMMENT ON COLUMN public.oauth_consents.client_id IS 'OAuth client identifier (e.g., Discourse)';
COMMENT ON COLUMN public.oauth_consents.scopes IS 'Array of approved OAuth scopes';

-- Enable RLS on oauth_consents
ALTER TABLE public.oauth_consents ENABLE ROW LEVEL SECURITY;

-- Users can view their own consents
CREATE POLICY "Users can view own consents"
ON public.oauth_consents
FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own consents
CREATE POLICY "Users can insert own consents"
ON public.oauth_consents
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can delete their own consents (to revoke access)
CREATE POLICY "Users can delete own consents"
ON public.oauth_consents
FOR DELETE
USING (auth.uid() = user_id);

-- Create index for faster lookups by user_id
CREATE INDEX IF NOT EXISTS idx_oauth_consents_user_id ON public.oauth_consents(user_id);
