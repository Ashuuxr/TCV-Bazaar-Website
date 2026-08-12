
-- 1. Extend role enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'super_admin';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'manager';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'editor';

COMMIT;

-- 2. user_roles: track who assigned + when
ALTER TABLE public.user_roles
  ADD COLUMN IF NOT EXISTS assigned_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS assigned_at timestamptz NOT NULL DEFAULT now();

-- 3. profiles: status + owner flag
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','suspended')),
  ADD COLUMN IF NOT EXISTS is_owner boolean NOT NULL DEFAULT false;

CREATE UNIQUE INDEX IF NOT EXISTS profiles_single_owner_idx
  ON public.profiles ((true)) WHERE is_owner = true;

-- 4. Redefine has_role so 'admin' checks also pass for super_admin (keeps existing policies working)
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id
      AND (
        role = _role
        OR (_role = 'admin'::app_role AND role = 'super_admin'::app_role)
      )
  )
$$;

CREATE OR REPLACE FUNCTION public.has_any_role(_user_id uuid, _roles app_role[])
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id
      AND role = ANY(_roles)
  )
$$;

CREATE OR REPLACE FUNCTION public.count_active_super_admins()
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(*)::int
  FROM public.user_roles ur
  JOIN public.profiles p ON p.id = ur.user_id
  WHERE ur.role = 'super_admin'::app_role
    AND COALESCE(p.status, 'active') = 'active'
$$;

CREATE OR REPLACE FUNCTION public.is_last_super_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.count_active_super_admins() <= 1
    AND EXISTS (
      SELECT 1 FROM public.user_roles ur
      JOIN public.profiles p ON p.id = ur.user_id
      WHERE ur.user_id = _user_id
        AND ur.role = 'super_admin'::app_role
        AND COALESCE(p.status,'active') = 'active'
    )
$$;

GRANT EXECUTE ON FUNCTION public.has_any_role(uuid, app_role[]) TO authenticated;
GRANT EXECUTE ON FUNCTION public.count_active_super_admins() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_last_super_admin(uuid) TO authenticated;

-- 5. Guard trigger on user_roles: cannot remove/demote last active super admin
CREATE OR REPLACE FUNCTION public.protect_last_super_admin()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  active_supers int;
BEGIN
  IF TG_OP = 'DELETE' AND OLD.role = 'super_admin'::app_role THEN
    SELECT public.count_active_super_admins() INTO active_supers;
    -- After delete count would drop by 1 (row still counted here since trigger runs BEFORE delete)
    IF active_supers <= 1 THEN
      RAISE EXCEPTION 'Cannot remove the last active Super Admin';
    END IF;
    RETURN OLD;
  END IF;
  IF TG_OP = 'UPDATE' AND OLD.role = 'super_admin'::app_role AND NEW.role <> 'super_admin'::app_role THEN
    IF public.count_active_super_admins() <= 1 THEN
      RAISE EXCEPTION 'Cannot demote the last active Super Admin';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_protect_last_super_admin ON public.user_roles;
CREATE TRIGGER trg_protect_last_super_admin
BEFORE UPDATE OR DELETE ON public.user_roles
FOR EACH ROW EXECUTE FUNCTION public.protect_last_super_admin();

-- Same guard on profile suspension
CREATE OR REPLACE FUNCTION public.protect_last_super_admin_status()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'UPDATE'
     AND OLD.status = 'active' AND NEW.status = 'suspended'
     AND EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = NEW.id AND role = 'super_admin'::app_role)
  THEN
    IF public.count_active_super_admins() <= 1 THEN
      RAISE EXCEPTION 'Cannot suspend the last active Super Admin';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_protect_last_super_admin_status ON public.profiles;
CREATE TRIGGER trg_protect_last_super_admin_status
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.protect_last_super_admin_status();

-- 6. Audit log
CREATE TABLE IF NOT EXISTS public.user_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  actor_email text,
  target_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  target_email text,
  action text NOT NULL,
  from_role app_role,
  to_role app_role,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.user_audit_log TO authenticated;
GRANT ALL ON public.user_audit_log TO service_role;

ALTER TABLE public.user_audit_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins read audit log" ON public.user_audit_log;
CREATE POLICY "Admins read audit log" ON public.user_audit_log
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- No INSERT policy — inserts happen through SECURITY DEFINER RPC or service_role

CREATE OR REPLACE FUNCTION public.log_user_audit(
  _target_id uuid,
  _target_email text,
  _action text,
  _from_role app_role DEFAULT NULL,
  _to_role app_role DEFAULT NULL,
  _metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _actor_email text;
BEGIN
  SELECT email INTO _actor_email FROM auth.users WHERE id = auth.uid();
  INSERT INTO public.user_audit_log
    (actor_id, actor_email, target_id, target_email, action, from_role, to_role, metadata)
  VALUES
    (auth.uid(), _actor_email, _target_id, _target_email, _action, _from_role, _to_role, COALESCE(_metadata,'{}'::jsonb));
END;
$$;

GRANT EXECUTE ON FUNCTION public.log_user_audit(uuid, text, text, app_role, app_role, jsonb) TO authenticated;

CREATE INDEX IF NOT EXISTS user_audit_log_created_idx ON public.user_audit_log (created_at DESC);
CREATE INDEX IF NOT EXISTS user_audit_log_target_idx ON public.user_audit_log (target_id);
CREATE INDEX IF NOT EXISTS user_audit_log_actor_idx ON public.user_audit_log (actor_id);

-- 7. Seed: promote every existing admin to super_admin; mark ashuuxxr@gmail.com as owner
INSERT INTO public.user_roles (user_id, role, assigned_at)
SELECT ur.user_id, 'super_admin'::app_role, now()
FROM public.user_roles ur
WHERE ur.role = 'admin'::app_role
ON CONFLICT (user_id, role) DO NOTHING;

UPDATE public.profiles p
SET is_owner = true
WHERE p.id = (SELECT id FROM auth.users WHERE email = 'ashuuxxr@gmail.com' LIMIT 1)
  AND NOT EXISTS (SELECT 1 FROM public.profiles WHERE is_owner = true);
