"use client";

import { useRouter } from "next/navigation";
import { setBusinessActive } from "@/lib/services/admin-businesses";
import { Button } from "@/components/ui/button";
import { Power } from "lucide-react";
import { useState } from "react";

export function ToggleActiveButton({
    id,
    isActive,
}: {
    id: string;
    isActive: boolean;
}) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    async function handleClick() {
        const msg = isActive
            ? "Firmayı pasife almak istediğinize emin misiniz?"
            : "Firmayı aktif yapmak istediğinize emin misiniz?";
        if (!confirm(msg)) return;

        setLoading(true);
        try {
            await setBusinessActive(id, !isActive);
            router.refresh();
        } catch (err: any) {
            alert(err.message || "Hata oluştu.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <Button
            variant="ghost"
            size="icon"
            onClick={handleClick}
            disabled={loading}
            title={isActive ? "Pasife Al" : "Aktif Yap"}
        >
            <Power className={`h-4 w-4 ${isActive ? "text-green-600" : "text-red-500"}`} />
        </Button>
    );
}
