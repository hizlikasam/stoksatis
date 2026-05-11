"use client";
import { toast } from "sonner";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Save, Camera } from "lucide-react";
import { BarcodeScannerDialog } from "@/components/ui/barcode-scanner";

import { productSchema } from "@/lib/validations/product";
import { ProductFormValues, Category, Supplier } from "@/types/database";
import { createProduct, updateProduct } from "@/lib/services/products";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

interface ProductFormProps {
    initialData?: any; // The existing product if editing
    categories: Category[];
    suppliers: Supplier[];
    onSuccess?: (product: any) => void;
    hideHeader?: boolean;
}

export function ProductForm({ initialData, categories, suppliers, onSuccess, hideHeader }: ProductFormProps) {
    const router = useRouter();
    const [error, setError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isScannerOpen, setIsScannerOpen] = useState(false);

    const isEditing = !!initialData;

    const {
        register,
        handleSubmit,
        setValue,
        watch,
        formState: { errors },
    } = useForm<ProductFormValues>({
        resolver: zodResolver(productSchema as any),
        defaultValues: {
            name: initialData?.name || "",
            brand: initialData?.brand || "",
            size: initialData?.size || "",
            barcode: initialData?.barcode || "",
            internal_code: initialData?.internal_code || "",
            category_id: initialData?.category_id || "",
            supplier_id: initialData?.supplier_id || "",
            cost_price: initialData?.cost_price || 0,
            sale_price: initialData?.sale_price || 0,
            stock_quantity: initialData?.stock_quantity || 0,
            min_stock_quantity: initialData?.min_stock_quantity || 0,
            image_url: initialData?.image_url || "",
        },
    });

    const categoryId = watch("category_id");
    const supplierId = watch("supplier_id");

    async function onSubmit(data: ProductFormValues) {
        setIsSubmitting(true);
        setError(null);

        try {
            let savedProduct;
            if (isEditing) {
                savedProduct = await updateProduct(initialData.id, data);
            } else {
                savedProduct = await createProduct(data);
            }

            if (onSuccess) {
                onSuccess(savedProduct);
            } else {
                toast.success("Ürün başarıyla kaydedildi!");
                window.location.href = "/products";
            }
        } catch (err: any) {
            console.error(err);
            setError(err.message || "Kaydetme işlemi sırasında bir hata oluştu.");
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <Card className={hideHeader ? "border-0 shadow-none" : ""}>
            {!hideHeader && (
                <CardHeader>
                    <CardTitle>Ürün Bilgileri</CardTitle>
                </CardHeader>
            )}
            <CardContent>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                    {error && (
                        <div className="rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive border border-destructive/20">
                            {error}
                        </div>
                    )}

                    <div className="space-y-2">
                        <Label htmlFor="name">Ürün Adı <span className="text-destructive">*</span></Label>
                        <Input id="name" placeholder="Ürün adını girin" {...register("name")} />
                        {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="brand">Marka (Opsiyonel)</Label>
                            <Input id="brand" placeholder="Örn: Nike, Paşabahçe" {...register("brand")} />
                            {errors.brand && <p className="text-sm text-destructive">{errors.brand.message}</p>}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="size">Boyut / Ölçü (Opsiyonel)</Label>
                            <Input id="size" placeholder="Örn: XL, 42 numara, 500ml" {...register("size")} />
                            {errors.size && <p className="text-sm text-destructive">{errors.size.message}</p>}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="barcode">Barkod</Label>
                            <div className="flex gap-2">
                                <Input id="barcode" placeholder="Barkod numarası" {...register("barcode")} className="flex-1" />
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="icon"
                                    onClick={() => setIsScannerOpen(true)}
                                >
                                    <Camera className="h-4 w-4 text-muted-foreground" />
                                </Button>
                            </div>
                            {errors.barcode && <p className="text-sm text-destructive">{errors.barcode.message}</p>}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="internal_code">İç Kod</Label>
                            <Input id="internal_code" placeholder="Mağaza içi özel kod" {...register("internal_code")} />
                            {errors.internal_code && <p className="text-sm text-destructive">{errors.internal_code.message}</p>}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Kategori</Label>
                            <Select
                                value={categoryId || undefined}
                                onValueChange={(value) => setValue("category_id", value === "none" ? "" : value)}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Kategori seçin" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">Kategori Yok</SelectItem>
                                    {categories.map((c) => (
                                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>Tedarikçi</Label>
                            <Select
                                value={supplierId || undefined}
                                onValueChange={(value) => setValue("supplier_id", value === "none" ? "" : value)}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Tedarikçi seçin" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">Tedarikçi Yok</SelectItem>
                                    {suppliers.map((s) => (
                                        <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="cost_price">Maliyet Fiyatı (₺)</Label>
                            <Input id="cost_price" type="number" step="0.01" {...register("cost_price")} />
                            {errors.cost_price && <p className="text-sm text-destructive">{errors.cost_price.message}</p>}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="sale_price">Satış Fiyatı (₺)</Label>
                            <Input id="sale_price" type="number" step="0.01" {...register("sale_price")} />
                            {errors.sale_price && <p className="text-sm text-destructive">{errors.sale_price.message}</p>}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="stock_quantity">Stok Miktarı</Label>
                            <Input id="stock_quantity" type="number" {...register("stock_quantity")} />
                            {errors.stock_quantity && <p className="text-sm text-destructive">{errors.stock_quantity.message}</p>}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="min_stock_quantity">Min. Stok Uyarısı</Label>
                            <Input id="min_stock_quantity" type="number" {...register("min_stock_quantity")} />
                            {errors.min_stock_quantity && <p className="text-sm text-destructive">{errors.min_stock_quantity.message}</p>}
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => router.back()}
                            disabled={isSubmitting}
                        >
                            İptal
                        </Button>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? (
                                <span className="flex items-center gap-2">
                                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                                    Kaydediliyor...
                                </span>
                            ) : (
                                <span className="flex items-center gap-2">
                                    <Save className="h-4 w-4" />
                                    {isEditing ? "Değişiklikleri Kaydet" : "Ürünü Kaydet"}
                                </span>
                            )}
                        </Button>
                    </div>
                </form>
            </CardContent>

            <BarcodeScannerDialog
                isOpen={isScannerOpen}
                onClose={() => setIsScannerOpen(false)}
                onResult={(res) => setValue("barcode", res)}
            />
        </Card>
    );
}
