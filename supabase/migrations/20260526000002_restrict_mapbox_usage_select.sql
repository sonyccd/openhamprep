-- L2: Restrict mapbox_usage SELECT to admin users only.
-- Previously any authenticated user could read aggregate request counts,
-- which discloses quota-exhaustion timing. Only admins need this data.

DROP POLICY IF EXISTS "Authenticated users can view mapbox usage" ON public.mapbox_usage;

CREATE POLICY "Admins can view mapbox usage"
  ON public.mapbox_usage FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );
