"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut, Settings, User, Store } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface HeaderProps {
    title?: string;
    businessName?: string;
}

export function Header({ title, businessName }: HeaderProps) {
    const router = useRouter();
    const [currentBusinessName, setCurrentBusinessName] = useState<
        string | null
    >(businessName || null);

    // If businessName is not passed as prop, fetch from client-side
    useEffect(() => {
        if (businessName) {
            setCurrentBusinessName(businessName);
            return;
        }

        async function fetchBusiness() {
            try {
                const supabase = createClient();

                const {
                    data: { user },
                } = await supabase.auth.getUser();

                if (!user) return;

                const { data } = await supabase
                    .from("business_users")
                    .select(
                        `
                        business:businesses (
                            name
                        )
                    `
                    )
                    .eq("user_id", user.id)
                    .eq("is_active", true)
                    .limit(1)
                    .single();

                if (data?.business) {
                    setCurrentBusinessName(
                        (data.business as any).name || null
                    );
                }
            } catch {
                // Silently fail — fallback text will show
            }
        }

        fetchBusiness();
    }, [businessName]);

    async function handleSignOut() {
        const supabase = createClient();
        await supabase.auth.signOut();
        router.push("/login");
        router.refresh();
    }

    return (
        <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b bg-card/95 backdrop-blur-md supports-[backdrop-filter]:bg-card/80 px-4 sm:px-6">
            {/* Page title + Business name */}
            <div className="flex items-center gap-3">
                <h1 className="text-lg font-semibold tracking-tight">
                    {title || "Dashboard"}
                </h1>
                {currentBusinessName && (
                    <>
                        <span className="hidden sm:block text-muted-foreground">
                            •
                        </span>
                        <span className="hidden sm:flex items-center gap-1.5 text-sm text-muted-foreground">
                            <Store className="h-3.5 w-3.5" />
                            {currentBusinessName}
                        </span>
                    </>
                )}
            </div>

            {/* User menu */}
            <DropdownMenu>
                <DropdownMenuTrigger className="relative flex h-9 w-9 items-center justify-center rounded-full hover:bg-accent transition-colors cursor-pointer">
                    <Avatar className="h-9 w-9">
                        <AvatarFallback className="bg-primary/10 text-primary text-sm font-medium">
                            <User className="h-4 w-4" />
                        </AvatarFallback>
                    </Avatar>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                    {/* Show business name in mobile dropdown too */}
                    {currentBusinessName && (
                        <>
                            <div className="px-2 py-1.5 sm:hidden">
                                <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                                    <Store className="h-3 w-3" />
                                    {currentBusinessName}
                                </p>
                            </div>
                            <DropdownMenuSeparator className="sm:hidden" />
                        </>
                    )}
                    <DropdownMenuItem
                        onClick={() => router.push("/settings")}
                        className="cursor-pointer"
                    >
                        <Settings className="mr-2 h-4 w-4" />
                        Ayarlar
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                        onClick={handleSignOut}
                        className="cursor-pointer text-destructive focus:text-destructive"
                    >
                        <LogOut className="mr-2 h-4 w-4" />
                        Çıkış Yap
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </header>
    );
}
