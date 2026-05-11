import { z } from "zod";

export const productSchema = z.object({
    name: z.string().min(1, "Ürün adı zorunludur").max(255, "Ürün adı çok uzun"),
    brand: z.string().max(100, "Marka çok uzun").optional().or(z.literal("")),
    size: z.string().max(100, "Boyut çok uzun").optional().or(z.literal("")),
    barcode: z.string().max(100, "Barkod çok uzun").optional().or(z.literal("")),
    internal_code: z.string().max(100, "İç kod çok uzun").optional().or(z.literal("")),
    category_id: z.string().uuid("Geçerli bir kategori ID giriniz").optional().nullable().or(z.literal("")),
    supplier_id: z.string().uuid("Geçerli bir tedarikçi ID giriniz").optional().nullable().or(z.literal("")),
    cost_price: z.coerce.number().min(0, "Maliyet 0'dan küçük olamaz"),
    sale_price: z.coerce.number().min(0, "Satış fiyatı 0'dan küçük olamaz"),
    stock_quantity: z.coerce.number().int("Stok tam sayı olmalıdır").min(0, "Stok 0'dan küçük olamaz"),
    min_stock_quantity: z.coerce.number().int("Min stok tam sayı olmalıdır").min(0, "Min stok 0'dan küçük olamaz"),
    image_url: z.string().url("Geçerli bir URL giriniz").optional().or(z.literal("")),
});
