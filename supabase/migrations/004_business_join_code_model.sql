-- ============================================================================
-- 004_business_join_code_model.sql
-- İşletme katılım kodu modeli (SaaS onboarding)
-- Oluşturulma: 2026-05-10
-- ============================================================================

-- ============================================================================
-- BÖLÜM 1: businesses TABLOSUNA YENİ KOLONLAR
-- ============================================================================

-- İşletme kodu: Platform/admin tarafından atanır (ör: HK-100001)
ALTER TABLE public.businesses
  ADD COLUMN IF NOT EXISTS business_code text UNIQUE;

-- Davet kodu: Kullanıcıların işletmeye katılmak için kullanacağı kod
ALTER TABLE public.businesses
  ADD COLUMN IF NOT EXISTS invite_code text;

-- Abonelik durumu
ALTER TABLE public.businesses
  ADD COLUMN IF NOT EXISTS subscription_status text NOT NULL DEFAULT 'trial';

-- Deneme süresi bitiş tarihi
ALTER TABLE public.businesses
  ADD COLUMN IF NOT EXISTS trial_ends_at timestamptz;

-- Platform admin notları
ALTER TABLE public.businesses
  ADD COLUMN IF NOT EXISTS notes text;

-- ============================================================================
-- BÖLÜM 2: İNDEKSLER
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_businesses_business_code
  ON public.businesses(business_code);

-- ============================================================================
-- BÖLÜM 3: İŞLETMEYE KATILMA RPC FONKSİYONU
-- ============================================================================
-- RLS, üye olmayan kullanıcıların businesses tablosuna erişimini engeller.
-- Bu nedenle katılım işlemi SECURITY DEFINER fonksiyonla yapılmalıdır.
-- Fonksiyon:
--   1. business_code + invite_code eşleşmesi kontrol eder
--   2. Zaten üye ise tekrar eklemez
--   3. Üye değilse 'cashier' rolüyle ekler
--   4. Minimal business bilgisi döndürür (invite_code döndürmez)

CREATE OR REPLACE FUNCTION public.join_business_with_code(
  p_business_code text,
  p_invite_code text
)
RETURNS jsonb AS $$
DECLARE
  v_business_id uuid;
  v_business_name text;
  v_user_id uuid;
  v_existing_membership_id uuid;
BEGIN
  v_user_id := auth.uid();

  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Oturum açmış bir kullanıcı gereklidir.'
    );
  END IF;

  -- Find active business matching both codes
  SELECT id, name INTO v_business_id, v_business_name
  FROM public.businesses
  WHERE business_code = p_business_code
    AND invite_code = p_invite_code
    AND is_active = true;

  IF v_business_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Firma kodu veya davet kodu hatalı.'
    );
  END IF;

  -- Check for existing active membership
  SELECT id INTO v_existing_membership_id
  FROM public.business_users
  WHERE business_id = v_business_id
    AND user_id = v_user_id
    AND is_active = true;

  IF v_existing_membership_id IS NOT NULL THEN
    -- Already a member, return success without duplicating
    RETURN jsonb_build_object(
      'success', true,
      'business_id', v_business_id,
      'business_name', v_business_name,
      'already_member', true
    );
  END IF;

  -- Ensure profile exists
  INSERT INTO public.profiles (id)
  VALUES (v_user_id)
  ON CONFLICT (id) DO NOTHING;

  -- Insert membership with cashier role
  INSERT INTO public.business_users (business_id, user_id, role, is_active)
  VALUES (v_business_id, v_user_id, 'cashier', true);

  RETURN jsonb_build_object(
    'success', true,
    'business_id', v_business_id,
    'business_name', v_business_name,
    'already_member', false
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- BÖLÜM 4: NOTLAR
-- ============================================================================
-- * business_code ve invite_code şimdilik Supabase Dashboard üzerinden
--   manuel girilecektir. İleride admin panelinden yönetilecektir.
-- * join_business_with_code fonksiyonu SECURITY DEFINER olarak tanımlanmıştır
--   çünkü RLS, üye olmayan kullanıcıların businesses tablosunu sorgulamasını engeller.
-- * invite_code hiçbir zaman normal kullanıcı UI'sında gösterilmez.
-- * create_business_for_current_user fonksiyonu veritabanında kalmaya devam eder
--   ancak normal onboarding akışından çağrılmaz.
