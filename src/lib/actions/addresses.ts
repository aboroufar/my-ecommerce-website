"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const addressSchema = z.object({
  line1: z.string().min(1, "Address is required"),
  line2: z.string().optional().default(""),
  city: z.string().min(1, "City is required"),
  region: z.string().optional().default(""),
  postal_code: z.string().min(1, "Postal code is required"),
  country: z.string().min(1, "Country is required"),
  // Checkboxes are only present in FormData when checked ("on"), so a
  // missing key means unchecked/false rather than a validation failure.
  is_billing: z.preprocess((v) => v === "on", z.boolean()),
});

export async function addAddress(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/account");

  const parsed = addressSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    redirect(
      `/account/addresses?error=${encodeURIComponent(parsed.error.issues[0].message)}`
    );
  }

  const { line2, region, is_billing, ...rest } = parsed.data;

  // Only one address per customer can be the billing address -- clear any
  // existing one first, same invariant as is_default (see setDefaultAddress).
  if (is_billing) {
    await supabase
      .from("addresses")
      .update({ is_billing: false })
      .eq("customer_id", user.id);
  }

  // Uses the logged-in user's own session (not the admin client) -- RLS
  // requires customer_id = auth.uid(), which also means this insert simply
  // fails for anyone trying to write another customer's address.
  const { error } = await supabase.from("addresses").insert({
    customer_id: user.id,
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

// Same validation + insert logic as addAddress, but returns a result
// instead of redirecting -- used by the checkout address-selection step.
export async function addAddressInline(
  formData: FormData
): Promise<{ success: true } | { success: false; error: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not signed in." };

  const parsed = addressSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  const { line2, region, is_billing, ...rest } = parsed.data;

  if (is_billing) {
    await supabase
      .from("addresses")
      .update({ is_billing: false })
      .eq("customer_id", user.id);
  }

  const { error } = await supabase.from("addresses").insert({
    customer_id: user.id,
    ...rest,
    line2: line2 || null,
    region: region || null,
    is_billing,
  });

  if (error) return { success: false, error: error.message };

  revalidatePath("/account/addresses");
  return { success: true };
}

export async function updateAddress(id: string, formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/account");

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
      .eq("customer_id", user.id);
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
    .eq("customer_id", user.id);

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

  // Only one address per customer should be marked billing -- clear the
  // existing one (if any) before setting the new one, both scoped to
  // the caller's own rows via RLS regardless.
  await supabase
    .from("addresses")
    .update({ is_billing: false })
    .eq("customer_id", user.id);

  await supabase
    .from("addresses")
    .update({ is_billing: true })
    .eq("id", id)
    .eq("customer_id", user.id);

  revalidatePath("/account/addresses");
  redirect("/account/addresses");
}

// Same clear-then-set logic as setBillingAddress, but returns a result
// instead of redirecting -- used by the checkout address-selection step,
// which needs to stay on the same page rather than bouncing to
// /account/addresses.
export async function setBillingAddressInline(
  id: string
): Promise<{ success: true } | { success: false; error: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not signed in." };

  await supabase
    .from("addresses")
    .update({ is_billing: false })
    .eq("customer_id", user.id);

  const { error } = await supabase
    .from("addresses")
    .update({ is_billing: true })
    .eq("id", id)
    .eq("customer_id", user.id);

  if (error) return { success: false, error: error.message };

  revalidatePath("/account/addresses");
  return { success: true };
}

export async function setDefaultAddress(id: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/account");

  // Only one address per customer should be marked default -- clear the
  // existing default (if any) before setting the new one, both scoped to
  // the caller's own rows via RLS regardless.
  await supabase
    .from("addresses")
    .update({ is_default: false })
    .eq("customer_id", user.id);

  await supabase
    .from("addresses")
    .update({ is_default: true })
    .eq("id", id)
    .eq("customer_id", user.id);

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
  // customer_id match below is just belt-and-suspenders clarity.
  await supabase
    .from("addresses")
    .delete()
    .eq("id", id)
    .eq("customer_id", user.id);

  revalidatePath("/account/addresses");
  redirect("/account/addresses");
}
