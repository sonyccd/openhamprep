-- Create lessons table for ordered groups of topics
CREATE TABLE public.lessons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  thumbnail_url TEXT,
  display_order INTEGER DEFAULT 0,
  is_published BOOLEAN DEFAULT false,
  license_types TEXT[] DEFAULT ARRAY['technician', 'general', 'extra'],
  edit_history JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create lesson_topics junction table for many-to-many relationship with topics
-- A topic can belong to multiple lessons; order is per-lesson
CREATE TABLE public.lesson_topics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id UUID REFERENCES public.lessons(id) ON DELETE CASCADE,
  topic_id UUID REFERENCES public.topics(id) ON DELETE CASCADE,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(lesson_id, topic_id)
);

-- Create lesson_progress table for user completion tracking
CREATE TABLE public.lesson_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  lesson_id UUID REFERENCES public.lessons(id) ON DELETE CASCADE,
  is_completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, lesson_id)
);

-- Create indexes for common queries
CREATE INDEX idx_lessons_slug ON public.lessons(slug);
CREATE INDEX idx_lessons_is_published ON public.lessons(is_published);
CREATE INDEX idx_lessons_display_order ON public.lessons(display_order);
CREATE INDEX idx_lesson_topics_lesson_id ON public.lesson_topics(lesson_id);
CREATE INDEX idx_lesson_topics_topic_id ON public.lesson_topics(topic_id);
CREATE INDEX idx_lesson_topics_display_order ON public.lesson_topics(display_order);
CREATE INDEX idx_lesson_progress_user_id ON public.lesson_progress(user_id);
CREATE INDEX idx_lesson_progress_lesson_id ON public.lesson_progress(lesson_id);

-- Enable RLS on all tables
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lesson_topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lesson_progress ENABLE ROW LEVEL SECURITY;

-- RLS Policies for lessons table
-- Anyone can view published lessons
CREATE POLICY "Anyone can view published lessons"
  ON public.lessons FOR SELECT
  USING (is_published = true);

-- Admins can view all lessons (including drafts)
CREATE POLICY "Admins can view all lessons"
  ON public.lessons FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Admins can insert lessons
CREATE POLICY "Admins can insert lessons"
  ON public.lessons FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Admins can update lessons
CREATE POLICY "Admins can update lessons"
  ON public.lessons FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Admins can delete lessons
CREATE POLICY "Admins can delete lessons"
  ON public.lessons FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- RLS Policies for lesson_topics table
-- Anyone can view lesson topics (for published lessons)
CREATE POLICY "Anyone can view lesson topics"
  ON public.lesson_topics FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.lessons
      WHERE lessons.id = lesson_topics.lesson_id AND lessons.is_published = true
    )
    OR
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Admins can manage lesson topics
CREATE POLICY "Admins can insert lesson topics"
  ON public.lesson_topics FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can update lesson topics"
  ON public.lesson_topics FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can delete lesson topics"
  ON public.lesson_topics FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- RLS Policies for lesson_progress table
-- Users can view their own progress
CREATE POLICY "Users can view their own lesson progress"
  ON public.lesson_progress FOR SELECT
  USING (user_id = auth.uid());

-- Users can insert their own progress
CREATE POLICY "Users can insert their own lesson progress"
  ON public.lesson_progress FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Users can update their own progress
CREATE POLICY "Users can update their own lesson progress"
  ON public.lesson_progress FOR UPDATE
  USING (user_id = auth.uid());

-- Users can delete their own progress
CREATE POLICY "Users can delete their own lesson progress"
  ON public.lesson_progress FOR DELETE
  USING (user_id = auth.uid());

-- Admins can view all progress (for analytics)
CREATE POLICY "Admins can view all lesson progress"
  ON public.lesson_progress FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Create triggers to update updated_at timestamp (reuse existing function)
CREATE TRIGGER lessons_updated_at
  BEFORE UPDATE ON public.lessons
  FOR EACH ROW
  EXECUTE FUNCTION update_topics_updated_at();

CREATE TRIGGER lesson_progress_updated_at
  BEFORE UPDATE ON public.lesson_progress
  FOR EACH ROW
  EXECUTE FUNCTION update_topics_updated_at();
