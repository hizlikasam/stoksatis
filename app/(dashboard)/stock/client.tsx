"use client";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { Header } from "@/components/layout/header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    ArrowDownToLine,
    ArrowUpFromLine,
    ArrowLeftRight,
    Search,
    Package,
    ScanBarcode,
    Camera
} from "lucide-react";
import { getStockMovements, addStockMovement } from "@/lib/services/stock";
import { getProducts, createProduct, getCategories, getSuppliers } from "@/lib/services/products";
import { Product, Category, Supplier } from "@/types/database";
import { BarcodeScannerDialog } from "@/components/ui/barcode-scanner";
import { ProductForm } from "@/components/products/product-form";

export default function StockClient({ businessId }: { businessId: string }) {
    const [movements, setMovements] = useState<any[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(true);

    // Modal state
    const [modalOpen, setModalOpen] = useState(false);
    const [moveType, setMoveType] = useState<"stock_in" | "stock_out">("stock_in");

    // Form state
    const [selectedProductId, setSelectedProductId] = useState("");
    const [searchQuery, setSearchQuery] = useState("");
    const [isScannerOpen, setIsScannerOpen] = useState(false);
    const [quantity, setQuantity] = useState("");
    const [note, setNote] = useState("");
    const [submitting, setSubmitting] = useState(false);

    // Quick Add Product state
    const [isQuickAdd, setIsQuickAdd] = useState(false);
    const [newProductName, setNewProductName] = useState("");
    const [newProductBarcode, setNewProductBarcode] = useState("");
    const [newProductPrice, setNewProductPrice] = useState("");
    const [addingProduct, setAddingProduct] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [m, p, cats, sups] = await Promise.all([
                getStockMovements(businessId),
                getProducts(), // Sadece aktif business'ınkiler gelir RLS ile
                getCategories(),
                getSuppliers(),
            ]);
            setMovements(m);
            setProducts(p as any);
            setCategories(cats);
            setSuppliers(sups);
        } catch (err: any) {
            toast.error("Stok verileri yüklenemedi.");
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (type: "stock_in" | "stock_out") => {
        setMoveType(type);
        setSelectedProductId("");
        setSearchQuery("");
        setQuantity("");
        setNote("");
        setIsQuickAdd(false);
        setModalOpen(true);
    };

    const handleQuickAddSuccess = async (newProd: any) => {
        setAddingProduct(true);
        try {
            await loadData();
            setSelectedProductId(newProd.id);
            setSearchQuery(newProd.name);
            setIsQuickAdd(false);
        } catch (error: any) {
            console.error(error);
        } finally {
            setAddingProduct(false);
        }
    };

    const searchLowerStock = searchQuery.toLocaleLowerCase("tr-TR").trim();
    const stockSearchResults = (searchLowerStock.length > 1 && !selectedProductId)
        ? products.filter(p =>
            p.name.toLocaleLowerCase("tr-TR").includes(searchLowerStock) ||
            p.barcode?.includes(searchLowerStock) ||
            p.internal_code?.toLocaleLowerCase("tr-TR").includes(searchLowerStock)
        ).slice(0, 5)
        : [];

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedProductId || !quantity) return;

        const qNum = parseInt(quantity, 10);
        if (isNaN(qNum) || qNum <= 0) {
            toast.error("Geçerli bir miktar girin.");
            return;
        }

        const product = products.find(p => p.id === selectedProductId);
        if (moveType === "stock_out" && product && product.stock_quantity < qNum) {
            toast.warning(`Üründe yeterli stok yok (Mevcut: ${product.stock_quantity})`);
            return;
        }

        setSubmitting(true);
        try {
            await addStockMovement(businessId, selectedProductId, moveType, qNum, note);
            toast.success(moveType === "stock_in" ? "Stok girişi başarılı!" : "Stok çıkışı başarılı!");
            setModalOpen(false);
            loadData(); // reload
        } catch (error: any) {
            toast.error(error.message || "İşlem başarısız.");
        } finally {
            setSubmitting(false);
        }
    };

    const filteredMovements = movements.filter(m => {
        const prodName = m.product?.name?.toLowerCase() || "";
        const s = search.toLowerCase();
        return prodName.includes(s) || m.note?.toLowerCase().includes(s);
    });

    const today = new Date().toISOString().split('T')[0];
    const todayIn = movements.filter(m => m.movement_type === "stock_in" && m.created_at.startsWith(today)).reduce((sum, m) => sum + m.quantity, 0);
    const todayOut = movements.filter(m => (m.movement_type === "stock_out" || m.movement_type === "sale") && m.created_at.startsWith(today)).reduce((sum, m) => sum + m.quantity, 0);

    return (
        <>
            <Header title="Stok Hareketleri" />
            <div className="p-4 sm:p-6 space-y-6">
                {/* Page header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight">
                            Stok Hareketleri
                        </h2>
                        <p className="text-sm text-muted-foreground mt-1">
                            Ürün giriş, çıkış ve sayım işlemlerini takip edin
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={() => handleOpenModal("stock_in")} className="border-green-200 hover:bg-green-50 hover:text-green-700">
                            <ArrowDownToLine className="h-4 w-4 mr-2 text-green-600" />
                            Stok Girişi
                        </Button>
                        <Button variant="outline" onClick={() => handleOpenModal("stock_out")} className="border-red-200 hover:bg-red-50 hover:text-red-700">
                            <ArrowUpFromLine className="h-4 w-4 mr-2 text-red-600" />
                            Stok Çıkışı
                        </Button>
                    </div>
                </div>

                {/* Quick stats */}
                <div className="grid gap-4 sm:grid-cols-3">
                    <Card>
                        <CardContent className="pt-5">
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-50">
                                    <ArrowDownToLine className="h-5 w-5 text-green-600" />
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Bugün Girişler</p>
                                    <p className="text-xl font-bold">{todayIn}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-5">
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-50">
                                    <ArrowUpFromLine className="h-5 w-5 text-red-600" />
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Bugün Çıkışlar</p>
                                    <p className="text-xl font-bold">{todayOut}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-5">
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50">
                                    <ArrowLeftRight className="h-5 w-5 text-blue-600" />
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Net Hareket (Ay)</p>
                                    <p className="text-xl font-bold">...</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Search */}
                <div className="relative max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Ürün adı veya not ile ara..."
                        className="pl-10"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>

                {/* Table */}
                <Card>
                    {loading ? (
                        <div className="p-8 text-center text-muted-foreground animate-pulse">Yükleniyor...</div>
                    ) : filteredMovements.length === 0 ? (
                        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted mb-4">
                                <Package className="h-8 w-8 text-muted-foreground/50" />
                            </div>
                            <h3 className="text-lg font-semibold">
                                Stok hareketi bulunamadı
                            </h3>
                            <p className="text-sm text-muted-foreground mt-2 max-w-sm">
                                Seçili filtrelerde gösterilecek kayıt yok veya henüz işlem yapmadınız.
                            </p>
                        </CardContent>
                    ) : (
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Tarih</TableHead>
                                        <TableHead>İşlem Türü</TableHead>
                                        <TableHead>Ürün</TableHead>
                                        <TableHead>Miktar</TableHead>
                                        <TableHead>Eski Stok</TableHead>
                                        <TableHead>Yeni Stok</TableHead>
                                        <TableHead>Not</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredMovements.map((m) => (
                                        <TableRow key={m.id}>
                                            <TableCell className="text-sm">
                                                {new Date(m.created_at).toLocaleString("tr-TR", { dateStyle: 'short', timeStyle: 'short' })}
                                            </TableCell>
                                            <TableCell>
                                                {m.movement_type === "stock_in" ? (
                                                    <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-green-50 text-green-700 text-xs font-medium">
                                                        <ArrowDownToLine className="w-3 h-3" /> Giriş
                                                    </span>
                                                ) : m.movement_type === "stock_out" ? (
                                                    <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-red-50 text-red-700 text-xs font-medium">
                                                        <ArrowUpFromLine className="w-3 h-3" /> Çıkış
                                                    </span>
                                                ) : m.movement_type === "sale" ? (
                                                    <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-blue-50 text-blue-700 text-xs font-medium">
                                                        📦 Satış
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-orange-50 text-orange-700 text-xs font-medium">
                                                        Ayarlama
                                                    </span>
                                                )}
                                            </TableCell>
                                            <TableCell className="font-medium">
                                                {m.product?.name || "Bilinmeyen Ürün"}
                                            </TableCell>
                                            <TableCell className="font-semibold">
                                                {m.movement_type === "stock_out" || m.movement_type === "sale" ? "-" : "+"}{m.quantity}
                                            </TableCell>
                                            <TableCell className="text-muted-foreground">{m.previous_quantity}</TableCell>
                                            <TableCell className="font-medium">{m.new_quantity}</TableCell>
                                            <TableCell className="text-muted-foreground text-sm max-w-[200px] truncate" title={m.note}>
                                                {m.note || "-"}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    )}
                </Card>
            </div>

            {/* Modal */}
            <Dialog open={modalOpen} onOpenChange={setModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            {moveType === "stock_in" ? "Yeni Stok Girişi" : "Yeni Stok Çıkışı"}
                        </DialogTitle>
                        <DialogDescription>
                            Depoya eklenecek veya çıkarılacak miktar detaylarını girin.
                        </DialogDescription>
                    </DialogHeader>
                    {isQuickAdd ? (
                        <div className="space-y-4 pt-2 mb-2 max-h-[80vh] overflow-y-auto">
                            <div className="flex justify-between items-center mb-2 px-1">
                                <h4 className="font-semibold text-lg text-primary">Yeni Ürün Ekle</h4>
                                <Button type="button" variant="ghost" size="sm" onClick={() => setIsQuickAdd(false)}>
                                    Listeye Dön
                                </Button>
                            </div>
                            <ProductForm
                                categories={categories}
                                suppliers={suppliers}
                                hideHeader={true}
                                onSuccess={handleQuickAddSuccess}
                            />
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
                            <div className="space-y-2 relative z-50">
                                <div className="flex justify-between items-center">
                                    <Label>Ürün Seçin / Barkod Okutun</Label>
                                    <Button type="button" variant="link" className="h-auto p-0 text-xs" onClick={() => setIsQuickAdd(true)}>
                                        + Yeni Ürün Oluştur
                                    </Button>
                                </div>

                                <div className="flex gap-2 relative">
                                    <div className="relative flex-1">
                                        <ScanBarcode className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            placeholder="Ürün adı veya barkod..."
                                            className="pl-10"
                                            autoComplete="off"
                                            value={searchQuery}
                                            onChange={(e) => {
                                                setSearchQuery(e.target.value);
                                                setSelectedProductId(""); // User starts typing again, clear selection
                                            }}
                                        />
                                        {/* Dropdown for Stock Modal */}
                                        {stockSearchResults.length > 0 && (
                                            <div className="absolute z-[100] w-full mt-1 bg-background border rounded-md shadow-lg overflow-hidden">
                                                <ul className="max-h-[200px] overflow-y-auto py-1">
                                                    {stockSearchResults.map(p => (
                                                        <li
                                                            key={p.id}
                                                            className="px-3 py-2 hover:bg-muted cursor-pointer flex justify-between items-center transition-colors border-b last:border-0 text-sm"
                                                            onClick={() => {
                                                                setSelectedProductId(p.id);
                                                                setSearchQuery(p.name);
                                                            }}
                                                        >
                                                            <div className="flex flex-col">
                                                                <span className="font-medium">{p.name}</span>
                                                                <span className="text-xs text-muted-foreground">{p.barcode || "Barkod yok"}</span>
                                                            </div>
                                                            <span className="text-xs font-semibold tabular-nums">Stok: {p.stock_quantity}</span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                    </div>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="icon"
                                        className="shrink-0"
                                        onClick={() => setIsScannerOpen(true)}
                                    >
                                        <Camera className="h-4 w-4 text-muted-foreground" />
                                    </Button>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label>Miktar</Label>
                                <Input
                                    type="number"
                                    min="1"
                                    placeholder="Örn: 10"
                                    value={quantity}
                                    onChange={(e) => setQuantity(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Not (Opsiyonel)</Label>
                                <Textarea
                                    placeholder="İşlem açıklaması yazın (Fatura no vb.)"
                                    value={note}
                                    onChange={(e) => setNote(e.target.value)}
                                />
                            </div>
                            <div className="flex justify-end gap-2 pt-2">
                                <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>
                                    İptal
                                </Button>
                                <Button type="submit" disabled={submitting || !selectedProductId || !quantity}>
                                    {submitting ? "Kaydediliyor..." : "İşlemi Kaydet"}
                                </Button>
                            </div>
                        </form>
                    )}
                </DialogContent>
            </Dialog>

            <BarcodeScannerDialog
                isOpen={isScannerOpen}
                onClose={() => setIsScannerOpen(false)}
                onResult={(content) => {
                    const match = products.find(p => p.barcode === content || p.internal_code === content);
                    if (match) {
                        setSelectedProductId(match.id);
                        setSearchQuery(match.name);
                        setIsScannerOpen(false);
                    } else {
                        toast.error("Okunan barkoda sahip ürün bulunamadı!");
                    }
                }}
            />
        </>
    );
}
