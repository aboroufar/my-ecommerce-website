"use server";

import { z } from "zod";
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

const optionsPayloadSchema = z.object({
  optionTypes: z.array(
    z.object({
      name: z.string().min(1),
      values: z.array(z.object({ label: z.string().min(1) })).min(1),
    })
  ),
  variants: z.array(
    z.object({
      // Index into optionTypes[i].values[j] for each option type, in the
      // same order as optionTypes -- identifies which combination this
      // variant row represents without needing client-generated ids.
      valueIndexes: z.array(z.number().int().nonnegative()),
      price: z.coerce.number().nonnegative(),
      stock_qty: z.coerce.number().int().nonnegative(),
      sku: z.string().optional().default(""),
    })
  ),
});

/**
 * Replaces a product's full set of option types/values/variants with the
 * given structure -- same "delete all, reinsert" approach as
 * setProductCategories in src/lib/actions/categories.ts, appropriate here
 * too since the whole options+variants tree is always edited as one unit
 * from the admin form, never incrementally.
 *
 * `optionsJson` is a single JSON-encoded hidden form field (rather than
 * deeply-indexed flat field names) because the nesting -- option types,
 * each with several values, plus a generated combination grid of
 * variants -- doesn't map cleanly onto FormData's flat key/value model.
 */
export async function setProductOptions(productId: string, optionsJson: string) {
  await requireAdmin();

  let raw: unknown;
  try {
    raw = JSON.parse(optionsJson);
  } catch {
    return; // no options submitted (e.g. product has none) -- nothing to do
  }

  const parsed = optionsPayloadSchema.safeParse(raw);
  if (!parsed.success) return;

  const { optionTypes, variants } = parsed.data;
  const supabase = createAdminClient();

  // Cascades to product_option_values, product_variants, and
  // product_variant_options via their FK ON DELETE CASCADE.
  await supabase.from("product_option_types").delete().eq("product_id", productId);

  if (optionTypes.length === 0) return;

  const { data: insertedTypes, error: typesError } = await supabase
    .from("product_option_types")
    .insert(
      optionTypes.map((t, i) => ({
        product_id: productId,
        name: t.name,
        sort_order: i,
      }))
    )
    .select("id");

  if (typesError || !insertedTypes) return;

  // valueIdsByType[typeIndex][valueIndex] -> the inserted row's id, so
  // variants (which reference values by index) can be translated into
  // real option_value_id foreign keys below.
  const valueIdsByType: string[][] = [];
  for (let i = 0; i < optionTypes.length; i++) {
    const { data: insertedValues, error: valuesError } = await supabase
      .from("product_option_values")
      .insert(
        optionTypes[i].values.map((v, j) => ({
          option_type_id: insertedTypes[i].id,
          label: v.label,
          sort_order: j,
        }))
      )
      .select("id");

    if (valuesError || !insertedValues) return;
    valueIdsByType.push(insertedValues.map((v) => v.id));
  }

  if (variants.length === 0) return;

  const { data: insertedVariants, error: variantsError } = await supabase
    .from("product_variants")
    .insert(
      variants.map((v) => ({
        product_id: productId,
        price_cents: Math.round(v.price * 100),
        stock_qty: v.stock_qty,
        sku: v.sku || null,
      }))
    )
    .select("id");

  if (variantsError || !insertedVariants) return;

  const junctionRows = variants.flatMap((v, variantIndex) =>
    v.valueIndexes.map((valueIndex, typeIndex) => ({
      variant_id: insertedVariants[variantIndex].id,
      option_value_id: valueIdsByType[typeIndex]?.[valueIndex],
    }))
  ).filter((row): row is { variant_id: string; option_value_id: string } => !!row.option_value_id);

  if (junctionRows.length > 0) {
    await supabase.from("product_variant_options").insert(junctionRows);
  }
}
