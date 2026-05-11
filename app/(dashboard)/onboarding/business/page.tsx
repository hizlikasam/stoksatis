"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Store, KeyRound } from "lucide-react";

export default function BusinessOnboardingPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        const formData = new FormData(e.currentTarget);
        const businessCode = formData.get("business_code") as string;
        const inviteCode = formData.get("invite_code") as string;

        const supabase = createClient();
        try {
            const { data, error: rpcError } = await supabase.rpc("join_business_with_code", {
                p_business_code: businessCode.trim(),
                p_invite_code: inviteCode.trim(),
            });

            if (rpcError) throw rpcError;

            // Expected JSON returned: { success, message, role, business_id }
            if (data && data.success) {
                router.push("/dashboard");
                router.refresh();
            } else {
                throw new Error(data?.message || "Katılım başarısız oldu.");
            }
        } catch (err: any) {
            setError(err.message || "Firma kodu veya davet kodu geçersiz.");
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <div className="flex-1 flex flex-col items-center justify-center p-4 lg:p-8 min-h-[80vh]">
            <Card className="w-full max-w-md shadow-xl border-t-4 border-t-primary">
                <CardHeader className="text-center space-y-3 pb-6">
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary mb-2">
                        <Store className="h-8 w-8" />
                    </div>
                    <CardTitle className="text-2xl font-bold tracking-tight">
                        İşletmeye Katıl
                    </CardTitle>
                    <CardDescription className="text-base">
                        Yöneticinizden aldığınız firma ve davet kodlarını girerek sisteme bağlanın.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {error && (
                            <div className="p-4 text-sm text-destructive bg-destructive/10 rounded-lg border border-destructive/20 font-medium">
                                {error}
                            </div>
                        )}

                        <div className="space-y-2">
                            <Label htmlFor="business_code" className="text-sm font-semibold text-foreground/80">Firma Kodu</Label>
                            <div className="relative">
                                <Store className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                                <Input
                                    id="business_code"
                                    name="business_code"
                                    required
                                    placeholder="Örn: HK-100001"
                                    className="pl-10 h-12 text-lg uppercase tracking-wider"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="invite_code" className="text-sm font-semibold text-foreground/80">Davet Kodu (Şifre)</Label>
                            <div className="relative">
                                <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                                <Input
                                    id="invite_code"
                                    name="invite_code"
                                    required
                                    placeholder="Örn: 483920"
                                    className="pl-10 h-12 text-lg font-mono tracking-widest text-primary"
                                />
                            </div>
                        </div>

                        <Button type="submit" className="w-full h-12 text-lg font-semibold" disabled={isLoading}>
                            {isLoading ? "Bağlanıyor..." : "İşletmeye Katıl"}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
