-- Create topic_questions junction table for many-to-many relationship
-- between topics and questions
CREATE TABLE public.topic_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_id UUID REFERENCES public.topics(id) ON DELETE CASCADE,
  question_id UUID REFERENCES public.questions(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(topic_id, question_id)
);

-- Create indexes for efficient lookups
CREATE INDEX idx_topic_questions_topic_id ON public.topic_questions(topic_id);
CREATE INDEX idx_topic_questions_question_id ON public.topic_questions(question_id);

-- Enable RLS
ALTER TABLE public.topic_questions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for topic_questions table
-- Anyone can view topic-question associations for published topics
CREATE POLICY "Anyone can view topic questions for published topics"
  ON public.topic_questions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.topics
      WHERE topics.id = topic_questions.topic_id AND topics.is_published = true
    )
    OR
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Admins can manage topic-question associations
CREATE POLICY "Admins can insert topic questions"
  ON public.topic_questions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can delete topic questions"
  ON public.topic_questions FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );
