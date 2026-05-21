"use client";
import { toast } from "sonner";
import { useState, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Save, Camera, ImagePlus, X, Loader2 } from "lucide-react";
import Image from "next/image";
import { BarcodeScannerDialog } from "@/components/ui/barcode-scanner";

import { productSchema } from "@/lib/validations/product";
import { ProductFormValues, Category, Supplier } from "@/types/database";
import { createProduct, updateProduct } from "@/lib/services/products";
import { uploadProductImage } from "@/lib/services/upload";

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

    // Image upload state
    const [imagePreview, setImagePreview] = useState<string | null>(initialData?.image_url || null);
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [isUploadingImage, setIsUploadingImage] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

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
            outlet_price: initialData?.outlet_price || 0,
            stock_quantity: initialData?.stock_quantity || 0,
            min_stock_quantity: initialData?.min_stock_quantity || 0,
            image_url: initialData?.image_url || "",
        },
    });

    const categoryId = watch("category_id");
    const supplierId = watch("supplier_id");
    const costPrice = watch("cost_price");
    const salePrice = watch("sale_price"); // List price
    const outletPrice = watch("outlet_price"); // Actual selling price

    // Profit margin calculation based on actual selling price (outlet_price)
    const profitInfo = useMemo(() => {
        const cost = Number(costPrice) || 0;
        const sale = Number(outletPrice) || 0;
        if (cost <= 0 || sale <= 0) return null;

        const profit = sale - cost;
        const marginPercent = ((profit / cost) * 100).toFixed(1);

        return {
            profit,
            marginPercent,
            isPositive: profit > 0,
        };
    }, [costPrice, outletPrice]);

    // Handle image file selection (camera or gallery)
    function handleImageSelect(event: React.ChangeEvent<HTMLInputElement>) {
        const file = event.target.files?.[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith("image/")) {
            toast.error("Lütfen geçerli bir resim dosyası seçin.");
            return;
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            toast.error("Resim boyutu en fazla 5MB olabilir.");
            return;
        }

        setImageFile(file);

        // Create preview
        const reader = new FileReader();
        reader.onloadend = () => {
            setImagePreview(reader.result as string);
        };
        reader.readAsDataURL(file);
    }

    function removeImage() {
        setImageFile(null);
        setImagePreview(null);
        setValue("image_url", "");
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    }

    async function onSubmit(data: ProductFormValues) {
        setIsSubmitting(true);
        setError(null);

        try {
            let imageUrl = data.image_url || "";

            // If a new image file is selected, upload it first
            if (imageFile) {
                setIsUploadingImage(true);
                try {
                    imageUrl = await uploadProductImage(imageFile);
                } catch (uploadErr: any) {
                    setError(uploadErr.message || "Resim yüklenirken bir hata oluştu.");
                    setIsSubmitting(false);
                    setIsUploadingImage(false);
                    return;
                }
                setIsUploadingImage(false);
            }

            const submitData = { ...data, image_url: imageUrl };

            let savedProduct;
            if (isEditing) {
                savedProduct = await updateProduct(initialData.id, submitData);
            } else {
                savedProduct = await createProduct(submitData);
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

                    {/* ── Image Upload Section ── */}
                    <div className="space-y-2">
                        <Label>Ürün Fotoğrafı</Label>
                        <div className="flex items-start gap-4">
                            {/* Preview / Placeholder */}
                            <div
                                className="relative group flex-shrink-0 w-28 h-28 sm:w-32 sm:h-32 rounded-xl border-2 border-dashed border-muted-foreground/25 bg-muted/30 flex items-center justify-center overflow-hidden cursor-pointer hover:border-primary/50 hover:bg-muted/50 transition-all"
                                onClick={() => fileInputRef.current?.click()}
                            >
                                {imagePreview ? (
                                    <>
                                        <img
                                            src={imagePreview}
                                            alt="Ürün önizleme"
                                            className="w-full h-full object-cover rounded-xl"
                                        />
                                        {/* Remove button overlay */}
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                removeImage();
                                            }}
                                            className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
                                        >
                                            <X className="h-3.5 w-3.5" />
                                        </button>
                                    </>
                                ) : (
                                    <div className="flex flex-col items-center gap-1.5 text-muted-foreground">
                                        <ImagePlus className="h-8 w-8" />
                                        <span className="text-xs font-medium">Fotoğraf Ekle</span>
                                    </div>
                                )}
                            </div>

                            {/* Upload Buttons */}
                            <div className="flex flex-col gap-2 pt-1">
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="justify-start gap-2"
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    <ImagePlus className="h-4 w-4" />
                                    Galeriden Seç
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="justify-start gap-2"
                                    onClick={() => {
                                        // Create a temporary input with capture attribute for camera
                                        const cameraInput = document.createElement("input");
                                        cameraInput.type = "file";
                                        cameraInput.accept = "image/*";
                                        cameraInput.capture = "environment";
                                        cameraInput.onchange = (e) => {
                                            const target = e.target as HTMLInputElement;
                                            const file = target.files?.[0];
                                            if (file) {
                                                // Reuse same handler logic
                                                if (!file.type.startsWith("image/")) {
                                                    toast.error("Lütfen geçerli bir resim dosyası seçin.");
                                                    return;
                                                }
                                                if (file.size > 5 * 1024 * 1024) {
                                                    toast.error("Resim boyutu en fazla 5MB olabilir.");
                                                    return;
                                                }
                                                setImageFile(file);
                                                const reader = new FileReader();
                                                reader.onloadend = () => {
                                                    setImagePreview(reader.result as string);
                                                };
                                                reader.readAsDataURL(file);
                                            }
                                        };
                                        cameraInput.click();
                                    }}
                                >
                                    <Camera className="h-4 w-4" />
                                    Kamera ile Çek
                                </Button>
                                {imagePreview && (
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        className="justify-start gap-2 text-destructive hover:text-destructive"
                                        onClick={removeImage}
                                    >
                                        <X className="h-4 w-4" />
                                        Kaldır
                                    </Button>
                                )}
                                <p className="text-xs text-muted-foreground mt-1">
                                    JPG, PNG veya WebP • Maks. 5MB
                                </p>
                            </div>

                            {/* Hidden file input for gallery */}
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={handleImageSelect}
                            />
                        </div>
                    </div>

                    {/* ── Product Name ── */}
                    <div className="space-y-2">
                        <Label htmlFor="name">Ürün Adı <span className="text-destructive">*</span></Label>
                        <Input id="name" placeholder="Ürün adını girin" {...register("name")} />
                        {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
                    </div>

                    {/* ── Brand & Size ── */}
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

                    {/* ── Barcode & Internal Code ── */}
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

                    {/* ── Category & Supplier ── */}
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

                    {/* ── Prices with Profit Margin ── */}
                    <div className="space-y-3">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="cost_price">Maliyet Fiyatı (₺)</Label>
                                <Input id="cost_price" type="number" step="0.01" {...register("cost_price")} />
                                {errors.cost_price && <p className="text-sm text-destructive">{errors.cost_price.message}</p>}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="sale_price">Liste Satış Fiyatı (₺)</Label>
                                <Input id="sale_price" type="number" step="0.01" {...register("sale_price")} />
                                {errors.sale_price && <p className="text-sm text-destructive">{errors.sale_price.message}</p>}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="outlet_price">Geçerli Fiyat / Outlet (₺)</Label>
                                <Input id="outlet_price" type="number" step="0.01" {...register("outlet_price")} />
                                {errors.outlet_price && <p className="text-sm text-destructive">{errors.outlet_price.message}</p>}
                            </div>
                        </div>

                        {/* Profit Margin Info */}
                        {profitInfo && (
                            <div
                                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium border ${profitInfo.isPositive
                                    ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800"
                                    : "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/30 dark:text-red-400 dark:border-red-800"
                                    }`}
                            >
                                <span>
                                    {profitInfo.isPositive ? "📈" : "📉"}{" "}
                                    Kâr: {profitInfo.profit.toLocaleString("tr-TR", { minimumFractionDigits: 2 })} ₺
                                    {" "}({profitInfo.isPositive ? "+" : ""}{profitInfo.marginPercent}% marj)
                                </span>
                            </div>
                        )}
                    </div>

                    {/* ── Stock Quantities ── */}
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

                    {/* ── Submit Buttons ── */}
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
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    {isUploadingImage ? "Resim yükleniyor..." : "Kaydediliyor..."}
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
