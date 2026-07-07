"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAdminUser } from "@/lib/auth";

const productSchema = z.object({
  name: z.string().min(1, "Name is required"),
  slug: z
    .string()
    .min(1, "Slug is required")
    .regex(/^[a-z0-9-]+$/, "Slug: lowercase letters, numbers, hyphens only"),
  description: z.string().optional().default(""),
  price: z.coerce.number().nonnegative("Price must be 0 or more"),
  sku: z.string().optional().default(""),
  stock_qty: z.coerce.number().int().nonnegative("Stock must be 0 or more"),
  status: z.enum(["draft", "active", "archived"]),
  image_url: z
    .union([z.string().url("Image URL must be a valid URL"), z.literal("")])
    .optional()
    .default(""),
});

/**
 * Every action here re-checks admin auth itself rather than relying solely
 * on the layout guard -- server actions are callable directly over the
 * network, so the layout's redirect alone isn't enough protection.
 */
async function requireAdmin() {
  const user = await getAdminUser();
  if (!user) redirect("/admin");
}

export async function createProduct(formData: FormData) {
  await requireAdmin();

  const parsed = productSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    redirect(
      `/admin/products/new?error=${encodeURIComponent(parsed.error.issues[0].message)}`
    );
  }

  const { image_url, price, description, sku, ...rest } = parsed.data;
  const supabase = createAdminClient();

  const { data: product, error } = await supabase
    .from("products")
    .insert({
      ...rest,
      price_cents: Math.round(price * 100),
      description: description || null,
      sku: sku || null,
    })
    .select("id")
    .single();

  if (error || !product) {
    redirect(
      `/admin/products/new?error=${encodeURIComponent(error?.message ?? "Failed to create product")}`
    );
  }

  if (image_url) {
    await supabase
      .from("product_images")
      .insert({ product_id: product.id, url: image_url, sort_order: 0 });
  }

  revalidatePath("/products");
  revalidatePath("/admin/products");
  redirect("/admin/products");
}

export async function updateProduct(id: string, formData: FormData) {
  await requireAdmin();

  const parsed = productSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    redirect(
      `/admin/products/${id}/edit?error=${encodeURIComponent(parsed.error.issues[0].message)}`
    );
  }

  const { image_url, price, description, sku, ...rest } = parsed.data;
  const supabase = createAdminClient();

  const { error } = await supabase
    .from("products")
    .update({
      ...rest,
      price_cents: Math.round(price * 100),
      description: description || null,
      sku: sku || null,
    })
    .eq("id", id);

  if (error) {
    redirect(
      `/admin/products/${id}/edit?error=${encodeURIComponent(error.message)}`
    );
  }

  // Simple approach for v1: replace the single primary image if a new URL
  // was given. Multi-image management can be added later without changing
  // this schema.
  if (image_url) {
    await supabase.from("product_images").delete().eq("product_id", id);
    await supabase
      .from("product_images")
      .insert({ product_id: id, url: image_url, sort_order: 0 });
  }

  revalidatePath("/products");
  revalidatePath(`/products/${rest.slug}`);
  revalidatePath("/admin/products");
  redirect("/admin/products");
}

export async function deleteProduct(id: string) {
  await requireAdmin();

  const supabase = createAdminClient();
  const { error } = await supabase.from("products").delete().eq("id", id);

  if (error) {
    redirect(
      `/admin/products?error=${encodeURIComponent(
        "Could not delete: " + error.message
      )}`
    );
  }

  revalidatePath("/products");
  revalidatePath("/admin/products");
  redirect("/admin/products");
}
