import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
    let supabaseResponse = NextResponse.next({
        request,
    });

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll();
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value }) =>
                        request.cookies.set(name, value)
                    );
                    supabaseResponse = NextResponse.next({
                        request,
                    });
                    cookiesToSet.forEach(({ name, value, options }) =>
                        supabaseResponse.cookies.set(name, value, options)
                    );
                },
            },
        }
    );

    const {
        data: { user },
    } = await supabase.auth.getUser();

    const isLoginPage = request.nextUrl.pathname === "/login";
    const isAdminArea = request.nextUrl.pathname.startsWith("/admin");
    const isAdminLogin = request.nextUrl.pathname === "/admin/login";

    // 1. Giriş yapmamış kişi korunan rotaya gitmeye çalışıyorsa
    if (!user) {
        if (!isLoginPage && !isAdminArea) {
            // Normal korunan sayfalar -> /login
            const url = request.nextUrl.clone();
            url.pathname = "/login";
            return NextResponse.redirect(url);
        }
        if (isAdminArea && !isAdminLogin) {
            // Admin korunan sayfalar -> /admin/login
            const url = request.nextUrl.clone();
            url.pathname = "/admin/login";
            return NextResponse.redirect(url);
        }
    }

    // 2. Giriş yapmış birisi login sayfalarına gidiyorsa
    if (user) {
        if (isLoginPage) {
            const url = request.nextUrl.clone();
            url.pathname = "/dashboard";
            return NextResponse.redirect(url);
        }
        if (isAdminLogin) {
            const url = request.nextUrl.clone();
            url.pathname = "/admin";
            return NextResponse.redirect(url);
        }
    }

    // 3. Admin Route Yetki Koruması (Safety Check)
    if (user && isAdminArea && !isAdminLogin) {
        const { data: profile } = await supabase
            .from("profiles")
            .select("is_platform_admin")
            .eq("id", user.id)
            .single();

        if (!profile?.is_platform_admin) {
            const url = request.nextUrl.clone();
            url.pathname = "/dashboard";
            return NextResponse.redirect(url);
        }
    }

    return supabaseResponse;
}
