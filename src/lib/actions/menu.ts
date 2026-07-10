"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAdminUser } from "@/lib/auth";

const columnSchema = z.object({
  title: z.string().min(1, "Title is required"),
});

const itemSchema = z.object({
  column_id: z.string().uuid(),
  label: z.string().min(1, "Label is required"),
  href: z.string().min(1, "Link is required"),
});

async function requireAdmin() {
  const user = await getAdminUser();
  if (!user) redirect("/admin");
}

export async function createMenuColumn(formData: FormData) {
  await requireAdmin();

  const parsed = columnSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    redirect(`/admin/menu?error=${encodeURIComponent(parsed.error.issues[0].message)}`);
  }

  const supabase = createAdminClient();
  const { data: existing } = await supabase
    .from("menu_columns")
    .select("sort_order")
    .order("sort_order", { ascending: false })
    .limit(1);
  const nextSortOrder = (existing?.[0]?.sort_order ?? -1) + 1;

  const { error } = await supabase
    .from("menu_columns")
    .insert({ ...parsed.data, sort_order: nextSortOrder });

  if (error) redirect(`/admin/menu?error=${encodeURIComponent(error.message)}`);

  revalidatePath("/admin/menu");
  revalidatePath("/");
  redirect("/admin/menu");
}

export async function deleteMenuColumn(id: string) {
  await requireAdmin();

  const supabase = createAdminClient();
  // menu_items rows reference this column with ON DELETE CASCADE, so
  // deleting a column removes its items automatically.
  await supabase.from("menu_columns").delete().eq("id", id);

  revalidatePath("/admin/menu");
  revalidatePath("/");
  redirect("/admin/menu");
}

export async function toggleMenuColumn(id: string, enabled: boolean) {
  await requireAdmin();

  const supabase = createAdminClient();
  await supabase.from("menu_columns").update({ enabled }).eq("id", id);

  revalidatePath("/admin/menu");
  revalidatePath("/");
}

export async function createMenuItem(formData: FormData) {
  await requireAdmin();

  const parsed = itemSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    redirect(`/admin/menu?error=${encodeURIComponent(parsed.error.issues[0].message)}`);
  }

  const supabase = createAdminClient();
  const { data: existing } = await supabase
    .from("menu_items")
    .select("sort_order")
    .eq("column_id", parsed.data.column_id)
    .order("sort_order", { ascending: false })
    .limit(1);
  const nextSortOrder = (existing?.[0]?.sort_order ?? -1) + 1;

  const { error } = await supabase
    .from("menu_items")
    .insert({ ...parsed.data, sort_order: nextSortOrder });

  if (error) redirect(`/admin/menu?error=${encodeURIComponent(error.message)}`);

  revalidatePath("/admin/menu");
  revalidatePath("/");
  redirect("/admin/menu");
}

export async function deleteMenuItem(id: string) {
  await requireAdmin();

  const supabase = createAdminClient();
  await supabase.from("menu_items").delete().eq("id", id);

  revalidatePath("/admin/menu");
  revalidatePath("/");
  redirect("/admin/menu");
}
