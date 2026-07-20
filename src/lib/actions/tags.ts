"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAdminUser } from "@/lib/auth";

/**
 * Every action here re-checks admin auth itself rather than relying solely
 * on the layout guard -- server actions are callable directly over the
 * network, so the layout's redirect alone isn't enough protection.
 */
async function requireAdmin() {
  const user = await getAdminUser();
  if (!user) redirect("/admin");
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const tagSchema = z.object({
  name: z.string().min(1, "Name is required"),
});

export async function createTag(formData: FormData) {
  await requireAdmin();

  const parsed = tagSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    redirect(`/admin/tags?error=${encodeURIComponent(parsed.error.issues[0].message)}`);
  }

  const supabase = createAdminClient();
  const { error } = await supabase.from("tags").insert({
    name: parsed.data.name,
    slug: slugify(parsed.data.name),
  });

  if (error) {
    const message =
      error.code === "23505" ? "That tag already exists." : error.message;
    redirect(`/admin/tags?error=${encodeURIComponent(message)}`);
  }

  revalidatePath("/admin/tags");
  revalidatePath("/products", "layout");
  redirect("/admin/tags");
}

/**
 * Same insert as createTag, but returns a result instead of redirecting --
 * for creating a tag inline from the product form's tag checklist, where a
 * redirect would blow away all the other in-progress product edits on the
 * page. createTag itself stays redirect-based since /admin/tags's own "Add
 * tag" form relies on that to land back on the (revalidated) tags list.
 */
export async function createTagInline(
  name: string
): Promise<{ id: string; name: string } | { error: string }> {
  await requireAdmin();

  const parsed = tagSchema.safeParse({ name });
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("tags")
    .insert({ name: parsed.data.name, slug: slugify(parsed.data.name) })
    .select("id, name")
    .single();

  if (error || !data) {
    return { error: error?.code === "23505" ? "That tag already exists." : (error?.message ?? "Could not create tag.") };
  }

  revalidatePath("/admin/tags");
  revalidatePath("/products", "layout");
  return data;
}

export async function deleteTag(id: string) {
  await requireAdmin();

  const supabase = createAdminClient();
  // product_tags rows reference this tag with ON DELETE CASCADE, so
  // deleting a tag un-assigns it from every product automatically.
  const { error } = await supabase.from("tags").delete().eq("id", id);

  if (error) {
    redirect(
      `/admin/tags?error=${encodeURIComponent("Could not delete: " + error.message)}`
    );
  }

  revalidatePath("/admin/tags");
  revalidatePath("/products", "layout");
  redirect("/admin/tags");
}

/**
 * Replaces a product's full tag assignment set with the given list --
 * same "delete all, reinsert" approach as setProductCategories, simpler
 * and safer than diffing add/remove given how small this list always is
 * (a handful of checkboxes in the product form).
 */
export async function setProductTags(productId: string, tagIds: string[]) {
  await requireAdmin();

  const supabase = createAdminClient();
  await supabase.from("product_tags").delete().eq("product_id", productId);

  if (tagIds.length > 0) {
    await supabase.from("product_tags").insert(
      tagIds.map((tag_id) => ({ product_id: productId, tag_id }))
    );
  }
}
