"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAdminUser } from "@/lib/auth";
import { HELP_ICON_KEYS } from "@/components/helpIcons";

const categorySchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional().default(""),
  icon: z.enum(HELP_ICON_KEYS),
});

const topicSchema = z.object({
  category_id: z.string().uuid(),
  title: z.string().min(1, "Title is required"),
  body_html: z.string().optional().default(""),
});

async function requireAdmin() {
  const user = await getAdminUser();
  if (!user) redirect("/admin");
}

export async function createHelpCategory(formData: FormData) {
  await requireAdmin();

  const parsed = categorySchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    redirect(`/admin/help?error=${encodeURIComponent(parsed.error.issues[0].message)}`);
  }

  const supabase = createAdminClient();
  const { data: existing } = await supabase
    .from("help_categories")
    .select("sort_order")
    .order("sort_order", { ascending: false })
    .limit(1);
  const nextSortOrder = (existing?.[0]?.sort_order ?? -1) + 1;

  const { error } = await supabase
    .from("help_categories")
    .insert({ ...parsed.data, sort_order: nextSortOrder });

  if (error) redirect(`/admin/help?error=${encodeURIComponent(error.message)}`);

  revalidatePath("/admin/help");
  revalidatePath("/help");
  redirect("/admin/help");
}

export async function updateHelpCategory(id: string, formData: FormData) {
  await requireAdmin();

  const parsed = categorySchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    redirect(`/admin/help?error=${encodeURIComponent(parsed.error.issues[0].message)}`);
  }

  const supabase = createAdminClient();
  const { error } = await supabase.from("help_categories").update(parsed.data).eq("id", id);

  if (error) redirect(`/admin/help?error=${encodeURIComponent(error.message)}`);

  revalidatePath("/admin/help");
  revalidatePath("/help");
  redirect("/admin/help");
}

export async function deleteHelpCategory(id: string) {
  await requireAdmin();

  const supabase = createAdminClient();
  // help_topics rows reference this category with ON DELETE CASCADE, so
  // deleting a category removes its topics automatically.
  await supabase.from("help_categories").delete().eq("id", id);

  revalidatePath("/admin/help");
  revalidatePath("/help");
  redirect("/admin/help");
}

/** Swaps sort_order with the adjacent category in the given direction. */
export async function moveHelpCategory(id: string, direction: "up" | "down") {
  await requireAdmin();

  const supabase = createAdminClient();
  const { data: categories } = await supabase
    .from("help_categories")
    .select("id, sort_order")
    .order("sort_order", { ascending: true });

  if (!categories) redirect("/admin/help");

  const index = categories.findIndex((c) => c.id === id);
  const swapIndex = direction === "up" ? index - 1 : index + 1;
  if (index === -1 || swapIndex < 0 || swapIndex >= categories.length) {
    redirect("/admin/help");
  }

  const current = categories[index];
  const swap = categories[swapIndex];

  await supabase.from("help_categories").update({ sort_order: swap.sort_order }).eq("id", current.id);
  await supabase.from("help_categories").update({ sort_order: current.sort_order }).eq("id", swap.id);

  revalidatePath("/admin/help");
  revalidatePath("/help");
  redirect("/admin/help");
}

export async function createHelpTopic(formData: FormData) {
  await requireAdmin();

  const parsed = topicSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    redirect(`/admin/help?error=${encodeURIComponent(parsed.error.issues[0].message)}`);
  }

  const supabase = createAdminClient();
  const { data: existing } = await supabase
    .from("help_topics")
    .select("sort_order")
    .eq("category_id", parsed.data.category_id)
    .order("sort_order", { ascending: false })
    .limit(1);
  const nextSortOrder = (existing?.[0]?.sort_order ?? -1) + 1;

  const { error } = await supabase
    .from("help_topics")
    .insert({ ...parsed.data, sort_order: nextSortOrder });

  if (error) redirect(`/admin/help?error=${encodeURIComponent(error.message)}`);

  revalidatePath("/admin/help");
  revalidatePath("/help");
  redirect("/admin/help");
}

export async function updateHelpTopic(id: string, formData: FormData) {
  await requireAdmin();

  const schema = z.object({
    title: z.string().min(1, "Title is required"),
    body_html: z.string().optional().default(""),
  });
  const parsed = schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    redirect(`/admin/help?error=${encodeURIComponent(parsed.error.issues[0].message)}`);
  }

  const supabase = createAdminClient();
  const { error } = await supabase.from("help_topics").update(parsed.data).eq("id", id);

  if (error) redirect(`/admin/help?error=${encodeURIComponent(error.message)}`);

  revalidatePath("/admin/help");
  revalidatePath("/help");
  redirect("/admin/help");
}

export async function deleteHelpTopic(id: string) {
  await requireAdmin();

  const supabase = createAdminClient();
  await supabase.from("help_topics").delete().eq("id", id);

  revalidatePath("/admin/help");
  revalidatePath("/help");
  redirect("/admin/help");
}

/** Swaps sort_order with the adjacent topic (within the same category) in the given direction. */
export async function moveHelpTopic(id: string, categoryId: string, direction: "up" | "down") {
  await requireAdmin();

  const supabase = createAdminClient();
  const { data: topics } = await supabase
    .from("help_topics")
    .select("id, sort_order")
    .eq("category_id", categoryId)
    .order("sort_order", { ascending: true });

  if (!topics) redirect("/admin/help");

  const index = topics.findIndex((t) => t.id === id);
  const swapIndex = direction === "up" ? index - 1 : index + 1;
  if (index === -1 || swapIndex < 0 || swapIndex >= topics.length) {
    redirect("/admin/help");
  }

  const current = topics[index];
  const swap = topics[swapIndex];

  await supabase.from("help_topics").update({ sort_order: swap.sort_order }).eq("id", current.id);
  await supabase.from("help_topics").update({ sort_order: current.sort_order }).eq("id", swap.id);

  revalidatePath("/admin/help");
  revalidatePath("/help");
  redirect("/admin/help");
}
