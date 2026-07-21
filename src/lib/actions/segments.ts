"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAdminUser } from "@/lib/auth";
import { parseSegmentQuery } from "@/lib/segmentQuery";
import type { Json } from "@/lib/supabase/types";

/**
 * Every action here re-checks admin auth itself rather than relying solely
 * on the layout guard -- server actions are callable directly over the
 * network, so the layout's redirect alone isn't enough protection.
 */
async function requireAdmin() {
  const user = await getAdminUser();
  if (!user) redirect("/admin");
}

const segmentSchema = z.object({
  name: z.string().min(1, "Name is required"),
  queryText: z.string().min(1, "Query is required"),
});

export async function createSegment(formData: FormData) {
  await requireAdmin();

  const parsed = segmentSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    redirect(`/admin/segments/new?error=${encodeURIComponent(parsed.error.issues[0].message)}`);
  }

  const result = parseSegmentQuery(parsed.data.queryText);
  if (!result.ok) {
    const message = `Line ${result.errors[0].line}: ${result.errors[0].message}`;
    redirect(`/admin/segments/new?error=${encodeURIComponent(message)}`);
  }

  const supabase = createAdminClient();
  const { error } = await supabase.from("client_segments").insert({
    name: parsed.data.name,
    condition_type: "conditions",
    conditions: result.query.conditions as unknown as Json,
    query_text: parsed.data.queryText,
  });

  if (error) {
    redirect(`/admin/segments/new?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/admin/segments");
  redirect("/admin/segments");
}

export async function updateSegment(id: string, formData: FormData) {
  await requireAdmin();

  const parsed = segmentSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    redirect(
      `/admin/segments/${id}?error=${encodeURIComponent(parsed.error.issues[0].message)}`
    );
  }

  const result = parseSegmentQuery(parsed.data.queryText);
  if (!result.ok) {
    const message = `Line ${result.errors[0].line}: ${result.errors[0].message}`;
    redirect(`/admin/segments/${id}?error=${encodeURIComponent(message)}`);
  }

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("client_segments")
    .update({
      name: parsed.data.name,
      conditions: result.query.conditions as unknown as Json,
      query_text: parsed.data.queryText,
    })
    .eq("id", id);

  if (error) {
    redirect(`/admin/segments/${id}?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/admin/segments");
  revalidatePath(`/admin/segments/${id}`);
  redirect(`/admin/segments/${id}`);
}

export async function deleteSegment(id: string) {
  await requireAdmin();

  const supabase = createAdminClient();
  const { error } = await supabase.from("client_segments").delete().eq("id", id);

  if (error) {
    redirect(`/admin/segments?error=${encodeURIComponent("Could not delete: " + error.message)}`);
  }

  revalidatePath("/admin/segments");
  redirect("/admin/segments");
}
