"use server";

import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAdminUser } from "@/lib/auth";

const MAX_FILE_BYTES = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = new Set(["image/png", "image/jpeg", "image/webp", "image/gif"]);

/**
 * Uploads an image file to the product-images Storage bucket and returns
 * its public URL. Runs server-side with the service-role client because
 * the bucket has no anon/authenticated write policy -- only admins should
 * be able to add product images, and there's no admin-scoped browser
 * client to enforce that at the RLS level.
 */
export async function uploadProductImage(
  file: File
): Promise<{ url: string } | { error: string }> {
  const user = await getAdminUser();
  if (!user) redirect("/admin");

  if (!ALLOWED_TYPES.has(file.type)) {
    return { error: "Please upload a PNG, JPEG, WebP, or GIF image." };
  }
  if (file.size > MAX_FILE_BYTES) {
    return { error: "Image must be under 5MB." };
  }

  const supabase = createAdminClient();
  const extension = file.name.split(".").pop() ?? "bin";
  const path = `${crypto.randomUUID()}.${extension}`;

  const { error } = await supabase.storage
    .from("product-images")
    .upload(path, file, { contentType: file.type });

  if (error) {
    return { error: error.message };
  }

  const { data } = supabase.storage.from("product-images").getPublicUrl(path);
  return { url: data.publicUrl };
}
