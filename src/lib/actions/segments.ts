"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
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

const conditionSchema = z.object({
  field: z.enum(["order_count", "email_subscribed", "created_at"]),
  operator: z.enum(["gte", "gt", "lt", "eq"]),
  value: z.union([z.coerce.number(), z.boolean(), z.string()]),
});

const segmentSchema = z.object({
  name: z.string().min(1, "Name is required"),
  field: z.enum(["order_count", "email_subscribed", "created_at"]),
  operator: z.enum(["gte", "gt", "lt", "eq"]),
  value: z.string().min(1, "Value is required"),
});

/**
 * Builds the single-condition array the form submits -- the form only
 * offers one field/operator/value triple at a time (matching how simple
 * every sample segment is), coercing the raw string value to the right
 * JS type for its field so matchesCondition's comparisons work correctly.
 */
function buildConditions(data: z.infer<typeof segmentSchema>) {
  let value: number | boolean | string = data.value;
  if (data.field === "order_count") {
    value = Number(data.value);
  } else if (data.field === "email_subscribed") {
    value = data.value === "true";
  }
  const condition = conditionSchema.parse({
    field: data.field,
    operator: data.operator,
    value,
  });
  return [condition];
}

export async function createSegment(formData: FormData) {
  await requireAdmin();

  const parsed = segmentSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    redirect(`/admin/segments/new?error=${encodeURIComponent(parsed.error.issues[0].message)}`);
  }

  const supabase = createAdminClient();
  const { error } = await supabase.from("customer_segments").insert({
    name: parsed.data.name,
    condition_type: "conditions",
    conditions: buildConditions(parsed.data),
  });

  if (error) {
    redirect(`/admin/segments/new?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/admin/segments");
  redirect("/admin/segments");
}

export async function deleteSegment(id: string) {
  await requireAdmin();

  const supabase = createAdminClient();
  const { error } = await supabase.from("customer_segments").delete().eq("id", id);

  if (error) {
    redirect(`/admin/segments?error=${encodeURIComponent("Could not delete: " + error.message)}`);
  }

  revalidatePath("/admin/segments");
  redirect("/admin/segments");
}
