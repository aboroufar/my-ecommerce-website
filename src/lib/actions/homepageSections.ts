"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAdminUser } from "@/lib/auth";

async function requireAdmin() {
  const user = await getAdminUser();
  if (!user) redirect("/admin");
}

export async function toggleHomepageSection(key: string, enabled: boolean) {
  await requireAdmin();

  const supabase = createAdminClient();
  await supabase.from("homepage_sections").update({ enabled }).eq("key", key);

  revalidatePath("/admin/content");
  revalidatePath("/");
}

/**
 * Swaps sort_order with the adjacent section in the given direction, same
 * pattern as moveHeroSlide -- simpler and safer than drag-and-drop for a
 * short, fixed list of section keys.
 */
export async function moveHomepageSection(key: string, direction: "up" | "down") {
  await requireAdmin();

  const supabase = createAdminClient();
  const { data: sections } = await supabase
    .from("homepage_sections")
    .select("key, sort_order")
    .order("sort_order", { ascending: true });

  if (!sections) redirect("/admin/content");

  const index = sections.findIndex((s) => s.key === key);
  const swapIndex = direction === "up" ? index - 1 : index + 1;
  if (index === -1 || swapIndex < 0 || swapIndex >= sections.length) {
    redirect("/admin/content");
  }

  const current = sections[index];
  const swap = sections[swapIndex];

  await supabase
    .from("homepage_sections")
    .update({ sort_order: swap.sort_order })
    .eq("key", current.key);
  await supabase
    .from("homepage_sections")
    .update({ sort_order: current.sort_order })
    .eq("key", swap.key);

  revalidatePath("/admin/content");
  revalidatePath("/");
  redirect("/admin/content");
}
