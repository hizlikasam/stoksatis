import { Sidebar } from "@/components/layout/sidebar";
import { MobileNav } from "@/components/layout/mobile-nav";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const supabase = await createClient();

    // Check if user is platform admin
    const { data: { user } } = await supabase.auth.getUser();
    let isPlatformAdmin = false;

    if (user) {
        const { data: profile } = await supabase
            .from("profiles")
            .select("is_platform_admin")
            .eq("id", user.id)
            .single();

        if (profile?.is_platform_admin) {
            isPlatformAdmin = true;
        }
    }

    return (
        <div className="min-h-screen bg-background">
            {/* Desktop sidebar */}
            <Sidebar isPlatformAdmin={isPlatformAdmin} />

            {/* Main content area */}
            <div className="lg:pl-64 flex flex-col min-h-screen">
                <main className="flex-1 pb-20 lg:pb-0">{children}</main>
            </div>

            {/* Mobile bottom navigation */}
            <MobileNav isPlatformAdmin={isPlatformAdmin} />
        </div>
    );
}
