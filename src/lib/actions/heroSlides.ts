"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAdminUser } from "@/lib/auth";

const slideSchema = z.object({
  category_id: z.string().uuid("Choose a category"),
  headline: z.string().min(1, "Headline is required"),
  description: z.string().default(""),
  image_url: z.string().min(1, "An image is required"),
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

export async function createHeroSlide(formData: FormData) {
  await requireAdmin();

  const parsed = slideSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    redirect(
      `/admin/content?error=${encodeURIComponent(parsed.error.issues[0].message)}`
    );
  }

  const supabase = createAdminClient();
  const { data: existing } = await supabase
    .from("hero_slides")
    .select("sort_order")
    .order("sort_order", { ascending: false })
    .limit(1);
  const nextSortOrder = (existing?.[0]?.sort_order ?? -1) + 1;

  const { error } = await supabase
    .from("hero_slides")
    .insert({ ...parsed.data, sort_order: nextSortOrder });

  if (error) {
    redirect(`/admin/content?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/admin/content");
  revalidatePath("/");
  redirect("/admin/content?saved=1");
}

export async function updateHeroSlide(id: string, formData: FormData) {
  await requireAdmin();

  const parsed = slideSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    redirect(
      `/admin/content?error=${encodeURIComponent(parsed.error.issues[0].message)}`
    );
  }

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("hero_slides")
    .update(parsed.data)
    .eq("id", id);

  if (error) {
    redirect(`/admin/content?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/admin/content");
  revalidatePath("/");
  redirect("/admin/content?saved=1");
}

export async function deleteHeroSlide(id: string) {
  await requireAdmin();

  const supabase = createAdminClient();
  const { error } = await supabase.from("hero_slides").delete().eq("id", id);

  if (error) {
    redirect(`/admin/content?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/admin/content");
  revalidatePath("/");
  redirect("/admin/content?saved=1");
}

/**
 * Swaps sort_order with the adjacent slide in the given direction --
 * simpler and safer than a full drag-and-drop reorder for what's usually
 * a very short list.
 */
export async function moveHeroSlide(id: string, direction: "up" | "down") {
  await requireAdmin();

  const supabase = createAdminClient();
  const { data: slides } = await supabase
    .from("hero_slides")
    .select("id, sort_order")
    .order("sort_order", { ascending: true });

  if (!slides) redirect("/admin/content");

  const index = slides.findIndex((s) => s.id === id);
  const swapIndex = direction === "up" ? index - 1 : index + 1;
  if (index === -1 || swapIndex < 0 || swapIndex >= slides.length) {
    redirect("/admin/content");
  }

  const current = slides[index];
  const swap = slides[swapIndex];

  await supabase.from("hero_slides").update({ sort_order: swap.sort_order }).eq("id", current.id);
  await supabase.from("hero_slides").update({ sort_order: current.sort_order }).eq("id", swap.id);

  revalidatePath("/admin/content");
  revalidatePath("/");
  redirect("/admin/content");
}
