"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { LogIn, Eye, EyeOff, Store } from "lucide-react";
import { loginSchema, type LoginFormValues } from "@/lib/validations/auth";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function LoginForm() {
    const router = useRouter();
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<LoginFormValues>({
        resolver: zodResolver(loginSchema),
        defaultValues: {
            businessCode: "",
            email: "",
            password: "",
        },
    });

    async function onSubmit(data: LoginFormValues) {
        setIsLoading(true);
        setError(null);

        const supabase = createClient();

        try {
            // Adım 1: Auth (email + password)
            const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
                email: data.email,
                password: data.password,
            });

            if (authError || !authData.user) {
                setError("E-posta veya şifre hatalı. Lütfen tekrar deneyin.");
                return;
            }

            // Adım 2: Firma kontrolü (Kullanıcının üye olduğu işletme ile business_code eşleşiyor mu)
            const { data: membership, error: membershipError } = await supabase
                .from("business_users")
                .select(
                    `
                    id,
                    role,
                    is_active,
                    business:businesses!inner (
                        id,
                        name,
                        business_code,
                        is_active
                    )
                `
                )
                .eq("is_active", true)
                .eq("businesses.business_code", data.businessCode.trim())
                .eq("businesses.is_active", true)
                .limit(1)
                .maybeSingle();

            if (membershipError || !membership) {
                // Kullanıcı belirttiği işletmenin çalışanı değil
                await supabase.auth.signOut();
                setError(
                    "Bu firma koduna erişim izniniz bulunmuyor. Lütfen firma kodunuzu kontrol edin."
                );
                return;
            }

            // Adım 3: Standart kullanıcı başarıyla girdi -> dashboard
            router.push("/dashboard");
            router.refresh();
        } catch {
            await supabase.auth.signOut();
            setError("Bir hata oluştu. Lütfen tekrar deneyin.");
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <Card className="w-full max-w-md shadow-xl border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader className="text-center space-y-3 pb-2">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-md">
                    <Store className="h-7 w-7" />
                </div>
                <div>
                    <CardTitle className="text-2xl font-bold tracking-tight">
                        Stok & Satış
                    </CardTitle>
                    <CardDescription className="text-muted-foreground mt-1">
                        Mağaza yönetim paneline giriş yapın
                    </CardDescription>
                </div>
            </CardHeader>
            <CardContent className="pt-4">
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                    {error && (
                        <div className="rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive border border-destructive/20">
                            {error}
                        </div>
                    )}

                    {/* Firma Kodu */}
                    <div className="space-y-2">
                        <Label htmlFor="businessCode">Firma Kodu</Label>
                        <Input
                            id="businessCode"
                            type="text"
                            placeholder="Örn: HK-100001"
                            autoComplete="off"
                            autoFocus
                            disabled={isLoading}
                            {...register("businessCode")}
                            className={errors.businessCode ? "border-destructive" : ""}
                        />
                        {errors.businessCode && (
                            <p className="text-sm text-destructive">{errors.businessCode.message}</p>
                        )}
                    </div>

                    {/* E-posta */}
                    <div className="space-y-2">
                        <Label htmlFor="email">E-posta</Label>
                        <Input
                            id="email"
                            type="email"
                            placeholder="ornek@email.com"
                            autoComplete="email"
                            disabled={isLoading}
                            {...register("email")}
                            className={errors.email ? "border-destructive" : ""}
                        />
                        {errors.email && (
                            <p className="text-sm text-destructive">{errors.email.message}</p>
                        )}
                    </div>

                    {/* Şifre */}
                    <div className="space-y-2">
                        <Label htmlFor="password">Şifre</Label>
                        <div className="relative">
                            <Input
                                id="password"
                                type={showPassword ? "text" : "password"}
                                placeholder="••••••"
                                autoComplete="current-password"
                                disabled={isLoading}
                                {...register("password")}
                                className={errors.password ? "border-destructive pr-10" : "pr-10"}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                tabIndex={-1}
                            >
                                {showPassword ? (
                                    <EyeOff className="h-4 w-4" />
                                ) : (
                                    <Eye className="h-4 w-4" />
                                )}
                            </button>
                        </div>
                        {errors.password && (
                            <p className="text-sm text-destructive">
                                {errors.password.message}
                            </p>
                        )}
                    </div>

                    <Button type="submit" className="w-full h-11 text-base" disabled={isLoading}>
                        {isLoading ? (
                            <span className="flex items-center gap-2">
                                <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                                Giriş yapılıyor...
                            </span>
                        ) : (
                            <span className="flex items-center gap-2">
                                <LogIn className="h-4 w-4" />
                                Giriş Yap
                            </span>
                        )}
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
}
