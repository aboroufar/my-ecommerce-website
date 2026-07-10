"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAdminUser } from "@/lib/auth";

const brandSchema = z.object({
  name: z.string().min(1, "Name is required"),
  logo_url: z.string().min(1, "A logo image is required"),
  link_url: z.union([z.string().min(1), z.literal("")]).optional(),
});

async function requireAdmin() {
  const user = await getAdminUser();
  if (!user) redirect("/admin");
}

export async function createBrand(formData: FormData) {
  await requireAdmin();

  const parsed = brandSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    redirect(`/admin/brands?error=${encodeURIComponent(parsed.error.issues[0].message)}`);
  }

  const supabase = createAdminClient();
  const { data: existing } = await supabase
    .from("brands")
    .select("sort_order")
    .order("sort_order", { ascending: false })
    .limit(1);
  const nextSortOrder = (existing?.[0]?.sort_order ?? -1) + 1;

  const { error } = await supabase.from("brands").insert({
    name: parsed.data.name,
    logo_url: parsed.data.logo_url,
    link_url: parsed.data.link_url || null,
    sort_order: nextSortOrder,
  });

  if (error) redirect(`/admin/brands?error=${encodeURIComponent(error.message)}`);

  revalidatePath("/admin/brands");
  revalidatePath("/");
  redirect("/admin/brands");
}

export async function updateBrand(id: string, formData: FormData) {
  await requireAdmin();

  const parsed = brandSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    redirect(`/admin/brands?error=${encodeURIComponent(parsed.error.issues[0].message)}`);
  }

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("brands")
    .update({
      name: parsed.data.name,
      logo_url: parsed.data.logo_url,
      link_url: parsed.data.link_url || null,
    })
    .eq("id", id);

  if (error) redirect(`/admin/brands?error=${encodeURIComponent(error.message)}`);

  revalidatePath("/admin/brands");
  revalidatePath("/");
  redirect("/admin/brands");
}

export async function deleteBrand(id: string) {
  await requireAdmin();

  const supabase = createAdminClient();
  await supabase.from("brands").delete().eq("id", id);

  revalidatePath("/admin/brands");
  revalidatePath("/");
  redirect("/admin/brands");
}

/**
 * Swaps sort_order with the adjacent brand in the given direction, same
 * pattern as moveHeroSlide.
 */
export async function moveBrand(id: string, direction: "up" | "down") {
  await requireAdmin();

  const supabase = createAdminClient();
  const { data: brands } = await supabase
    .from("brands")
    .select("id, sort_order")
    .order("sort_order", { ascending: true });

  if (!brands) redirect("/admin/brands");

  const index = brands.findIndex((b) => b.id === id);
  const swapIndex = direction === "up" ? index - 1 : index + 1;
  if (index === -1 || swapIndex < 0 || swapIndex >= brands.length) {
    redirect("/admin/brands");
  }

  const current = brands[index];
  const swap = brands[swapIndex];

  await supabase.from("brands").update({ sort_order: swap.sort_order }).eq("id", current.id);
  await supabase.from("brands").update({ sort_order: current.sort_order }).eq("id", swap.id);

  revalidatePath("/admin/brands");
  revalidatePath("/");
  redirect("/admin/brands");
}
