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

export async function updateMenuColumn(id: string, formData: FormData) {
  await requireAdmin();

  const parsed = columnSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    redirect(`/admin/menu?error=${encodeURIComponent(parsed.error.issues[0].message)}`);
  }

  const supabase = createAdminClient();
  const { error } = await supabase.from("menu_columns").update(parsed.data).eq("id", id);

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

export async function updateMenuItem(id: string, formData: FormData) {
  await requireAdmin();

  const schema = z.object({
    label: z.string().min(1, "Label is required"),
    href: z.string().min(1, "Link is required"),
  });
  const parsed = schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    redirect(`/admin/menu?error=${encodeURIComponent(parsed.error.issues[0].message)}`);
  }

  const supabase = createAdminClient();
  const { error } = await supabase.from("menu_items").update(parsed.data).eq("id", id);

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

/** Swaps sort_order with the adjacent column in the given direction. */
export async function moveMenuColumn(id: string, direction: "up" | "down") {
  await requireAdmin();

  const supabase = createAdminClient();
  const { data: columns } = await supabase
    .from("menu_columns")
    .select("id, sort_order")
    .order("sort_order", { ascending: true });

  if (!columns) redirect("/admin/menu");

  const index = columns.findIndex((c) => c.id === id);
  const swapIndex = direction === "up" ? index - 1 : index + 1;
  if (index === -1 || swapIndex < 0 || swapIndex >= columns.length) {
    redirect("/admin/menu");
  }

  const current = columns[index];
  const swap = columns[swapIndex];

  await supabase.from("menu_columns").update({ sort_order: swap.sort_order }).eq("id", current.id);
  await supabase.from("menu_columns").update({ sort_order: current.sort_order }).eq("id", swap.id);

  revalidatePath("/admin/menu");
  revalidatePath("/");
  redirect("/admin/menu");
}

/** Swaps sort_order with the adjacent item (within the same column) in the given direction. */
export async function moveMenuItem(id: string, columnId: string, direction: "up" | "down") {
  await requireAdmin();

  const supabase = createAdminClient();
  const { data: items } = await supabase
    .from("menu_items")
    .select("id, sort_order")
    .eq("column_id", columnId)
    .order("sort_order", { ascending: true });

  if (!items) redirect("/admin/menu");

  const index = items.findIndex((i) => i.id === id);
  const swapIndex = direction === "up" ? index - 1 : index + 1;
  if (index === -1 || swapIndex < 0 || swapIndex >= items.length) {
    redirect("/admin/menu");
  }

  const current = items[index];
  const swap = items[swapIndex];

  await supabase.from("menu_items").update({ sort_order: swap.sort_order }).eq("id", current.id);
  await supabase.from("menu_items").update({ sort_order: current.sort_order }).eq("id", swap.id);

  revalidatePath("/admin/menu");
  revalidatePath("/");
  redirect("/admin/menu");
}
