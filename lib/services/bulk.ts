"use server";

import { createClient } from "@/lib/supabase/server";
import { getCurrentBusiness } from "@/lib/services/businesses";
import { addStockMovement } from "@/lib/services/stock";

export interface BulkExcelRow {
    barcode?: string;
    name: string;
    cost_price: number;
    sale_price: number;
    outlet_price: number;
    quantity: number;
    min_stock_quantity?: number;
}

export type BulkProcessResult = {
    success: boolean;
    message: string;
    successCount: number;
    errorCount: number;
    errors: { row: number; error: string }[];
};

export async function bulkProcessStockExcel(rows: BulkExcelRow[]): Promise<BulkProcessResult> {
    const supabase = await createClient();
    const currentBusiness = await getCurrentBusiness();

    if (!currentBusiness) {
        throw new Error("Aktif firma bulunamadı.");
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Oturum bulunamadı");

    let successCount = 0;
    let errorCount = 0;
    const errors: { row: number; error: string }[] = [];

    // Fetch existing products to match
    const { data: existingProducts, error: fetchErr } = await supabase
        .from("products")
        .select("id, name, barcode, internal_code")
        .eq("business_id", currentBusiness.id)
        .eq("is_active", true);

    if (fetchErr) {
        throw new Error("Mevcut ürünler getirilemedi.");
    }

    // Process rows sequentially to avoid overwhelming the database connection and handle errors per row
    let index = 0;
    for (const row of rows) {
        index++;
        try {
            if (!row.name || isNaN(row.quantity) || row.quantity <= 0) {
                throw new Error("Ürün adı veya miktar geçersiz.");
            }

            let productId: string | null = null;

            // Try to match by barcode first, then exactly by name
            const matchByBarcode = row.barcode ? existingProducts?.find(p => p.barcode === String(row.barcode)) : undefined;
            const matchByName = existingProducts?.find(p => p.name.trim().toLowerCase() === row.name.trim().toLowerCase());

            const matchedProduct = matchByBarcode || matchByName;

            if (matchedProduct) {
                productId = matchedProduct.id;
            } else {
                // Determine if we have a valid barcode, no empty strings allowed due to unique constraints
                const newBarcode = (row.barcode && String(row.barcode).trim()) ? String(row.barcode).trim() : null;
                // Create product with 0 stock, we will add movement next
                const payload = {
                    business_id: currentBusiness.id,
                    name: row.name.trim(),
                    barcode: newBarcode,
                    cost_price: isNaN(row.cost_price) ? 0 : row.cost_price,
                    sale_price: isNaN(row.sale_price) ? 0 : row.sale_price,
                    outlet_price: isNaN(row.outlet_price) ? 0 : row.outlet_price,
                    stock_quantity: 0,
                    min_stock_quantity: isNaN(row.min_stock_quantity!) ? 10 : row.min_stock_quantity,
                    is_active: true
                };

                const { data: newProduct, error: createErr } = await supabase
                    .from("products")
                    .insert(payload)
                    .select("id")
                    .single();

                if (createErr) {
                    throw new Error(`Ürün oluşturulamadı: ${createErr.message}`);
                }
                productId = newProduct.id;
            }

            // Now perform stock movement
            const { error: rpcError } = await supabase.rpc("process_stock_movement", {
                p_business_id: currentBusiness.id,
                p_product_id: productId,
                p_movement_type: "stock_in",
                p_quantity: row.quantity,
                p_note: "Toplu Excel Yükleme",
                p_user_id: user.id
            });

            if (rpcError) {
                throw new Error(`Stok hareketi kaydedilemedi: ${rpcError.message}`);
            }

            successCount++;
        } catch (e: any) {
            errorCount++;
            errors.push({ row: index, error: e.message });
        }
    }

    return {
        success: errorCount === 0 || successCount > 0,
        message: `${successCount} ürün başarıyla işlendi. ${errorCount} hata oluştu.`,
        successCount,
        errorCount,
        errors
    };
}
