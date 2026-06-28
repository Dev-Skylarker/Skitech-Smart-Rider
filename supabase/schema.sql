-- ============================================================
-- SKITECH SMART RIDER — Complete Database Schema
-- Run this in the Supabase SQL Editor for project ddxplkgukwawcrnlhkjy
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- ENUMS
-- ============================================================
DO $$ BEGIN
  CREATE TYPE app_role AS ENUM ('admin', 'user');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE profile_status AS ENUM ('draft', 'pending_payment', 'active', 'suspended', 'banned');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============================================================
-- USER ROLES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.user_roles (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role        app_role NOT NULL DEFAULT 'user',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, role)
);

-- ============================================================
-- PROFILES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email         TEXT,
  full_name     TEXT,
  display_name  TEXT,
  phone         TEXT,
  vehicle_type  TEXT,
  plate_number  TEXT,
  route         TEXT,
  city          TEXT,
  bio           TEXT,
  photo_url     TEXT,
  qr_slug       TEXT NOT NULL DEFAULT gen_random_uuid()::TEXT,
  status        profile_status NOT NULL DEFAULT 'draft',
  trust_score   INTEGER NOT NULL DEFAULT 0 CHECK (trust_score BETWEEN -5 AND 5),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (qr_slug)
);

-- Ensure email column exists if the table was created before the email column was added
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email TEXT;

-- ============================================================
-- PAYMENT METHODS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.payment_methods (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id      UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  method_type     TEXT NOT NULL,
  label           TEXT,
  account_name    TEXT,
  account_number  TEXT,
  paybill_number  TEXT,
  is_primary      BOOLEAN NOT NULL DEFAULT FALSE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT payment_methods_method_type_check
    CHECK (method_type IN (
      'mpesa',
      'send_money',
      'till',
      'paybill',
      'bank',
      'pochi_la_biashara',
      'other'
    ))
);

-- Upgrade existing projects that were created with the older 4-value constraint
-- (mpesa, till, paybill, bank only). Required for profile payment method inserts.
ALTER TABLE public.payment_methods
  DROP CONSTRAINT IF EXISTS payment_methods_method_type_check;

ALTER TABLE public.payment_methods
  ADD CONSTRAINT payment_methods_method_type_check
  CHECK (method_type IN (
    'mpesa',
    'send_money',
    'till',
    'paybill',
    'bank',
    'pochi_la_biashara',
    'other'
  ));

-- ============================================================
-- PROFILE ORDERS TABLE (Profile activation fee: KES 100)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.profile_orders (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id    UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount_kes    INTEGER NOT NULL DEFAULT 100,
  status        TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','paid','failed')),
  payment_ref   TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  paid_at       TIMESTAMPTZ,
  confirmed_by  UUID REFERENCES auth.users(id)
);

-- ============================================================
-- MERCH ORDERS TABLE (QR Sticker physical orders)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.merch_orders (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id    UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount_kes    INTEGER NOT NULL DEFAULT 500,
  status        TEXT NOT NULL DEFAULT 'pending',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  paid_at       TIMESTAMPTZ,
  printed_at    TIMESTAMPTZ,
  shipped_at    TIMESTAMPTZ,
  tracking_note TEXT,
  confirmed_by  UUID REFERENCES auth.users(id)
);

-- ============================================================
-- SHOP ITEMS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.shop_items (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name            TEXT NOT NULL,
  description     TEXT,
  price_kes       INTEGER NOT NULL CHECK (price_kes >= 0),
  cover_image     TEXT,
  gallery_images  TEXT[] NOT NULL DEFAULT '{}',
  in_stock        BOOLEAN NOT NULL DEFAULT TRUE,
  created_by      UUID REFERENCES auth.users(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- CART ITEMS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.cart_items (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  shop_item_id  UUID NOT NULL REFERENCES public.shop_items(id) ON DELETE CASCADE,
  quantity      INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, shop_item_id)
);

-- ============================================================
-- SHOP ORDERS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.shop_orders (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  items_snapshot  JSONB NOT NULL DEFAULT '[]',
  total_kes       INTEGER NOT NULL CHECK (total_kes >= 0),
  status          TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','paid','shipped','delivered','cancelled')),
  tracking_note   TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  paid_at         TIMESTAMPTZ,
  shipped_at      TIMESTAMPTZ
);

-- ============================================================
-- RIDER REPORTS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.rider_reports (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  rider_profile_id  UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reporter_name     TEXT NOT NULL DEFAULT 'Anonymous',
  reporter_email    TEXT NOT NULL DEFAULT 'anonymous@report.com',
  remarks           TEXT,
  emailjs_sent      BOOLEAN NOT NULL DEFAULT FALSE,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- FUNCTIONS
-- ============================================================

-- Check if user has a specific role
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  );
$$;

-- Check if user is staff (admin or support)
CREATE OR REPLACE FUNCTION public.is_staff(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role IN ('admin', 'support')
  );
$$;

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- ============================================================
-- TRIGGERS
-- ============================================================

-- Auto-create user_roles + profiles row on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insert default user role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user')
  ON CONFLICT (user_id, role) DO NOTHING;

  -- Insert empty profile with UUID-based qr_slug
  INSERT INTO public.profiles (id, full_name, email, qr_slug, status)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NULL),
    NEW.email,
    gen_random_uuid()::TEXT,
    'draft'
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$;

