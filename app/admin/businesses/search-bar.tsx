"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { useTransition, useState } from "react";

export function BusinessSearchBar() {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const [isPending, startTransition] = useTransition();
    const [value, setValue] = useState(searchParams.get("q") ?? "");

    function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
        const v = e.target.value;
        setValue(v);
        startTransition(() => {
            const params = new URLSearchParams(searchParams.toString());
            if (v.trim()) {
                params.set("q", v);
            } else {
                params.delete("q");
            }
            router.replace(`${pathname}?${params.toString()}`);
        });
    }

    return (
        <div className="relative w-full max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
                type="search"
                placeholder="Firma adı, firma kodu, telefon veya e-posta ara..."
                className="pl-8"
                value={value}
                onChange={handleChange}
            />
        </div>
    );
}
