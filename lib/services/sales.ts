"use server";

import { createClient } from "@/lib/supabase/server";
import { getCurrentBusiness } from "@/lib/services/businesses";

export interface SaleItemData {
    product_id: string;
    quantity: number;
    unit_price: number;
    total_price: number;
    cost_price: number;
}

export async function createSale(
    businessId: string,
    totalAmount: number,
    discountAmount: number,
    finalAmount: number,
    paymentMethod: "cash" | "credit_card" | "other",
    note: string,
    items: SaleItemData[]
) {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Oturum bulunamadı");

    const { data, error } = await supabase.rpc("process_sale", {
        p_business_id: businessId,
        p_user_id: user.id,
        p_total_amount: totalAmount,
        p_discount_amount: discountAmount,
        p_final_amount: finalAmount,
        p_payment_method: paymentMethod,
        p_note: note,
        p_items: items
    });

    if (error) {
        console.error("Satış hatası:", error);
        throw new Error("Satış tamamlanamadı: " + error.message);
    }

    return data;
}

export async function getSales(businessId: string) {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from("sales")
        .select("*")
        .eq("business_id", businessId)
        .order("created_at", { ascending: false });

    if (error) throw new Error("Satışlar getirilemedi.");
    return data;
}

export async function getSalesDetailed() {
    const supabase = await createClient();
    const currentBusiness = await getCurrentBusiness();
    if (!currentBusiness) throw new Error("Aktif bir işletme bulunamadı");
    const businessId = currentBusiness.id;

    // 1. Get sales
    const { data: sales, error: salesError } = await supabase
        .from("sales")
        .select("*")
        .eq("business_id", businessId)
        .order("created_at", { ascending: false });

    if (salesError) throw new Error("Satışlar getirilemedi.");

    // 2. Get user ids from business
    const { data: bUsers } = await supabase
        .from("business_users")
        .select("user_id")
        .eq("business_id", businessId);

    let profilesMap: Record<string, string> = {};
    if (bUsers && bUsers.length > 0) {
        const userIds = bUsers.map((u: any) => u.user_id);
        const { data: profiles } = await supabase
            .from("profiles")
            .select("id, full_name")
            .in("id", userIds);

        if (profiles) {
            profiles.forEach((p: any) => {
                profilesMap[p.id] = p.full_name || "Bilinmeyen Kullanıcı";
            });
        }
    }

    // 3. Map sales with seller name
    const detailedSales = (sales || []).map((sale: any) => ({
        ...sale,
        seller_name: profilesMap[sale.created_by] || "Bilinmeyen"
    }));

    return detailedSales;
}
