
-- =========================================================
-- Enums
-- =========================================================
CREATE TYPE public.app_role AS ENUM ('admin', 'customer');
CREATE TYPE public.stall_status AS ENUM ('available', 'held', 'reserved', 'pending', 'booked', 'sold');
CREATE TYPE public.booking_status AS ENUM ('pending', 'approved', 'rejected', 'cancelled');
CREATE TYPE public.payment_status AS ENUM ('pending', 'partial', 'paid', 'refunded');
CREATE TYPE public.pay_type AS ENUM ('full', 'advance');

-- =========================================================
-- Helper: updated_at trigger
-- =========================================================
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- =========================================================
-- profiles
-- =========================================================
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text,
  phone text,
  business_name text,
  owner_name text,
  gstin text,
  email text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER trg_profiles_touch BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- =========================================================
-- user_roles + has_role (must exist before policies that use it)
-- =========================================================
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- user_roles policies
CREATE POLICY "Users can view own roles" ON public.user_roles
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all roles" ON public.user_roles
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins manage roles" ON public.user_roles
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- profiles policies
CREATE POLICY "Users read own profile" ON public.profiles
  FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "Users update own profile" ON public.profiles
  FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "Users insert own profile" ON public.profiles
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "Admins read all profiles" ON public.profiles
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins update all profiles" ON public.profiles
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- =========================================================
-- Auto-create profile on signup
-- =========================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, phone, business_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'phone', ''),
    COALESCE(NEW.raw_user_meta_data->>'business_name', '')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =========================================================
-- events
-- =========================================================
CREATE TABLE public.events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  name text NOT NULL,
  edition text,
  venue text,
  city text,
  dates_label text,
  start_at timestamptz,
  end_at timestamptz,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.events TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.events TO authenticated;
GRANT ALL ON public.events TO service_role;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public reads active events" ON public.events
  FOR SELECT TO anon, authenticated USING (is_active = true);
