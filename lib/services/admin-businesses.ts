"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { CreateBusinessValues, UpdateBusinessValues } from "@/lib/validations/admin-business";

// -------------------------------------------------------------------
// Helpers
// -------------------------------------------------------------------

async function getSupabaseWithUser() {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Oturum bulunamadı.");
    return { supabase, user };
}

async function generateNextBusinessCode(
    supabase: Awaited<ReturnType<typeof createClient>>
): Promise<string> {
    const { data } = await supabase
        .from("businesses")
        .select("business_code")
        .ilike("business_code", "HK-%")
        .order("business_code", { ascending: false })
        .limit(1);

    if (!data || data.length === 0 || !data[0].business_code) {
        return "HK-100001";
    }

    const numPart = parseInt(data[0].business_code.split("-")[1], 10);
    if (isNaN(numPart)) return "HK-100001";
    return `HK-${numPart + 1}`;
}

function generateRandomInviteCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

// -------------------------------------------------------------------
// 1. getBusinesses
// -------------------------------------------------------------------
export async function getBusinesses(search?: string) {
    const { supabase } = await getSupabaseWithUser();

    let query = supabase
        .from("businesses")
        .select(
            "id, name, business_code, invite_code, email, phone, is_active, created_at"
        )
        .order("created_at", { ascending: false });

    if (search && search.trim()) {
        const s = search.trim();
        query = query.or(
            `name.ilike.%${s}%,business_code.ilike.%${s}%,email.ilike.%${s}%,phone.ilike.%${s}%`
        );
    }

    const { data, error } = await query;
    if (error) throw new Error("Firmalar getirilemedi: " + error.message);
    return data ?? [];
}

// -------------------------------------------------------------------
// 2. getBusinessById
// -------------------------------------------------------------------
export async function getBusinessById(id: string) {
    const { supabase } = await getSupabaseWithUser();

    const { data, error } = await supabase
        .from("businesses")
        .select("*")
        .eq("id", id)
        .single();

    if (error || !data) throw new Error("Firma bulunamadı.");
    return data;
}

// -------------------------------------------------------------------
// 3. createBusiness
// -------------------------------------------------------------------
export async function createBusiness(formData: CreateBusinessValues) {
    const { supabase, user } = await getSupabaseWithUser();

    const businessCode =
        formData.business_code?.trim() ||
        (await generateNextBusinessCode(supabase));
    const inviteCode =
        formData.invite_code?.trim() || generateRandomInviteCode();

    const { data, error } = await supabase
        .from("businesses")
        .insert({
            name: formData.name.trim(),
            business_code: businessCode,
            invite_code: inviteCode,
            phone: formData.phone || null,
            email: formData.email || null,
            address: formData.address || null,
            tax_number: formData.tax_number || null,
            subscription_status: "trial",
            notes: formData.notes || null,
            owner_id: user.id,
            is_active: formData.is_active,
        })
        .select()
        .single();

    if (error) {
        if (error.code === "23505")
            throw new Error("Bu firma kodu zaten kullanılıyor.");
        throw new Error("Firma oluşturulamadı: " + error.message);
    }
    return data;
}

// -------------------------------------------------------------------
// 4. updateBusiness
// -------------------------------------------------------------------
export async function updateBusiness(
    id: string,
    formData: UpdateBusinessValues
) {
    const { supabase } = await getSupabaseWithUser();

    const { data, error } = await supabase
        .from("businesses")
        .update({
            name: formData.name.trim(),
            phone: formData.phone || null,
            email: formData.email || null,
            address: formData.address || null,
            tax_number: formData.tax_number || null,
            notes: formData.notes || null,
            is_active: formData.is_active,
        })
        .eq("id", id)
        .select()
        .single();

    if (error) throw new Error("Firma güncellenemedi: " + error.message);
    return data;
}

// -------------------------------------------------------------------
// 5. setBusinessActive
// -------------------------------------------------------------------
export async function setBusinessActive(id: string, isActive: boolean) {
    const { supabase } = await getSupabaseWithUser();

    const { error } = await supabase
        .from("businesses")
        .update({ is_active: isActive })
        .eq("id", id);

    if (error) throw new Error("Firma durumu güncellenemedi.");
    return true;
}

// -------------------------------------------------------------------
// 6. regenerateInviteCode
// -------------------------------------------------------------------
export async function regenerateInviteCode(id: string) {
    const { supabase } = await getSupabaseWithUser();

    const newCode = generateRandomInviteCode();

    const { error } = await supabase
        .from("businesses")
        .update({ invite_code: newCode })
        .eq("id", id);

    if (error)
        throw new Error("Davet kodu yenilenirken hata oluştu.");
    return newCode;
}

