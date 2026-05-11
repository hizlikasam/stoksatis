import { Header } from "@/components/layout/header";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Package,
    ShoppingCart,
    TrendingUp,
    AlertTriangle,
} from "lucide-react";

const stats = [
    {
        title: "Toplam Ürün",
        value: "0",
        description: "Kayıtlı ürün sayısı",
        icon: Package,
        color: "text-blue-600",
        bg: "bg-blue-50",
    },
    {
        title: "Bugünkü Satış",
        value: "₺0,00",
        description: "Günlük satış tutarı",
        icon: ShoppingCart,
        color: "text-emerald-600",
        bg: "bg-emerald-50",
    },
    {
        title: "Aylık Satış",
        value: "₺0,00",
        description: "Bu ayki toplam satış",
        icon: TrendingUp,
        color: "text-violet-600",
        bg: "bg-violet-50",
    },
    {
        title: "Düşük Stok",
        value: "0",
        description: "Stok uyarısı olan ürünler",
        icon: AlertTriangle,
        color: "text-amber-600",
        bg: "bg-amber-50",
    },
];

export default function DashboardPage() {
    return (
        <>
            <Header title="Dashboard" />
            <div className="p-4 sm:p-6 space-y-6">
                {/* Welcome message */}
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Hoş Geldiniz 👋</h2>
                    <p className="text-muted-foreground mt-1">
                        Züccaciye mağazanızın günlük özeti
                    </p>
                </div>

                {/* Stats grid */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {stats.map((stat) => (
                        <Card
                            key={stat.title}
                            className="hover:shadow-md transition-shadow duration-200"
                        >
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground">
                                    {stat.title}
                                </CardTitle>
                                <div
                                    className={`flex h-9 w-9 items-center justify-center rounded-lg ${stat.bg}`}
                                >
                                    <stat.icon className={`h-4.5 w-4.5 ${stat.color}`} />
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{stat.value}</div>
                                <p className="text-xs text-muted-foreground mt-1">
                                    {stat.description}
                                </p>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* Recent activity placeholder */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Son İşlemler</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-col items-center justify-center py-8 text-center">
                            <ShoppingCart className="h-10 w-10 text-muted-foreground/40 mb-3" />
                            <p className="text-sm text-muted-foreground">
                                Henüz işlem kaydı bulunmuyor
                            </p>
                            <p className="text-xs text-muted-foreground/70 mt-1">
                                Satış yaptığınızda son işlemler burada görünecek
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </>
    );
}
