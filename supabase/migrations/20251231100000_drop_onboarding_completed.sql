-- Drop the onboarding_completed column from profiles
-- This column was used by Shepherd.js-based onboarding tour which is being replaced by Pendo

ALTER TABLE profiles DROP COLUMN IF EXISTS onboarding_completed;
