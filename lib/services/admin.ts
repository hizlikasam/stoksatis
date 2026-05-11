"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { BusinessRole } from "@/types/database";

// ============================================================================
// DAHBOARD STATS
// ============================================================================
export async function getAdminDashboardStats() {
    const supabase = createAdminClient();

    // Total businesses
    const { count: totalBusinesses } = await supabase
        .from("businesses")
        .select("*", { count: "exact", head: true });

    // Active businesses
    const { count: activeBusinesses } = await supabase
        .from("businesses")
        .select("*", { count: "exact", head: true })
        .eq("is_active", true);

    // Total users
    const { count: totalUsers } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true });

    // Recent businesses
    const { data: recentBusinesses } = await supabase
        .from("businesses")
        .select("id, name, business_code, created_at, status:subscription_status")
        .order("created_at", { ascending: false })
        .limit(5);

    return {
        totalBusinesses: totalBusinesses || 0,
        activeBusinesses: activeBusinesses || 0,
        totalUsers: totalUsers || 0,
        recentBusinesses: recentBusinesses || [],
    };
}

// ============================================================================
// BUSINESS LISTING
// ============================================================================
export async function getAllBusinesses() {
    const supabase = createAdminClient();

    const { data, error } = await supabase
        .from("businesses")
        .select("id, name, business_code, created_at, is_active, subscription_status")
        .order("created_at", { ascending: false });

    if (error) {
        console.error("Error fetching businesses for admin:", error);
        throw new Error("Firmalar getirilemedi.");
    }

    return data;
}

// ============================================================================
// GET HIGHEST BUSINESS CODE
// ============================================================================
async function generateNextBusinessCode(): Promise<string> {
    const supabase = createAdminClient();

    const { data, error } = await supabase
        .from("businesses")
        .select("business_code")
        .ilike("business_code", "HK-%")
        .order("business_code", { ascending: false })
        .limit(1);

    if (error || !data || data.length === 0 || !data[0].business_code) {
        return "HK-100001";
    }

    const lastCode = data[0].business_code; // Format: HK-XXXXXX
    try {
        const numberPart = parseInt(lastCode.split("-")[1], 10);
        if (isNaN(numberPart)) return "HK-100001";

        const nextNumber = numberPart + 1;
        return `HK-${nextNumber.toString()}`; // Removed padding since requested format is HK-100001
    } catch {
        return "HK-100001";
    }
}

function generateRandomInviteCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString(); // 6 haneli rastgele kod
}

// ============================================================================
// CREATE BUSINESS
// ============================================================================
export async function createBusinessAsAdmin(formData: {
    name: string;
    business_code?: string;
    invite_code?: string;
    subscription_status: string;
    notes?: string;
}) {
    const supabase = createAdminClient();

    // 1. Generate codes if empty
    const businessCode = formData.business_code?.trim() || (await generateNextBusinessCode());
    const inviteCode = formData.invite_code?.trim() || generateRandomInviteCode();

    // 2. We need a dummy owner_id since owner_id is NOT NULL in schema. 
    // Usually it should be the ID of an admin or a system user until assigned.
    // For now, let's grab the current calling admin's UID.
    const userClient = await import("@/lib/supabase/server").then(m => m.createClient());
    const { data: { user } } = await userClient.auth.getUser();

    if (!user) {
        throw new Error("İşlem için yetkiniz yok.");
    }

    const { data, error } = await supabase
        .from("businesses")
        .insert({
            name: formData.name.trim(),
            business_code: businessCode,
            invite_code: inviteCode,
            subscription_status: formData.subscription_status,
            notes: formData.notes?.trim() || null,
            owner_id: user.id, // Forcing owner_id to current admin. Real SaaS drops NOT NULL or links immediately
            is_active: true,
        })
        .select()
        .single();

    if (error) {
        console.error("Create business error:", error);
        if (error.code === '23505') {
            throw new Error("Bu firma kodu zaten kullanılıyor.");
        }
        throw new Error("Firma oluşturulamadı. Veritabanı hatası.");
    }

    return data;
}

// ============================================================================
// ASSIGN USER TO BUSINESS
// ============================================================================
export async function assignUserToBusiness(
    userId: string,
    businessId: string,
    role: BusinessRole
) {
    const supabase = createAdminClient();

    // 1. Ensure user has a profile record (in case it's missing)
    await supabase.from("profiles").upsert({ id: userId });

    // 2. Check existing active membership
    const { data: existing } = await supabase
        .from("business_users")
        .select("id")
        .eq("user_id", userId)
        .eq("business_id", businessId)
        .eq("is_active", true)
        .single();

    if (existing) {
        throw new Error("Bu kullanıcı zaten bu işletmeye aktif olarak bağlı.");
    }

    // 3. Insert membership
    const { error } = await supabase.from("business_users").insert({
        business_id: businessId,
        user_id: userId,
        role: role,
        is_active: true,
    });

    if (error) {
        console.error("Assign user error:", error);
        throw new Error("Kullanıcı eşleştirilemedi.");
    }

    return true;
}
