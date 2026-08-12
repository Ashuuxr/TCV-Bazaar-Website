
-- Brochures & versions
CREATE TABLE public.brochures (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  event_id uuid REFERENCES public.events(id) ON DELETE SET NULL,
  file_path text NOT NULL,
  file_name text NOT NULL,
  file_size bigint NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT false,
  is_archived boolean NOT NULL DEFAULT false,
  sort_order int NOT NULL DEFAULT 0,
  uploaded_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Only one active brochure per event (and one for the global/null-event scope)
CREATE UNIQUE INDEX brochures_one_active_per_event
  ON public.brochures ((COALESCE(event_id::text, 'GLOBAL')))
  WHERE is_active AND NOT is_archived;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.brochures TO authenticated;
GRANT SELECT ON public.brochures TO anon;
GRANT ALL ON public.brochures TO service_role;

ALTER TABLE public.brochures ENABLE ROW LEVEL SECURITY;

-- Public can read only active, non-archived rows (safe columns only via projection in server functions)
CREATE POLICY "brochures_public_active"
  ON public.brochures FOR SELECT
  TO anon, authenticated
  USING (is_active AND NOT is_archived);

-- Admins can read everything (superset of public policy)
CREATE POLICY "brochures_admin_all_select"
  ON public.brochures FOR SELECT
  TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['super_admin','admin']::app_role[]));

CREATE POLICY "brochures_admin_insert"
  ON public.brochures FOR INSERT
  TO authenticated
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['super_admin','admin']::app_role[]));

CREATE POLICY "brochures_admin_update"
  ON public.brochures FOR UPDATE
  TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['super_admin','admin']::app_role[]))
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['super_admin','admin']::app_role[]));

CREATE POLICY "brochures_admin_delete"
  ON public.brochures FOR DELETE
  TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['super_admin','admin']::app_role[]));

CREATE TRIGGER brochures_touch_updated_at
  BEFORE UPDATE ON public.brochures
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Version history
CREATE TABLE public.brochure_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brochure_id uuid NOT NULL REFERENCES public.brochures(id) ON DELETE CASCADE,
  file_path text NOT NULL,
  file_name text NOT NULL,
  file_size bigint NOT NULL DEFAULT 0,
  title text,
  description text,
  replaced_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX brochure_versions_brochure_id_idx ON public.brochure_versions(brochure_id, created_at DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.brochure_versions TO authenticated;
GRANT ALL ON public.brochure_versions TO service_role;

ALTER TABLE public.brochure_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "brochure_versions_admin_all"
  ON public.brochure_versions FOR ALL
  TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['super_admin','admin']::app_role[]))
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['super_admin','admin']::app_role[]));

-- Storage RLS for brochures bucket (bucket created separately via storage_create_bucket)
-- Admins manage all objects in the 'brochures' bucket. Public access is via signed URLs only.
CREATE POLICY "brochures_bucket_admin_read"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'brochures' AND public.has_any_role(auth.uid(), ARRAY['super_admin','admin']::app_role[]));

CREATE POLICY "brochures_bucket_admin_insert"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'brochures' AND public.has_any_role(auth.uid(), ARRAY['super_admin','admin']::app_role[]));

CREATE POLICY "brochures_bucket_admin_update"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'brochures' AND public.has_any_role(auth.uid(), ARRAY['super_admin','admin']::app_role[]))
  WITH CHECK (bucket_id = 'brochures' AND public.has_any_role(auth.uid(), ARRAY['super_admin','admin']::app_role[]));

CREATE POLICY "brochures_bucket_admin_delete"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'brochures' AND public.has_any_role(auth.uid(), ARRAY['super_admin','admin']::app_role[]));
