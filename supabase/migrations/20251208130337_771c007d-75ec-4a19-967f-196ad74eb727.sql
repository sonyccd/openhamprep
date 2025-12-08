-- Add best_streak column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN best_streak integer NOT NULL DEFAULT 0;