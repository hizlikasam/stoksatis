"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createBusiness } from "@/lib/services/admin-businesses";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function NewBusinessPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isActive, setIsActive] = useState(true);

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        const fd = new FormData(e.currentTarget);

        try {
            const created = await createBusiness({
                name: fd.get("name") as string,
                phone: fd.get("phone") as string,
                email: fd.get("email") as string,
                address: fd.get("address") as string,
                tax_number: fd.get("tax_number") as string,
                business_code: fd.get("business_code") as string,
                invite_code: fd.get("invite_code") as string,
                notes: fd.get("notes") as string,
                is_active: isActive,
            });
            router.push(`/admin/businesses/${created.id}`);
            router.refresh();
        } catch (err: any) {
            setError(err.message || "Firma oluşturulurken bir hata oluştu.");
            setIsLoading(false);
        }
    }

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <div className="flex items-center gap-4">
                <Link href="/admin/businesses">
                    <Button variant="outline" size="icon">
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                </Link>
                <h1 className="text-2xl font-bold tracking-tight">Yeni Firma Oluştur</h1>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Firma Bilgileri</CardTitle>
                    <CardDescription>
                        Firma kodu ve davet kodunu boş bırakırsanız sistem otomatik oluşturur.
                    </CardDescription>
                </CardHeader>
                <form onSubmit={handleSubmit}>
                    <CardContent className="space-y-5">
                        {error && (
                            <div className="rounded-md bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">
                                {error}
                            </div>
                        )}

                        {/* Firma Adı */}
                        <div className="space-y-1.5">
                            <Label htmlFor="name">
                                Firma Adı <span className="text-destructive">*</span>
                            </Label>
                            <Input id="name" name="name" required placeholder="Örn: Kayalar Züccaciye" />
                        </div>

                        {/* Telefon / E-posta */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <Label htmlFor="phone">Telefon</Label>
                                <Input id="phone" name="phone" placeholder="0555 123 4567" />
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="email">E-posta</Label>
                                <Input id="email" name="email" type="email" placeholder="ornek@email.com" />
                            </div>
                        </div>

                        {/* Adres */}
                        <div className="space-y-1.5">
                            <Label htmlFor="address">Adres</Label>
                            <Textarea id="address" name="address" rows={2} placeholder="Fatura / Şirket Adresi" />
                        </div>

                        {/* Vergi No */}
                        <div className="space-y-1.5">
                            <Label htmlFor="tax_number">Vergi No</Label>
                            <Input id="tax_number" name="tax_number" placeholder="V.D. / No" />
                        </div>

                        {/* Firma Kodu / Davet Kodu */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t">
                            <div className="space-y-1.5">
                                <Label htmlFor="business_code">Firma Kodu (Opsiyonel)</Label>
                                <Input id="business_code" name="business_code" placeholder="Örn: HK-100001" />
                                <p className="text-xs text-muted-foreground">
                                    Boş bırakırsanız sistem otomatik firma kodu oluşturur.
                                </p>
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="invite_code">Davet Kodu (Opsiyonel)</Label>
                                <Input id="invite_code" name="invite_code" placeholder="Örn: 483920" />
                                <p className="text-xs text-muted-foreground">
                                    Boş bırakırsanız sistem otomatik davet kodu oluşturur.
                                </p>
                            </div>
                        </div>

                        {/* Notlar */}
                        <div className="space-y-1.5 pt-4 border-t">
                            <Label htmlFor="notes">Notlar</Label>
                            <Textarea id="notes" name="notes" placeholder="İç notlar..." />
                        </div>

                        {/* Aktif/Pasif */}
                        <div className="flex items-center justify-between pt-4 border-t">
                            <div>
                                <Label>Aktif/Pasif</Label>
                                <p className="text-xs text-muted-foreground">
                                    Pasife alınan firma müşterileri giriş yapamaz.
                                </p>
                            </div>
                            <Switch checked={isActive} onCheckedChange={setIsActive} />
                        </div>
                    </CardContent>

                    <CardFooter className="flex justify-between border-t p-6">
                        <Link href="/admin/businesses">
                            <Button variant="ghost" type="button">
                                İptal
                            </Button>
                        </Link>
                        <Button type="submit" disabled={isLoading}>
                            {isLoading ? "Oluşturuluyor..." : "Kaydet"}
                        </Button>
                    </CardFooter>
                </form>
            </Card>
        </div>
    );
}
