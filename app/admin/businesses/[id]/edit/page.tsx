"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { getBusinessById, updateBusiness } from "@/lib/services/admin-businesses";
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

export default function EditBusinessPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = use(params);
    const router = useRouter();
    const [business, setBusiness] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isActive, setIsActive] = useState(true);

    useEffect(() => {
        getBusinessById(id)
            .then((b) => {
                setBusiness(b);
                setIsActive(b.is_active);
                setLoading(false);
            })
            .catch(() => router.push("/admin/businesses"));
    }, [id, router]);

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setSaving(true);
        setError(null);

        const fd = new FormData(e.currentTarget);

        try {
            await updateBusiness(id, {
                name: fd.get("name") as string,
                phone: fd.get("phone") as string,
                email: fd.get("email") as string,
                address: fd.get("address") as string,
                tax_number: fd.get("tax_number") as string,
                notes: fd.get("notes") as string,
                is_active: isActive,
            });
            router.push(`/admin/businesses/${id}`);
            router.refresh();
        } catch (err: any) {
            setError(err.message || "Firma güncellenirken bir hata oluştu.");
            setSaving(false);
        }
    }

    if (loading)
        return (
            <div className="p-8 text-center text-muted-foreground animate-pulse">
                Yükleniyor...
            </div>
        );

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <div className="flex items-center gap-4">
                <Link href={`/admin/businesses/${id}`}>
                    <Button variant="outline" size="icon">
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                </Link>
                <h1 className="text-2xl font-bold tracking-tight">Firmayı Düzenle</h1>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Genel Bilgileri Güncelle</CardTitle>
                    <CardDescription>
                        Firma kodu ve davet kodu bu ekrandan değiştirilemez.
                    </CardDescription>
                </CardHeader>
                <form onSubmit={handleSubmit}>
                    <CardContent className="space-y-5">
                        {error && (
                            <div className="rounded-md bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">
                                {error}
                            </div>
                        )}

                        <div className="space-y-1.5">
                            <Label htmlFor="name">
                                Firma Adı <span className="text-destructive">*</span>
                            </Label>
                            <Input
                                id="name"
                                name="name"
                                required
                                defaultValue={business?.name}
                            />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <Label htmlFor="phone">Telefon</Label>
                                <Input
                                    id="phone"
                                    name="phone"
                                    defaultValue={business?.phone ?? ""}
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="email">E-posta</Label>
                                <Input
                                    id="email"
                                    name="email"
                                    type="email"
                                    defaultValue={business?.email ?? ""}
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="address">Adres</Label>
                            <Textarea
                                id="address"
                                name="address"
                                rows={2}
                                defaultValue={business?.address ?? ""}
                            />
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="tax_number">Vergi No</Label>
                            <Input
                                id="tax_number"
                                name="tax_number"
                                defaultValue={business?.tax_number ?? ""}
                            />
                        </div>

                        <div className="space-y-1.5 pt-4 border-t">
                            <Label htmlFor="notes">Notlar</Label>
                            <Textarea
                                id="notes"
                                name="notes"
                                defaultValue={business?.notes ?? ""}
                            />
                        </div>

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
                        <Link href={`/admin/businesses/${id}`}>
                            <Button variant="ghost" type="button">
                                İptal
                            </Button>
                        </Link>
                        <Button type="submit" disabled={saving}>
                            {saving ? "Kaydediliyor..." : "Kaydet"}
                        </Button>
                    </CardFooter>
                </form>
            </Card>
        </div>
    );
}