// -------------------------------------------------------------------
// 7. getBusinessUsers
// -------------------------------------------------------------------
export async function getBusinessUsers(businessId: string) {
    const { supabase } = await getSupabaseWithUser(); // Yetki kontrolü için
    const adminSupabase = createAdminClient(); // İsimleri okumak için (RLS bypass)

    // İlk önce basit sorgu ile business_users çekelim
    const { data, error } = await supabase
        .from("business_users")
        .select("id, user_id, role, is_active, created_at")
        .eq("business_id", businessId)
        .order("created_at", { ascending: false });

    if (error) throw new Error("Kullanıcılar getirilemedi: " + error.message);

    // Sonra her kullanıcının profilindeki full_name'i alalım
    const results = [];
    for (const bu of data ?? []) {
        let fullName: string | null = null;
        try {
            // RLS bypass client ile profili okuyoruz
            const { data: profile } = await adminSupabase
                .from("profiles")
                .select("full_name")
                .eq("id", bu.user_id)
                .single();
            fullName = profile?.full_name ?? null;
        } catch {
            // profil bulunamazsa null kalır
        }
        results.push({
            id: bu.id,
            user_id: bu.user_id,
            full_name: fullName,
            role: bu.role,
            is_active: bu.is_active,
            created_at: bu.created_at,
        });
    }

    return results;
}

// -------------------------------------------------------------------
// 8. updateBusinessUserRole
// -------------------------------------------------------------------
export async function updateBusinessUserRole(
    businessUserId: string,
    role: "owner" | "manager" | "cashier"
) {
    const { supabase } = await getSupabaseWithUser();

    const { error } = await supabase
        .from("business_users")
        .update({ role })
        .eq("id", businessUserId);

    if (error) throw new Error("Rol güncellenemedi.");
    return true;
}

// -------------------------------------------------------------------
// 9. setBusinessUserActive
// -------------------------------------------------------------------
export async function setBusinessUserActive(
    businessUserId: string,
    isActive: boolean
) {
    const { supabase } = await getSupabaseWithUser();

    const { error } = await supabase
        .from("business_users")
        .update({ is_active: isActive })
        .eq("id", businessUserId);

    if (error) throw new Error("Kullanıcı durumu güncellenemedi.");
    return true;
}

// -------------------------------------------------------------------
// 10. createBusinessUserDirectly
// -------------------------------------------------------------------
export async function createBusinessUserDirectly(
    businessId: string,
    fullName: string,
    email: string,
    password: string,
    role: "owner" | "manager" | "cashier"
) {
    // 1. Önce bu işlemi çağıran kişinin yetkili olduğundan emin olalım (Platform Admin olmalı)
    const { supabase, user } = await getSupabaseWithUser();
    const { data: adminProfile } = await supabase
        .from("profiles")
        .select("is_platform_admin")
        .eq("id", user.id)
        .single();

    if (!adminProfile?.is_platform_admin) {
        throw new Error("Yetkisiz işlem: Sadece platform yöneticileri doğrudan kullanıcı oluşturabilir.");
    }

    // 2. Admin client - RLS bypass
    const adminSupabase = createAdminClient();

    // 3. Supabase Auth'ta kullanıcı oluştur
    const { data: authData, error: authError } = await adminSupabase.auth.admin.createUser({
        email: email.trim(),
        password: password,
        email_confirm: true, // Direkt onaylı şekilde aç ki şifresiyle login olabilsin
        user_metadata: {
            full_name: fullName.trim(),
        },
    });

    if (authError) {
        if (authError.message.includes("already registered")) {
            throw new Error("Bu e-posta adresi ile zaten bir kayıt mevcut.");
        }
        throw new Error("Kullanıcı oluşturulamadı: " + authError.message);
    }

    const newUserId = authData.user.id;

    // 4. `profiles` tablosuna manuel kayıt ekle (001 numaralı migration'da trigger varsa bile auth id eklemekte fayda var ama biz direkt insert edelim. Eğer conflicts olursa hata vermez sadece ignore ederiz ya da update ederiz)
    const { error: profileError } = await adminSupabase
        .from("profiles")
        .upsert({
            id: newUserId,
            full_name: fullName.trim(),
        });

    if (profileError) {
        console.error("Profil oluşturma hatası:", profileError);
        // Profili ignore edebiliriz ama hatayı dondurmayalım, main point auth.
    }

    // 5. Firma-kullanıcı ilişkisini (business_users) ekle
    const { error: businessUserError } = await adminSupabase
        .from("business_users")
        .insert({
            business_id: businessId,
            user_id: newUserId,
            role: role,
            is_active: true,
        });

    if (businessUserError) {
        throw new Error("Kullanıcı oluşturuldu ancak firmaya eklenemedi: " + businessUserError.message);
    }

    return true;
}

