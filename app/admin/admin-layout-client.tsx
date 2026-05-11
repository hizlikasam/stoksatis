"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { Building2, LogOut, ShieldAlert } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export function AdminLayoutClient({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const isLogin = pathname === "/admin/login";

    const handleLogout = async () => {
        const supabase = createClient();
        await supabase.auth.signOut();
        window.location.href = "/admin/login";
    };

    if (isLogin) {
        return <main className="min-h-screen bg-slate-50">{children}</main>;
    }

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
            {/* Sidebar */}
            <aside className="w-full md:w-64 bg-white border-r flex flex-col shadow-sm shrink-0">
                <div className="h-16 flex items-center px-6 border-b font-bold text-lg gap-2 text-purple-700">
                    <ShieldAlert className="h-5 w-5" />
                    HızlıKasam Admin
                </div>
                
                <nav className="flex-1 p-4 space-y-2">
                    <Link href="/admin/businesses" className="flex items-center gap-3 px-3 py-2 bg-purple-50 text-purple-700 rounded-md font-medium">
                        <Building2 className="h-5 w-5" />
                        Firmalar
                    </Link>
                </nav>

                <div className="p-4 border-t">
                    <button onClick={handleLogout} className="w-full flex items-center gap-3 px-3 py-2 text-muted-foreground hover:bg-slate-100 hover:text-foreground rounded-md font-medium transition-colors">
                        <LogOut className="h-5 w-5" />
                        Çıkış Yap
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col min-h-screen overflow-hidden">
                <header className="h-16 bg-white border-b flex items-center px-6 shadow-sm sticky top-0 z-10 shrink-0">
                    <h2 className="font-semibold text-lg text-slate-800">SaaS Yönetim Paneli</h2>
                </header>
                <div className="flex-1 overflow-auto p-4 md:p-8">
                    {children}
                </div>
            </main>
        </div>
    );
}
