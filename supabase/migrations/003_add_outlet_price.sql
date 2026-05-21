-- Add outlet price as the actual selling price, keeping sale_price as the list/label price
ALTER TABLE products 
ADD COLUMN outlet_price numeric(12,2) NOT NULL DEFAULT 0;

-- Optional: If you want all current sale_price to be copied to outlet_price initially so POS continues working unchanged:
-- UPDATE products SET outlet_price = sale_price;