-- Attach trigger to auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Backfill profiles for auth users created before the signup trigger existed
INSERT INTO public.profiles (id, full_name, qr_slug, status)
SELECT
  u.id,
  COALESCE(u.raw_user_meta_data->>'full_name', NULL),
  gen_random_uuid()::TEXT,
  'draft'::profile_status
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
WHERE p.id IS NULL
ON CONFLICT (id) DO NOTHING;

-- Updated_at triggers
DROP TRIGGER IF EXISTS profiles_updated_at ON public.profiles;
CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS shop_items_updated_at ON public.shop_items;
CREATE TRIGGER shop_items_updated_at
  BEFORE UPDATE ON public.shop_items
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE public.profiles        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profile_orders  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.merch_orders    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shop_items      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cart_items      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shop_orders     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rider_reports   ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- PROFILES POLICIES
-- ============================================================
DROP POLICY IF EXISTS "profiles_public_read_active" ON public.profiles;
CREATE POLICY "profiles_public_read_active" ON public.profiles
  FOR SELECT USING (status = 'active');

DROP POLICY IF EXISTS "profiles_owner_read" ON public.profiles;
CREATE POLICY "profiles_owner_read" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_owner_insert" ON public.profiles;
CREATE POLICY "profiles_owner_insert" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_owner_update" ON public.profiles;
CREATE POLICY "profiles_owner_update" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_staff_all" ON public.profiles;
CREATE POLICY "profiles_staff_all" ON public.profiles
  FOR ALL USING (is_staff(auth.uid()));

-- ============================================================
-- USER_ROLES POLICIES
-- ============================================================
DROP POLICY IF EXISTS "user_roles_own_read" ON public.user_roles;
CREATE POLICY "user_roles_own_read" ON public.user_roles
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "user_roles_staff_all" ON public.user_roles;
CREATE POLICY "user_roles_staff_all" ON public.user_roles
  FOR ALL USING (is_staff(auth.uid()));

-- ============================================================
-- PAYMENT METHODS POLICIES
-- ============================================================
DROP POLICY IF EXISTS "payment_methods_public_read" ON public.payment_methods;
CREATE POLICY "payment_methods_public_read" ON public.payment_methods
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = profile_id AND p.status = 'active')
  );

DROP POLICY IF EXISTS "payment_methods_owner_all" ON public.payment_methods;
CREATE POLICY "payment_methods_owner_all" ON public.payment_methods
  FOR ALL USING (auth.uid() = profile_id);

DROP POLICY IF EXISTS "payment_methods_staff_all" ON public.payment_methods;
CREATE POLICY "payment_methods_staff_all" ON public.payment_methods
  FOR ALL USING (is_staff(auth.uid()));

-- ============================================================
-- PROFILE ORDERS POLICIES
-- ============================================================
DROP POLICY IF EXISTS "profile_orders_owner_all" ON public.profile_orders;
CREATE POLICY "profile_orders_owner_all" ON public.profile_orders
  FOR ALL USING (auth.uid() = profile_id);

DROP POLICY IF EXISTS "profile_orders_staff_all" ON public.profile_orders;
CREATE POLICY "profile_orders_staff_all" ON public.profile_orders
  FOR ALL USING (is_staff(auth.uid()));

-- ============================================================
-- MERCH ORDERS POLICIES
-- ============================================================
DROP POLICY IF EXISTS "merch_orders_owner_all" ON public.merch_orders;
CREATE POLICY "merch_orders_owner_all" ON public.merch_orders
  FOR ALL USING (auth.uid() = profile_id);

DROP POLICY IF EXISTS "merch_orders_staff_all" ON public.merch_orders;
CREATE POLICY "merch_orders_staff_all" ON public.merch_orders
  FOR ALL USING (is_staff(auth.uid()));

-- ============================================================
-- SHOP ITEMS POLICIES
-- ============================================================
DROP POLICY IF EXISTS "shop_items_public_read" ON public.shop_items;
CREATE POLICY "shop_items_public_read" ON public.shop_items
  FOR SELECT USING (in_stock = true);

DROP POLICY IF EXISTS "shop_items_staff_all" ON public.shop_items;
CREATE POLICY "shop_items_staff_all" ON public.shop_items
  FOR ALL USING (is_staff(auth.uid()));

