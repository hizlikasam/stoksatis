"use client";

import { useEffect, useState } from "react";
import { use } from "react";
import { useRouter } from "next/navigation";
import {
    getBusinessById,
    regenerateInviteCode,
    setBusinessActive,
} from "@/lib/services/admin-businesses";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    ArrowLeft,
    Building2,
    Copy,
    Pencil,
    Power,
    RefreshCw,
    Users,
} from "lucide-react";
import Link from "next/link";

export default function BusinessDetailPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = use(params);
    const router = useRouter();
    const [business, setBusiness] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [regenerating, setRegenerating] = useState(false);

    useEffect(() => {
        getBusinessById(id)
            .then((b) => {
                setBusiness(b);
                setLoading(false);
            })
            .catch(() => router.push("/admin/businesses"));
    }, [id, router]);

    function copyToClipboard(text: string) {
        navigator.clipboard.writeText(text);
    }

    async function handleRegenerateInviteCode() {
        if (
            !confirm(
                "Davet kodunu yenilemek istediğinize emin misiniz? Eski kod artık kullanılamaz."
            )
        )
            return;

        setRegenerating(true);
        try {
            const newCode = await regenerateInviteCode(id);
            setBusiness((prev: any) => ({ ...prev, invite_code: newCode }));
        } catch (err: any) {
            alert(err.message || "Hata oluştu.");
        } finally {
            setRegenerating(false);
        }
    }

    async function handleToggleActive() {
        const msg = business.is_active
            ? "Firmayı pasife almak istediğinize emin misiniz?"
            : "Firmayı aktif yapmak istediğinize emin misiniz?";
        if (!confirm(msg)) return;

        try {
            await setBusinessActive(id, !business.is_active);
            setBusiness((prev: any) => ({
                ...prev,
                is_active: !prev.is_active,
            }));
        } catch (err: any) {
            alert(err.message || "Hata oluştu.");
        }
    }

    if (loading)
        return (
            <div className="p-8 text-center text-muted-foreground animate-pulse">
                Yükleniyor...
            </div>
        );
    if (!business) return null;

    const info = [
        { label: "Telefon", value: business.phone },
        { label: "E-posta", value: business.email },
        { label: "Adres", value: business.address },
        { label: "Vergi No", value: business.tax_number },
        {
            label: "Oluşturulma",
            value: new Date(business.created_at).toLocaleDateString("tr-TR"),
        },
    ];

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            {/* Top Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Link href="/admin/businesses">
                        <Button variant="outline" size="icon">
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                            <Building2 className="h-5 w-5 text-muted-foreground" />
                            {business.name}
                        </h1>
                        <Badge
                            variant={business.is_active ? "default" : "destructive"}
                            className="mt-1"
                        >
                            {business.is_active ? "Aktif" : "Pasif"}
                        </Badge>
                    </div>
                </div>
                <div className="flex flex-wrap gap-2">
                    <Link href={`/admin/businesses/${id}/edit`}>
                        <Button variant="secondary" size="sm">
                            <Pencil className="mr-2 h-4 w-4" />
                            Düzenle
                        </Button>
                    </Link>
                    <Link href={`/admin/businesses/${id}/users`}>
                        <Button variant="outline" size="sm">
                            <Users className="mr-2 h-4 w-4" />
                            Kullanıcıları Gör
                        </Button>
                    </Link>
                    <Button variant="outline" size="sm" onClick={handleToggleActive}>
                        <Power className="mr-2 h-4 w-4" />
                        {business.is_active ? "Pasife Al" : "Aktif Yap"}
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Info Card */}
                <Card className="md:col-span-2">
                    <CardHeader>
                        <CardTitle>Firma Bilgileri</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {info.map((item) => (
                                <div key={item.label}>
                                    <dt className="text-xs text-muted-foreground uppercase tracking-wider">
                                        {item.label}
                                    </dt>
                                    <dd className="mt-1 font-medium text-sm">
                                        {item.value || "-"}
                                    </dd>
                                </div>
                            ))}
                        </dl>

                        {business.notes && (
                            <div className="mt-6 pt-4 border-t">
                                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                                    Notlar
                                </p>
                                <p className="text-sm bg-muted/50 p-3 rounded-md whitespace-pre-wrap">
                                    {business.notes}
                                </p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Join Info Card */}
                <Card className="border-purple-200">
                    <CardHeader className="bg-purple-50/60 border-b pb-4">
                        <CardTitle className="text-lg text-purple-900">
                            Müşteri Katılım Bilgileri
                        </CardTitle>
                        <CardDescription className="text-purple-700">
                            Müşteri bu bilgilerle işletmeye katılabilir.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-4 space-y-4">
                        {/* Firma Kodu */}
                        <div>
                            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                                Firma Kodu
                            </p>
                            <div className="flex items-center gap-2">
                                <code className="flex-1 bg-muted px-3 py-2 rounded-md font-mono text-sm border">
                                    {business.business_code ?? "-"}
                                </code>
                                {business.business_code && (
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        onClick={() =>
                                            copyToClipboard(business.business_code)
                                        }
                                        title="Kopyala"
                                    >
                                        <Copy className="h-4 w-4" />
                                    </Button>
                                )}
                            </div>
                        </div>

                        {/* Davet Kodu */}
                        <div>
                            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                                Davet Kodu
                            </p>
                            <div className="flex items-center gap-2">
                                <code className="flex-1 bg-muted px-3 py-2 rounded-md font-mono text-lg text-center border tracking-widest text-purple-700">
                                    {business.invite_code ?? "-"}
                                </code>
                                {business.invite_code && (
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        onClick={() =>
                                            copyToClipboard(business.invite_code)
                                        }
                                        title="Kopyala"
                                    >
                                        <Copy className="h-4 w-4" />
                                    </Button>
                                )}
                            </div>
                        </div>

                        <Button
                            variant="destructive"
                            className="w-full"
                            onClick={handleRegenerateInviteCode}
                            disabled={regenerating}
                        >
                            <RefreshCw
                                className={`mr-2 h-4 w-4 ${regenerating ? "animate-spin" : ""}`}
                            />
                            Davet Kodunu Yenile
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
