-- Remove unused oauth_consents table
-- This table was originally created for storing user consent decisions with a
-- "remember this decision" feature. Since we own both apps (Open Ham Prep and forum),
-- we simplified the OAuth flow to auto-approve based on forum username instead.

DROP TABLE IF EXISTS public.oauth_consents;
