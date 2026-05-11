import { Header } from "@/components/layout/header";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function ProductsLoading() {
    return (
        <>
            <Header title="Ürünler" />
            <div className="p-4 sm:p-6 space-y-6">
                {/* Page header with action */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight">Ürünler</h2>
                        <p className="text-sm text-muted-foreground mt-1">
                            Tüm ürünlerinizi buradan yönetin
                        </p>
                    </div>
                    <Button className="w-full sm:w-auto" disabled>
                        <Plus className="h-4 w-4 mr-2" />
                        Yeni Ürün Ekle
                    </Button>
                </div>

                {/* Search Header */}
                <div className="relative max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        disabled
                        placeholder="Yükleniyor..."
                        className="pl-10"
                    />
                </div>

                {/* Loading State skeleton */}
                <Card>
                    <CardContent className="p-0 overflow-x-auto">
                        <div className="w-full h-12 bg-muted/30 border-b animate-pulse" />

                        {Array.from({ length: 5 }).map((_, i) => (
                            <div key={i} className="flex p-4 border-b gap-4 w-full animate-pulse">
                                <div className="h-5 w-48 bg-muted rounded" />
                                <div className="h-5 w-32 bg-muted rounded" />
                                <div className="h-5 w-24 bg-muted rounded" />
                                <div className="h-5 w-16 bg-muted rounded ml-auto" />
                                <div className="h-5 w-16 bg-muted rounded" />
                            </div>
                        ))}
                    </CardContent>
                </Card>
            </div>
        </>
    );
}
