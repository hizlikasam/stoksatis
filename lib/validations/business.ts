import { z } from "zod";

export const businessJoinSchema = z.object({
    businessCode: z
        .string()
        .min(3, "Firma kodu en az 3 karakter olmalıdır")
        .max(50, "Firma kodu çok uzun"),
    inviteCode: z
        .string()
        .min(3, "Davet kodu en az 3 karakter olmalıdır")
        .max(50, "Davet kodu çok uzun"),
});

export type BusinessJoinFormValues = z.infer<typeof businessJoinSchema>;
