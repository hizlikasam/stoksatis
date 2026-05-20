"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { BrowserMultiFormatReader, DecodeHintType, BarcodeFormat, Result } from "@zxing/library";
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

export function BarcodeScannerDialog({
    onResult,
    isOpen,
    onClose,
}: BarcodeScannerProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const codeReaderRef = useRef<BrowserMultiFormatReader | null>(null);
    const hasResultRef = useRef(false);
    const [error, setError] = useState<string>("");

    // Callback stabilizasyonu
    const onResultRef = useRef(onResult);
    const onCloseRef = useRef(onClose);
    useEffect(() => {
        onResultRef.current = onResult;
    }, [onResult]);
    useEffect(() => {
        onCloseRef.current = onClose;
    }, [onClose]);

    const stopScanner = useCallback(() => {
        if (codeReaderRef.current) {
            try {
                codeReaderRef.current.reset();
            } catch (err) {
                // Hataları göz ardı et
            }
        }
    }, []);

    useEffect(() => {
        if (!isOpen) return;

        hasResultRef.current = false;
        setError("");

        // MultiFormatReader nesnesini desteklenen formatlarla başlatıyoruz.
        const hints = new Map<DecodeHintType, any>();
        hints.set(DecodeHintType.POSSIBLE_FORMATS, [
            BarcodeFormat.EAN_13,
            BarcodeFormat.EAN_8,
            BarcodeFormat.UPC_A,
            BarcodeFormat.UPC_E,
            BarcodeFormat.CODE_128,
            BarcodeFormat.CODE_39,
            BarcodeFormat.CODE_93,
            BarcodeFormat.QR_CODE,
            BarcodeFormat.DATA_MATRIX,
            BarcodeFormat.ITF,
        ]);

        const codeReader = new BrowserMultiFormatReader(hints);
        codeReaderRef.current = codeReader;

        // Video elementinin DOM'a mount olması için ufak bir bekleme
        const timeoutId = setTimeout(() => {
            if (videoRef.current) {
                codeReader
                    .decodeFromConstraints(
                        {
                            video: {
                                facingMode: "environment", // Arka kamerayı zorlar
                                // Odaklanma sorunu yaşamaması için gelişmiş kısıtlamalar eklenebilir, fakat environment çoğu mobil cihazda iş görür.
                            },
                        },
                        videoRef.current,
                        (result: Result | null, err: Error | undefined) => {
                            if (result) {
                                // Çift okumayı önleme
                                if (hasResultRef.current) return;
                                hasResultRef.current = true;

                                onResultRef.current(result.getText());

                                // Tarayıcıyı durdur ve dialogu kapat
                                stopScanner();
                                onCloseRef.current();
                            }
                            if (err) {
                                // Bulunamama hataları (NotFoundException) çok sıktır (her saniye karede fırlatır), yok say.
                                if (err.name === "NotFoundException") {
                                    return;
                                }
                                // Ciddi bir hata varsa loglayabiliriz, genelde Zxing sessiz başarısızlıklarla çalışır.
                            }
                        }
                    )
                    .catch((err: any) => {
                        console.error("Camera Start Error: ", err);
                        const msg = String(err);
                        if (msg.includes("NotAllowed") || msg.includes("Permission denied")) {
                            setError("Kamera izni verilmedi. Lütfen tarayıcı ayarlarından kamera erişimine izin verin.");
                        } else if (msg.includes("NotFound") || msg.includes("Requested device not found")) {
                            setError("Kamera desteklenmiyor veya bulunamadı.");
                        } else {
                            setError(`Kamera başlatılamadı: ${err.message || msg}`);
                        }
                    });
            }
        }, 100);

        return () => {
            clearTimeout(timeoutId);
            stopScanner();
        };
    }, [isOpen, stopScanner]);

    return (
        <Dialog
            open={isOpen}
            onOpenChange={(open) => {
                if (!open) {
                    stopScanner();
                    onClose();
                }
            }}
        >
            <DialogContent className="sm:max-w-md p-4">
                <DialogHeader>
                    <DialogTitle>Barkod Okutun</DialogTitle>
                    <DialogDescription>
                        Ürününüzün barkodunu kameraya gösterin. Zxing motoru ile hızlı tarama aktif.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex flex-col items-center justify-center min-h-[300px] w-full bg-black/5 rounded-md relative overflow-hidden">
                    {error ? (
                        <div className="text-center space-y-3 px-4">
                            <p className="text-sm text-destructive">{error}</p>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                    setError("");
                                    onClose();
                                }}
                            >
                                Kapat
                            </Button>
                        </div>
                    ) : (
                        <div className="relative w-full h-[300px] rounded overflow-hidden">
                            <video
                                ref={videoRef}
                                className="w-full h-full object-cover"
                                autoPlay
                                muted
                                playsInline
                            />
                            {/* Hedef gösterge kutusu (Görsel efekt amaçlı) */}
                            <div className="absolute inset-0 border-[40px] border-black/40 z-10 pointer-events-none flex items-center justify-center">
                                <div className="w-full h-[120px] border-2 border-red-500/70 rounded-md"></div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="flex justify-center mt-2">
                    <Button
                        variant="outline"
                        onClick={() => {
                            stopScanner();
                            onClose();
                        }}
                    >
                        <X className="mr-2 h-4 w-4" /> İptal
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
