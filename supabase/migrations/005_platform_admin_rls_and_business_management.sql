-- Create a secure helper function to check if the current user is a platform admin
CREATE OR REPLACE FUNCTION public.is_platform_admin()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = auth.uid()
      AND is_platform_admin = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- 1. Businesses Table Policies for Platform Admins

-- Select all businesses
CREATE POLICY "Platform admins can select all businesses"
ON public.businesses FOR SELECT
USING (public.is_platform_admin());

-- Insert any business
CREATE POLICY "Platform admins can insert businesses"
ON public.businesses FOR INSERT
WITH CHECK (public.is_platform_admin());

-- Update any business
CREATE POLICY "Platform admins can update businesses"
ON public.businesses FOR UPDATE
USING (public.is_platform_admin());

-- 2. Business Users Table Policies for Platform Admins

-- Select all business users
CREATE POLICY "Platform admins can select all business_users"
ON public.business_users FOR SELECT
USING (public.is_platform_admin());

-- Insert business users (assign members)
CREATE POLICY "Platform admins can insert business_users"
ON public.business_users FOR INSERT
WITH CHECK (public.is_platform_admin());

-- Update business users (change role, activate/deactivate)
CREATE POLICY "Platform admins can update business_users"
ON public.business_users FOR UPDATE
USING (public.is_platform_admin());

-- Note: We intentionally avoid adding DELETE policies. We use is_active flag.
