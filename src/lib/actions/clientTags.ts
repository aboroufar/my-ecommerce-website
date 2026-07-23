"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAdminUser } from "@/lib/auth";

/**
 * Organizational tags for client records, kept in their own
 * client_tags/client_tag_links tables so they don't share a pool with
 * product tags, discount labels, or blog tags -- mirrors
 * src/lib/actions/discountLabels.ts, but against client_tags.
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

export async function createClientTagInline(
  name: string
): Promise<{ id: string; name: string } | { error: string }> {
  await requireAdmin();

  const parsed = tagSchema.safeParse({ name });
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("client_tags")
    .insert({ name: parsed.data.name, slug: slugify(parsed.data.name) })
    .select("id, name")
    .single();

  if (error || !data) {
    return { error: error?.code === "23505" ? "That tag already exists." : (error?.message ?? "Could not create tag.") };
  }

  revalidatePath("/admin/clients");
  return data;
}

/**
 * Replaces a client's full tag assignment set with the given list --
 * same "delete all, reinsert" approach as setProductTags, simpler and
 * safer than diffing add/remove given how small this list always is.
 */
export async function setClientTags(clientId: string, tagIds: string[]) {
  await requireAdmin();

  const supabase = createAdminClient();
  await supabase.from("client_tag_links").delete().eq("client_id", clientId);

  if (tagIds.length > 0) {
    await supabase.from("client_tag_links").insert(
      tagIds.map((tag_id) => ({ client_id: clientId, tag_id }))
    );
  }

  revalidatePath(`/admin/clients/${clientId}`);
}
