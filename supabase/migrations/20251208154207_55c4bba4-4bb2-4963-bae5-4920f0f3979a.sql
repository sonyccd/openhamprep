-- Add glossary streak tracking to profiles
ALTER TABLE public.profiles 
ADD COLUMN glossary_current_streak INTEGER NOT NULL DEFAULT 0,
ADD COLUMN glossary_best_streak INTEGER NOT NULL DEFAULT 0,
ADD COLUMN glossary_last_study_date DATE;

-- Create table for daily glossary study sessions
CREATE TABLE public.glossary_study_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  study_date DATE NOT NULL DEFAULT CURRENT_DATE,
  terms_studied INTEGER NOT NULL DEFAULT 0,
  terms_correct INTEGER NOT NULL DEFAULT 0,
  session_duration_seconds INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, study_date)
);

-- Enable RLS
ALTER TABLE public.glossary_study_sessions ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own study sessions"
ON public.glossary_study_sessions
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own study sessions"
ON public.glossary_study_sessions
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own study sessions"
ON public.glossary_study_sessions
FOR UPDATE
USING (auth.uid() = user_id);