"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function getCurrentAdminUser() {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) return null;
    return user;
}

export async function isCurrentUserPlatformAdmin() {
    const user = await getCurrentAdminUser();
    if (!user) return false;

    const supabase = await createClient();
    const { data } = await supabase
        .from("profiles")
        .select("is_platform_admin")
        .eq("id", user.id)
        .single();

    return !!data?.is_platform_admin;
}

export async function requirePlatformAdmin() {
    const user = await getCurrentAdminUser();

    if (!user) {
        redirect("/admin/login");
    }

    const isAdmin = await isCurrentUserPlatformAdmin();

    if (!isAdmin) {
        // Eğer giriş var ama admin değilse yetkisizdir
        redirect("/dashboard");
    }

    return user;
}
