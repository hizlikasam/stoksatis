"use client";

import { useEffect } from "react";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";

export default function ProductsError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        // Optionally log the error to an error reporting service
        console.error("Products page error:", error);
    }, [error]);

    return (
        <>
            <Header title="Ürünler" />
            <div className="p-4 sm:p-6 space-y-6">
                <Card className="border-destructive/50 bg-destructive/5">
                    <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10 mb-4 text-destructive">
                            <AlertCircle className="h-8 w-8" />
                        </div>
                        <h3 className="text-lg font-semibold text-destructive">
                            Ürünler Yüklenemedi
                        </h3>
                        <p className="text-sm text-destructive/80 mt-2 max-w-md">
                            Veritabanına bağlanırken veya güncel ürün listesini getirirken bir
                            hata oluştu. İnternet bağlantınızı veya veritabanı ayarlarınızı kontrol edin.
                        </p>
                        <p className="text-xs text-muted-foreground mt-4 mb-6">
                            Hata Detayı: {error.message}
                        </p>
                        <Button variant="outline" onClick={() => reset()}>
                            Tekrar Dene
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </>
    );
}
