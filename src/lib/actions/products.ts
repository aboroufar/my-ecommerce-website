"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAdminUser } from "@/lib/auth";
import { setProductCategories } from "@/lib/actions/categories";
import { setProductOptions } from "@/lib/actions/productOptions";
import { setProductHighlights } from "@/lib/actions/productHighlights";
import { setProductTags } from "@/lib/actions/tags";

const productSchema = z.object({
  name: z.string().min(1, "Name is required"),
  slug: z
    .string()
    .min(1, "Slug is required")
    .regex(/^[a-z0-9-]+$/, "Slug: lowercase letters, numbers, hyphens only"),
  description: z.string().optional().default(""),
  price: z.coerce.number().nonnegative("Price must be 0 or more"),
  // Empty input means "not on sale", not "$0" -- coerce only runs on
  // non-empty strings, so a blank field is treated as undefined and
  // caught by the literal("") branch instead of becoming NaN.
  compare_at_price: z
    .union([z.coerce.number().nonnegative("Compare-at price must be 0 or more"), z.literal("")])
    .optional()
    .default(""),
  sku: z.string().optional().default(""),
  stock_qty: z.coerce.number().int().nonnegative("Stock must be 0 or more"),
  status: z.enum(["draft", "active", "archived"]),
  // Checkboxes are only present in FormData when checked ("on"), so a
  // missing key means unchecked/false rather than a validation failure.
  is_popular: z.preprocess((v) => v === "on", z.boolean()),
  brand_id: z.union([z.string().uuid(), z.literal("")]).optional().default(""),
  gender: z.union([z.enum(["women", "men", "unisex"]), z.literal("")]).optional().default(""),
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

const imagesPayloadSchema = z.array(
  z.object({
    url: z.string().url(),
    alt_text: z.string(),
  })
);

/**
 * Replaces the full product_images set for a product from the
 * ImageGalleryManager's serialized array, same delete-then-reinsert
 * pattern as setProductHighlights/setProductOptions -- order in the
 * array becomes sort_order, so the first image is always the primary
 * one shown on the storefront.
 */
async function setProductImages(
  productId: string,
  supabase: ReturnType<typeof createAdminClient>,
  imagesJson: string
) {
  let raw: unknown;
  try {
    raw = JSON.parse(imagesJson);
  } catch {
    return;
  }

  const parsed = imagesPayloadSchema.safeParse(raw);
  if (!parsed.success) return;

  await supabase.from("product_images").delete().eq("product_id", productId);

  if (parsed.data.length === 0) return;

  await supabase.from("product_images").insert(
    parsed.data.map((image, i) => ({
      product_id: productId,
      url: image.url,
      alt_text: image.alt_text || null,
      sort_order: i,
    }))
  );
}

export async function createProduct(formData: FormData) {
  await requireAdmin();

  const parsed = productSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    redirect(
      `/admin/products/new?error=${encodeURIComponent(parsed.error.issues[0].message)}`
    );
  }

  const { price, compare_at_price, description, sku, brand_id, gender, ...rest } = parsed.data;
  const supabase = createAdminClient();

  const { data: product, error } = await supabase
    .from("products")
    .insert({
      ...rest,
      price_cents: Math.round(price * 100),
      compare_at_price_cents:
        compare_at_price === "" ? null : Math.round(compare_at_price * 100),
      description: description || null,
      sku: sku || null,
      brand_id: brand_id || null,
      gender: gender || null,
    })
    .select("id")
    .single();

  if (error || !product) {
    redirect(
      `/admin/products/new?error=${encodeURIComponent(error?.message ?? "Failed to create product")}`
    );
  }

  await setProductImages(product.id, supabase, String(formData.get("images_json") ?? ""));
  await setProductCategories(product.id, formData.getAll("category_ids") as string[]);
  await setProductOptions(product.id, String(formData.get("options_json") ?? ""));
  await setProductHighlights(product.id, String(formData.get("highlights_json") ?? ""));
  await setProductTags(product.id, formData.getAll("tag_ids") as string[]);

  revalidatePath("/");
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

  const { price, compare_at_price, description, sku, brand_id, gender, ...rest } = parsed.data;
  const supabase = createAdminClient();

  const { error } = await supabase
    .from("products")
    .update({
      ...rest,
      price_cents: Math.round(price * 100),
      compare_at_price_cents:
        compare_at_price === "" ? null : Math.round(compare_at_price * 100),
      description: description || null,
      sku: sku || null,
      brand_id: brand_id || null,
      gender: gender || null,
    })
    .eq("id", id);

  if (error) {
    redirect(
      `/admin/products/${id}/edit?error=${encodeURIComponent(error.message)}`
    );
  }

  await setProductImages(id, supabase, String(formData.get("images_json") ?? ""));
  await setProductCategories(id, formData.getAll("category_ids") as string[]);
  await setProductOptions(id, String(formData.get("options_json") ?? ""));
  await setProductHighlights(id, String(formData.get("highlights_json") ?? ""));
  await setProductTags(id, formData.getAll("tag_ids") as string[]);

  revalidatePath("/");
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

  revalidatePath("/");
  revalidatePath("/products");
  revalidatePath("/admin/products");
  redirect("/admin/products");
}

export async function bulkUpdateProductStatus(formData: FormData) {
  await requireAdmin();

  const ids = formData.getAll("product_ids") as string[];
  const status = formData.get("bulk_status");
  const parsedStatus = z.enum(["draft", "active", "archived"]).safeParse(status);

  if (ids.length === 0 || !parsedStatus.success) {
    redirect(
      `/admin/products?error=${encodeURIComponent("Select at least one product and a status.")}`
    );
  }

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("products")
    .update({ status: parsedStatus.data })
    .in("id", ids);

  if (error) {
    redirect(`/admin/products?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/");
  revalidatePath("/products");
  revalidatePath("/admin/products");
  redirect("/admin/products");
}

export async function bulkDeleteProducts(formData: FormData) {
  await requireAdmin();

  const ids = formData.getAll("product_ids") as string[];
  if (ids.length === 0) {
    redirect(`/admin/products?error=${encodeURIComponent("Select at least one product.")}`);
  }

  const supabase = createAdminClient();
  const { error } = await supabase.from("products").delete().in("id", ids);

  if (error) {
    redirect(
      `/admin/products?error=${encodeURIComponent("Could not delete: " + error.message)}`
    );
  }

  revalidatePath("/");
  revalidatePath("/products");
  revalidatePath("/admin/products");
  redirect("/admin/products");
}