CREATE POLICY "Admins read all events" ON public.events
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins manage events" ON public.events
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_events_touch BEFORE UPDATE ON public.events
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- =========================================================
-- packages
-- =========================================================
CREATE TABLE public.packages (
  id text PRIMARY KEY,
  event_id uuid REFERENCES public.events(id) ON DELETE CASCADE,
  name text NOT NULL,
  price integer NOT NULL,
  size text,
  tag text,
  features text[] NOT NULL DEFAULT '{}',
  popular boolean NOT NULL DEFAULT false,
  enabled boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.packages TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.packages TO authenticated;
GRANT ALL ON public.packages TO service_role;
ALTER TABLE public.packages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public reads enabled packages" ON public.packages
  FOR SELECT TO anon, authenticated USING (enabled = true);
CREATE POLICY "Admins read all packages" ON public.packages
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins manage packages" ON public.packages
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_packages_touch BEFORE UPDATE ON public.packages
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- =========================================================
-- stalls
-- =========================================================
CREATE TABLE public.stalls (
  id text PRIMARY KEY,
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  label text NOT NULL,
  zone text,
  x numeric NOT NULL DEFAULT 0,
  y numeric NOT NULL DEFAULT 0,
  w numeric NOT NULL DEFAULT 10,
  h numeric NOT NULL DEFAULT 10,
  pkg_id text REFERENCES public.packages(id) ON DELETE SET NULL,
  status public.stall_status NOT NULL DEFAULT 'available',
  customer_name text,
  held_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  held_until timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.stalls TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.stalls TO authenticated;
GRANT ALL ON public.stalls TO service_role;
ALTER TABLE public.stalls ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public reads stalls" ON public.stalls
  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admins manage stalls" ON public.stalls
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_stalls_touch BEFORE UPDATE ON public.stalls
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- =========================================================
-- banks
-- =========================================================
CREATE TABLE public.banks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bank_name text NOT NULL,
  holder text NOT NULL,
  account_number text NOT NULL,
  ifsc text NOT NULL,
  branch text,
  upi text,
  qr_url text,
  instructions text,
  enabled boolean NOT NULL DEFAULT true,
  is_default boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.banks TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.banks TO authenticated;
GRANT ALL ON public.banks TO service_role;
ALTER TABLE public.banks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public reads enabled banks" ON public.banks
  FOR SELECT TO anon, authenticated USING (enabled = true);
CREATE POLICY "Admins read all banks" ON public.banks
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins manage banks" ON public.banks
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_banks_touch BEFORE UPDATE ON public.banks
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- =========================================================
-- bookings
-- =========================================================
CREATE SEQUENCE public.invoice_seq START 1001;

CREATE TABLE public.bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number text UNIQUE NOT NULL DEFAULT ('TCV-2026-' || lpad(nextval('public.invoice_seq')::text, 6, '0')),
  customer_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  event_id uuid REFERENCES public.events(id) ON DELETE SET NULL,
  package_id text REFERENCES public.packages(id) ON DELETE SET NULL,
  stall_id text REFERENCES public.stalls(id) ON DELETE SET NULL,
  business_name text,
  owner_name text,
  contact_phone text,
  contact_email text,
  gstin text,
  business jsonb NOT NULL DEFAULT '{}'::jsonb,
  subtotal integer NOT NULL DEFAULT 0,
  gst_rate numeric NOT NULL DEFAULT 0,
  gst_amount integer NOT NULL DEFAULT 0,
  total integer NOT NULL DEFAULT 0,
  amount_paid integer NOT NULL DEFAULT 0,
  balance integer NOT NULL DEFAULT 0,
  pay_type public.pay_type NOT NULL DEFAULT 'full',
  method text,
  utr text,
  txn_id text,
  proof_url text,
  remarks text,
  status public.booking_status NOT NULL DEFAULT 'pending',
  pay_status public.payment_status NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.bookings TO authenticated;
GRANT ALL ON public.bookings TO service_role;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own bookings" ON public.bookings
  FOR SELECT TO authenticated USING (auth.uid() = customer_id);
CREATE POLICY "Users create own bookings" ON public.bookings
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = customer_id);
CREATE POLICY "Users update own pending bookings" ON public.bookings
  FOR UPDATE TO authenticated
  USING (auth.uid() = customer_id AND status = 'pending')
  WITH CHECK (auth.uid() = customer_id);
CREATE POLICY "Admins read all bookings" ON public.bookings
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins manage bookings" ON public.bookings
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_bookings_touch BEFORE UPDATE ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE INDEX idx_bookings_customer ON public.bookings(customer_id);
CREATE INDEX idx_bookings_status ON public.bookings(status);
CREATE INDEX idx_bookings_created ON public.bookings(created_at DESC);

-- =========================================================
-- booking_files
-- =========================================================
CREATE TABLE public.booking_files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  kind text NOT NULL,
  bucket text NOT NULL,
  path text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, DELETE ON public.booking_files TO authenticated;
GRANT ALL ON public.booking_files TO service_role;
ALTER TABLE public.booking_files ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own booking files" ON public.booking_files
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM public.bookings b WHERE b.id = booking_id AND b.customer_id = auth.uid())
  );
CREATE POLICY "Users insert own booking files" ON public.booking_files
  FOR INSERT TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM public.bookings b WHERE b.id = booking_id AND b.customer_id = auth.uid())
  );
CREATE POLICY "Admins manage booking files" ON public.booking_files
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- =========================================================
-- activity_log
-- =========================================================
CREATE TABLE public.activity_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  text text NOT NULL,
  meta jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.activity_log TO authenticated;
GRANT ALL ON public.activity_log TO service_role;
ALTER TABLE public.activity_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins read activity" ON public.activity_log
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins insert activity" ON public.activity_log
  FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- =========================================================
-- Seed: event, packages, stalls, bank, admin role
-- =========================================================
DO $seed$
DECLARE
  v_event_id uuid;
  v_admin_id uuid;
  zone_rec RECORD;
  i int;
  col int;
  row int;
  n int;
  s_status public.stall_status;
  status_cycle public.stall_status[] := ARRAY['booked','reserved','sold','pending']::public.stall_status[];
