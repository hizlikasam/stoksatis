"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    LayoutDashboard,
    Package,
    ShoppingCart,
    ArrowLeftRight,
    BarChart3,
    Settings,
    Store,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navigation = [
    { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { title: "Ürünler", href: "/products", icon: Package },
    { title: "Satış (POS)", href: "/pos", icon: ShoppingCart },
    { title: "Stok Hareketleri", href: "/stock", icon: ArrowLeftRight },
    { title: "Satış Takibi", href: "/reports", icon: BarChart3 },
    { title: "Ayarlar", href: "/settings", icon: Settings },
];

export function Sidebar({ isPlatformAdmin = false }: { isPlatformAdmin?: boolean }) {
    const pathname = usePathname();

    return (
        <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 border-r bg-card">
            {/* Logo */}
            <div className="flex h-16 items-center gap-2.5 px-6 border-b">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                    <Store className="h-5 w-5" />
                </div>
                <div className="flex flex-col">
                    <span className="text-sm font-bold leading-tight">Stok & Satış</span>
                    <span className="text-[11px] text-muted-foreground leading-tight">
                        Züccaciye Yönetim
                    </span>
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
                {navigation.map((item) => {
                    const isActive =
                        pathname === item.href || pathname.startsWith(item.href + "/");
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                                isActive
                                    ? "bg-primary text-primary-foreground shadow-sm"
                                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                            )}
                        >
                            <item.icon className="h-4.5 w-4.5 shrink-0" />
                            {item.title}
                        </Link>
                    );
                })}

                {/* Admin Link */}
                {isPlatformAdmin && (
                    <>
                        <div className="my-2 border-t border-border" />
                        <Link
                            href="/admin"
                            className={cn(
                                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 text-purple-600 dark:text-purple-400 font-semibold",
                                pathname.startsWith("/admin")
                                    ? "bg-purple-100 dark:bg-purple-900/30"
                                    : "hover:bg-purple-50 dark:hover:bg-purple-900/10"
                            )}
                        >
                            <Store className="h-4.5 w-4.5 shrink-0" />
                            SaaS Admin
                        </Link>
                    </>
                )}
            </nav>

            {/* Footer */}
            <div className="border-t px-4 py-3">
                <p className="text-[11px] text-muted-foreground text-center">
                    v0.1.0 — Züccaciye
                </p>
            </div>
        </aside>
    );
}
