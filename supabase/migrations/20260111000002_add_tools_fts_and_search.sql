-- Add full-text search support to ham_radio_tools table

-- Drop the old search_content function (5 parameters) before creating new one (6 parameters)
DROP FUNCTION IF EXISTS public.search_content(TEXT, TEXT, INT, INT, INT);

-- Add FTS column to ham_radio_tools
ALTER TABLE public.ham_radio_tools ADD COLUMN IF NOT EXISTS fts tsvector
  GENERATED ALWAYS AS (
    setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(description, '')), 'B')
  ) STORED;

-- Create GIN index for fast FTS queries
CREATE INDEX IF NOT EXISTS ham_radio_tools_fts_idx ON public.ham_radio_tools USING GIN (fts);

-- Update search_content function to include tools
CREATE OR REPLACE FUNCTION public.search_content(
  search_query TEXT,
  license_prefix TEXT DEFAULT NULL,
  questions_limit INT DEFAULT 5,
  glossary_limit INT DEFAULT 5,
  topics_limit INT DEFAULT 3,
  tools_limit INT DEFAULT 3
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result JSON;
  ts_query tsquery;
  clean_query TEXT;
  escaped_query TEXT;
  fts_question_count INT;
BEGIN
  -- Return empty results for empty or whitespace-only queries
  IF search_query IS NULL OR trim(search_query) = '' THEN
    RETURN json_build_object(
      'questions', '[]'::json,
      'glossary', '[]'::json,
      'topics', '[]'::json,
      'tools', '[]'::json
    );
  END IF;

  clean_query := trim(search_query);
  -- Escape ILIKE metacharacters (%, _, \) to prevent pattern injection
  escaped_query := replace(replace(replace(clean_query, '\', '\\'), '%', '\%'), '_', '\_');

  -- Convert search query to tsquery using websearch syntax
  -- websearch_to_tsquery handles natural language queries like "antenna gain"
  BEGIN
    ts_query := websearch_to_tsquery('english', clean_query);
  EXCEPTION WHEN OTHERS THEN
    -- If query parsing fails, use plainto_tsquery as fallback
    ts_query := plainto_tsquery('english', clean_query);
  END;

  -- Check how many FTS results we'd get for questions
  SELECT COUNT(*) INTO fts_question_count
  FROM public.questions
  WHERE fts @@ ts_query
    AND (license_prefix IS NULL OR display_name LIKE license_prefix || '%');

  -- Build the result with conditional question search strategy
  SELECT json_build_object(
    'questions', (
      CASE
        WHEN fts_question_count > 0 THEN
          -- Use full-text search results
          (SELECT coalesce(json_agg(
            json_build_object(
              'id', q.id,
              'display_name', q.display_name,
              'question', q.question,
              'explanation', q.explanation,
              'rank', q.rank
            ) ORDER BY q.rank DESC
          ), '[]'::json)
          FROM (
            SELECT
              id,
              display_name,
              question,
              explanation,
              ts_rank(fts, ts_query) as rank
            FROM public.questions
            WHERE fts @@ ts_query
              AND (license_prefix IS NULL OR display_name LIKE license_prefix || '%')
            ORDER BY ts_rank(fts, ts_query) DESC
            LIMIT questions_limit
          ) q)
        ELSE
          -- Fallback to ILIKE search on display_name (for question IDs like T4B02)
          (SELECT coalesce(json_agg(
            json_build_object(
              'id', q.id,
              'display_name', q.display_name,
              'question', q.question,
              'explanation', q.explanation,
              'rank', q.rank
            ) ORDER BY q.display_name ASC
          ), '[]'::json)
          FROM (
            SELECT
              id,
              display_name,
              question,
              explanation,
              1.0 as rank
            FROM public.questions
            WHERE display_name ILIKE escaped_query || '%'
              AND (license_prefix IS NULL OR display_name LIKE license_prefix || '%')
            ORDER BY display_name ASC
            LIMIT questions_limit
          ) q)
      END
    ),
    'glossary', (
      SELECT coalesce(json_agg(
        json_build_object(
          'id', g.id,
          'term', g.term,
          'definition', g.definition,
          'rank', g.rank
        ) ORDER BY g.rank DESC
      ), '[]'::json)
      FROM (
        SELECT
          id,
          term,
          definition,
          ts_rank(fts, ts_query) as rank
        FROM public.glossary_terms
        WHERE fts @@ ts_query
        ORDER BY ts_rank(fts, ts_query) DESC
        LIMIT glossary_limit
      ) g
    ),
    'topics', (
      SELECT coalesce(json_agg(
        json_build_object(
          'id', t.id,
          'slug', t.slug,
          'title', t.title,
          'description', t.description,
          'rank', t.rank
        ) ORDER BY t.rank DESC
      ), '[]'::json)
      FROM (
        SELECT
          id,
          slug,
          title,
          description,
          ts_rank(fts, ts_query) as rank
        FROM public.topics
        WHERE fts @@ ts_query
          AND is_published = true
          AND (
            license_prefix IS NULL
            OR license_types @> ARRAY[
              CASE license_prefix
                WHEN 'T' THEN 'technician'
                WHEN 'G' THEN 'general'
                WHEN 'E' THEN 'extra'
              END
            ]
          )
        ORDER BY ts_rank(fts, ts_query) DESC
        LIMIT topics_limit
      ) t
    ),
    'tools', (
      SELECT coalesce(json_agg(
        json_build_object(
          'id', tool.id,
          'title', tool.title,
          'description', tool.description,
          'url', tool.url,
          'rank', tool.rank
        ) ORDER BY tool.rank DESC
      ), '[]'::json)
      FROM (
        SELECT
          id,
          title,
          description,
          url,
          ts_rank(fts, ts_query) as rank
        FROM public.ham_radio_tools
        WHERE fts @@ ts_query
          AND is_published = true
        ORDER BY ts_rank(fts, ts_query) DESC
        LIMIT tools_limit
      ) tool
    )
  ) INTO result;

  RETURN result;
END;
$$;

-- Grant execute permission to authenticated and anonymous users
GRANT EXECUTE ON FUNCTION public.search_content(TEXT, TEXT, INT, INT, INT, INT) TO authenticated, anon;

-- Update comment
COMMENT ON FUNCTION public.search_content(TEXT, TEXT, INT, INT, INT, INT) IS 'Unified search function for global keyword search. Searches questions, glossary terms, topics, and tools with optional license filtering. Uses FTS for natural language with ILIKE fallback for question IDs.';
