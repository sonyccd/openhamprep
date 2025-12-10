# Migrating from Lovable Cloud to Supabase

This guide explains how to migrate the Open Ham Prep backend from Lovable Cloud to a standalone Supabase project.

## Prerequisites

1. Create a new Supabase project at [supabase.com](https://supabase.com)
2. Have access to your Supabase project's SQL Editor
3. Note your Supabase project URL and anon key

## Step 1: Create Enum Types

```sql
-- Create the app_role enum for user roles
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');
```

## Step 2: Create Database Functions

```sql
-- Function to check if a user has a specific role (used in RLS policies)
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Function to create profile on new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (new.id, new.raw_user_meta_data ->> 'display_name');
  RETURN new;
END;
$$;

-- Function to automatically update updated_at timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;
```

## Step 3: Create Tables

### Profiles Table

```sql
CREATE TABLE public.profiles (
  id uuid NOT NULL PRIMARY KEY,
  display_name text,
  best_streak integer NOT NULL DEFAULT 0,
  glossary_current_streak integer NOT NULL DEFAULT 0,
  glossary_best_streak integer NOT NULL DEFAULT 0,
  glossary_last_study_date date,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);
```

### User Roles Table

```sql
CREATE TABLE public.user_roles (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
```

### Questions Table

```sql
CREATE TABLE public.questions (
  id text NOT NULL PRIMARY KEY,
  question text NOT NULL,
  options jsonb NOT NULL,
  correct_answer integer NOT NULL,
  subelement text NOT NULL,
  question_group text NOT NULL,
  explanation text,
  links jsonb NOT NULL DEFAULT '[]'::jsonb,
  edit_history jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);
```

### Glossary Terms Table

```sql
CREATE TABLE public.glossary_terms (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  term text NOT NULL,
  definition text NOT NULL,
  edit_history jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);
```

### Bookmarked Questions Table

```sql
CREATE TABLE public.bookmarked_questions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  question_id text NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  note text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);
```

### Practice Test Results Table

```sql
CREATE TABLE public.practice_test_results (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  score integer NOT NULL,
  total_questions integer NOT NULL,
  percentage numeric NOT NULL,
  passed boolean NOT NULL,
  test_type text NOT NULL DEFAULT 'practice',
  completed_at timestamp with time zone NOT NULL DEFAULT now()
);
```

### Question Attempts Table

```sql
CREATE TABLE public.question_attempts (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  question_id text NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  test_result_id uuid REFERENCES public.practice_test_results(id) ON DELETE CASCADE,
  selected_answer integer NOT NULL,
  is_correct boolean NOT NULL,
  attempt_type text NOT NULL DEFAULT 'practice',
  attempted_at timestamp with time zone NOT NULL DEFAULT now()
);
```

### Explanation Feedback Table

```sql
CREATE TABLE public.explanation_feedback (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  question_id text NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  is_helpful boolean NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (user_id, question_id)
);
```

### Glossary Progress Table

```sql
CREATE TABLE public.glossary_progress (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  term_id uuid NOT NULL REFERENCES public.glossary_terms(id) ON DELETE CASCADE,
  times_seen integer NOT NULL DEFAULT 0,
  times_correct integer NOT NULL DEFAULT 0,
  mastered boolean NOT NULL DEFAULT false,
  last_seen_at timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (user_id, term_id)
);
```

### Glossary Study Sessions Table

```sql
CREATE TABLE public.glossary_study_sessions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  terms_studied integer NOT NULL DEFAULT 0,
  terms_correct integer NOT NULL DEFAULT 0,
  session_duration_seconds integer DEFAULT 0,
  study_date date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);
```

### Weekly Study Goals Table

```sql
CREATE TABLE public.weekly_study_goals (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE,
  questions_goal integer NOT NULL DEFAULT 50,
  tests_goal integer NOT NULL DEFAULT 3,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);
```

### Exam Sessions Table

```sql
CREATE TABLE public.exam_sessions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title text,
  exam_date date NOT NULL,
  exam_time text,
  sponsor text,
  walk_ins_allowed boolean DEFAULT false,
  public_contact text,
  phone text,
  email text,
  vec text,
  location_name text,
  address text,
  address_2 text,
  address_3 text,
  city text NOT NULL,
  state text NOT NULL,
  zip text NOT NULL,
  latitude double precision,
  longitude double precision,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);
```

### User Target Exam Table

```sql
CREATE TABLE public.user_target_exam (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE,
  exam_session_id uuid NOT NULL REFERENCES public.exam_sessions(id) ON DELETE CASCADE,
  study_intensity text NOT NULL DEFAULT 'moderate',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);
```

## Step 4: Enable Row Level Security

```sql
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.glossary_terms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookmarked_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.practice_test_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.question_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.explanation_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.glossary_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.glossary_study_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weekly_study_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_target_exam ENABLE ROW LEVEL SECURITY;
```

## Step 5: Create RLS Policies

### Profiles Policies

```sql
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);
```

### User Roles Policies

```sql
CREATE POLICY "Users can view their own roles" ON public.user_roles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can insert roles" ON public.user_roles
  FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update roles" ON public.user_roles
  FOR UPDATE USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete roles" ON public.user_roles
  FOR DELETE USING (has_role(auth.uid(), 'admin'));
```

### Questions Policies

```sql
CREATE POLICY "Questions are publicly readable" ON public.questions
  FOR SELECT USING (true);

CREATE POLICY "Admins can insert questions" ON public.questions
  FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update questions" ON public.questions
  FOR UPDATE USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete questions" ON public.questions
  FOR DELETE USING (has_role(auth.uid(), 'admin'));
```

### Glossary Terms Policies

```sql
CREATE POLICY "Glossary terms are publicly readable" ON public.glossary_terms
  FOR SELECT USING (true);

CREATE POLICY "Admins can insert glossary terms" ON public.glossary_terms
  FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update glossary terms" ON public.glossary_terms
  FOR UPDATE USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete glossary terms" ON public.glossary_terms
  FOR DELETE USING (has_role(auth.uid(), 'admin'));
```

### Bookmarked Questions Policies

```sql
CREATE POLICY "Users can view their own bookmarks" ON public.bookmarked_questions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own bookmarks" ON public.bookmarked_questions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own bookmarks" ON public.bookmarked_questions
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own bookmarks" ON public.bookmarked_questions
  FOR DELETE USING (auth.uid() = user_id);
```

### Practice Test Results Policies

```sql
CREATE POLICY "Users can view their own test results" ON public.practice_test_results
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own test results" ON public.practice_test_results
  FOR INSERT WITH CHECK (auth.uid() = user_id);
```

### Question Attempts Policies

```sql
CREATE POLICY "Users can view their own attempts" ON public.question_attempts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own attempts" ON public.question_attempts
  FOR INSERT WITH CHECK (auth.uid() = user_id);
```

### Explanation Feedback Policies

```sql
CREATE POLICY "Users can view their own feedback" ON public.explanation_feedback
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all feedback" ON public.explanation_feedback
  FOR SELECT USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can insert their own feedback" ON public.explanation_feedback
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own feedback" ON public.explanation_feedback
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own feedback" ON public.explanation_feedback
  FOR DELETE USING (auth.uid() = user_id);
```

### Glossary Progress Policies

```sql
CREATE POLICY "Users can view their own progress" ON public.glossary_progress
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own progress" ON public.glossary_progress
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own progress" ON public.glossary_progress
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own progress" ON public.glossary_progress
  FOR DELETE USING (auth.uid() = user_id);
```

### Glossary Study Sessions Policies

```sql
CREATE POLICY "Users can view their own study sessions" ON public.glossary_study_sessions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own study sessions" ON public.glossary_study_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own study sessions" ON public.glossary_study_sessions
  FOR UPDATE USING (auth.uid() = user_id);
```

### Weekly Study Goals Policies

```sql
CREATE POLICY "Users can view their own goals" ON public.weekly_study_goals
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own goals" ON public.weekly_study_goals
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own goals" ON public.weekly_study_goals
  FOR UPDATE USING (auth.uid() = user_id);
```

### Exam Sessions Policies

```sql
CREATE POLICY "Exam sessions are publicly readable" ON public.exam_sessions
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage exam sessions" ON public.exam_sessions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );
```

### User Target Exam Policies

```sql
CREATE POLICY "Users can view their own target exam" ON public.user_target_exam
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own target exam" ON public.user_target_exam
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own target exam" ON public.user_target_exam
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own target exam" ON public.user_target_exam
  FOR DELETE USING (auth.uid() = user_id);
```

## Step 6: Create Triggers

```sql
-- Trigger to create profile on new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Trigger to update updated_at on profiles
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger to update updated_at on weekly_study_goals
CREATE TRIGGER update_weekly_study_goals_updated_at
  BEFORE UPDATE ON public.weekly_study_goals
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger to update updated_at on exam_sessions
CREATE TRIGGER update_exam_sessions_updated_at
  BEFORE UPDATE ON public.exam_sessions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger to update updated_at on user_target_exam
CREATE TRIGGER update_user_target_exam_updated_at
  BEFORE UPDATE ON public.user_target_exam
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
```

## Step 7: Create Performance Indexes

```sql
-- Questions indexes
CREATE INDEX idx_questions_subelement ON public.questions(subelement);
CREATE INDEX idx_questions_question_group ON public.questions(question_group);

-- Question attempts indexes
CREATE INDEX idx_question_attempts_user_id ON public.question_attempts(user_id);
CREATE INDEX idx_question_attempts_question_id ON public.question_attempts(question_id);
CREATE INDEX idx_question_attempts_user_question ON public.question_attempts(user_id, question_id);

-- Practice test results indexes
CREATE INDEX idx_practice_test_results_user_id ON public.practice_test_results(user_id);
CREATE INDEX idx_practice_test_results_completed_at ON public.practice_test_results(completed_at DESC);

-- Bookmarked questions indexes
CREATE INDEX idx_bookmarked_questions_user_id ON public.bookmarked_questions(user_id);

-- Glossary progress indexes
CREATE INDEX idx_glossary_progress_user_id ON public.glossary_progress(user_id);

-- Exam sessions indexes
CREATE INDEX idx_exam_sessions_exam_date ON public.exam_sessions(exam_date);
CREATE INDEX idx_exam_sessions_state ON public.exam_sessions(state);
CREATE INDEX idx_exam_sessions_zip ON public.exam_sessions(zip);
CREATE INDEX idx_exam_sessions_location ON public.exam_sessions(latitude, longitude);
```

## Step 8: Deploy Edge Functions

Copy the edge functions from `supabase/functions/` to your new Supabase project:

1. **delete-user** - Handles user account deletion
2. **geocode-addresses** - Geocodes exam session addresses
3. **manage-question-links** - Manages question learning resource links
4. **seed-questions** - Seeds initial question data

Deploy using the Supabase CLI:

```bash
supabase functions deploy delete-user
supabase functions deploy geocode-addresses
supabase functions deploy manage-question-links
supabase functions deploy seed-questions
```

## Step 9: Update Environment Variables

Update your `.env` file with your new Supabase credentials:

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-key
VITE_SUPABASE_PROJECT_ID=your-project-id
```

## Step 10: Update Supabase Client

Update `src/integrations/supabase/client.ts` with your new project credentials:

```typescript
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://your-project-id.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "your-anon-key";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
```

## Step 11: Configure Authentication

In your Supabase dashboard:

1. Go to **Authentication** > **Settings**
2. Set **Site URL** to your production domain (e.g., `https://openhamprep.app`)
3. Add redirect URLs:
   - `https://openhamprep.app/auth`
   - `http://localhost:5173/auth` (for local development)
4. Enable/disable email confirmations as needed

## Step 12: Export and Import Data

### Export from Lovable Cloud

Use the admin bulk export feature to export:
- Questions (CSV/JSON)
- Glossary terms (CSV/JSON)

### Import to New Supabase

Use the Supabase SQL Editor or the admin bulk import feature to import your data.

## Step 13: Set Up Initial Admin User

After your first user signs up, manually grant them admin role:

```sql
INSERT INTO public.user_roles (user_id, role)
VALUES ('your-user-uuid-here', 'admin');
```

## Troubleshooting

### Common Issues

1. **RLS Policy Errors**: Ensure all policies are created in the correct order
2. **Foreign Key Violations**: Create tables in dependency order (profiles first)
3. **Missing Functions**: Ensure `has_role` function exists before creating policies that use it

### Verification Queries

```sql
-- Check all tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public';

-- Check RLS is enabled
SELECT tablename, rowsecurity FROM pg_tables 
WHERE schemaname = 'public';

-- Check policies exist
SELECT * FROM pg_policies WHERE schemaname = 'public';
```

## Support

For issues with this migration, please open an issue on the [GitHub repository](https://github.com/sonyccd/openhamprep).
