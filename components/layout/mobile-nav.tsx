"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    LayoutDashboard,
    Package,
    ShoppingCart,
    ArrowLeftRight,
    BarChart3,
    Store,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navigation = [
    { title: "Ana Sayfa", href: "/dashboard", icon: LayoutDashboard },
    { title: "Ürünler", href: "/products", icon: Package },
    { title: "POS", href: "/pos", icon: ShoppingCart },
    { title: "Stok", href: "/stock", icon: ArrowLeftRight },
    { title: "Raporlar", href: "/reports", icon: BarChart3 },
];

export function MobileNav({ isPlatformAdmin = false }: { isPlatformAdmin?: boolean }) {
    const pathname = usePathname();

    // Limit nav items on mobile if admin to ensure it fits, or just add it. 
    // It's scrollable/flex, let's just create the actual list
    const finalNav = isPlatformAdmin
        ? [...navigation.filter(n => n.href !== "/reports" && n.href !== "/stock"), { title: "Admin", href: "/admin", icon: Store }] // Swap out some to save space
        : navigation;

    return (
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 border-t bg-card/95 backdrop-blur-md supports-[backdrop-filter]:bg-card/80">
            <div className="flex items-center justify-around px-1 py-1.5">
                {finalNav.map((item) => {
                    const isActive =
                        pathname === item.href || pathname.startsWith(item.href + "/");
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-lg text-[10px] font-medium transition-colors min-w-[56px]",
                                isActive
                                    ? (item.href === "/admin" ? "text-purple-600" : "text-primary")
                                    : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            <item.icon
                                className={cn(
                                    "h-5 w-5",
                                    isActive && "stroke-[2.5]"
                                )}
                            />
                            <span>{item.title}</span>
                        </Link>
                    );
                })}
            </div>
            {/* Safe area for iPhone notch */}
            <div className="h-[env(safe-area-inset-bottom)]" />
        </nav>
    );
}
