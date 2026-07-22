import Link from "next/link";
import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { updateClientAccount } from "@/lib/actions/clients";

export const dynamic = "force-dynamic";

export default async function EditClientPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const { error } = await searchParams;
  const supabase = createAdminClient();

  const { data: client } = await supabase
    .from("clients")
    .select("id, email, name, phone, sms_marketing_consent, whatsapp_marketing_consent")
    .eq("id", id)
    .single();

  if (!client) notFound();

  // clients.name is one combined field (see createClientAccount) --
  // split back into first/last for the form the same way it was joined,
  // falling back to putting everything in "first name" if there's no
  // space to split on.
  const [firstName, ...rest] = (client.name ?? "").split(" ");
  const lastName = rest.join(" ");

  return (
    <div>
      <Link
        href={`/admin/clients/${id}`}
        className="text-xs uppercase tracking-[0.15em] text-muted transition-colors hover:text-foreground"
      >
        ← {client.email}
      </Link>

      <h1 className="mt-4 font-display text-2xl text-foreground">Edit client</h1>

      {error && (
        <p className="mt-6 max-w-2xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      <form
        action={updateClientAccount.bind(null, id)}
        className="mt-8 flex max-w-2xl flex-col gap-8"
      >
        <section>
          <h2 className="text-xs font-medium uppercase tracking-wide text-muted">Client overview</h2>
          <div className="mt-3 grid grid-cols-2 gap-4">
            <label className="flex flex-col gap-1.5">
              <span className="text-sm text-foreground">First name</span>
              <input
                name="first_name"
                required
                defaultValue={firstName}
                className="border border-line bg-background px-3 py-2 text-sm"
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-sm text-foreground">Last name</span>
              <input
                name="last_name"
                required
                defaultValue={lastName}
                className="border border-line bg-background px-3 py-2 text-sm"
              />
            </label>
          </div>

          <label className="mt-4 flex flex-col gap-1.5">
            <span className="text-sm text-foreground">Email</span>
            <input
              type="email"
              value={client.email}
              disabled
              className="border border-line bg-surface px-3 py-2 text-sm text-muted"
            />
          </label>

          <label className="mt-4 flex flex-col gap-1.5">
            <span className="text-sm text-foreground">Phone number</span>
            <input
              type="tel"
              name="phone"
              defaultValue={client.phone ?? ""}
              placeholder="e.g. +39 333 1234567"
              className="border border-line bg-background px-3 py-2 text-sm"
            />
          </label>
        </section>

        <section>
          <h2 className="text-xs font-medium uppercase tracking-wide text-muted">Marketing</h2>
          <div className="mt-3 flex flex-col gap-2">
            <label className="flex items-center gap-2 text-sm text-foreground">
              <input
                type="checkbox"
                name="sms_marketing_consent"
                defaultChecked={client.sms_marketing_consent}
              />
              Customer agreed to receive SMS marketing text messages.
            </label>
            <label className="flex items-center gap-2 text-sm text-foreground">
              <input
                type="checkbox"
                name="whatsapp_marketing_consent"
                defaultChecked={client.whatsapp_marketing_consent}
              />
              Customer agreed to receive WhatsApp marketing messages.
            </label>
          </div>
        </section>

        <div className="flex items-center gap-4">
          <button
            type="submit"
            className="bg-accent px-4 py-2 text-xs font-medium uppercase tracking-wide text-background transition-opacity hover:opacity-90"
          >
            Save changes
          </button>
          <Link
            href={`/admin/clients/${id}`}
            className="text-xs text-muted underline underline-offset-4 hover:text-foreground"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
