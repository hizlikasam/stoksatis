"use client";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    ScanBarcode,
    ShoppingCart,
    Trash2,
    Banknote,
    CreditCard,
    Plus,
    Minus,
    Camera
} from "lucide-react";
import { BarcodeScannerDialog } from "@/components/ui/barcode-scanner";
import { createSale, SaleItemData } from "@/lib/services/sales";
import { getProducts } from "@/lib/services/products";
import { Product } from "@/types/database";

export default function PosClient({ businessId }: { businessId: string }) {
    const [barcodeInput, setBarcodeInput] = useState("");
    const [cart, setCart] = useState<(SaleItemData & { product: Product })[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [loadingProducts, setLoadingProducts] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [isScannerOpen, setIsScannerOpen] = useState(false);
    const [discountType, setDiscountType] = useState<"amount" | "final_price">("amount");
    const [discountInputValue, setDiscountInputValue] = useState<string>("");

    useEffect(() => {
        // Load products for quick search / barcode matching
        getProducts()
            .then(setProducts)
            .catch((err) => console.error(err))
            .finally(() => setLoadingProducts(false));
    }, []);

    const addToCart = (product: Product) => {
        setCart((prev) => {
            const existing = prev.find((p) => p.product_id === product.id);
            if (existing) {
                // Check stock
                if (existing.quantity + 1 > product.stock_quantity) {
                    toast.error(`"${product.name}" için yeterli stok yok.`);
                    return prev;
                }
                return prev.map((p) =>
                    p.product_id === product.id
                        ? {
                            ...p,
                            quantity: p.quantity + 1,
                            total_price: (p.quantity + 1) * p.unit_price,
                        }
                        : p
                );
            }
            // Check stock for new item
            if (product.stock_quantity < 1) {
                toast.error(`"${product.name}" tütkendi.`);
                return prev;
            }
            return [
                ...prev,
                {
                    product_id: product.id,
                    quantity: 1,
                    unit_price: product.outlet_price,
                    cost_price: product.cost_price,
                    total_price: product.outlet_price,
                    product,
                },
            ];
        });
    };

    const updateQuantity = (productId: string, change: number) => {
        setCart((prev) => {
            return prev
                .map((p) => {
                    if (p.product_id === productId) {
                        const newQ = p.quantity + change;
                        if (newQ > p.product.stock_quantity) {
                            toast.error(`Yeterli stok yok.`);
                            return p;
                        }
                        return {
                            ...p,
                            quantity: newQ,
                            total_price: newQ * p.unit_price,
                        };
                    }
                    return p;
                })
                .filter((p) => p.quantity > 0);
        });
    };

    const handleBarcodeSubmit = (e?: React.FormEvent, directScanContent?: string) => {
        if (e) e.preventDefault();
        const search = directScanContent || barcodeInput.trim();
        if (!search) return;

        const searchLower = search.toLowerCase();

        // Önce tam eşleşme (barkod, iç kod)
        const exactMatch = products.find((p) => p.barcode === search || p.internal_code === searchLower);
        if (exactMatch) {
            addToCart(exactMatch);
            setBarcodeInput("");
            return;
        }

        // Exact match yoksa isme göre tam eşleşme ara
        const exactNameMatch = products.find((p) => p.name.toLowerCase() === searchLower);
        if (exactNameMatch) {
            addToCart(exactNameMatch);
            setBarcodeInput("");
            return;
        }

        toast.error("Ürün tam olarak bulunamadı. Lütfen listeden seçin veya barkodu kontrol edin.");
    };

    const searchLower = barcodeInput.toLocaleLowerCase("tr-TR").trim();
    const searchResults = searchLower.length > 1
        ? products.filter(p =>
            p.name.toLocaleLowerCase("tr-TR").includes(searchLower) ||
            p.barcode?.includes(searchLower) ||
            p.internal_code?.toLocaleLowerCase("tr-TR").includes(searchLower)
        ).slice(0, 8)
        : [];

    const subtotal = cart.reduce((sum, item) => sum + item.total_price, 0);

    // İndirim Hesaplaması
    const parsedDiscountInput = parseFloat(discountInputValue) || 0;
    let discountToApply = 0;

    if (discountType === "amount") {
        discountToApply = parsedDiscountInput;
    } else if (discountType === "final_price") {
        discountToApply = subtotal - parsedDiscountInput;
    }

    if (discountToApply < 0) discountToApply = 0;
    if (discountToApply > subtotal && discountType === "amount") discountToApply = subtotal;

    const finalAmount = subtotal - discountToApply;

    const handleCheckout = async (paymentMethod: "cash" | "credit_card") => {
        if (cart.length === 0) return;
        setSubmitting(true);
        try {
            // Remove 'product' object to match SaleItemData interface
            const itemsToSave = cart.map(({ product_id, quantity, unit_price, cost_price, total_price }) => ({
                product_id, quantity, unit_price, cost_price, total_price
            }));

            await createSale(
                businessId,
                subtotal,
                discountToApply, // applied discount
                finalAmount,
                paymentMethod,
                "", // note
                itemsToSave
            );

            toast.success("Satış başarıyla tamamlandı!");
            setCart([]);
            setDiscountInputValue(""); // İndirimi sıfırla
            // Reload products to update stock quantities
            const newProds = await getProducts();
            setProducts(newProds);
        } catch (error: any) {
            toast.error(error.message || "Satış işleminde hata.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <>
            <Header title="Satış (POS)" />
            <div className="p-4 sm:p-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left: Barcode + product input */}
                    <div className="lg:col-span-2 space-y-4">
                        {/* Barcode input */}
                        <Card className="relative z-50 overflow-visible">
                            <CardContent className="pt-5 overflow-visible">
                                <form onSubmit={(e) => handleBarcodeSubmit(e)} className="flex gap-3">
                                    <div className="relative flex-1">
                                        <div className="flex gap-2">
                                            <div className="relative flex-1">
                                                <ScanBarcode className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                                <Input
                                                    placeholder="Barkod okutun veya ürün arayın..."
                                                    className="pl-10 h-12 text-base"
                                                    autoFocus
                                                    value={barcodeInput}
                                                    onChange={(e) => setBarcodeInput(e.target.value)}
                                                    disabled={loadingProducts}
                                                    autoComplete="off"
                                                />
                                            </div>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="icon"
                                                className="h-12 w-12"
                                                onClick={() => setIsScannerOpen(true)}
                                            >
                                                <Camera className="h-5 w-5 text-muted-foreground" />
                                            </Button>
                                        </div>

                                        {/* Autocomplete Dropdown */}
                                        {searchResults.length > 0 && (
                                            <div className="absolute z-[100] w-full mt-2 bg-background border rounded-md shadow-xl overflow-hidden">
                                                <ul className="max-h-[300px] overflow-y-auto py-1">
                                                    {searchResults.map(p => (
                                                        <li
                                                            key={p.id}
                                                            className="px-4 py-2 hover:bg-muted cursor-pointer flex justify-between items-center transition-colors"
                                                            onClick={() => {
                                                                addToCart(p);
                                                                setBarcodeInput("");
                                                            }}
                                                        >
                                                            <div className="flex flex-col">
                                                                <span className="font-medium text-sm">{p.name} {p.brand && <span className="text-muted-foreground font-normal text-xs ml-1">({p.brand})</span>}</span>
                                                                <span className="text-xs text-muted-foreground">
                                                                    {p.barcode || p.internal_code || "Kodu yok"} {p.size && `- ${p.size}`}
                                                                </span>
                                                            </div>
                                                            <div className="flex flex-col items-end">
                                                                <span className="text-xs text-muted-foreground line-through">₺{p.sale_price.toFixed(2)}</span>
                                                                <span className="font-semibold text-sm tabular-nums text-emerald-600">₺{p.outlet_price.toFixed(2)}</span>
                                                            </div>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                    </div>
                                    <Button type="submit" size="lg" variant="outline" disabled={!barcodeInput || loadingProducts}>
                                        Ekle
                                    </Button>
                                </form>
                            </CardContent>
                        </Card>

                        {/* Cart items */}
                        <Card className="min-h-[400px] flex flex-col">
                            <CardHeader className="pb-3 border-b">
                                <CardTitle className="text-base flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <ShoppingCart className="h-4 w-4" />
                                        Sepet
                                    </div>
                                    <span className="text-sm font-normal text-muted-foreground bg-muted px-2 py-1 rounded-md">
                                        {cart.length} çeşit
                                    </span>
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="flex-1 p-0 flex flex-col">
                                {/* Cart header */}
                                {cart.length > 0 && (
                                    <div className="hidden sm:grid grid-cols-12 gap-2 text-xs font-semibold text-muted-foreground border-b py-3 px-6 bg-muted/40">
                                        <div className="col-span-5">Ürün</div>
                                        <div className="col-span-3 text-center">Miktar</div>
                                        <div className="col-span-2 text-right">Fiyat</div>
                                        <div className="col-span-2 text-right">Toplam</div>
                                    </div>
                                )}

                                {/* Cart Body */}
                                <div className="flex-1 overflow-auto">
                                    {cart.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center h-full py-20 text-center">
                                            <ShoppingCart className="h-10 w-10 text-muted-foreground/30 mb-3" />
                                            <p className="text-base font-medium text-muted-foreground">
                                                Sepet boş
                                            </p>
                                            <p className="text-sm text-muted-foreground/70 mt-1 max-w-[200px]">
                                                Barkod okutarak ürünü sepete ekleyin
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="divide-y">
                                            {cart.map((item) => (
                                                <div key={item.product_id} className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center p-4 hover:bg-muted/30 transition-colors">
                                                    <div className="sm:col-span-5 flex flex-col gap-1">
                                                        <span className="font-semibold text-sm line-clamp-1">{item.product.name}</span>
                                                        <span className="text-xs text-muted-foreground font-mono bg-muted/50 w-fit px-1.5 py-0.5 rounded">
                                                            {item.product.barcode || item.product.internal_code || "-"}
                                                        </span>
                                                    </div>

                                                    <div className="sm:col-span-3 flex justify-center items-center gap-1.5">
                                                        <Button
                                                            variant="outline"
                                                            size="icon"
                                                            className="h-8 w-8 rounded-full border-muted-foreground/30 hover:border-destructive hover:text-destructive hover:bg-destructive/10"
                                                            onClick={() => updateQuantity(item.product_id, -1)}
                                                        >
                                                            {item.quantity === 1 ? <Trash2 className="h-3.5 w-3.5" /> : <Minus className="h-3.5 w-3.5" />}
                                                        </Button>
                                                        <div className="w-10 text-center font-semibold tabular-nums text-sm">
                                                            {item.quantity}
                                                        </div>
                                                        <Button
                                                            variant="outline"
                                                            size="icon"
                                                            className="h-8 w-8 rounded-full border-muted-foreground/30 hover:border-primary hover:text-primary hover:bg-primary/10"
                                                            onClick={() => updateQuantity(item.product_id, 1)}
                                                            disabled={item.quantity >= item.product.stock_quantity}
                                                        >
                                                            <Plus className="h-3.5 w-3.5" />
                                                        </Button>
                                                    </div>

                                                    <div className="sm:col-span-2 text-right flex sm:block items-center justify-between">
                                                        <span className="sm:hidden text-xs text-muted-foreground">Birim:</span>
                                                        <span className="text-sm text-muted-foreground tabular-nums">₺{item.unit_price.toFixed(2)}</span>
                                                    </div>

                                                    <div className="sm:col-span-2 text-right flex sm:block items-center justify-between">
                                                        <span className="sm:hidden text-xs text-muted-foreground">Toplam:</span>
                                                        <span className="text-sm font-semibold tabular-nums">₺{item.total_price.toFixed(2)}</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Right: Summary + payment */}
                    <div className="space-y-4">
                        <Card className="sticky top-6">
                            <CardHeader className="pb-4 border-b bg-muted/20">
                                <CardTitle className="text-lg">Ödeme Özeti</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-6 pt-6">
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-muted-foreground font-medium">Ara Toplam</span>
                                        <span className="font-semibold tabular-nums">₺{subtotal.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-muted-foreground font-medium">İndirim Tipi</span>
                                        <Select value={discountType} onValueChange={(val: any) => {
                                            setDiscountType(val);
                                            setDiscountInputValue("");
                                        }}>
                                            <SelectTrigger className="w-[140px] h-8 text-xs">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="amount">İndirim Tutarı Gireceğim</SelectItem>
                                                <SelectItem value="final_price">Net Fiyat Belirleyeceğim</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-muted-foreground font-medium">
                                            {discountType === "amount" ? "Eksi İndirim (₺)" : "Ödenecek Tutar (₺)"}
                                        </span>
                                        <div className="relative w-[140px]">
                                            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">₺</span>
                                            <Input
                                                type="number"
                                                className="h-8 pl-6 text-right text-sm"
                                                placeholder={discountType === "amount" ? "0.00" : "0.00"}
                                                value={discountInputValue}
                                                onChange={(e) => setDiscountInputValue(e.target.value)}
                                            />
                                        </div>
                                    </div>
                                    {discountToApply > 0 && (
                                        <div className="flex justify-between items-center text-sm pt-2">
                                            <span className="text-muted-foreground font-medium text-green-600">Toplam İskonto</span>
                                            <span className="text-green-600 font-semibold tabular-nums">-₺{discountToApply.toFixed(2)}</span>
                                        </div>
                                    )}
                                </div>

                                <Separator className="bg-muted-foreground/20" />

                                <div className="flex justify-between items-center py-2">
                                    <span className="text-lg font-bold">Toplam</span>
                                    <span className="text-3xl font-black text-primary tabular-nums tracking-tight">₺{finalAmount.toFixed(2)}</span>
                                </div>

                                <Separator className="bg-muted-foreground/20" />

                                <div className="space-y-3">
                                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Ödeme Yöntemi</p>
                                    <div className="grid grid-cols-2 gap-3">
                                        <Button
                                            variant="outline"
                                            className="h-16 flex-col gap-1.5 border-primary/20 hover:border-primary hover:bg-primary/5 active:scale-95 transition-all"
                                            onClick={() => handleCheckout("cash")}
                                            disabled={cart.length === 0 || submitting}
                                        >
                                            <Banknote className="h-5 w-5 text-emerald-600" />
                                            <span className="text-xs font-semibold">Nakit</span>
                                        </Button>
                                        <Button
                                            variant="outline"
                                            className="h-16 flex-col gap-1.5 border-primary/20 hover:border-primary hover:bg-primary/5 active:scale-95 transition-all"
                                            onClick={() => handleCheckout("credit_card")}
                                            disabled={cart.length === 0 || submitting}
                                        >
                                            <CreditCard className="h-5 w-5 text-blue-600" />
                                            <span className="text-xs font-semibold">Kredi Kartı</span>
                                        </Button>
                                    </div>
                                </div>

                                <div className="pt-2">
                                    <Button
                                        variant="ghost"
                                        className="w-full text-destructive hover:text-destructive hover:bg-destructive/10"
                                        onClick={() => {
                                            setCart([]);
                                            setDiscountInputValue("");
                                        }}
                                        disabled={cart.length === 0 || submitting}
                                    >
                                        <Trash2 className="h-4 w-4 mr-2" />
                                        İptal (Sepeti Temizle)
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
            <BarcodeScannerDialog
                isOpen={isScannerOpen}
                onClose={() => setIsScannerOpen(false)}
                onResult={(res) => handleBarcodeSubmit(undefined, res)}
            />
        </>
    );
}
