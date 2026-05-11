import { Header } from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Store, Printer, Bell } from "lucide-react";

export default function SettingsPage() {
    return (
        <>
            <Header title="Ayarlar" />
            <div className="p-4 sm:p-6 space-y-6 max-w-2xl">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Ayarlar</h2>
                    <p className="text-sm text-muted-foreground mt-1">
                        Mağaza ve uygulama ayarlarını yönetin
                    </p>
                </div>

                {/* Store info */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base">
                            <Store className="h-4 w-4" />
                            Mağaza Bilgileri
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="storeName">Mağaza Adı</Label>
                            <Input
                                id="storeName"
                                placeholder="Mağaza adını girin"
                                disabled
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="storePhone">Telefon</Label>
                            <Input
                                id="storePhone"
                                placeholder="0(5XX) XXX XX XX"
                                disabled
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="storeAddress">Adres</Label>
                            <Input id="storeAddress" placeholder="Mağaza adresi" disabled />
                        </div>
                        <Button disabled>Kaydet</Button>
                    </CardContent>
                </Card>

                <Separator />

                {/* Printer settings */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base">
                            <Printer className="h-4 w-4" />
                            Yazıcı Ayarları
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground">
                            Barkod ve fiş yazıcısı ayarları yakında eklenecek.
                        </p>
                    </CardContent>
                </Card>

                {/* Notification settings */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base">
                            <Bell className="h-4 w-4" />
                            Bildirim Ayarları
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground">
                            Düşük stok uyarıları ve bildirim tercihleri yakında eklenecek.
                        </p>
                    </CardContent>
                </Card>
            </div>
        </>
    );
}
