"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { adminLoginSchema, type AdminLoginValues } from "@/lib/validations/admin-business";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ShieldAlert, LogIn } from "lucide-react";

export default function AdminLoginPage() {
    const router = useRouter();
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const { register, handleSubmit, formState: { errors } } = useForm<AdminLoginValues>({
        resolver: zodResolver(adminLoginSchema),
        defaultValues: { email: "", password: "" },
    });

    async function onSubmit(data: AdminLoginValues) {
        setIsLoading(true);
        setError(null);

        const supabase = createClient();

        try {
            const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
                email: data.email,
                password: data.password,
            });

            if (authError || !authData.user) {
                setError("E-posta veya şifre hatalı.");
                setIsLoading(false);
                return;
            }

            const { data: profile } = await supabase
                .from("profiles")
                .select("is_platform_admin")
                .eq("id", authData.user.id)
                .single();

            if (!profile?.is_platform_admin) {
                await supabase.auth.signOut();
                setError("Bu alana erişim yetkiniz yok.");
                setIsLoading(false);
                return;
            }

            router.push("/admin/businesses");
            router.refresh();
        } catch {
            await supabase.auth.signOut();
            setError("Bir hata oluştu.");
            setIsLoading(false);
        }
    }

    return (
        <div className="flex h-screen w-full items-center justify-center p-4">
            <Card className="w-full max-w-md shadow-2xl border-purple-500/20">
                <CardHeader className="text-center space-y-3 pb-2">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-purple-600 text-white shadow-md">
                        <ShieldAlert className="h-7 w-7" />
                    </div>
                    <CardTitle className="text-2xl font-bold tracking-tight">
                        HızlıKasam Admin
                    </CardTitle>
                    <CardDescription className="text-muted-foreground mt-1">
                        Platform yönetim paneline giriş yapın.
                    </CardDescription>
                </CardHeader>
                <CardContent className="pt-4">
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                        {error && (
                            <div className="rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive border border-destructive/20 font-medium">
                                {error}
                            </div>
                        )}

                        <div className="space-y-2">
                            <Label htmlFor="email">E-posta</Label>
                            <Input
                                id="email"
                                type="email"
                                autoComplete="email"
                                autoFocus
                                disabled={isLoading}
                                {...register("email")}
                                className={errors.email ? "border-destructive focus-visible:ring-destructive" : "focus-visible:ring-purple-600"}
                            />
                            {errors.email && (
                                <p className="text-sm text-destructive">{errors.email.message}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="password">Şifre</Label>
                            <Input
                                id="password"
                                type="password"
                                autoComplete="current-password"
                                disabled={isLoading}
                                {...register("password")}
                                className={errors.password ? "border-destructive focus-visible:ring-destructive" : "focus-visible:ring-purple-600"}
                            />
                            {errors.password && (
                                <p className="text-sm text-destructive">{errors.password.message}</p>
                            )}
                        </div>

                        <Button type="submit" className="w-full h-11 text-base bg-purple-600 hover:bg-purple-700 text-white" disabled={isLoading}>
                            {isLoading ? "Doğrulanıyor..." : (
                                <span className="flex items-center gap-2">
                                    <LogIn className="h-4 w-4" /> Giriş Yap
                                </span>
                            )}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
