-- ============================================================================
-- 002_multi_tenant_schema.sql
-- Multi-Tenant (Çok Kiracılı) Mimari Migration Dosyası
-- Oluşturulma: 2026-05-10
-- ============================================================================

-- ============================================================================
-- BÖLÜM 1: YENİ TABLOLAR
-- ============================================================================

-- İşletmeler tablosu
CREATE TABLE public.businesses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  phone text,
  email text,
  address text,
  tax_number text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- İşletme-Kullanıcı üyelik tablosu
CREATE TABLE public.business_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'cashier' CHECK (role IN ('owner', 'manager', 'cashier')),
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(business_id, user_id)
);

-- ============================================================================
-- BÖLÜM 2: OPERASYONEL TABLOLARA business_id EKLENMESİ
-- ============================================================================

-- Categories
ALTER TABLE public.categories
  ADD COLUMN business_id uuid REFERENCES public.businesses(id) ON DELETE CASCADE;

-- Suppliers
ALTER TABLE public.suppliers
  ADD COLUMN business_id uuid REFERENCES public.businesses(id) ON DELETE CASCADE;

-- Products
ALTER TABLE public.products
  ADD COLUMN business_id uuid REFERENCES public.businesses(id) ON DELETE CASCADE;

-- Stock Movements
ALTER TABLE public.stock_movements
  ADD COLUMN business_id uuid REFERENCES public.businesses(id) ON DELETE CASCADE;

-- Sales
ALTER TABLE public.sales
  ADD COLUMN business_id uuid REFERENCES public.businesses(id) ON DELETE CASCADE;

-- Sale Items
ALTER TABLE public.sale_items
  ADD COLUMN business_id uuid REFERENCES public.businesses(id) ON DELETE CASCADE;

-- ============================================================================
-- BÖLÜM 3: GLOBAL UNIQUE CONSTRAINT'LERİN KALDIRILMASI VE
--           BUSINESS-SCOPED UNIQUE INDEX'LERİN EKLENMESİ
-- ============================================================================

-- Mevcut global unique constraint'leri kaldır
ALTER TABLE public.products DROP CONSTRAINT IF EXISTS products_barcode_key;
ALTER TABLE public.products DROP CONSTRAINT IF EXISTS products_internal_code_key;

-- Mevcut global unique index'leri kaldır (constraint yerine index olarak oluşturulmuş olabilir)
DROP INDEX IF EXISTS products_barcode_key;
DROP INDEX IF EXISTS products_internal_code_key;

-- Business-scoped unique index'ler oluştur
CREATE UNIQUE INDEX idx_products_business_barcode
  ON public.products(business_id, barcode) WHERE barcode IS NOT NULL;

CREATE UNIQUE INDEX idx_products_business_internal_code
  ON public.products(business_id, internal_code) WHERE internal_code IS NOT NULL;

-- ============================================================================
-- BÖLÜM 4: İNDEKSLER
-- ============================================================================

-- Businesses
CREATE INDEX idx_businesses_owner_id ON public.businesses(owner_id);

-- Business Users
CREATE INDEX idx_business_users_business_id ON public.business_users(business_id);
CREATE INDEX idx_business_users_user_id ON public.business_users(user_id);
CREATE INDEX idx_business_users_role ON public.business_users(role);

-- Operasyonel tablolar – business_id indeksleri
CREATE INDEX idx_categories_business_id ON public.categories(business_id);
CREATE INDEX idx_suppliers_business_id ON public.suppliers(business_id);
CREATE INDEX idx_products_business_id ON public.products(business_id);
CREATE INDEX idx_stock_movements_business_id ON public.stock_movements(business_id);
CREATE INDEX idx_sales_business_id ON public.sales(business_id);
CREATE INDEX idx_sale_items_business_id ON public.sale_items(business_id);

-- ============================================================================
-- BÖLÜM 5: TRIGGER'LAR (updated_at)
-- ============================================================================

CREATE TRIGGER on_businesses_updated
  BEFORE UPDATE ON public.businesses
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

CREATE TRIGGER on_business_users_updated
  BEFORE UPDATE ON public.business_users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

-- profiles ve diğer tablolar zaten 001'de trigger'a sahip.

-- ============================================================================
-- BÖLÜM 6: YARDIMCI FONKSİYONLAR
-- ============================================================================

