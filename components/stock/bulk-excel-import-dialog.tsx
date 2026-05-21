"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FileDown, FileUp, Info, Loader2, AlertCircle, Trash2 } from "lucide-react";
import * as xlsx from "xlsx";
import { bulkProcessStockExcel, BulkExcelRow } from "@/lib/services/bulk";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface BulkExcelImportDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export function BulkExcelImportDialog({ isOpen, onClose, onSuccess }: BulkExcelImportDialogProps) {
    const [previewData, setPreviewData] = useState<BulkExcelRow[]>([]);
    const [isParsing, setIsParsing] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitResult, setSubmitResult] = useState<any>(null);

    const resetState = () => {
        setPreviewData([]);
        setIsParsing(false);
        setIsSubmitting(false);
        setSubmitResult(null);
    };

    const handleClose = () => {
        resetState();
        onClose();
    };

    const updateRow = (index: number, field: keyof BulkExcelRow, value: any) => {
        const newData = [...previewData];
        newData[index] = { ...newData[index], [field]: value };
        setPreviewData(newData);
    };

    const deleteRow = (index: number) => {
        const newData = [...previewData];
        newData.splice(index, 1);
        setPreviewData(newData);
        if (newData.length === 0) {
            toast.info("Tüm satırları sildiniz. Yeni bir dosya yükleyebilirsiniz.");
        }
    };

    const downloadTemplate = () => {
        const templateData = [
            {
                Barkod: "8691234567890",
                "Ürün Adı": "Örnek Ürün A",
                "Alış Fiyatı": 100,
                "Liste Fiyatı": 150,
                "Outlet Fiyatı": 120,
                "Eklenecek Miktar": 50,
                "Kritik Stok": 10,
            },
            {
                Barkod: "",
                "Ürün Adı": "Barkodsuz Ürün B",
                "Alış Fiyatı": 200,
                "Liste Fiyatı": 300,
                "Outlet Fiyatı": 280,
                "Eklenecek Miktar": 20,
                "Kritik Stok": 5,
            }
        ];

        const worksheet = xlsx.utils.json_to_sheet(templateData);

        // Customize column widths
        worksheet["!cols"] = [
            { wpx: 120 }, // Barkod
            { wpx: 200 }, // Ürün Adı
            { wpx: 100 }, // Alış
            { wpx: 100 }, // Satış
            { wpx: 100 }, // Outlet
            { wpx: 120 }, // Miktar
            { wpx: 100 }, // Kritik Stok
        ];

        const workbook = xlsx.utils.book_new();
        xlsx.utils.book_append_sheet(workbook, worksheet, "Şablon");
        xlsx.writeFile(workbook, "toplu_stok_sablonu.xlsx");
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsParsing(true);
        setSubmitResult(null);

        const reader = new FileReader();
        reader.onload = (evt) => {
            try {
                const bstr = evt.target?.result;
                const wb = xlsx.read(bstr, { type: "binary" });
                const wsname = wb.SheetNames[0];
                const ws = wb.Sheets[wsname];
                const data = xlsx.utils.sheet_to_json(ws);

                if (data.length === 0) {
                    toast.error("Yüklenen dosya boş.");
                    setIsParsing(false);
                    return;
                }

                // Map Excel headers to internal format
                const mappedData: BulkExcelRow[] = data.map((row: any) => ({
                    barcode: row["Barkod"] || row["barkod"] || undefined,
                    name: row["Ürün Adı"] || row["urun_adi"] || row["ürün adı"] || "",
                    cost_price: Number(row["Alış Fiyatı"] || row["alis"]) || 0,
                    sale_price: Number(row["Liste Fiyatı"] || row["Satış Fiyatı"] || row["satis"]) || 0,
                    outlet_price: Number(row["Outlet Fiyatı"] || row["outlet"]) || 0,
                    quantity: Number(row["Eklenecek Miktar"] || row["miktar"]) || 0,
                    min_stock_quantity: Number(row["Kritik Stok"] || row["kritik"]) || 10,
                })).filter(row => row.name && row.quantity > 0);

                if (mappedData.length === 0) {
                    toast.error("Geçerli bir satır bulunamadı. Lütfen zorunlu alanları (Ürün Adı, Eklenecek Miktar) doldurun.");
                } else {
                    setPreviewData(mappedData);
                }
            } catch (err) {
                console.error("Excel parse error:", err);
                toast.error("Dosya okunamadı. Yalnızca Excel(.xlsx) formatı desteklenmektedir.");
            } finally {
                setIsParsing(false);
            }
        };
        reader.onerror = () => {
            toast.error("Dosya okunamadı.");
            setIsParsing(false);
        };
        reader.readAsBinaryString(file);

        // Reset file input target
        e.target.value = "";
    };

    const handleSubmit = async () => {
        if (previewData.length === 0) return;

        setIsSubmitting(true);
        try {
            const result = await bulkProcessStockExcel(previewData);
            setSubmitResult(result);
            if (result.successCount > 0) {
                toast.success(`${result.successCount} ürün / stok başarıyla işlendi.`);
                onSuccess(); // Refresh pareht data
            } else {
                toast.error("Hiçbir ürün işlenemedi.");
            }
        } catch (error: any) {
            toast.error(error.message || "İşlem sırasında beklenmedik bir hata oluştu.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
            <DialogContent className="w-[95vw] sm:max-w-xl md:max-w-3xl lg:max-w-4xl max-h-[90vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>Toplu Stok / Ürün Yükleme (Excel)</DialogTitle>
                    <DialogDescription>
                        Excel şablonunu indirerek ürün bilgilerinizi doldurabilir, ardından bu ekrandan sisteme yükleyebilirsiniz.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 overflow-hidden flex flex-col gap-4">
                    {/* Actions and Instruction */}
                    {!previewData.length && !submitResult && (
                        <div className="space-y-6 py-4">
                            <div className="bg-muted p-4 rounded-lg flex flex-col gap-4 items-center justify-center border-dashed border-2 text-center">
                                <FileDown className="w-8 h-8 text-muted-foreground" />
                                <div>
                                    <h4 className="font-semibold">Örnek Şablonu İndirin</h4>
                                    <p className="text-sm text-muted-foreground mt-1 mb-4">
                                        Doğru dosya formatı için lütfen örnek excel şablonumuzu indirin.
                                    </p>
                                    <Button onClick={downloadTemplate} variant="outline" className="border-primary/20 hover:bg-primary/5">
                                        Şablonu İndir (.xlsx)
                                    </Button>
                                </div>
                            </div>

                            <div className="bg-primary/5 p-4 rounded-lg border flex flex-col gap-4 items-center justify-center text-center">
                                <FileUp className="w-8 h-8 text-primary" />
                                <div>
                                    <h4 className="font-semibold">Doldurulmuş Excel'i Yükleyin</h4>
                                    <p className="text-sm text-muted-foreground mt-1 mb-4 max-w-sm">
                                        Doldurduğunuz listeyi yüklediğinizde, doğrudan kaydedilmeden önce bir <strong>önizleme tablosu</strong> ile kontrolünü sağlayacaksınız.
                                    </p>
                                    <div className="relative inline-block">
                                        <Button disabled={isParsing}>
                                            {isParsing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                                            Dosya Seç
                                        </Button>
                                        <input
                                            type="file"
                                            accept=".xlsx, .xls"
                                            onChange={handleFileUpload}
                                            className="absolute inset-0 opacity-0 cursor-pointer disabled:cursor-not-allowed"
                                            disabled={isParsing}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Submit Result View */}
                    {submitResult && (
                        <div className="space-y-4 py-4 overflow-y-auto">
                            <Alert variant={submitResult.errorCount > 0 ? "destructive" : "default"} className={submitResult.errorCount === 0 ? "border-green-500 bg-green-50 text-green-900" : ""}>
                                <Info className="h-4 w-4" />
                                <AlertTitle>İşlem Tamamlandı</AlertTitle>
                                <AlertDescription>
                                    {submitResult.message}
                                </AlertDescription>
                            </Alert>

                            {submitResult.errors && submitResult.errors.length > 0 && (
                                <div className="mt-4">
                                    <h4 className="font-semibold text-red-600 mb-2 flex items-center"><AlertCircle className="w-4 h-4 mr-2" /> Hatalı Satırlar</h4>
                                    <ul className="text-sm space-y-2 bg-red-50 p-4 rounded-lg text-red-900">
                                        {submitResult.errors.map((err: any, idx: number) => (
                                            <li key={idx}><strong>Satır {err.row}:</strong> {err.error}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            <div className="flex justify-end pt-4">
                                <Button onClick={handleClose}>Kapat</Button>
                            </div>
                        </div>
                    )}

                    {/* Preview Table View */}
                    {previewData.length > 0 && !submitResult && (
                        <div className="flex flex-col h-full overflow-hidden">
                            <div className="bg-yellow-50 text-yellow-800 p-3 rounded-lg text-sm mb-4 border border-yellow-200 shrink-0">
                                <Info className="w-4 h-4 inline mr-2" />
                                Aşağıdaki <strong>{previewData.length}</strong> ürün listeden okunmuştur. Sistem, mevcut ürünleri otomatik tanımlayıp stok güncelleyecek, yeni ürünler için veri oluşturacaktır.
                            </div>

                            <div className="flex-1 overflow-auto border rounded-md min-h-[300px]">
                                <Table>
                                    <TableHeader className="bg-muted sticky top-0 z-10 shadow-sm">
                                        <TableRow>
                                            <TableHead>Barkod</TableHead>
                                            <TableHead>Ürün Adı</TableHead>
                                            <TableHead className="text-right w-[100px]">Alış Fiyatı</TableHead>
                                            <TableHead className="text-right w-[100px]">Liste Fiyatı</TableHead>
                                            <TableHead className="text-right w-[100px] text-primary">Outlet Fiyatı</TableHead>
                                            <TableHead className="text-right text-emerald-600 font-bold w-[100px]">Miktar</TableHead>
                                            <TableHead className="w-[50px]"></TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {previewData.map((row, idx) => (
                                            <TableRow key={idx}>
                                                <TableCell>
                                                    <Input
                                                        value={row.barcode || ""}
                                                        onChange={(e) => updateRow(idx, "barcode", e.target.value)}
                                                        className="h-8 text-sm px-2 bg-transparent border-transparent hover:border-input focus:border-input focus:bg-background"
                                                        placeholder="Boş"
                                                    />
                                                </TableCell>
                                                <TableCell>
                                                    <Input
                                                        value={row.name}
                                                        onChange={(e) => updateRow(idx, "name", e.target.value)}
                                                        className={`h-8 text-sm px-2 bg-transparent border-transparent hover:border-input focus:border-input focus:bg-background ${!row.name ? "border-red-500 bg-red-50" : ""}`}
                                                        placeholder="Ürün adı girin"
                                                    />
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <Input
                                                        type="number"
                                                        value={row.cost_price}
                                                        onChange={(e) => updateRow(idx, "cost_price", Number(e.target.value))}
                                                        className="h-8 text-sm px-2 text-right bg-transparent border-transparent hover:border-input focus:border-input focus:bg-background"
                                                    />
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <Input
                                                        type="number"
                                                        value={row.sale_price}
                                                        onChange={(e) => updateRow(idx, "sale_price", Number(e.target.value))}
                                                        className="h-8 text-sm px-2 text-right bg-transparent border-transparent hover:border-input focus:border-input focus:bg-background"
                                                    />
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <Input
                                                        type="number"
                                                        value={row.outlet_price}
                                                        onChange={(e) => updateRow(idx, "outlet_price", Number(e.target.value))}
                                                        className="h-8 text-sm px-2 text-right bg-transparent border-transparent hover:border-input focus:border-input focus:bg-background"
                                                    />
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <Input
                                                        type="number"
                                                        value={row.quantity}
                                                        onChange={(e) => updateRow(idx, "quantity", Number(e.target.value))}
                                                        className={`h-8 text-sm px-2 text-right bg-transparent border-transparent hover:border-input focus:border-input focus:bg-background font-bold text-green-600 ${row.quantity <= 0 ? "border-red-500 bg-red-50 text-red-600" : ""}`}
                                                    />
                                                </TableCell>
                                                <TableCell>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-red-600" onClick={() => deleteRow(idx)}>
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>

                            <div className="flex justify-between items-center pt-4 shrink-0 mt-4 border-t">
                                <Button variant="ghost" onClick={resetState} disabled={isSubmitting}>İptal Et ve Geri Dön</Button>
                                <Button onClick={handleSubmit} disabled={isSubmitting}>
                                    {isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                                    Verileri Onayla ve Kaydet
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
