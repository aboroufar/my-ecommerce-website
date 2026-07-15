import Link from "next/link";
import { getSessionUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { updateProfile } from "@/lib/actions/customers";

export const dynamic = "force-dynamic";

export default async function AccountOverviewPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; saved?: string }>;
}) {
  const { error, saved } = await searchParams;
  const user = await getSessionUser();

  const supabase = await createClient();
  const { data: customer } = user
    ? await supabase
        .from("customers")
        .select("name, phone, client_id")
        .eq("id", user.id)
        .single()
    : { data: null };

  return (
    <div>
      <h1 className="font-display text-2xl text-foreground">Welcome back</h1>
      <p className="mt-2 text-sm text-muted">{user?.email}</p>
      {customer?.client_id && (
        <p className="mt-1 text-xs text-muted">
          Client ID: <span className="font-medium text-foreground">{customer.client_id}</span>
        </p>
      )}

      {error && (
        <p className="mt-6 max-w-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}
      {saved && (
        <p className="mt-6 max-w-md border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
          Saved.
        </p>
      )}

      <h2 className="mt-10 text-sm font-medium text-foreground">
        Profile details
      </h2>
      <form action={updateProfile} className="mt-4 flex max-w-md flex-col gap-3">
        <input
          name="name"
          required
          defaultValue={customer?.name ?? ""}
          placeholder="Full name"
          className="border border-line bg-transparent px-3 py-2 text-sm"
        />
        <input
          name="phone"
          type="tel"
          defaultValue={customer?.phone ?? ""}
          placeholder="Phone number (optional)"
          className="border border-line bg-transparent px-3 py-2 text-sm"
        />
        <button
          type="submit"
          className="mt-2 self-start bg-accent px-5 py-2 text-sm font-medium text-background transition-opacity hover:opacity-90"
        >
          Save profile
        </button>
      </form>

      <div className="mt-10 flex gap-4">
        <Link
          href="/account/orders"
          className="border border-line px-4 py-2 text-sm text-foreground transition-colors hover:border-foreground"
        >
          Order history
        </Link>
        <Link
          href="/account/addresses"
          className="border border-line px-4 py-2 text-sm text-foreground transition-colors hover:border-foreground"
        >
          Saved addresses
        </Link>
      </div>
    </div>
  );
}
