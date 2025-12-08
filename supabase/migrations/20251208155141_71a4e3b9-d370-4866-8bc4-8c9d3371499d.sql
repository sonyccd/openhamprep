-- Create table for weekly study goals
CREATE TABLE public.weekly_study_goals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  questions_goal INTEGER NOT NULL DEFAULT 50,
  tests_goal INTEGER NOT NULL DEFAULT 3,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.weekly_study_goals ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own goals"
ON public.weekly_study_goals
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own goals"
ON public.weekly_study_goals
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own goals"
ON public.weekly_study_goals
FOR UPDATE
USING (auth.uid() = user_id);

-- Add trigger for updated_at
CREATE TRIGGER update_weekly_study_goals_updated_at
BEFORE UPDATE ON public.weekly_study_goals
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();