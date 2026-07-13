"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAdminUser } from "@/lib/auth";

const categorySchema = z.object({
  name: z.string().min(1, "Name is required"),
  slug: z
    .string()
    .min(1, "Slug is required")
    .regex(/^[a-z0-9-]+$/, "Slug: lowercase letters, numbers, hyphens only"),
  image_url: z.union([z.string().min(1), z.literal("")]).optional(),
  parent_id: z.union([z.string().uuid(), z.literal("")]).optional(),
  hero_image_url: z.union([z.string().min(1), z.literal("")]).optional(),
  hero_headline: z.string().optional(),
  hero_eyebrow: z.string().optional(),
  // Checkboxes are only present in FormData when checked ("on"), so a
  // missing key means unchecked/false rather than a validation failure.
  display_only: z.preprocess((v) => v === "on", z.boolean()),
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

export async function createCategory(formData: FormData) {
  await requireAdmin();

  const parsed = categorySchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    redirect(
      `/admin/categories?error=${encodeURIComponent(parsed.error.issues[0].message)}`
    );
  }

  const supabase = createAdminClient();
  const { error } = await supabase.from("categories").insert({
    name: parsed.data.name,
    slug: parsed.data.slug,
    image_url: parsed.data.image_url || null,
    parent_id: parsed.data.parent_id || null,
    hero_image_url: parsed.data.hero_image_url || null,
    hero_headline: parsed.data.hero_headline || null,
    hero_eyebrow: parsed.data.hero_eyebrow || null,
    display_only: parsed.data.display_only,
  });

  if (error) {
    const message =
      error.code === "23505" ? "That slug is already in use." : error.message;
    redirect(`/admin/categories?error=${encodeURIComponent(message)}`);
  }

  revalidatePath("/admin/categories");
  revalidatePath("/products");
  revalidatePath("/");
  redirect("/admin/categories");
}

export async function updateCategory(id: string, formData: FormData) {
  await requireAdmin();

  const parsed = categorySchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    redirect(
      `/admin/categories?error=${encodeURIComponent(parsed.error.issues[0].message)}`
    );
  }

  if (parsed.data.parent_id === id) {
    redirect(
      `/admin/categories?error=${encodeURIComponent("A category can't be its own parent.")}`
    );
  }

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("categories")
    .update({
      name: parsed.data.name,
      slug: parsed.data.slug,
      image_url: parsed.data.image_url || null,
      parent_id: parsed.data.parent_id || null,
      hero_image_url: parsed.data.hero_image_url || null,
      hero_headline: parsed.data.hero_headline || null,
      hero_eyebrow: parsed.data.hero_eyebrow || null,
      display_only: parsed.data.display_only,
    })
    .eq("id", id);

  if (error) {
    const message =
      error.code === "23505" ? "That slug is already in use." : error.message;
    redirect(`/admin/categories?error=${encodeURIComponent(message)}`);
  }

  revalidatePath("/admin/categories");
  revalidatePath("/products");
  revalidatePath("/");
  redirect("/admin/categories");
}

export async function deleteCategory(id: string) {
  await requireAdmin();

  const supabase = createAdminClient();
  // product_categories rows reference this category with ON DELETE CASCADE,
  // so deleting a category un-assigns it from every product automatically
  // -- it does not delete the products themselves.
  const { error } = await supabase.from("categories").delete().eq("id", id);

  if (error) {
    redirect(
      `/admin/categories?error=${encodeURIComponent(
        "Could not delete: " + error.message
      )}`
    );
  }

  revalidatePath("/admin/categories");
  revalidatePath("/products");
  revalidatePath("/");
  redirect("/admin/categories");
}

/**
 * Replaces a product's full category assignment set with the given list --
 * simpler and safer than diffing add/remove given how small this list
 * always is (a handful of checkboxes in the product form).
 */
export async function setProductCategories(
  productId: string,
  categoryIds: string[]
) {
  await requireAdmin();

  const supabase = createAdminClient();
  await supabase.from("product_categories").delete().eq("product_id", productId);

  if (categoryIds.length > 0) {
    await supabase.from("product_categories").insert(
      categoryIds.map((category_id) => ({
        product_id: productId,
        category_id,
      }))
    );
  }
}
