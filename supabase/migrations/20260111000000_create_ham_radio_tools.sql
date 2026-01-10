-- Create ham_radio_tool_categories table
CREATE TABLE public.ham_radio_tool_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  display_order INTEGER DEFAULT 0,
  icon_name TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create ham_radio_tools table
-- Note: ON DELETE SET NULL allows deleting categories while keeping tools (they become uncategorized)
CREATE TABLE public.ham_radio_tools (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID REFERENCES public.ham_radio_tool_categories(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  url TEXT NOT NULL,
  image_url TEXT,
  storage_path TEXT,
  is_published BOOLEAN DEFAULT false,
  display_order INTEGER DEFAULT 0,
  edit_history JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes for common queries
CREATE INDEX idx_ham_radio_tools_category_id ON public.ham_radio_tools(category_id);
CREATE INDEX idx_ham_radio_tools_is_published ON public.ham_radio_tools(is_published);
CREATE INDEX idx_ham_radio_tools_display_order ON public.ham_radio_tools(display_order);
CREATE INDEX idx_ham_radio_tool_categories_slug ON public.ham_radio_tool_categories(slug);
CREATE INDEX idx_ham_radio_tool_categories_display_order ON public.ham_radio_tool_categories(display_order);

-- Enable RLS on all tables
ALTER TABLE public.ham_radio_tool_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ham_radio_tools ENABLE ROW LEVEL SECURITY;

-- RLS Policies for ham_radio_tool_categories table
-- Anyone can view categories
CREATE POLICY "Anyone can view ham radio tool categories"
  ON public.ham_radio_tool_categories FOR SELECT
  USING (true);

-- Admins can manage categories
CREATE POLICY "Admins can insert ham radio tool categories"
  ON public.ham_radio_tool_categories FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can update ham radio tool categories"
  ON public.ham_radio_tool_categories FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can delete ham radio tool categories"
  ON public.ham_radio_tool_categories FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- RLS Policies for ham_radio_tools table
-- Anyone can view published tools
CREATE POLICY "Anyone can view published ham radio tools"
  ON public.ham_radio_tools FOR SELECT
  USING (is_published = true);

-- Admins can view all tools (including drafts)
CREATE POLICY "Admins can view all ham radio tools"
  ON public.ham_radio_tools FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Admins can insert tools
CREATE POLICY "Admins can insert ham radio tools"
  ON public.ham_radio_tools FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Admins can update tools
CREATE POLICY "Admins can update ham radio tools"
  ON public.ham_radio_tools FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Admins can delete tools
CREATE POLICY "Admins can delete ham radio tools"
  ON public.ham_radio_tools FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Create triggers to update updated_at timestamp
CREATE TRIGGER ham_radio_tool_categories_updated_at
  BEFORE UPDATE ON public.ham_radio_tool_categories
  FOR EACH ROW
  EXECUTE FUNCTION update_topics_updated_at();

CREATE TRIGGER ham_radio_tools_updated_at
  BEFORE UPDATE ON public.ham_radio_tools
  FOR EACH ROW
  EXECUTE FUNCTION update_topics_updated_at();
