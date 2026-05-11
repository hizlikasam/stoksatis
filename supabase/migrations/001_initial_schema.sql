-- Profil tablosu
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text,
  shop_name text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Kategoriler tablosu
CREATE TABLE public.categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Tedarikçiler tablosu
CREATE TABLE public.suppliers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  phone text,
  email text,
  address text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Ürünler tablosu
CREATE TABLE public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  barcode text UNIQUE,
  internal_code text UNIQUE,
  category_id uuid REFERENCES public.categories(id) ON DELETE SET NULL,
  supplier_id uuid REFERENCES public.suppliers(id) ON DELETE SET NULL,
  cost_price numeric(12,2) NOT NULL DEFAULT 0,
  sale_price numeric(12,2) NOT NULL DEFAULT 0,
  stock_quantity integer NOT NULL DEFAULT 0,
  min_stock_quantity integer NOT NULL DEFAULT 0,
  image_url text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Stok Hareketleri tablosu
CREATE TABLE public.stock_movements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  movement_type text NOT NULL CHECK (movement_type IN ('stock_in', 'stock_out', 'adjustment', 'sale', 'return')),
  quantity integer NOT NULL,
  previous_quantity integer NOT NULL,
  new_quantity integer NOT NULL,
  note text,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

-- Indeksler (Performans optimizasyonu için)
CREATE INDEX idx_products_barcode ON public.products(barcode);
CREATE INDEX idx_products_internal_code ON public.products(internal_code);
CREATE INDEX idx_products_name ON public.products(name);
CREATE INDEX idx_products_is_active ON public.products(is_active);
CREATE INDEX idx_categories_name ON public.categories(name);
CREATE INDEX idx_suppliers_name ON public.suppliers(name);
CREATE INDEX idx_stock_movements_product_id ON public.stock_movements(product_id);
CREATE INDEX idx_stock_movements_created_at ON public.stock_movements(created_at);

-- updated_at Trigger fonksiyonu
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggerların tablolara eklenmesi
CREATE TRIGGER on_profiles_updated
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

CREATE TRIGGER on_categories_updated
  BEFORE UPDATE ON public.categories
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

CREATE TRIGGER on_suppliers_updated
  BEFORE UPDATE ON public.suppliers
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

CREATE TRIGGER on_products_updated
  BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

-- Row Level Security (RLS) Etkinleştirme
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_movements ENABLE ROW LEVEL SECURITY;

-- RLS Politikaları (Authenticated kullanıcılar için)
-- Profiles
CREATE POLICY "Users can view their own profile." 
  ON public.profiles FOR SELECT 
  TO authenticated USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile." 
  ON public.profiles FOR UPDATE 
  TO authenticated USING (auth.uid() = id);

-- Categories
CREATE POLICY "Authenticated users can select categories"
  ON public.categories FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert categories"
  ON public.categories FOR INSERT
  TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update categories"
  ON public.categories FOR UPDATE
  TO authenticated USING (true);

-- Suppliers
CREATE POLICY "Authenticated users can select suppliers"
  ON public.suppliers FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert suppliers"
  ON public.suppliers FOR INSERT
  TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update suppliers"
  ON public.suppliers FOR UPDATE
  TO authenticated USING (true);

-- Products
CREATE POLICY "Authenticated users can select products"
  ON public.products FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert products"
  ON public.products FOR INSERT
  TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update products"
  ON public.products FOR UPDATE
  TO authenticated USING (true);

-- Stock Movements
CREATE POLICY "Authenticated users can select stock_movements"
  ON public.stock_movements FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert stock_movements"
  ON public.stock_movements FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = created_by OR created_by IS NULL);

-- Satışlar tablosu
CREATE TABLE public.sales (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  total_amount numeric(12,2) NOT NULL DEFAULT 0,
  discount_amount numeric(12,2) NOT NULL DEFAULT 0,
  final_amount numeric(12,2) NOT NULL DEFAULT 0,
  payment_method text NOT NULL CHECK (payment_method IN ('cash', 'credit_card', 'other')),
  status text NOT NULL DEFAULT 'completed' CHECK (status IN ('completed', 'cancelled', 'refunded')),
  note text,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Satış Kalemleri (Detayları) tablosu
CREATE TABLE public.sale_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id uuid NOT NULL REFERENCES public.sales(id) ON DELETE CASCADE,
  product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
  quantity integer NOT NULL,
  unit_price numeric(12,2) NOT NULL,
  total_price numeric(12,2) NOT NULL,
  cost_price numeric(12,2) NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Indexler (Performans için)
CREATE INDEX idx_sales_created_at ON public.sales(created_at);
CREATE INDEX idx_sales_created_by ON public.sales(created_by);
CREATE INDEX idx_sale_items_sale_id ON public.sale_items(sale_id);
CREATE INDEX idx_sale_items_product_id ON public.sale_items(product_id);

-- updated_at Trigger (sales için)
CREATE TRIGGER on_sales_updated
  BEFORE UPDATE ON public.sales
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

-- Row Level Security (RLS) Etkinleştirme
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sale_items ENABLE ROW LEVEL SECURITY;

-- RLS Politikaları (Authenticated kullanıcılar için)
CREATE POLICY "Authenticated users can select sales"
  ON public.sales FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert sales"
  ON public.sales FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = created_by OR created_by IS NULL);

CREATE POLICY "Authenticated users can select sale_items"
  ON public.sale_items FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert sale_items"
  ON public.sale_items FOR INSERT
  TO authenticated WITH CHECK (true);
