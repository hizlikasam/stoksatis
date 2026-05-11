import { redirect } from "next/navigation";
import { getCurrentBusiness } from "@/lib/services/businesses";
import StockClient from "./client";

export default async function StockPage() {
    const activeBusiness = await getCurrentBusiness();

    if (!activeBusiness) {
        redirect("/onboarding/business");
    }

    return <StockClient businessId={activeBusiness.id} />;
}
