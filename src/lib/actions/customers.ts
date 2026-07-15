"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const profileSchema = z.object({
  name: z.string().min(1, "Name is required"),
  phone: z.string().optional().default(""),
});

export async function updateProfile(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/account");

  const parsed = profileSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    redirect(`/account?error=${encodeURIComponent(parsed.error.issues[0].message)}`);
  }

  const { name, phone } = parsed.data;

  // Uses the logged-in user's own session (not the admin client) -- RLS
  // requires id = auth.uid() for updates, so this simply fails for anyone
  // trying to write another customer's row.
  const { error } = await supabase
    .from("customers")
    .update({ name, phone: phone || null })
    .eq("id", user.id);

  if (error) {
    redirect(`/account?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/account");
  redirect("/account?saved=1");
}
