import Link from "next/link";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Package, ArrowLeft } from "lucide-react";
import { ProductForm } from "@/components/products/product-form";
import { getCategories, getSuppliers } from "@/lib/services/products";

export default async function NewProductPage() {
    const categories = await getCategories();
    const suppliers = await getSuppliers();

    return (
        <>
            <Header title="Yeni Ürün Ekle" />
            <div className="p-4 sm:p-6 space-y-6 max-w-3xl mx-auto w-full">
                {/* Back link */}
                <Link
                    href="/products"
                    className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Ürünlere Dön
                </Link>

                <ProductForm categories={categories} suppliers={suppliers} />
            </div>
        </>
    );
}
