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

const PAYMENT_TERMS = [
  "none",
  "cod",
  "receipt",
  "advance",
  "net7",
  "net15",
  "net30",
  "net45",
  "net60",
] as const;

const supplierSchema = z.object({
  company: z.string().min(1, "Company is required"),
  country: z.string().min(1, "Country/region is required"),
  address_line1: z.string().optional().default(""),
  address_line2: z.string().optional().default(""),
  postal_code: z.string().optional().default(""),
  city: z.string().optional().default(""),
  province: z.string().optional().default(""),
  contact_name: z.string().optional().default(""),
  phone: z.string().optional().default(""),
  email: z
    .union([z.string().email("Enter a valid email address"), z.literal("")])
    .optional()
    .default(""),
  website: z.string().optional().default(""),
  notes: z.string().max(5000, "Notes must be 5000 characters or fewer").optional().default(""),
  payment_terms: z.enum(PAYMENT_TERMS),
  currency: z.string().min(1),
});

/**
 * Minimal supplier creation for the "Create new supplier" flow inside the
 * purchase order form -- returns the new row instead of redirecting, same
 * reasoning as createDiscountLabelInline/createClientTagInline: a
 * redirect would blow away the in-progress purchase order the admin is
 * still filling out. Only company is required here; every other field
 * stays blank and can be filled in later from /admin/suppliers.
 */
export async function createSupplierInline(
  company: string
): Promise<{ id: string; company: string } | { error: string }> {
  await requireAdmin();

  const parsed = z.object({ company: z.string().min(1, "Company is required") }).safeParse({ company });
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("suppliers")
    .insert({ company: parsed.data.company })
    .select("id, company")
    .single();

  if (error || !data) {
    return { error: error?.message ?? "Could not create supplier." };
  }

  revalidatePath("/admin/suppliers");
  return data;
}

export async function createSupplier(formData: FormData) {
  await requireAdmin();

  const parsed = supplierSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    redirect(`/admin/suppliers/new?error=${encodeURIComponent(parsed.error.issues[0].message)}`);
  }

  const {
    company,
    country,
    address_line1,
    address_line2,
    postal_code,
    city,
    province,
    contact_name,
    phone,
    email,
    website,
    notes,
    payment_terms,
    currency,
  } = parsed.data;

  const supabase = createAdminClient();
  const { error } = await supabase.from("suppliers").insert({
    company,
    country,
    address_line1: address_line1 || null,
    address_line2: address_line2 || null,
    postal_code: postal_code || null,
    city: city || null,
    province: province || null,
    contact_name: contact_name || null,
    phone: phone || null,
    email: email || null,
    website: website || null,
    notes: notes || null,
    payment_terms,
    currency,
  });

  if (error) {
    redirect(`/admin/suppliers/new?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/admin/suppliers");
  redirect("/admin/suppliers");
}

export async function updateSupplier(id: string, formData: FormData) {
  await requireAdmin();

  const parsed = supplierSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    redirect(
      `/admin/suppliers/${id}/edit?error=${encodeURIComponent(parsed.error.issues[0].message)}`
    );
  }

  const {
    company,
    country,
    address_line1,
    address_line2,
    postal_code,
    city,
    province,
    contact_name,
    phone,
    email,
    website,
    notes,
    payment_terms,
    currency,
  } = parsed.data;

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("suppliers")
    .update({
      company,
      country,
      address_line1: address_line1 || null,
      address_line2: address_line2 || null,
      postal_code: postal_code || null,
      city: city || null,
      province: province || null,
      contact_name: contact_name || null,
      phone: phone || null,
      email: email || null,
      website: website || null,
      notes: notes || null,
      payment_terms,
      currency,
    })
    .eq("id", id);

  if (error) {
    redirect(`/admin/suppliers/${id}/edit?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/admin/suppliers");
  redirect("/admin/suppliers");
}

export async function deleteSupplier(id: string) {
  await requireAdmin();

  const supabase = createAdminClient();
  const { error } = await supabase.from("suppliers").delete().eq("id", id);

  if (error) {
    redirect(`/admin/suppliers?error=${encodeURIComponent("Could not delete: " + error.message)}`);
  }

  revalidatePath("/admin/suppliers");
  redirect("/admin/suppliers");
}
