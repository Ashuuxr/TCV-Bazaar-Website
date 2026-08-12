
CREATE TYPE public.tracking_provider AS ENUM (
  'meta_pixel','ga4','gtm','google_ads','clarity','tiktok','linkedin','custom'
);

CREATE TABLE public.tracking_integrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider public.tracking_provider NOT NULL UNIQUE,
  enabled boolean NOT NULL DEFAULT false,
  tracking_id text,
  custom_code text,
  config jsonb NOT NULL DEFAULT '{}'::jsonb,
  load_on_admin boolean NOT NULL DEFAULT false,
  updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.tracking_integrations TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.tracking_integrations TO authenticated;
GRANT ALL ON public.tracking_integrations TO service_role;

ALTER TABLE public.tracking_integrations ENABLE ROW LEVEL SECURITY;

-- Public may read only rows that are enabled (so disabled/staged IDs stay private).
CREATE POLICY "public read enabled tracking"
  ON public.tracking_integrations FOR SELECT
  TO anon, authenticated
  USING (enabled = true);

-- Super admins can read every row (including disabled).
CREATE POLICY "super admin read all tracking"
  ON public.tracking_integrations FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'::app_role));

-- Only super admins may write.
CREATE POLICY "super admin manage tracking"
  ON public.tracking_integrations FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'super_admin'::app_role));

CREATE TRIGGER tracking_integrations_touch
  BEFORE UPDATE ON public.tracking_integrations
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

ALTER PUBLICATION supabase_realtime ADD TABLE public.tracking_integrations;
ALTER TABLE public.tracking_integrations REPLICA IDENTITY FULL;
