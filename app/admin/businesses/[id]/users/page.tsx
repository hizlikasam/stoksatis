"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import {
    getBusinessById,
    getBusinessUsers,
    updateBusinessUserRole,
    setBusinessUserActive,
    createBusinessUserDirectly,
} from "@/lib/services/admin-businesses";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Plus, Power, UserPlus } from "lucide-react";
import Link from "next/link";

interface BusinessUser {
    id: string;
    user_id: string;
    full_name: string | null;
    role: string;
    is_active: boolean;
    created_at: string;
}

export default function BusinessUsersPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = use(params);
    const router = useRouter();
    const [businessName, setBusinessName] = useState("");
    const [users, setUsers] = useState<BusinessUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Add user form state
    const [showAddForm, setShowAddForm] = useState(false);
    const [newFullName, setNewFullName] = useState("");
    const [newEmail, setNewEmail] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [newUserRole, setNewUserRole] = useState<"owner" | "manager" | "cashier">("cashier");
    const [addingUser, setAddingUser] = useState(false);
    const [addError, setAddError] = useState<string | null>(null);
    const [addSuccess, setAddSuccess] = useState<string | null>(null);

    async function loadData() {
        setLoading(true);
        setError(null);
        try {
            const [b, u] = await Promise.all([
                getBusinessById(id),
                getBusinessUsers(id),
            ]);
            setBusinessName(b.name);
            setUsers(u);
        } catch (err: any) {
            setError(err.message || "Kullanıcılar yüklenirken bir hata oluştu.");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        loadData();
    }, [id]);

    async function handleRoleChange(
        businessUserId: string,
        role: "owner" | "manager" | "cashier"
    ) {
        try {
            await updateBusinessUserRole(businessUserId, role);
            setUsers((prev) =>
                prev.map((u) =>
                    u.id === businessUserId ? { ...u, role } : u
                )
            );
        } catch (err: any) {
            alert(err.message || "Rol güncellenemedi.");
        }
    }

    async function handleToggleActive(businessUserId: string, current: boolean) {
        const msg = current
            ? "Kullanıcıyı pasife almak istediğinize emin misiniz?"
            : "Kullanıcıyı aktif yapmak istediğinize emin misiniz?";
        if (!confirm(msg)) return;

        try {
            await setBusinessUserActive(businessUserId, !current);
            setUsers((prev) =>
                prev.map((u) =>
                    u.id === businessUserId
                        ? { ...u, is_active: !current }
                        : u
                )
            );
        } catch (err: any) {
            alert(err.message || "Durum güncellenemedi.");
        }
    }

    async function handleAddUser(e: React.FormEvent) {
        e.preventDefault();
        setAddingUser(true);
        setAddError(null);
        setAddSuccess(null);

        try {
            await createBusinessUserDirectly(id, newFullName, newEmail, newPassword, newUserRole);
            setAddSuccess("Kullanıcı başarıyla oluşturuldu ve firmaya eklendi.");
            setNewFullName("");
            setNewEmail("");
            setNewPassword("");
            setNewUserRole("cashier");
            setShowAddForm(false);
            // Listeyi yenile
            await loadData();
        } catch (err: any) {
            setAddError(err.message || "Kullanıcı oluşturulamadı.");
        } finally {
            setAddingUser(false);
        }
    }

    if (loading)
        return (
            <div className="p-8 text-center text-muted-foreground animate-pulse">
                Yükleniyor...
            </div>
        );

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Link href={`/admin/businesses/${id}`}>
                        <Button variant="outline" size="icon">
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">
                            Firma Kullanıcıları
                        </h1>
                        <p className="text-sm text-muted-foreground mt-1">
                            <span className="font-medium text-foreground">{businessName}</span> — kullanıcıları ve rollerini yönetin.
                        </p>
                    </div>
                </div>
                <Button onClick={() => setShowAddForm(!showAddForm)} variant={showAddForm ? "secondary" : "default"}>
                    <UserPlus className="mr-2 h-4 w-4" />
                    {showAddForm ? "İptal" : "Kullanıcı Ekle"}
                </Button>
            </div>

            {/* Error state */}
            {error && (
                <div className="rounded-md bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">
                    {error}
                </div>
            )}

            {/* Success state */}
            {addSuccess && (
                <div className="rounded-md bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700">
                    {addSuccess}
                </div>
            )}

            {/* Add User Form */}
            {showAddForm && (
                <Card className="border-purple-200">
                    <CardHeader className="bg-purple-50/60 border-b pb-4">
                        <CardTitle className="text-lg text-purple-900">
                            Firmaya Kullanıcı Ekle
                        </CardTitle>
                        <CardDescription className="text-purple-700">
                            Yeni bir kullanıcı oluşturarak bu firmaya atayın. Şifre en az 6 karakter olmalıdır.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-4">
                        <form onSubmit={handleAddUser} className="space-y-4">
                            {addError && (
                                <div className="rounded-md bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">
                                    {addError}
                                </div>
                            )}

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <Label htmlFor="full_name">Ad Soyad</Label>
                                    <Input
                                        id="full_name"
                                        placeholder="Örn: Ahmet Yılmaz"
                                        value={newFullName}
                                        onChange={(e) => setNewFullName(e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label htmlFor="email">E-posta</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder="Örn: ahmet@firma.com"
                                        value={newEmail}
                                        onChange={(e) => setNewEmail(e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label htmlFor="password">Giriş Şifresi</Label>
                                    <Input
                                        id="password"
                                        type="password"
                                        placeholder="En az 6 karakter"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        required
                                        minLength={6}
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        Kullanıcının sisteme girerken kullanacağı şifre.
                                    </p>
                                </div>
                                <div className="space-y-1.5">
                                    <Label>Rol</Label>
                                    <Select value={newUserRole} onValueChange={(v) => setNewUserRole(v as any)}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="owner">Owner</SelectItem>
                                            <SelectItem value="manager">Manager</SelectItem>
                                            <SelectItem value="cashier">Cashier</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <div className="flex justify-end pt-2">
                                <Button type="submit" disabled={addingUser || !newFullName.trim() || !newEmail.trim() || newPassword.length < 6}>
                                    {addingUser ? "Oluşturuluyor..." : "Kullanıcı Oluştur ve Ekle"}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            )}

            {/* Users Table */}
            <Card>
                <CardContent className="pt-6">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Kullanıcı</TableHead>
                                <TableHead>User ID</TableHead>
                                <TableHead>Rol</TableHead>
                                <TableHead>Durum</TableHead>
                                <TableHead>Katılma Tarihi</TableHead>
                                <TableHead className="text-right">İşlemler</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {users.map((u) => (
                                <TableRow key={u.id}>
                                    <TableCell className="font-medium">
                                        {u.full_name || "İsimsiz Kullanıcı"}
                                    </TableCell>
                                    <TableCell className="font-mono text-xs text-muted-foreground max-w-[160px] truncate" title={u.user_id}>
                                        {u.user_id.substring(0, 8)}...
                                    </TableCell>
                                    <TableCell>
                                        <Select
                                            defaultValue={u.role}
                                            onValueChange={(v) =>
                                                handleRoleChange(
                                                    u.id,
                                                    v as "owner" | "manager" | "cashier"
                                                )
                                            }
                                        >
                                            <SelectTrigger className="w-[130px]">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="owner">Owner</SelectItem>
                                                <SelectItem value="manager">Manager</SelectItem>
                                                <SelectItem value="cashier">Cashier</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </TableCell>
                                    <TableCell>
                                        <Badge
                                            variant={u.is_active ? "default" : "destructive"}
                                        >
                                            {u.is_active ? "Aktif" : "Pasif"}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-xs text-muted-foreground">
                                        {new Date(u.created_at).toLocaleDateString("tr-TR")}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => handleToggleActive(u.id, u.is_active)}
                                            title={u.is_active ? "Pasife Al" : "Aktif Yap"}
                                        >
                                            <Power
                                                className={`h-4 w-4 ${u.is_active ? "text-green-600" : "text-red-500"}`}
                                            />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {users.length === 0 && !error && (
                                <TableRow>
                                    <TableCell
                                        colSpan={6}
                                        className="text-center py-8 text-muted-foreground"
                                    >
                                        Bu firmaya henüz kullanıcı katılmamış.
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
