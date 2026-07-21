"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";

async function getAddressSchema() {
  const t = await getTranslations("addressesErrors");
  return z.object({
    line1: z.string().min(1, t("addressRequired")),
    line2: z.string().optional().default(""),
    city: z.string().min(1, t("cityRequired")),
    region: z.string().optional().default(""),
    postal_code: z.string().min(1, t("postalCodeRequired")),
    country: z.string().min(1, t("countryRequired")),
    // Checkboxes are only present in FormData when checked ("on"), so a
    // missing key means unchecked/false rather than a validation failure.
    is_billing: z.preprocess((v) => v === "on", z.boolean()),
  });
}

export async function addAddress(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/account");

  const addressSchema = await getAddressSchema();
  const parsed = addressSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    redirect(
      `/account/addresses?error=${encodeURIComponent(parsed.error.issues[0].message)}`
    );
  }

  const { line2, region, is_billing, ...rest } = parsed.data;

  // Only one address per client can be the billing address -- clear any
  // existing one first, same invariant as is_default (see setDefaultAddress).
  if (is_billing) {
    await supabase
      .from("addresses")
      .update({ is_billing: false })
      .eq("client_id", user.id);
  }

  // Uses the logged-in user's own session (not the admin client) -- RLS
  // requires client_id = auth.uid(), which also means this insert simply
  // fails for anyone trying to write another client's address.
  const { error } = await supabase.from("addresses").insert({
    client_id: user.id,
    ...rest,
    line2: line2 || null,
    region: region || null,
    is_billing,
  });

  if (error) {
    redirect(`/account/addresses?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/account/addresses");
  redirect("/account/addresses");
}

export async function updateAddress(id: string, formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/account");

  const addressSchema = await getAddressSchema();
  const parsed = addressSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    redirect(
      `/account/addresses?edit=${id}&error=${encodeURIComponent(parsed.error.issues[0].message)}`
    );
  }

  const { line2, region, is_billing, ...rest } = parsed.data;

  if (is_billing) {
    await supabase
      .from("addresses")
      .update({ is_billing: false })
      .eq("client_id", user.id);
  }

  const { error } = await supabase
    .from("addresses")
    .update({
      ...rest,
      line2: line2 || null,
      region: region || null,
      is_billing,
    })
    .eq("id", id)
    .eq("client_id", user.id);

  if (error) {
    redirect(
      `/account/addresses?edit=${id}&error=${encodeURIComponent(error.message)}`
    );
  }

  revalidatePath("/account/addresses");
  redirect("/account/addresses");
}

export async function setBillingAddress(id: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/account");

  // Only one address per client should be marked billing -- clear the
  // existing one (if any) before setting the new one, both scoped to
  // the caller's own rows via RLS regardless.
  await supabase
    .from("addresses")
    .update({ is_billing: false })
    .eq("client_id", user.id);

  await supabase
    .from("addresses")
    .update({ is_billing: true })
    .eq("id", id)
    .eq("client_id", user.id);

  revalidatePath("/account/addresses");
  redirect("/account/addresses");
}

export async function setDefaultAddress(id: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/account");

  // Only one address per client should be marked default -- clear the
  // existing default (if any) before setting the new one, both scoped to
  // the caller's own rows via RLS regardless.
  await supabase
    .from("addresses")
    .update({ is_default: false })
    .eq("client_id", user.id);

  await supabase
    .from("addresses")
    .update({ is_default: true })
    .eq("id", id)
    .eq("client_id", user.id);

  revalidatePath("/account/addresses");
  redirect("/account/addresses");
}

export async function deleteAddress(id: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/account");

  // RLS scopes this to the caller's own rows regardless; the explicit
  // client_id match below is just belt-and-suspenders clarity.
  await supabase
    .from("addresses")
    .delete()
    .eq("id", id)
    .eq("client_id", user.id);

  revalidatePath("/account/addresses");
  redirect("/account/addresses");
}