BEGIN
  -- Event
  INSERT INTO public.events (slug, name, edition, venue, city, dates_label, start_at, end_at, is_active)
  VALUES ('tcv-2026-diwali', 'TCV Bazaar 2026', 'Diwali Edition', 'Keshar Towers', 'Gwalior',
          '23 · 24 · 25 October 2026',
          '2026-10-23T10:00:00+05:30', '2026-10-25T22:00:00+05:30', true)
  RETURNING id INTO v_event_id;

  -- Packages
  INSERT INTO public.packages (id, event_id, name, price, size, tag, features, popular, enabled, sort_order) VALUES
    ('premium',  v_event_id, 'Premium Tent',          40000, '10 × 10 ft',        'Hot Spot',    ARRAY['Prime hot-spot location','4 Tables + 2 Chairs','10×8 ft Branding Banner','Tea / Coffee service','Dedicated electric point','3 Collaboration Reels'], true,  true, 1),
    ('standard', v_event_id, 'Standard Tent',         30000, '10 × 10 ft',        'Best Seller', ARRAY['4 Tables + 2 Chairs','Tea / Coffee service','Dedicated electric point','1 Collaboration Reel'], false, true, 2),
    ('sharing',  v_event_id, 'Standard Sharing Tent', 17000, 'Shared 10 × 10 ft', 'Value Pick',  ARRAY['Shared premium tent','2 Tables + 1 Chair','Tea / Coffee service','Dedicated electric point','1 Collaboration Reel'], false, true, 3),
    ('tabler',   v_event_id, 'Tabler',                15000, 'Open Row',          'Compact',     ARRAY['2 Tables + 1 Chair','Tea / Coffee service','Dedicated electric point','1 Collaboration Reel'], false, true, 4),
    ('branding', v_event_id, 'Branding Spot',          5000, '10 × 8 ft Banner',  'Visibility',  ARRAY['10×8 ft branding banner','Premium placement','1 Collaboration Reel'], false, true, 5);

  -- Stalls (5 zones matching the frontend layout)
  FOR zone_rec IN
    SELECT * FROM (VALUES
      ('Premium Zone',  'A', 12, 6, 4::numeric,  4::numeric,  13::numeric, 9::numeric,  15::numeric, 12::numeric,   'premium',  ARRAY[2,5,7]),
      ('Standard Zone', 'B', 16, 8, 4::numeric,  29::numeric, 10::numeric, 8::numeric,  12::numeric, 11::numeric,   'standard', ARRAY[3,4,10,11]),
      ('Sharing Zone',  'C', 10, 5, 4::numeric,  52::numeric, 11::numeric, 8::numeric,  13::numeric, 11::numeric,   'sharing',  ARRAY[1]),
      ('Tabler Row',    'D', 8,  4, 72::numeric, 52::numeric, 9::numeric,  7::numeric,  11::numeric, 9::numeric,    'tabler',   ARRAY[6]),
      ('Branding Spots','E', 6,  1, 100::numeric,4::numeric,  16::numeric, 6::numeric,  0::numeric,  8.5::numeric,  'branding', ARRAY[]::int[])
    ) AS z(zone, prefix, count, cols, x, y, w, h, gapX, gapY, pkg_id, booked)
  LOOP
    FOR i IN 0 .. zone_rec.count - 1 LOOP
      col := i % zone_rec.cols;
      row := i / zone_rec.cols;
      n := i + 1;
      IF n = ANY(zone_rec.booked) THEN
        s_status := status_cycle[(n % 4) + 1];
      ELSE
        s_status := 'available'::public.stall_status;
      END IF;
      INSERT INTO public.stalls (id, event_id, label, zone, x, y, w, h, pkg_id, status, customer_name)
      VALUES (
        zone_rec.prefix || n,
        v_event_id,
        zone_rec.prefix || n,
        zone_rec.zone,
        zone_rec.x + col * zone_rec.gapX,
        zone_rec.y + row * zone_rec.gapY,
        zone_rec.w, zone_rec.h,
        zone_rec.pkg_id,
        s_status,
        CASE WHEN s_status = 'available' THEN NULL
             ELSE (ARRAY['The City Vibes','Gwalior Jewels','Ananya Crafts','Sharma Foods'])[(n % 4) + 1]
        END
      );
    END LOOP;
  END LOOP;

  -- Bank
  INSERT INTO public.banks (bank_name, holder, account_number, ifsc, branch, upi, instructions, enabled, is_default)
  VALUES ('HDFC Bank', 'The City Vibes Marketing', '50200045678901', 'HDFC0001234',
          'City Centre, Gwalior', 'thecityvibes@hdfcbank',
          'Please use your Booking ID as the payment remark. Share the screenshot on WhatsApp after payment.',
          true, true);

  -- Grant admin role to existing admin user (if present)
  SELECT id INTO v_admin_id FROM auth.users WHERE lower(email) = 'ashuuxxr@gmail.com' LIMIT 1;
  IF v_admin_id IS NOT NULL THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (v_admin_id, 'admin')
      ON CONFLICT (user_id, role) DO NOTHING;
    INSERT INTO public.profiles (id, email, full_name)
      VALUES (v_admin_id, 'ashuuxxr@gmail.com', 'TCV Admin')
      ON CONFLICT (id) DO NOTHING;
  END IF;
END
$seed$;
