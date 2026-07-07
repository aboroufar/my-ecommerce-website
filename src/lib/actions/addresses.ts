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

  const { line2, region, ...rest } = parsed.data;

  // Uses the logged-in user's own session (not the admin client) -- RLS
  // requires customer_id = auth.uid(), which also means this insert simply
  // fails for anyone trying to write another customer's address.
  const { error } = await supabase.from("addresses").insert({
    customer_id: user.id,
    ...rest,
    line2: line2 || null,
    region: region || null,
  });

  if (error) {
    redirect(`/account/addresses?error=${encodeURIComponent(error.message)}`);
  }

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