-- Kullanıcının belirli bir işletmeye aktif üyeliği var mı?
CREATE OR REPLACE FUNCTION public.user_has_business_access(p_business_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.business_users
    WHERE business_id = p_business_id
      AND user_id = auth.uid()
      AND is_active = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Kullanıcının belirli bir işletmede belirli rollerden birine sahip aktif üyeliği var mı?
CREATE OR REPLACE FUNCTION public.user_has_business_role(p_business_id uuid, allowed_roles text[])
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.business_users
    WHERE business_id = p_business_id
      AND user_id = auth.uid()
      AND is_active = true
      AND role = ANY(allowed_roles)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ============================================================================
-- BÖLÜM 7: ONBOARDING YARDIMCI FONKSİYONU
-- Yeni kullanıcı için işletme ve üyelik oluşturur.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.create_business_for_current_user(p_business_name text)
RETURNS uuid AS $$
DECLARE
  v_business_id uuid;
  v_user_id uuid;
BEGIN
  v_user_id := auth.uid();

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Oturum açmış bir kullanıcı gereklidir.';
  END IF;

  -- İşletme oluştur
  INSERT INTO public.businesses (name, owner_id)
  VALUES (p_business_name, v_user_id)
  RETURNING id INTO v_business_id;

  -- İşletme-Kullanıcı üyeliği oluştur (owner rolüyle)
  INSERT INTO public.business_users (business_id, user_id, role)
  VALUES (v_business_id, v_user_id, 'owner');

  -- Profile tablosunda kayıt yoksa oluştur
  INSERT INTO public.profiles (id)
  VALUES (v_user_id)
  ON CONFLICT (id) DO NOTHING;

  RETURN v_business_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- BÖLÜM 8: RLS ETKİNLEŞTİRME (Yeni tablolar için)
-- ============================================================================

ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_users ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- BÖLÜM 9: ESKİ GÜVENSİZ RLS POLİTİKALARININ KALDIRILMASI
-- ============================================================================

-- Categories
DROP POLICY IF EXISTS "Authenticated users can select categories" ON public.categories;
DROP POLICY IF EXISTS "Authenticated users can insert categories" ON public.categories;
DROP POLICY IF EXISTS "Authenticated users can update categories" ON public.categories;

-- Suppliers
DROP POLICY IF EXISTS "Authenticated users can select suppliers" ON public.suppliers;
DROP POLICY IF EXISTS "Authenticated users can insert suppliers" ON public.suppliers;
DROP POLICY IF EXISTS "Authenticated users can update suppliers" ON public.suppliers;

-- Products
DROP POLICY IF EXISTS "Authenticated users can select products" ON public.products;
DROP POLICY IF EXISTS "Authenticated users can insert products" ON public.products;
DROP POLICY IF EXISTS "Authenticated users can update products" ON public.products;

-- Stock Movements
DROP POLICY IF EXISTS "Authenticated users can select stock_movements" ON public.stock_movements;
DROP POLICY IF EXISTS "Authenticated users can insert stock_movements" ON public.stock_movements;

-- Sales
DROP POLICY IF EXISTS "Authenticated users can select sales" ON public.sales;
DROP POLICY IF EXISTS "Authenticated users can insert sales" ON public.sales;

-- Sale Items
DROP POLICY IF EXISTS "Authenticated users can select sale_items" ON public.sale_items;
DROP POLICY IF EXISTS "Authenticated users can insert sale_items" ON public.sale_items;

-- ============================================================================
-- BÖLÜM 10: YENİ GÜVENLİ RLS POLİTİKALARI
-- ============================================================================

-- --------------------------------------------------------------------------
-- businesses
-- --------------------------------------------------------------------------
CREATE POLICY "business_select_member"
  ON public.businesses FOR SELECT
  TO authenticated
  USING (public.user_has_business_access(id));

CREATE POLICY "business_insert_owner"
  ON public.businesses FOR INSERT
  TO authenticated
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "business_update_owner_manager"
  ON public.businesses FOR UPDATE
  TO authenticated
  USING (public.user_has_business_role(id, ARRAY['owner', 'manager']));

-- --------------------------------------------------------------------------
-- business_users
-- --------------------------------------------------------------------------
CREATE POLICY "business_users_select_member"
  ON public.business_users FOR SELECT
  TO authenticated
  USING (public.user_has_business_access(business_id));

CREATE POLICY "business_users_insert_owner_manager"
  ON public.business_users FOR INSERT
  TO authenticated
  WITH CHECK (public.user_has_business_role(business_id, ARRAY['owner', 'manager']));

CREATE POLICY "business_users_update_owner_manager"
  ON public.business_users FOR UPDATE
  TO authenticated
  USING (public.user_has_business_role(business_id, ARRAY['owner', 'manager']));

-- --------------------------------------------------------------------------
-- profiles (mevcut politikalar zaten auth.uid() = id ile güvenli, dokunmuyoruz)
-- --------------------------------------------------------------------------

-- --------------------------------------------------------------------------
-- categories
-- --------------------------------------------------------------------------
CREATE POLICY "categories_select_member"
  ON public.categories FOR SELECT
  TO authenticated
  USING (public.user_has_business_access(business_id));

CREATE POLICY "categories_insert_member"
  ON public.categories FOR INSERT
  TO authenticated
  WITH CHECK (public.user_has_business_access(business_id));

CREATE POLICY "categories_update_member"
  ON public.categories FOR UPDATE
  TO authenticated
  USING (public.user_has_business_access(business_id));

-- --------------------------------------------------------------------------
-- suppliers
-- --------------------------------------------------------------------------
CREATE POLICY "suppliers_select_member"
  ON public.suppliers FOR SELECT
  TO authenticated
  USING (public.user_has_business_access(business_id));

CREATE POLICY "suppliers_insert_member"
  ON public.suppliers FOR INSERT
  TO authenticated
  WITH CHECK (public.user_has_business_access(business_id));

CREATE POLICY "suppliers_update_member"
  ON public.suppliers FOR UPDATE
  TO authenticated
  USING (public.user_has_business_access(business_id));

-- --------------------------------------------------------------------------
-- products
-- --------------------------------------------------------------------------
CREATE POLICY "products_select_member"
  ON public.products FOR SELECT
  TO authenticated
  USING (public.user_has_business_access(business_id));

CREATE POLICY "products_insert_member"
  ON public.products FOR INSERT
  TO authenticated
  WITH CHECK (public.user_has_business_access(business_id));

CREATE POLICY "products_update_member"
  ON public.products FOR UPDATE
  TO authenticated
  USING (public.user_has_business_access(business_id));

-- --------------------------------------------------------------------------
-- stock_movements
-- --------------------------------------------------------------------------
CREATE POLICY "stock_movements_select_member"
  ON public.stock_movements FOR SELECT
  TO authenticated
  USING (public.user_has_business_access(business_id));

CREATE POLICY "stock_movements_insert_member"
  ON public.stock_movements FOR INSERT
  TO authenticated
  WITH CHECK (public.user_has_business_access(business_id));

-- --------------------------------------------------------------------------
-- sales
-- --------------------------------------------------------------------------
CREATE POLICY "sales_select_member"
  ON public.sales FOR SELECT
  TO authenticated
  USING (public.user_has_business_access(business_id));

CREATE POLICY "sales_insert_member"
  ON public.sales FOR INSERT
  TO authenticated
  WITH CHECK (public.user_has_business_access(business_id));

CREATE POLICY "sales_update_member"
  ON public.sales FOR UPDATE
  TO authenticated
  USING (public.user_has_business_access(business_id));

-- --------------------------------------------------------------------------
-- sale_items
-- --------------------------------------------------------------------------
CREATE POLICY "sale_items_select_member"
  ON public.sale_items FOR SELECT
  TO authenticated
  USING (public.user_has_business_access(business_id));

CREATE POLICY "sale_items_insert_member"
  ON public.sale_items FOR INSERT
  TO authenticated
  WITH CHECK (public.user_has_business_access(business_id));

-- ============================================================================
-- BÖLÜM 11: create_business_for_current_user FONKSİYONU İÇİN
--            RLS BYPASS (SECURITY DEFINER zaten tanımlı)
--            Onboarding sırasında business_users INSERT RLS'ini bypass eder.
-- ============================================================================
-- Yukarıdaki fonksiyon SECURITY DEFINER olarak tanımlandığı için
-- RLS kurallarını atlayarak INSERT yapabilir. Ek bir politikaya gerek yok.

-- ============================================================================
-- BÖLÜM 12: NOTLAR
-- ============================================================================
-- * Mevcut profiles tablosundaki shop_name kolonu korundu (geriye dönük uyumluluk).
--   Gelecekte kaldırılabilir.
-- * sale_items tablosuna da business_id eklendi (raporlama ve filtreleme kolaylığı).
-- * DELETE politikaları bilinçli olarak eklenmedi. Soft-delete (is_active=false)
--   yaklaşımı kullanılması önerilir.
-- * Tüm RLS politikaları user_has_business_access() helper fonksiyonunu kullanır.
--   Bu fonksiyon SECURITY DEFINER olarak tanımlanmış olup RLS döngüsünü önler.
