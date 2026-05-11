import Link from "next/link";
import { notFound } from "next/navigation";
import { Header } from "@/components/layout/header";
import { ArrowLeft } from "lucide-react";
import { ProductForm } from "@/components/products/product-form";
import { getProductById, getCategories, getSuppliers } from "@/lib/services/products";

interface EditProductPageProps {
    params: Promise<{ id: string }>;
}

export default async function EditProductPage({ params }: EditProductPageProps) {
    const { id } = await params;

    const product = await getProductById(id);

    if (!product) {
        notFound();
    }

    const categories = await getCategories();
    const suppliers = await getSuppliers();

    return (
        <>
            <Header title="Ürün Düzenle" />
            <div className="p-4 sm:p-6 space-y-6 max-w-3xl mx-auto w-full">
                {/* Back link */}
                <Link
                    href="/products"
                    className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Ürünlere Dön
                </Link>

                <ProductForm initialData={product} categories={categories} suppliers={suppliers} />
            </div>
        </>
    );
}
