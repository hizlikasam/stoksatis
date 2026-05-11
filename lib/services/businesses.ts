"use server";

import { createClient } from "@/lib/supabase/server";
import { Business, BusinessRole } from "@/types/database";

/**
 * Returns all active businesses where the current authenticated user
 * has active membership in business_users.
 * Includes the user's role in each business.
 */
export async function getCurrentUserBusinesses(): Promise<
    (Business & { role: BusinessRole })[]
> {
    const supabase = await createClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return [];
    }

    const { data, error } = await supabase
        .from("business_users")
        .select(
            `
            role,
            business:businesses (
                id,
                name,
                owner_id,
                business_code,
                phone,
                email,
                address,
                tax_number,
                subscription_status,
                trial_ends_at,
                notes,
                is_active,
                created_at,
                updated_at
            )
        `
        )
        .eq("user_id", user.id)
        .eq("is_active", true);

    if (error) {
        console.error("Error fetching user businesses:", error);
        return [];
    }

    if (!data) {
        return [];
    }

    // Flatten the join result
    return data
        .filter((row: any) => row.business && row.business.is_active)
        .map((row: any) => ({
            ...row.business,
            role: row.role as BusinessRole,
        }));
}

/**
 * Returns the current user's first active business.
 * For MVP, we don't support business switching — just pick the first one.
 * Returns null if the user has no business.
 */
export async function getCurrentBusiness(): Promise<
    (Business & { role: BusinessRole }) | null
> {
    const businesses = await getCurrentUserBusinesses();

    if (businesses.length === 0) {
        return null;
    }

    return businesses[0];
}

/**
 * Returns true if the current user has at least one active business membership.
 */
export async function userHasBusiness(): Promise<boolean> {
    const supabase = await createClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return false;
    }

    const { count, error } = await supabase
        .from("business_users")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("is_active", true);

    if (error) {
        console.error("Error checking user business:", error);
        return false;
    }

    return (count ?? 0) > 0;
}

/**
 * Joins a user to an existing business using business_code + invite_code.
 * Uses a SECURITY DEFINER RPC to bypass RLS (user is not yet a member).
 * Returns the joined business info on success, throws on failure.
 */
export async function joinBusinessWithCode(
    businessCode: string,
    inviteCode: string
): Promise<{ businessId: string; businessName: string; alreadyMember: boolean }> {
    const supabase = await createClient();

    const { data, error } = await supabase.rpc("join_business_with_code", {
        p_business_code: businessCode,
        p_invite_code: inviteCode,
    });

    if (error) {
        console.error("Error joining business:", error);
        throw new Error(
            "İşletmeye katılırken bir hata oluştu. Lütfen tekrar deneyin."
        );
    }

    // RPC returns jsonb
    const result = data as {
        success: boolean;
        error?: string;
        business_id?: string;
        business_name?: string;
        already_member?: boolean;
    };

    if (!result.success) {
        throw new Error(
            result.error || "Firma kodu veya davet kodu hatalı."
        );
    }

    return {
        businessId: result.business_id!,
        businessName: result.business_name!,
        alreadyMember: result.already_member || false,
    };
}

/**
 * Returns the current user's role in a specific business.
 * Returns null if no active membership exists.
 */
export async function getCurrentUserBusinessRole(
    businessId: string
): Promise<BusinessRole | null> {
    const supabase = await createClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return null;
    }

    const { data, error } = await supabase
        .from("business_users")
        .select("role")
        .eq("business_id", businessId)
        .eq("user_id", user.id)
        .eq("is_active", true)
        .single();

    if (error) {
        if (error.code === "PGRST116") {
            // No matching row
            return null;
        }
        console.error("Error fetching user business role:", error);
        return null;
    }

    return data.role as BusinessRole;
}
