"use client";

import React, { useEffect, useRef, useCallback, useState } from "react";
import { Html5Qrcode, Html5QrcodeSupportedFormats } from "html5-qrcode";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

interface BarcodeScannerProps {
    onResult: (result: string) => void;
    isOpen: boolean;
    onClose: () => void;
}

// Supported 1D & 2D barcode formats for product scanning
const SUPPORTED_FORMATS = [
    Html5QrcodeSupportedFormats.EAN_13,
    Html5QrcodeSupportedFormats.EAN_8,
    Html5QrcodeSupportedFormats.UPC_A,
    Html5QrcodeSupportedFormats.UPC_E,
    Html5QrcodeSupportedFormats.CODE_128,
    Html5QrcodeSupportedFormats.CODE_39,
    Html5QrcodeSupportedFormats.CODE_93,
    Html5QrcodeSupportedFormats.ITF,
    Html5QrcodeSupportedFormats.QR_CODE,
    Html5QrcodeSupportedFormats.DATA_MATRIX,
];

const READER_ID = "barcode-reader";

export function BarcodeScannerDialog({
    onResult,
    isOpen,
    onClose,
}: BarcodeScannerProps) {
    const html5QrcodeRef = useRef<Html5Qrcode | null>(null);
    const isScanningRef = useRef(false);
    const hasResultRef = useRef(false);
    const [error, setError] = useState("");

    // Stable callbacks via refs to avoid re-triggering useEffect
    const onResultRef = useRef(onResult);
    const onCloseRef = useRef(onClose);
    useEffect(() => {
        onResultRef.current = onResult;
    }, [onResult]);
    useEffect(() => {
        onCloseRef.current = onClose;
    }, [onClose]);

    const stopScanner = useCallback(async () => {
        if (html5QrcodeRef.current && isScanningRef.current) {
            try {
                await html5QrcodeRef.current.stop();
            } catch {
                // Ignore stop errors
            }
            isScanningRef.current = false;
        }
        // Clear the html5-qrcode instance
        if (html5QrcodeRef.current) {
            try {
                html5QrcodeRef.current.clear();
            } catch {
                // Ignore clear errors
            }
            html5QrcodeRef.current = null;
        }
    }, []);

    useEffect(() => {
        if (!isOpen) return;

        hasResultRef.current = false;
        setError("");

        // Delay to ensure the Dialog DOM is mounted
        const timerId = setTimeout(async () => {
            const readerEl = document.getElementById(READER_ID);
            if (!readerEl) return;

            try {
                const qrcode = new Html5Qrcode(READER_ID, {
                    formatsToSupport: SUPPORTED_FORMATS,
                    verbose: false,
                });
                html5QrcodeRef.current = qrcode;

                await qrcode.start(
                    { facingMode: "environment" },
                    {
                        fps: 20,
                        qrbox: (viewfinderWidth, viewfinderHeight) => {
                            // Ekranın daha geniş bir alanını tarama için kullan
                            const width = Math.floor(viewfinderWidth * 0.9);
                            const height = Math.floor(viewfinderHeight * 0.6);
                            return { width, height };
                        },
                        disableFlip: false,
                    },
                    (decodedText) => {
                        // Prevent duplicate results
                        if (hasResultRef.current) return;
                        hasResultRef.current = true;

                        onResultRef.current(decodedText);

                        // Stop scanner then close dialog
                        stopScanner().then(() => {
                            onCloseRef.current();
                        });
                    },
                    // Error callback – fires frequently, ignore scan-in-progress errors
                    () => { }
                );

                isScanningRef.current = true;
            } catch (err: unknown) {
                const msg =
                    err instanceof Error ? err.message : String(err);
                if (
                    msg.includes("NotAllowed") ||
                    msg.includes("Permission")
                ) {
                    setError(
                        "Kamera izni verilmedi. Lütfen tarayıcı ayarlarından kamera erişimine izin verin."
                    );
                } else if (
                    msg.includes("NotFound") ||
                    msg.includes("Requested device not found")
                ) {
                    setError(
                        "Kamera bulunamadı. Lütfen kameranızın çalıştığından emin olun."
                    );
                } else {
                    setError(`Kamera başlatılamadı: ${msg}`);
                }
            }
        }, 300);

        return () => {
            clearTimeout(timerId);
            stopScanner();
        };
        // Only depend on isOpen – callbacks are tracked via refs
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen]);

    return (
        <Dialog
            open={isOpen}
            onOpenChange={(open) => {
                if (!open) {
                    stopScanner().then(() => onClose());
                }
            }}
        >
            <DialogContent className="sm:max-w-md p-4">
                <DialogHeader>
                    <DialogTitle>Barkod Okutun</DialogTitle>
                    <DialogDescription>
                        Ürününüzün barkodunu kameraya gösterin. Barkodu
                        tarama alanının içine hizalayın.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex flex-col items-center justify-center min-h-[320px]">
                    {error ? (
                        <div className="text-center space-y-3 px-2">
                            <p className="text-sm text-destructive">
                                {error}
                            </p>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                    setError("");
                                    // Re-trigger by toggling isOpen through close/open
                                    onClose();
                                }}
                            >
                                Tekrar Dene
                            </Button>
                        </div>
                    ) : (
                        <div
                            id={READER_ID}
                            className="w-full rounded overflow-hidden"
                            style={{ minHeight: 280 }}
                        />
                    )}
                </div>

                <div className="flex justify-center mt-2">
                    <Button
                        variant="outline"
                        onClick={() => {
                            stopScanner().then(() => onClose());
                        }}
                    >
                        <X className="mr-2 h-4 w-4" /> İptal
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
