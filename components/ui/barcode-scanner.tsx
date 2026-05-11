"use client";

import React, { useEffect, useRef, useState } from "react";
import { Html5QrcodeScanner, Html5QrcodeScanType } from "html5-qrcode";
import { Button } from "@/components/ui/button";
import { X, Camera } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface BarcodeScannerProps {
    onResult: (result: string) => void;
    isOpen: boolean;
    onClose: () => void;
}

export function BarcodeScannerDialog({ onResult, isOpen, onClose }: BarcodeScannerProps) {
    const scannerRef = useRef<Html5QrcodeScanner | null>(null);
    const [error, setError] = useState("");

    useEffect(() => {
        if (isOpen) {
            // Need a slight delay to ensure DOM element is mounted inside the Dialog Content
            const initScanner = setTimeout(() => {
                scannerRef.current = new Html5QrcodeScanner(
                    "reader",
                    {
                        fps: 15,
                        // qrbox alanını kaldırıyoruz ki kameranın GÖRDÜĞÜ TÜM ALANI (tam çerçeve) tarasın.
                        // Dar çerçeveye oturtma zorunluluğu ortadan kalkar.
                        videoConstraints: {
                            facingMode: "environment", // mobilde arka kamerayı zorlar
                        },
                        experimentalFeatures: {
                            useBarCodeDetectorIfSupported: true // Tarayıcı destekliyorsa donanımsal hızlandırma kullanır
                        },
                        rememberLastUsedCamera: true,
                    },
                    false
                );

                scannerRef.current.render(
                    (decodedText) => {
                        // On success
                        scannerRef.current?.clear().catch(console.error);
                        onResult(decodedText);
                        onClose();
                    },
                    (errorMessage) => {
                        // Error callback is called very frequently, we don't need to log everything
                        // just ignore unless it's a fatal error
                    }
                );
            }, 100);

            return () => {
                clearTimeout(initScanner);
                if (scannerRef.current) {
                    scannerRef.current.clear().catch(console.error);
                }
            };
        }
    }, [isOpen, onResult, onClose]);

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Barkod Okutun</DialogTitle>
                    <DialogDescription>
                        Ürününüzün barkodunu kameraya gösterin. Tarayıcı izin isterse "İzin Ver" (Allow) butonuna tıklayın.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex flex-col items-center justify-center min-h-[300px]">
                    {error ? (
                        <p className="text-sm text-destructive">{error}</p>
                    ) : (
                        <div id="reader" className="w-full max-w-sm rounded overflow-hidden"></div>
                    )}
                </div>

                <div className="flex justify-center mt-4">
                    <Button variant="outline" onClick={onClose}>
                        <X className="mr-2 h-4 w-4" /> İptal
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
