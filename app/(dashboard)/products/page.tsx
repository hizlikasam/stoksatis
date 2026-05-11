import Link from "next/link";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Search, Package, Edit, Trash2 } from "lucide-react";
import { getProducts } from "@/lib/services/products";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

interface ProductsPageProps {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
    const resolvedSearchParams = await searchParams;
    const search = typeof resolvedSearchParams.q === "string" ? resolvedSearchParams.q : undefined;

    const products = await getProducts(search);

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
                    <Link href="/products/new">
                        <Button className="w-full sm:w-auto">
                            <Plus className="h-4 w-4 mr-2" />
                            Yeni Ürün Ekle
                        </Button>
                    </Link>
                </div>

                {/* Search Header */}
                <form className="relative max-w-md" action="/products" method="GET">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        name="q"
                        defaultValue={search || ""}
                        placeholder="Ürün adı, barkod veya iç kod ile ara (Enter'a basın)..."
                        className="pl-10"
                    />
                </form>

                {/* Data Table or Empty State */}
                <Card>
                    {products.length === 0 ? (
                        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted mb-4">
                                <Package className="h-8 w-8 text-muted-foreground/50" />
                            </div>
                            <h3 className="text-lg font-semibold">Henüz ürün bulunmuyor.</h3>
                            <p className="text-sm text-muted-foreground mt-2 max-w-sm">
                                İlk ürününüzü ekleyerek başlayın. Ürünleri barkod, isim ve
                                kategoriye göre yönetebilirsiniz.
                            </p>
                            <Link href="/products/new" className="mt-6">
                                <Button>
                                    <Plus className="h-4 w-4 mr-2" />
                                    İlk Ürünü Ekle
                                </Button>
                            </Link>
                        </CardContent>
                    ) : (
                        <CardContent className="p-0 overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="min-w-[200px]">Ürün Adı</TableHead>
                                        <TableHead>Barkod</TableHead>
                                        <TableHead>Kategori</TableHead>
                                        <TableHead className="text-right">Maliyet (₺)</TableHead>
                                        <TableHead className="text-right">Satış (₺)</TableHead>
                                        <TableHead className="text-center">Stok</TableHead>
                                        <TableHead className="text-center">Durum</TableHead>
                                        <TableHead className="text-right">İşlem</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {products.map((product) => (
                                        <TableRow key={product.id}>
                                            <TableCell className="font-medium">
                                                {product.name}
                                                {product.internal_code && (
                                                    <span className="block text-xs text-muted-foreground">
                                                        Kod: {product.internal_code}
                                                    </span>
                                                )}
                                            </TableCell>
                                            <TableCell>{product.barcode || "-"}</TableCell>
                                            <TableCell>
                                                {product.category ? (
                                                    <Badge variant="secondary" className="font-normal">
                                                        {product.category.name}
                                                    </Badge>
                                                ) : (
                                                    <span className="text-muted-foreground text-xs">-</span>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                {Number(product.cost_price).toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                                            </TableCell>
                                            <TableCell className="text-right font-medium text-emerald-600">
                                                {Number(product.sale_price).toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <Badge
                                                    variant={product.stock_quantity <= product.min_stock_quantity ? "destructive" : "outline"}
                                                    className={product.stock_quantity > product.min_stock_quantity ? "bg-emerald-50 text-emerald-700 border-emerald-200" : ""}
                                                >
                                                    {product.stock_quantity}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                                                    Aktif
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-2">
                                                    <Link href={`/products/${product.id}/edit`}>
                                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                                                            <Edit className="h-4 w-4" />
                                                        </Button>
                                                    </Link>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    )}
                </Card>
            </div>
        </>
    );
}
