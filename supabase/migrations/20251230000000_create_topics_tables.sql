-- Create topics table for custom learning content
CREATE TABLE public.topics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  thumbnail_url TEXT,
  display_order INTEGER DEFAULT 0,
  is_published BOOLEAN DEFAULT false,
  license_types TEXT[] DEFAULT ARRAY['technician', 'general', 'extra'],
  content_path TEXT,  -- Path to markdown file in storage
  edit_history JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create topic_subelements junction table for many-to-many relationship
CREATE TABLE public.topic_subelements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_id UUID REFERENCES public.topics(id) ON DELETE CASCADE,
  subelement TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(topic_id, subelement)
);

-- Create topic_resources table for sidebar resources
CREATE TABLE public.topic_resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_id UUID REFERENCES public.topics(id) ON DELETE CASCADE,
  resource_type TEXT NOT NULL,  -- 'video', 'article', 'pdf', 'image', 'link'
  title TEXT NOT NULL,
  url TEXT,                     -- For external links/videos
  storage_path TEXT,            -- For uploaded files
  description TEXT,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create topic_progress table for user completion tracking
CREATE TABLE public.topic_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  topic_id UUID REFERENCES public.topics(id) ON DELETE CASCADE,
  is_completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, topic_id)
);

-- Create indexes for common queries
CREATE INDEX idx_topics_slug ON public.topics(slug);
CREATE INDEX idx_topics_is_published ON public.topics(is_published);
CREATE INDEX idx_topics_display_order ON public.topics(display_order);
CREATE INDEX idx_topic_subelements_topic_id ON public.topic_subelements(topic_id);
CREATE INDEX idx_topic_subelements_subelement ON public.topic_subelements(subelement);
CREATE INDEX idx_topic_resources_topic_id ON public.topic_resources(topic_id);
CREATE INDEX idx_topic_resources_display_order ON public.topic_resources(display_order);
CREATE INDEX idx_topic_progress_user_id ON public.topic_progress(user_id);
CREATE INDEX idx_topic_progress_topic_id ON public.topic_progress(topic_id);

-- Enable RLS on all tables
ALTER TABLE public.topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.topic_subelements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.topic_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.topic_progress ENABLE ROW LEVEL SECURITY;

-- RLS Policies for topics table
-- Anyone can view published topics
CREATE POLICY "Anyone can view published topics"
  ON public.topics FOR SELECT
  USING (is_published = true);

-- Admins can view all topics (including drafts)
CREATE POLICY "Admins can view all topics"
  ON public.topics FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Admins can insert topics
CREATE POLICY "Admins can insert topics"
  ON public.topics FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Admins can update topics
CREATE POLICY "Admins can update topics"
  ON public.topics FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Admins can delete topics
CREATE POLICY "Admins can delete topics"
  ON public.topics FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- RLS Policies for topic_subelements table
-- Anyone can view topic subelements (for published topics)
CREATE POLICY "Anyone can view topic subelements"
  ON public.topic_subelements FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.topics
      WHERE topics.id = topic_subelements.topic_id AND topics.is_published = true
    )
    OR
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Admins can manage topic subelements
CREATE POLICY "Admins can insert topic subelements"
  ON public.topic_subelements FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can update topic subelements"
  ON public.topic_subelements FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can delete topic subelements"
  ON public.topic_subelements FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- RLS Policies for topic_resources table
-- Anyone can view resources for published topics
CREATE POLICY "Anyone can view topic resources"
  ON public.topic_resources FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.topics
      WHERE topics.id = topic_resources.topic_id AND topics.is_published = true
    )
    OR
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Admins can manage topic resources
CREATE POLICY "Admins can insert topic resources"
  ON public.topic_resources FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can update topic resources"
  ON public.topic_resources FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can delete topic resources"
  ON public.topic_resources FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- RLS Policies for topic_progress table
-- Users can view their own progress
CREATE POLICY "Users can view their own topic progress"
  ON public.topic_progress FOR SELECT
  USING (user_id = auth.uid());

-- Users can insert their own progress
CREATE POLICY "Users can insert their own topic progress"
  ON public.topic_progress FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Users can update their own progress
CREATE POLICY "Users can update their own topic progress"
  ON public.topic_progress FOR UPDATE
  USING (user_id = auth.uid());

-- Users can delete their own progress
CREATE POLICY "Users can delete their own topic progress"
  ON public.topic_progress FOR DELETE
  USING (user_id = auth.uid());

-- Admins can view all progress (for analytics)
CREATE POLICY "Admins can view all topic progress"
  ON public.topic_progress FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_topics_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER topics_updated_at
  BEFORE UPDATE ON public.topics
  FOR EACH ROW
  EXECUTE FUNCTION update_topics_updated_at();

CREATE TRIGGER topic_progress_updated_at
  BEFORE UPDATE ON public.topic_progress
  FOR EACH ROW
  EXECUTE FUNCTION update_topics_updated_at();
