-- ============================================================================
-- 003_platform_admin_and_business_onboarding.sql
-- Platform Admin Foundation + Onboarding helpers
-- Oluşturulma: 2026-05-10
-- ============================================================================

-- Platform Admin alanı: SaaS/platform yöneticileri için (gelecekte kullanılacak).
-- business_users.role ile karıştırılmamalıdır; bu alan sadece platform seviyesindedir.
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_platform_admin boolean NOT NULL DEFAULT false;

-- ============================================================================
-- NOTLAR
-- ============================================================================
-- * is_platform_admin alanı normal kullanıcı UI'sında gösterilmeyecektir.
-- * /admin rotaları henüz oluşturulmayacaktır.
-- * Normal business RLS davranışı bu alandan etkilenmez.
-- * Bu alan yalnızca gelecekteki platform admin paneli için bir temeldir.
