"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAdminUser } from "@/lib/auth";

/**
 * Tags for blog posts, kept in their own blog_tags/blog_post_tag_links
 * tables so they don't share a pool with product tags or discount
 * labels -- mirrors src/lib/actions/tags.ts, but against blog_tags.
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

export async function createBlogTagInline(
  name: string
): Promise<{ id: string; name: string } | { error: string }> {
  await requireAdmin();

  const parsed = tagSchema.safeParse({ name });
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("blog_tags")
    .insert({ name: parsed.data.name, slug: slugify(parsed.data.name) })
    .select("id, name")
    .single();

  if (error || !data) {
    return { error: error?.code === "23505" ? "That tag already exists." : (error?.message ?? "Could not create tag.") };
  }

  revalidatePath("/admin/blog");
  return data;
}
