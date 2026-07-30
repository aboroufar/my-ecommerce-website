"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireSection } from "@/lib/permissions.server";
import { parseWhereClause } from "@/lib/segmentQuery";
import type { Json } from "@/lib/supabase/types";


const segmentSchema = z.object({
  name: z.string().min(1, "Name is required"),
  queryText: z.string().min(1, "Query is required"),
});

export async function createSegment(formData: FormData) {
  await requireSection("segments");

  const parsed = segmentSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    redirect(`/admin/segments/new?error=${encodeURIComponent(parsed.error.issues[0].message)}`);
  }

  const result = parseWhereClause(parsed.data.queryText);
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
  await requireSection("segments");

  const parsed = segmentSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    redirect(
      `/admin/segments/${id}?error=${encodeURIComponent(parsed.error.issues[0].message)}`
    );
  }

  const result = parseWhereClause(parsed.data.queryText);
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

export async function duplicateSegment(id: string) {
  await requireSection("segments");

  const supabase = createAdminClient();
  const { data: original, error: fetchError } = await supabase
    .from("client_segments")
    .select("name, condition_type, conditions, query_text")
    .eq("id", id)
    .single();

  if (fetchError || !original) {
    redirect(`/admin/segments?error=${encodeURIComponent("Could not duplicate: segment not found")}`);
  }

  const { data: copy, error: insertError } = await supabase
    .from("client_segments")
    .insert({
      name: `${original.name} (copy)`,
      condition_type: original.condition_type,
      conditions: original.conditions,
      query_text: original.query_text,
    })
    .select("id")
    .single();

  if (insertError || !copy) {
    redirect(`/admin/segments?error=${encodeURIComponent("Could not duplicate: " + (insertError?.message ?? "unknown error"))}`);
  }

  revalidatePath("/admin/segments");
  redirect(`/admin/segments/${copy.id}`);
}

export async function deleteSegment(id: string) {
  await requireSection("segments");

  const supabase = createAdminClient();
  const { error } = await supabase.from("client_segments").delete().eq("id", id);

  if (error) {
    redirect(`/admin/segments?error=${encodeURIComponent("Could not delete: " + error.message)}`);
  }

  revalidatePath("/admin/segments");
  redirect("/admin/segments");
}