-- ============================================================
-- CART ITEMS POLICIES
-- ============================================================
DROP POLICY IF EXISTS "cart_items_owner_all" ON public.cart_items;
CREATE POLICY "cart_items_owner_all" ON public.cart_items
  FOR ALL USING (auth.uid() = user_id);

-- ============================================================
-- SHOP ORDERS POLICIES
-- ============================================================
DROP POLICY IF EXISTS "shop_orders_owner_all" ON public.shop_orders;
CREATE POLICY "shop_orders_owner_all" ON public.shop_orders
  FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "shop_orders_staff_all" ON public.shop_orders;
CREATE POLICY "shop_orders_staff_all" ON public.shop_orders
  FOR ALL USING (is_staff(auth.uid()));

-- ============================================================
-- RIDER REPORTS POLICIES
-- ============================================================
DROP POLICY IF EXISTS "rider_reports_public_insert" ON public.rider_reports;
CREATE POLICY "rider_reports_public_insert" ON public.rider_reports
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "rider_reports_staff_all" ON public.rider_reports;
CREATE POLICY "rider_reports_staff_all" ON public.rider_reports
  FOR ALL USING (is_staff(auth.uid()));

-- ============================================================
-- INDEXES for performance
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_profiles_qr_slug ON public.profiles (qr_slug);
CREATE INDEX IF NOT EXISTS idx_profiles_status ON public.profiles (status);
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles (user_id);
CREATE INDEX IF NOT EXISTS idx_payment_methods_profile_id ON public.payment_methods (profile_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_user_id ON public.cart_items (user_id);
CREATE INDEX IF NOT EXISTS idx_rider_reports_profile_id ON public.rider_reports (rider_profile_id);

-- ============================================================
-- STORAGE SETUP (Avatars)
-- ============================================================
INSERT INTO storage.buckets (id, name, public) 
VALUES ('avatars', 'avatars', true) 
ON CONFLICT (id) DO NOTHING;

-- Storage Policies for 'avatars'
DROP POLICY IF EXISTS "Avatar images are publicly accessible." ON storage.objects;
CREATE POLICY "Avatar images are publicly accessible."
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

DROP POLICY IF EXISTS "Anyone can upload an avatar." ON storage.objects;
CREATE POLICY "Anyone can upload an avatar."
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'avatars');

-- Users can update their own avatars.
DROP POLICY IF EXISTS "Users can update their own avatars." ON storage.objects;
CREATE POLICY "Users can update their own avatars."
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'avatars');

-- ============================================================
-- STORAGE SETUP (Shop Images)
-- ============================================================
INSERT INTO storage.buckets (id, name, public) 
VALUES ('shop_images', 'shop_images', true) 
ON CONFLICT (id) DO NOTHING;

-- Storage Policies for 'shop_images'
DROP POLICY IF EXISTS "Shop images are publicly accessible." ON storage.objects;
CREATE POLICY "Shop images are publicly accessible."
  ON storage.objects FOR SELECT
  USING (bucket_id = 'shop_images');

DROP POLICY IF EXISTS "Staff can upload shop images." ON storage.objects;
CREATE POLICY "Staff can upload shop images."
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'shop_images' AND public.is_staff(auth.uid()));

DROP POLICY IF EXISTS "Staff can update shop images." ON storage.objects;
CREATE POLICY "Staff can update shop images."
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'shop_images' AND public.is_staff(auth.uid()));

DROP POLICY IF EXISTS "Staff can delete shop images." ON storage.objects;
CREATE POLICY "Staff can delete shop images."
  ON storage.objects FOR DELETE
  USING (bucket_id = 'shop_images' AND public.is_staff(auth.uid()));
-- ============================================================
-- ADMIN FUNCTIONS
-- ============================================================

-- Function to securely delete a user account from the client (Admin only)
CREATE OR REPLACE FUNCTION public.admin_delete_user(target_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  is_admin BOOLEAN;
BEGIN
  -- Verify the caller is an admin
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  ) INTO is_admin;

  IF NOT is_admin THEN
    RAISE EXCEPTION 'Unauthorized: Only admins can delete users.';
  END IF;

  -- Clean up storage objects owned by the user to prevent FK constraint violations
  DELETE FROM storage.objects WHERE owner = target_user_id;

  -- Remove references where the user might be a creator/confirmer (if they were an admin)
  UPDATE public.profile_orders SET confirmed_by = NULL WHERE confirmed_by = target_user_id;
  UPDATE public.merch_orders SET confirmed_by = NULL WHERE confirmed_by = target_user_id;
  UPDATE public.shop_items SET created_by = NULL WHERE created_by = target_user_id;

  -- Delete the user from auth.users (cascades to public.profiles)
  DELETE FROM auth.users WHERE id = target_user_id;
  
  RETURN TRUE;
END;
$$;
