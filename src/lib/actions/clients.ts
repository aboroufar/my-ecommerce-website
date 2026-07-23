"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
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

const profileSchema = z.object({
  name: z.string().min(1, "Name is required"),
  phone: z.string().min(1, "Phone is required"),
  date_of_birth: z.string().min(1, "Date of birth is required"),
  gender: z.enum(["male", "female", "other", "prefer_not_to_say"], {
    message: "Gender is required",
  }),
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

  const { name, phone, date_of_birth, gender } = parsed.data;

  // Uses the logged-in user's own session (not the admin client) -- RLS
  // requires id = auth.uid() for updates, so this simply fails for anyone
  // trying to write another client's row.
  const { error } = await supabase
    .from("clients")
    .update({ name, phone, date_of_birth, gender })
    .eq("id", user.id);

  if (error) {
    redirect(`/account?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/account");
  redirect("/account?saved=1");
}

const completeProfileSchema = z.object({
  name: z.string().min(1, "Name is required"),
  phone: z.string().min(1, "Phone is required"),
  date_of_birth: z.string().min(1, "Date of birth is required"),
  gender: z.enum(["male", "female", "other", "prefer_not_to_say"], {
    message: "Gender is required",
  }),
  email_marketing_consent: z.preprocess((v) => v === "on", z.boolean()),
  sms_marketing_consent: z.preprocess((v) => v === "on", z.boolean()),
  whatsapp_marketing_consent: z.preprocess((v) => v === "on", z.boolean()),
  // Address is optional here -- a customer can finish onboarding without
  // one and add it later from /account/addresses, same as the admin
  // "Add client" form treats its own default address block.
  address_country: z.string().optional().default(""),
  address_line1: z.string().optional().default(""),
  address_line2: z.string().optional().default(""),
  address_city: z.string().optional().default(""),
  address_postal_code: z.string().optional().default(""),
  address_region: z.string().optional().default(""),
});

/**
 * One-time onboarding form shown right after a customer's first
 * magic-link login (see /auth/callback's redirect-when-incomplete
 * check) -- combines updateProfile's fields with marketing consent and
 * an optional billing address in a single submit, since asking for all
 * of it across several separate forms would be a worse first-run
 * experience than one page.
 */
export async function completeProfile(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/account");

  const parsed = completeProfileSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    redirect(`/account/complete-profile?error=${encodeURIComponent(parsed.error.issues[0].message)}`);
  }

  const {
    name,
    phone,
    date_of_birth,
    gender,
    email_marketing_consent,
    sms_marketing_consent,
    whatsapp_marketing_consent,
    address_country,
    address_line1,
    address_line2,
    address_city,
    address_postal_code,
    address_region,
  } = parsed.data;

  // RLS scopes this update to the caller's own row (id = auth.uid()).
  const { error } = await supabase
    .from("clients")
    .update({
      name,
      phone,
      date_of_birth,
      gender,
      sms_marketing_consent,
      whatsapp_marketing_consent,
    })
    .eq("id", user.id);

  if (error) {
    redirect(`/account/complete-profile?error=${encodeURIComponent(error.message)}`);
  }

  if (email_marketing_consent && user.email) {
    // Same list the storefront's newsletter signup and admin "Add client"
    // form write to -- unique constraint on email means a 23505 here is
    // a harmless no-op, not an error worth surfacing.
    await supabase.from("newsletter_subscribers").insert({ email: user.email.toLowerCase() });
  }

  if (address_line1 && address_city && address_postal_code && address_country) {
    await supabase.from("addresses").insert({
      client_id: user.id,
      country: address_country,
      line1: address_line1,
      line2: address_line2 || null,
      city: address_city,
      postal_code: address_postal_code,
      region: address_region || null,
      is_default: true,
      is_billing: true,
    });
  }

  revalidatePath("/account");
  redirect("/account?saved=1");
}

const newClientSchema = z.object({
  first_name: z.string().min(1, "First name is required"),
  last_name: z.string().min(1, "Last name is required"),
  email: z.string().email("A valid email is required"),
  phone: z.string().optional().default(""),
  email_marketing_consent: z.preprocess((v) => v === "on", z.boolean()),
  sms_marketing_consent: z.preprocess((v) => v === "on", z.boolean()),
  whatsapp_marketing_consent: z.preprocess((v) => v === "on", z.boolean()),
  address_country: z.string().optional().default(""),
  address_line1: z.string().optional().default(""),
  address_line2: z.string().optional().default(""),
  address_city: z.string().optional().default(""),
  address_postal_code: z.string().optional().default(""),
  address_region: z.string().optional().default(""),
});

/**
 * Admin-created clients get a real (unconfirmed) Supabase Auth account
 * tied to their email -- same identity model as a self-registered
 * customer, since clients.id is a foreign key to auth.users(id) and every
 * write path in this app (RLS policies, order/segment lookups) assumes
 * that relationship holds. The customer can later sign in themselves via
 * magic link using this email; no password is set here.
 *
 * handle_new_user() already inserts a bare clients row (id, email,
 * display_id) the moment the auth user is created -- this action updates
 * that row with the rest of the form fields rather than inserting a
 * second one.
 */
export async function createClientAccount(formData: FormData) {
  await requireAdmin();

  const parsed = newClientSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    redirect(`/admin/clients/new?error=${encodeURIComponent(parsed.error.issues[0].message)}`);
  }

  const {
    first_name,
    last_name,
    email,
    phone,
    email_marketing_consent,
    sms_marketing_consent,
    whatsapp_marketing_consent,
    address_country,
    address_line1,
    address_line2,
    address_city,
    address_postal_code,
    address_region,
  } = parsed.data;

  const supabase = createAdminClient();

  const { data: created, error: authError } = await supabase.auth.admin.createUser({
    email,
    email_confirm: false,
  });

  if (authError || !created.user) {
    const message =
      authError?.code === "email_exists"
        ? "A client with this email already exists."
        : (authError?.message ?? "Could not create the client account.");
    redirect(`/admin/clients/new?error=${encodeURIComponent(message)}`);
  }

  const clientId = created.user.id;
  const name = `${first_name} ${last_name}`.trim();

  const { error: updateError } = await supabase
    .from("clients")
    .update({
      name,
      phone: phone || null,
      sms_marketing_consent,
      whatsapp_marketing_consent,
    })
    .eq("id", clientId);

  if (updateError) {
    redirect(`/admin/clients/new?error=${encodeURIComponent(updateError.message)}`);
  }

  if (email_marketing_consent) {
    // Same list customer-facing newsletter signup writes to -- unique
    // constraint on email means a 23505 here is a harmless no-op, not an
    // error worth surfacing.
    await supabase.from("newsletter_subscribers").insert({ email: email.toLowerCase() });
  }

  if (address_line1 && address_city && address_postal_code && address_country) {
    await supabase.from("addresses").insert({
      client_id: clientId,
      country: address_country,
      line1: address_line1,
      line2: address_line2 || null,
      city: address_city,
      postal_code: address_postal_code,
      region: address_region || null,
      is_default: true,
    });
  }

  revalidatePath("/admin/clients");
  redirect(`/admin/clients/${clientId}`);
}

const updateClientSchema = z.object({
  first_name: z.string().min(1, "First name is required"),
  last_name: z.string().min(1, "Last name is required"),
  phone: z.string().optional().default(""),
  sms_marketing_consent: z.preprocess((v) => v === "on", z.boolean()),
  whatsapp_marketing_consent: z.preprocess((v) => v === "on", z.boolean()),
});

/**
 * Admin edit of an existing client -- deliberately does not touch email
 * (that's the auth.users identity, changing it needs Supabase's own
 * email-change/re-confirmation flow, not a plain column update) or
 * addresses (managed from the client detail page's own address list,
 * same as a customer manages their own via /account/addresses).
 */
export async function updateClientAccount(clientId: string, formData: FormData) {
  await requireAdmin();

  const parsed = updateClientSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    redirect(
      `/admin/clients/${clientId}/edit?error=${encodeURIComponent(parsed.error.issues[0].message)}`
    );
  }

  const { first_name, last_name, phone, sms_marketing_consent, whatsapp_marketing_consent } =
    parsed.data;
  const name = `${first_name} ${last_name}`.trim();

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("clients")
    .update({
      name,
      phone: phone || null,
      sms_marketing_consent,
      whatsapp_marketing_consent,
    })
    .eq("id", clientId);

  if (error) {
    redirect(`/admin/clients/${clientId}/edit?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/admin/clients");
  revalidatePath(`/admin/clients/${clientId}`);
  redirect(`/admin/clients/${clientId}`);
}

/**
 * Deletes the client's Supabase Auth user, not just the `clients` row --
 * clients.id references auth.users(id) on delete cascade, so this alone
 * removes the clients row and cascades to addresses/carts/wishlist_items
 * too. orders.client_id is `on delete set null` (not cascade), so past
 * orders survive with their financial record intact, just unlinked from
 * a client. Deleting only the `clients` row directly (leaving the auth
 * user behind) would orphan an account that can still sign in but no
 * longer has a client record anywhere in the app.
 */
export async function deleteClientAccount(clientId: string) {
  await requireAdmin();

  const supabase = createAdminClient();
  const { error } = await supabase.auth.admin.deleteUser(clientId);

  if (error) {
    redirect(`/admin/clients?error=${encodeURIComponent("Could not delete: " + error.message)}`);
  }

  revalidatePath("/admin/clients");
  redirect("/admin/clients");
}

const clientNoteSchema = z.object({
  body: z.string().min(1, "Note can't be empty"),
});

/**
 * Adds a staff-only note to a client's activity timeline. Returns a
 * result instead of redirecting -- the detail page's Timeline is a
 * single-page dashboard, not a form flow, so a redirect would just be an
 * unnecessary round trip; the caller clears its own textarea on success.
 */
export async function addClientNote(
  clientId: string,
  body: string
): Promise<{ error: string } | { success: true }> {
  await requireAdmin();

  const parsed = clientNoteSchema.safeParse({ body });
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("client_notes")
    .insert({ client_id: clientId, body: parsed.data.body });

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/admin/clients/${clientId}`);
  return { success: true };
}
