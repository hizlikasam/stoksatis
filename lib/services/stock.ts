"use server";

import { createClient } from "@/lib/supabase/server";

export async function getStockMovements(businessId: string) {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from("stock_movements")
        .select(`
            *,
            product:products(id, name, barcode)
        `)
        .eq("business_id", businessId)
        .order("created_at", { ascending: false });

    if (error) {
        console.error("Stok hareketleri getirilemedi:", error);
        throw new Error("Stok hareketleri getirilirken hata oluştu.");
    }

    return data;
}

export async function addStockMovement(
    businessId: string,
    productId: string,
    movementType: "stock_in" | "stock_out" | "adjustment",
    quantity: number,
    note: string
) {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Oturum bulunamadı");

    const { data, error } = await supabase.rpc("process_stock_movement", {
        p_business_id: businessId,
        p_product_id: productId,
        p_movement_type: movementType,
        p_quantity: quantity,
        p_note: note,
        p_user_id: user.id
    });

    if (error) {
        console.error("Stok işlemi hata:", error);
        throw new Error("Stok işlemi kaydedilemedi: " + error.message);
    }

    return data;
}
