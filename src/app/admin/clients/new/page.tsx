import Link from "next/link";
import { createClientAccount } from "@/lib/actions/clients";
import { DefaultAddressSection } from "@/components/admin/DefaultAddressSection";

export default async function NewClientPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <div>
      <Link
        href="/admin/clients"
        className="text-xs uppercase tracking-[0.15em] text-muted transition-colors hover:text-foreground"
      >
        ← Clients
      </Link>

      <h1 className="mt-4 font-display text-2xl text-foreground">Add client</h1>

      {error && (
        <p className="mt-6 max-w-2xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      <form action={createClientAccount} className="mt-8 flex max-w-2xl flex-col gap-8">
        <section>
          <h2 className="text-xs font-medium uppercase tracking-wide text-muted">Client overview</h2>
          <div className="mt-3 grid grid-cols-2 gap-4">
            <label className="flex flex-col gap-1.5">
              <span className="text-sm text-foreground">First name</span>
              <input
                name="first_name"
                required
                className="border border-line bg-background px-3 py-2 text-sm"
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-sm text-foreground">Last name</span>
              <input
                name="last_name"
                required
                className="border border-line bg-background px-3 py-2 text-sm"
              />
            </label>
          </div>

          <label className="mt-4 flex flex-col gap-1.5">
            <span className="text-sm text-foreground">Email</span>
            <input
              type="email"
              name="email"
              required
              className="border border-line bg-background px-3 py-2 text-sm"
            />
          </label>

          <label className="mt-4 flex flex-col gap-1.5">
            <span className="text-sm text-foreground">Phone number</span>
            <input
              type="tel"
              name="phone"
              placeholder="e.g. +39 333 1234567"
              className="border border-line bg-background px-3 py-2 text-sm"
            />
          </label>
        </section>

        <section>
          <h2 className="text-xs font-medium uppercase tracking-wide text-muted">Marketing</h2>
          <p className="mt-2 text-sm text-muted">
            You should ask your customers for permission before you subscribe them to your
            marketing emails, SMS, or WhatsApp messages.
          </p>
          <div className="mt-3 flex flex-col gap-2">
            <label className="flex items-center gap-2 text-sm text-foreground">
              <input type="checkbox" name="email_marketing_consent" />
              Customer agreed to receive marketing emails.
            </label>
            <label className="flex items-center gap-2 text-sm text-foreground">
              <input type="checkbox" name="sms_marketing_consent" />
              Customer agreed to receive SMS marketing text messages.
            </label>
            <label className="flex items-center gap-2 text-sm text-foreground">
              <input type="checkbox" name="whatsapp_marketing_consent" />
              Customer agreed to receive WhatsApp marketing messages.
            </label>
          </div>
        </section>

        <DefaultAddressSection />

        <div className="flex items-center gap-4">
          <button
            type="submit"
            className="bg-accent px-4 py-2 text-xs font-medium uppercase tracking-wide text-background transition-opacity hover:opacity-90"
          >
            Save client
          </button>
          <Link
            href="/admin/clients"
            className="text-xs text-muted underline underline-offset-4 hover:text-foreground"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
