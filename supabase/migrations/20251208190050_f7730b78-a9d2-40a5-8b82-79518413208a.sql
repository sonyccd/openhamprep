-- Add foreign key constraint from profiles to auth.users with CASCADE delete
-- First check if the constraint exists, if not add it
ALTER TABLE public.profiles 
DROP CONSTRAINT IF EXISTS profiles_id_fkey;

ALTER TABLE public.profiles
ADD CONSTRAINT profiles_id_fkey 
FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Add foreign key constraints from user data tables to profiles with CASCADE delete
-- bookmarked_questions
ALTER TABLE public.bookmarked_questions
DROP CONSTRAINT IF EXISTS bookmarked_questions_user_id_fkey;

ALTER TABLE public.bookmarked_questions
ADD CONSTRAINT bookmarked_questions_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- explanation_feedback
ALTER TABLE public.explanation_feedback
DROP CONSTRAINT IF EXISTS explanation_feedback_user_id_fkey;

ALTER TABLE public.explanation_feedback
ADD CONSTRAINT explanation_feedback_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- glossary_progress
ALTER TABLE public.glossary_progress
DROP CONSTRAINT IF EXISTS glossary_progress_user_id_fkey;

ALTER TABLE public.glossary_progress
ADD CONSTRAINT glossary_progress_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- glossary_study_sessions
ALTER TABLE public.glossary_study_sessions
DROP CONSTRAINT IF EXISTS glossary_study_sessions_user_id_fkey;

ALTER TABLE public.glossary_study_sessions
ADD CONSTRAINT glossary_study_sessions_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- practice_test_results
ALTER TABLE public.practice_test_results
DROP CONSTRAINT IF EXISTS practice_test_results_user_id_fkey;

ALTER TABLE public.practice_test_results
ADD CONSTRAINT practice_test_results_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- question_attempts
ALTER TABLE public.question_attempts
DROP CONSTRAINT IF EXISTS question_attempts_user_id_fkey;

ALTER TABLE public.question_attempts
ADD CONSTRAINT question_attempts_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- user_roles
ALTER TABLE public.user_roles
DROP CONSTRAINT IF EXISTS user_roles_user_id_fkey;

ALTER TABLE public.user_roles
ADD CONSTRAINT user_roles_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- weekly_study_goals
ALTER TABLE public.weekly_study_goals
DROP CONSTRAINT IF EXISTS weekly_study_goals_user_id_fkey;

ALTER TABLE public.weekly_study_goals
ADD CONSTRAINT weekly_study_goals_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;