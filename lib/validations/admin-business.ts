import { z } from "zod";

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

export const createBusinessSchema = z.object({
    name: z.string().min(2, "Firma adı en az 2 karakter olmalıdır"),
    phone: z.string().optional().or(z.literal("")),
    email: z
        .string()
        .email("Geçerli bir e-posta adresi girin")
        .optional()
        .or(z.literal("")),
    address: z.string().optional().or(z.literal("")),
    tax_number: z.string().optional().or(z.literal("")),
    business_code: z.string().optional().or(z.literal("")),
    invite_code: z
        .string()
        .min(4, "Davet kodu en az 4 karakter olmalıdır")
        .optional()
        .or(z.literal("")),
    notes: z.string().optional().nullable(),
    is_active: z.boolean().default(true),
});

export const updateBusinessSchema = z.object({
    name: z.string().min(2, "Firma adı en az 2 karakter olmalıdır"),
    phone: z.string().optional().or(z.literal("")),
    email: z
        .string()
        .email("Geçerli bir e-posta adresi girin")
        .optional()
        .or(z.literal("")),
    address: z.string().optional().or(z.literal("")),
    tax_number: z.string().optional().or(z.literal("")),
    notes: z.string().optional().nullable(),
    is_active: z.boolean().default(true),
});

export type AdminLoginValues = z.infer<typeof adminLoginSchema>;
export type CreateBusinessValues = z.infer<typeof createBusinessSchema>;
export type UpdateBusinessValues = z.infer<typeof updateBusinessSchema>;
