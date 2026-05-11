"use server";

import { createClient } from "@/lib/supabase/server";
import { Product, ProductFormValues } from "@/types/database";

export async function getProducts(search?: string): Promise<Product[]> {
    const supabase = await createClient();

    let query = supabase
        .from("products")
        .select(
            `
      *,
      category:categories(id, name),
      supplier:suppliers(id, name)
    `
        )
        .eq("is_active", true)
        .order("created_at", { ascending: false });

    if (search && search.trim() !== "") {
        // Search in name, barcode or internal_code using or syntax safely
        query = query.or(`name.ilike.%${search}%,barcode.ilike.%${search}%,internal_code.ilike.%${search}%`);
    }

    const { data, error } = await query;

    if (error) {
        console.error("Error fetching products:", error);
        throw new Error("Ürünler getirilirken bir hata oluştu.");
    }

    return (data as any) || [];
}

export async function getProductById(id: string): Promise<Product | null> {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from("products")
        .select(
            `
      *,
      category:categories(id, name),
      supplier:suppliers(id, name)
    `
        )
        .eq("id", id)
        .eq("is_active", true)
        .single();

    if (error) {
        if (error.code === "PGRST116") {
            // Not found
            return null;
        }
        console.error("Error fetching product by id:", error);
        throw new Error("Ürün getirilirken bir hata oluştu.");
    }

    return data as any;
}

import { getCurrentBusiness } from "@/lib/services/businesses";

export async function createProduct(data: ProductFormValues): Promise<Product> {
    const supabase = await createClient();
    const currentBusiness = await getCurrentBusiness();

    if (!currentBusiness) {
        throw new Error("Aktif bir firmanız bulunamadı.");
    }

    // Handle empty strings for nullable unique fields
    const payload = {
        ...data,
        business_id: currentBusiness.id,
        barcode: data.barcode || null,
        internal_code: data.internal_code || null,
        category_id: data.category_id || null,
        supplier_id: data.supplier_id || null,
    };

    const { data: newProduct, error } = await supabase
        .from("products")
        .insert(payload)
        .select()
        .single();

    if (error) {
        console.error("Error creating product:", error);
        throw new Error("Ürün kaydedilirken bir hata oluştu. Barkod veya kod çakışması olabilir.");
    }

    return newProduct as any;
}

export async function updateProduct(id: string, data: Partial<ProductFormValues>): Promise<Product> {
    const supabase = await createClient();

    const payload = { ...data };

    if (payload.barcode === "") payload.barcode = undefined;
    if (payload.internal_code === "") payload.internal_code = undefined;

    // We convert empty string to null to avoid unique constraint matching on ''
    const finalPayload = {
        ...payload,
        ...(payload.barcode !== undefined && { barcode: payload.barcode || null }),
        ...(payload.internal_code !== undefined && { internal_code: payload.internal_code || null }),
        ...(payload.category_id !== undefined && { category_id: payload.category_id || null }),
        ...(payload.supplier_id !== undefined && { supplier_id: payload.supplier_id || null }),
    };

    const { data: updatedProduct, error } = await supabase
        .from("products")
        .update(finalPayload)
        .eq("id", id)
        .select()
        .single();

    if (error) {
        console.error("Error updating product:", error);
        throw new Error("Ürün güncellenirken bir hata oluştu. Barkod veya kod çakışması olabilir.");
    }

    return updatedProduct as any;
}

export async function deactivateProduct(id: string): Promise<void> {
    const supabase = await createClient();

    const { error } = await supabase
        .from("products")
        .update({ is_active: false })
        .eq("id", id);

    if (error) {
        console.error("Error deactivating product:", error);
        throw new Error("Ürün silinirken bir hata oluştu.");
    }
}

// Categories and Suppliers simplified fetchers for dropdowns
export async function getCategories() {
    const supabase = await createClient();
    const { data } = await supabase.from("categories").select("*").eq("is_active", true).order("name");
    return data || [];
}

export async function getSuppliers() {
    const supabase = await createClient();
    const { data } = await supabase.from("suppliers").select("*").eq("is_active", true).order("name");
    return data || [];
}
