-- Table to track Mapbox API usage across all users
-- This ensures we never exceed the free tier limit (100k/month)
CREATE TABLE mapbox_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  year_month TEXT NOT NULL UNIQUE, -- Format: YYYY_MM (e.g., "2026_01")
  request_count INTEGER NOT NULL DEFAULT 0,
  last_updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for quick lookups by year_month
CREATE INDEX idx_mapbox_usage_year_month ON mapbox_usage(year_month);

-- Function to increment usage and return the new count
CREATE OR REPLACE FUNCTION increment_mapbox_usage(p_year_month TEXT)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_count INTEGER;
BEGIN
  INSERT INTO mapbox_usage (year_month, request_count, last_updated_at)
  VALUES (p_year_month, 1, now())
  ON CONFLICT (year_month)
  DO UPDATE SET
    request_count = mapbox_usage.request_count + 1,
    last_updated_at = now()
  RETURNING request_count INTO new_count;

  RETURN new_count;
END;
$$;

-- RLS policies - allow authenticated users to read, only admins can modify
ALTER TABLE mapbox_usage ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can read usage (to check quota)
CREATE POLICY "Authenticated users can view mapbox usage"
  ON mapbox_usage FOR SELECT
  TO authenticated
  USING (true);

-- Only admins can insert/update (via the increment function which uses SECURITY DEFINER)
CREATE POLICY "Admins can manage mapbox usage"
  ON mapbox_usage FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

-- Grant execute on the increment function to authenticated users
GRANT EXECUTE ON FUNCTION increment_mapbox_usage(TEXT) TO authenticated;
