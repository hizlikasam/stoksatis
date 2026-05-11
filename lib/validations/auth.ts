import { z } from "zod";

export const loginSchema = z.object({
    businessCode: z
        .string()
        .min(1, "Firma kodu gerekli"),
    email: z
        .string()
        .min(1, "E-posta adresi gerekli")
        .email("Geçerli bir e-posta adresi girin"),
    password: z
        .string()
        .min(1, "Şifre gerekli")
        .min(6, "Şifre en az 6 karakter olmalı"),
});

export const adminLoginSchema = z.object({
    email: z
        .string()
        .min(1, "E-posta adresi gerekli")
        .email("Geçerli bir e-posta adresi girin"),
    password: z
        .string()
        .min(1, "Şifre gerekli")
        .min(6, "Şifre en az 6 karakter olmalı"),
});

export type LoginFormValues = z.infer<typeof loginSchema>;
export type AdminLoginFormValues = z.infer<typeof adminLoginSchema>;
