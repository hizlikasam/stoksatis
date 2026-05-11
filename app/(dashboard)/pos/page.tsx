import { redirect } from "next/navigation";
import { getCurrentBusiness } from "@/lib/services/businesses";
import PosClient from "./client";

export default async function PosPage() {
    const activeBusiness = await getCurrentBusiness();

    if (!activeBusiness) {
        // Eğer hiçbir firması yoksa onboarding'e veya boş sayfaya atabiliriz
        // Şimdilik onboarding makul bir yönlendirmedir.
        redirect("/onboarding/business");
    }

    return <PosClient businessId={activeBusiness.id} />;
}
