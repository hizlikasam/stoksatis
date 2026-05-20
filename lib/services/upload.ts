"use client";

import { createClient } from "@/lib/supabase/client";

const BUCKET_NAME = "products";

/**
 * Uploads a product image to Supabase Storage and returns the public URL.
 * File is stored under: products/{businessId}/{timestamp}_{filename}
 */
export async function uploadProductImage(
    file: File,
    businessId?: string
): Promise<string> {
    const supabase = createClient();

    // Generate unique file name to avoid collisions
    const fileExt = file.name.split(".").pop() || "jpg";
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2, 8);
    const filePath = businessId
        ? `${businessId}/${timestamp}_${randomId}.${fileExt}`
        : `general/${timestamp}_${randomId}.${fileExt}`;

    const { data, error } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(filePath, file, {
            cacheControl: "3600",
            upsert: false,
        });

    if (error) {
        console.error("Image upload error:", error);
        throw new Error("Resim yüklenirken bir hata oluştu: " + error.message);
    }

    // Get the public URL
    const {
        data: { publicUrl },
    } = supabase.storage.from(BUCKET_NAME).getPublicUrl(data.path);

    return publicUrl;
}

/**
 * Deletes a product image from Supabase Storage.
 * Extracts the path from the full public URL.
 */
export async function deleteProductImage(imageUrl: string): Promise<void> {
    const supabase = createClient();

    // Extract the file path from the public URL
    // URL format: https://{project}.supabase.co/storage/v1/object/public/products/{path}
    const urlParts = imageUrl.split(`/storage/v1/object/public/${BUCKET_NAME}/`);
    if (urlParts.length < 2) {
        console.warn("Could not parse image URL for deletion:", imageUrl);
        return;
    }

    const filePath = urlParts[1];

    const { error } = await supabase.storage
        .from(BUCKET_NAME)
        .remove([filePath]);

    if (error) {
        console.error("Image delete error:", error);
        throw new Error("Resim silinirken bir hata oluştu.");
    }
}
