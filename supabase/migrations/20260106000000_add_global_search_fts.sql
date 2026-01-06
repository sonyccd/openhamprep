-- Add full-text search (FTS) columns for global keyword search
-- These are generated tsvector columns with weighted search across multiple fields

-- Questions: weighted search on display_name (A), question (B), explanation (C)
-- Higher weight = more important in ranking
ALTER TABLE public.questions
ADD COLUMN IF NOT EXISTS fts tsvector
GENERATED ALWAYS AS (
  setweight(to_tsvector('english', coalesce(display_name, '')), 'A') ||
  setweight(to_tsvector('english', coalesce(question, '')), 'B') ||
  setweight(to_tsvector('english', coalesce(explanation, '')), 'C')
) STORED;

-- Create GIN index for fast full-text search on questions
CREATE INDEX IF NOT EXISTS questions_fts_idx ON public.questions USING GIN (fts);

-- Glossary terms: weighted search on term (A), definition (B)
ALTER TABLE public.glossary_terms
ADD COLUMN IF NOT EXISTS fts tsvector
GENERATED ALWAYS AS (
  setweight(to_tsvector('english', coalesce(term, '')), 'A') ||
  setweight(to_tsvector('english', coalesce(definition, '')), 'B')
) STORED;

-- Create GIN index for fast full-text search on glossary
CREATE INDEX IF NOT EXISTS glossary_terms_fts_idx ON public.glossary_terms USING GIN (fts);

-- Topics: weighted search on title (A), description (B)
ALTER TABLE public.topics
ADD COLUMN IF NOT EXISTS fts tsvector
GENERATED ALWAYS AS (
  setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
  setweight(to_tsvector('english', coalesce(description, '')), 'B')
) STORED;

-- Create GIN index for fast full-text search on topics
CREATE INDEX IF NOT EXISTS topics_fts_idx ON public.topics USING GIN (fts);

-- Add comment explaining the FTS setup
COMMENT ON COLUMN public.questions.fts IS 'Full-text search vector for global search. Weights: display_name (A), question (B), explanation (C)';
COMMENT ON COLUMN public.glossary_terms.fts IS 'Full-text search vector for global search. Weights: term (A), definition (B)';
COMMENT ON COLUMN public.topics.fts IS 'Full-text search vector for global search. Weights: title (A), description (B)';
