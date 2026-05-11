import { getBusinesses, setBusinessActive } from "@/lib/services/admin-businesses";
import Link from "next/link";
import { Plus, Eye, Pencil, Users } from "lucide-react";
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
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { BusinessSearchBar } from "./search-bar";
import { ToggleActiveButton } from "./toggle-active-button";

export default async function AdminBusinessesPage({
    searchParams,
}: {
    searchParams?: Promise<{ q?: string }>;
}) {
    const resolvedParams = await searchParams;
    const search = resolvedParams?.q ?? "";
    const businesses = await getBusinesses(search);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Firmalar</h1>
                    <p className="text-muted-foreground text-sm mt-1">
                        Sisteme kayıtlı müşteri firmalarını yönetin.
                    </p>
                </div>
                <Link href="/admin/businesses/new">
                    <Button>
                        <Plus className="mr-2 h-4 w-4" />
                        Yeni Firma Oluştur
                    </Button>
                </Link>
            </div>

            {/* Search + Table */}
            <Card>
                <CardHeader>
                    <div className="pt-2">
                        <BusinessSearchBar />
                    </div>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Firma Adı</TableHead>
                                <TableHead>Firma Kodu</TableHead>
                                <TableHead>Davet Kodu</TableHead>
                                <TableHead>Telefon</TableHead>
                                <TableHead>E-posta</TableHead>
                                <TableHead>Durum</TableHead>
                                <TableHead>Oluşturulma</TableHead>
                                <TableHead className="text-right">İşlemler</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {businesses.map((b) => (
                                <TableRow key={b.id}>
                                    <TableCell className="font-medium">{b.name}</TableCell>
                                    <TableCell className="font-mono text-xs">{b.business_code ?? "-"}</TableCell>
                                    <TableCell className="font-mono text-xs text-muted-foreground">{b.invite_code ?? "-"}</TableCell>
                                    <TableCell className="text-sm">{b.phone ?? "-"}</TableCell>
                                    <TableCell className="text-sm">{b.email ?? "-"}</TableCell>
                                    <TableCell>
                                        <Badge variant={b.is_active ? "default" : "destructive"}>
                                            {b.is_active ? "Aktif" : "Pasif"}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-xs text-muted-foreground">
                                        {new Date(b.created_at).toLocaleDateString("tr-TR")}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex items-center justify-end gap-1">
                                            <Link href={`/admin/businesses/${b.id}`}>
                                                <Button variant="ghost" size="icon" title="Detay">
                                                    <Eye className="h-4 w-4" />
                                                </Button>
                                            </Link>
                                            <Link href={`/admin/businesses/${b.id}/edit`}>
                                                <Button variant="ghost" size="icon" title="Düzenle">
                                                    <Pencil className="h-4 w-4" />
                                                </Button>
                                            </Link>
                                            <Link href={`/admin/businesses/${b.id}/users`}>
                                                <Button variant="ghost" size="icon" title="Kullanıcılar">
                                                    <Users className="h-4 w-4" />
                                                </Button>
                                            </Link>
                                            <ToggleActiveButton id={b.id} isActive={b.is_active} />
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {businesses.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                                        Kayıtlı firma bulunamadı.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
