"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireSection } from "@/lib/permissions.server";
import { HIGHLIGHT_ICON_KEYS } from "@/components/highlightIcons";


const highlightsPayloadSchema = z.array(
  z.object({
    label: z.string().min(1),
    icon: z.enum(HIGHLIGHT_ICON_KEYS),
  })
);

/**
 * Replaces a product's full set of highlight bullets with the given list --
 * same "delete all, reinsert" approach as setProductOptions/
 * setProductCategories, appropriate here too since the whole list is
 * always edited as one unit from the admin form, never incrementally.
 */
export async function setProductHighlights(productId: string, highlightsJson: string) {
  await requireSection("products");

  let raw: unknown;
  try {
    raw = JSON.parse(highlightsJson);
  } catch {
    return; // no highlights submitted -- nothing to do
  }

  const parsed = highlightsPayloadSchema.safeParse(raw);
  if (!parsed.success) return;

  const supabase = createAdminClient();
  await supabase.from("product_highlights").delete().eq("product_id", productId);

  if (parsed.data.length === 0) return;

  await supabase.from("product_highlights").insert(
    parsed.data.map((h, i) => ({
      product_id: productId,
      label: h.label,
      icon: h.icon,
      sort_order: i,
    }))
  );
}
