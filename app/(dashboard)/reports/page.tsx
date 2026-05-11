import { Header } from "@/components/layout/header";
import {
    Card,
    CardContent,
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
import { Badge } from "@/components/ui/badge";
import {
    CalendarDays,
    CalendarRange,
    CreditCard,
    Wallet,
    Receipt,
    User,
} from "lucide-react";
import { getSalesDetailed } from "@/lib/services/sales";

export default async function ReportsPage() {
    const sales = await getSalesDetailed();

    // Today
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const dailySales = sales.filter((s) => new Date(s.created_at) >= todayStart);
    const dailyTotal = dailySales.reduce((acc, s) => acc + s.final_amount, 0);

    // This Week (Last 7 Days)
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - 7);
    weekStart.setHours(0, 0, 0, 0);
    const weeklySales = sales.filter((s) => new Date(s.created_at) >= weekStart);
    const weeklyTotal = weeklySales.reduce((acc, s) => acc + s.final_amount, 0);

    // Payment Methods
    const cashSales = sales.filter((s) => s.payment_method === 'cash');
    const cashTotal = cashSales.reduce((acc, s) => acc + s.final_amount, 0);

    const cardSales = sales.filter((s) => s.payment_method === 'credit_card');
    const cardTotal = cardSales.reduce((acc, s) => acc + s.final_amount, 0);

    // Top Sellers
    let sellers: Record<string, { name: string, total: number }> = {};
    sales.forEach((s) => {
        if (!sellers[s.seller_name]) sellers[s.seller_name] = { name: s.seller_name, total: 0 };
        sellers[s.seller_name].total += s.final_amount;
    });
    const topSellers = Object.values(sellers).sort((a, b) => b.total - a.total).slice(0, 3);
    const mainSeller = topSellers.length > 0 ? topSellers[0] : null;

    return (
        <>
            <Header title="Satış Takibi" />
            <div className="p-4 sm:p-6 space-y-6">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Satış Takibi</h2>
                    <p className="text-sm text-muted-foreground mt-1">
                        Mağazanızın satışlarını ve detaylı işlem geçmişini izleyin.
                    </p>
                </div>

                {/* Report cards */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {/* Daily Sales */}
                    <Card className="hover:shadow-md transition-shadow">
                        <CardHeader className="flex flex-row items-center gap-3 pb-2">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50">
                                <CalendarDays className="h-5 w-5 text-emerald-600" />
                            </div>
                            <div>
                                <CardTitle className="text-base">Günlük Satış</CardTitle>
                                <p className="text-xs text-muted-foreground">Bugünün özeti</p>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">İşlem Adedi</span>
                                    <span className="font-medium">{dailySales.length}</span>
                                </div>
                                <div className="flex justify-between text-sm border-t pt-1 mt-1">
                                    <span className="text-muted-foreground">Toplam Tutar</span>
                                    <span className="font-bold text-emerald-600">
                                        ₺{dailyTotal.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                                    </span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Weekly Sales */}
                    <Card className="hover:shadow-md transition-shadow">
                        <CardHeader className="flex flex-row items-center gap-3 pb-2">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50">
                                <CalendarRange className="h-5 w-5 text-blue-600" />
                            </div>
                            <div>
                                <CardTitle className="text-base">Haftalık Satış</CardTitle>
                                <p className="text-xs text-muted-foreground">Son 7 gün</p>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">İşlem Adedi</span>
                                    <span className="font-medium">{weeklySales.length}</span>
                                </div>
                                <div className="flex justify-between text-sm border-t pt-1 mt-1">
                                    <span className="text-muted-foreground">Toplam Tutar</span>
                                    <span className="font-bold text-blue-600">
                                        ₺{weeklyTotal.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                                    </span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Payment Methods */}
                    <Card className="hover:shadow-md transition-shadow">
                        <CardHeader className="flex flex-row items-center gap-3 pb-2">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-pink-50">
                                <Wallet className="h-5 w-5 text-pink-600" />
                            </div>
                            <div>
                                <CardTitle className="text-base">Yöntemler</CardTitle>
                                <p className="text-xs text-muted-foreground">Tüm zamanlar</p>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                <div className="flex justify-between text-sm items-center">
                                    <span className="text-muted-foreground flex items-center gap-1">
                                        <Wallet className="h-3 w-3" /> Nakit
                                    </span>
                                    <span className="font-medium">₺{cashTotal.toLocaleString("tr-TR")}</span>
                                </div>
                                <div className="flex justify-between text-sm items-center border-t pt-1 mt-1">
                                    <span className="text-muted-foreground flex items-center gap-1">
                                        <CreditCard className="h-3 w-3" /> Kart
                                    </span>
                                    <span className="font-medium">₺{cardTotal.toLocaleString("tr-TR")}</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Top Seller */}
                    <Card className="hover:shadow-md transition-shadow">
                        <CardHeader className="flex flex-row items-center gap-3 pb-2">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50">
                                <User className="h-5 w-5 text-amber-600" />
                            </div>
                            <div>
                                <CardTitle className="text-base">En Çok Satan</CardTitle>
                                <p className="text-xs text-muted-foreground">Personel performansı</p>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {mainSeller ? (
                                <div className="space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground truncate max-w-[120px]">{mainSeller.name}</span>
                                        <span className="font-bold text-amber-600">₺{mainSeller.total.toLocaleString("tr-TR")}</span>
                                    </div>
                                    {topSellers.length > 1 && (
                                        <div className="flex justify-between text-xs text-muted-foreground border-t pt-1 mt-1">
                                            <span className="truncate max-w-[120px]">{topSellers[1].name}</span>
                                            <span>₺{topSellers[1].total.toLocaleString("tr-TR")}</span>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center pt-2">
                                    <p className="text-xs text-muted-foreground">Kayıtlı satış yok</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Sales History Table */}
                <div className="pt-4">
                    <div className="flex items-center gap-2 mb-4">
                        <Receipt className="h-5 w-5 text-muted-foreground" />
                        <h3 className="text-xl font-bold">Satış Geçmişi</h3>
                    </div>
                    <Card>
                        {sales.length === 0 ? (
                            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                                <Receipt className="h-12 w-12 text-muted-foreground/30 mb-4" />
                                <h3 className="text-lg font-semibold">Henüz Satış Yok</h3>
                                <p className="text-sm text-muted-foreground mt-2 max-w-sm">
                                    Satış yapıldıktan sonra tüm işlemler burada listelenecektir.
                                </p>
                            </CardContent>
                        ) : (
                            <CardContent className="p-0 overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="w-[180px]">Tarih</TableHead>
                                            <TableHead>Satıcı</TableHead>
                                            <TableHead>Ödeme Yöntemi</TableHead>
                                            <TableHead className="text-right">Top. Tutar</TableHead>
                                            <TableHead className="text-right">İndirim</TableHead>
                                            <TableHead className="text-right">Net Tutar</TableHead>
                                            <TableHead className="text-center">Durum</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {sales.map((sale) => (
                                            <TableRow key={sale.id}>
                                                <TableCell className="font-medium text-sm text-muted-foreground">
                                                    {new Date(sale.created_at).toLocaleString('tr-TR', {
                                                        day: '2-digit', month: 'short', year: 'numeric',
                                                        hour: '2-digit', minute: '2-digit'
                                                    })}
                                                </TableCell>
                                                <TableCell className="font-medium">
                                                    {sale.seller_name}
                                                </TableCell>
                                                <TableCell>
                                                    {sale.payment_method === 'cash' ? (
                                                        <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                                                            Nakit
                                                        </Badge>
                                                    ) : sale.payment_method === 'credit_card' ? (
                                                        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                                                            Kart
                                                        </Badge>
                                                    ) : (
                                                        <Badge variant="secondary">
                                                            Diğer
                                                        </Badge>
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    ₺{sale.total_amount.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                                                </TableCell>
                                                <TableCell className="text-right text-red-500">
                                                    {sale.discount_amount > 0 ? `-₺${sale.discount_amount.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}` : "-"}
                                                </TableCell>
                                                <TableCell className="text-right font-bold text-emerald-600">
                                                    ₺{sale.final_amount.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    {sale.status === 'completed' ? (
                                                        <Badge variant="default" className="bg-green-500">
                                                            Tamamlandı
                                                        </Badge>
                                                    ) : sale.status === 'refunded' ? (
                                                        <Badge variant="destructive">
                                                            İade Edildi
                                                        </Badge>
                                                    ) : (
                                                        <Badge variant="secondary">
                                                            İptal
                                                        </Badge>
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        )}
                    </Card>
                </div>
            </div>
        </>
    );
}
