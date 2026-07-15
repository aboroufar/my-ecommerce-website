import Link from "next/link";
import { getSessionUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { updateProfile } from "@/lib/actions/customers";

export const dynamic = "force-dynamic";

const GENDER_LABELS: Record<string, string> = {
  male: "Male",
  female: "Female",
  other: "Other",
  prefer_not_to_say: "Prefer not to say",
};

function formatDate(isoDate: string) {
  return new Date(isoDate + "T00:00:00").toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

const COUNTRY_LABELS: Record<string, string> = { IT: "Italy" };

export default async function AccountOverviewPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; saved?: string; edit?: string }>;
}) {
  const { error, saved, edit } = await searchParams;
  const user = await getSessionUser();
  const editingProfile = edit === "profile";

  const supabase = await createClient();
  const [{ data: customer }, { data: billingAddress }] = user
    ? await Promise.all([
        supabase
          .from("customers")
          .select("name, phone, client_id, date_of_birth, gender")
          .eq("id", user.id)
          .single(),
        supabase
          .from("addresses")
          .select("line1, line2, city, region, postal_code, country")
          .eq("customer_id", user.id)
          .eq("is_billing", true)
          .maybeSingle(),
      ])
    : [{ data: null }, { data: null }];

  return (
    <div>
      <h1 className="font-display text-2xl text-foreground">Welcome back</h1>

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

      <h2 className="mt-10 font-display text-lg font-bold uppercase tracking-wide text-foreground">
        My personal data
      </h2>

      <div className="mt-6 grid gap-10 sm:grid-cols-2">
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted">
            Billing address
          </h3>
          <div className="mt-2 text-sm text-foreground">
            {billingAddress ? (
              <>
                <p>{customer?.name}</p>
                <p>
                  {billingAddress.line1}
                  {billingAddress.line2 ? `, ${billingAddress.line2}` : ""}
                </p>
                <p>
                  {billingAddress.postal_code} {billingAddress.city}
                  {billingAddress.region ? `, ${billingAddress.region}` : ""}
                </p>
                <p>
                  {COUNTRY_LABELS[billingAddress.country] ?? billingAddress.country}
                </p>
              </>
            ) : (
              <p className="text-muted">No billing address set.</p>
            )}
          </div>
          <Link
            href="/account/addresses"
            className="mt-3 inline-flex items-center gap-1.5 text-sm text-foreground underline underline-offset-4 hover:text-accent"
          >
            <EditIcon /> Edit
          </Link>
        </div>

        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted">
            Customer data
          </h3>
          {editingProfile ? (
            <form action={updateProfile} className="mt-3 flex max-w-xs flex-col gap-3">
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
                required
                defaultValue={customer?.phone ?? ""}
                placeholder="Phone number"
                className="border border-line bg-transparent px-3 py-2 text-sm"
              />
              <label className="flex flex-col gap-1.5">
                <span className="text-xs text-muted">Date of birth</span>
                <input
                  name="date_of_birth"
                  type="date"
                  required
                  defaultValue={customer?.date_of_birth ?? ""}
                  className="border border-line bg-transparent px-3 py-2 text-sm text-foreground"
                />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-xs text-muted">Gender</span>
                <select
                  name="gender"
                  required
                  defaultValue={customer?.gender ?? ""}
                  className="border border-line bg-transparent px-3 py-2 text-sm text-foreground"
                >
                  <option value="" disabled>
                    Select…
                  </option>
                  {Object.entries(GENDER_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>
              <div className="mt-1 flex items-center gap-4">
                <button
                  type="submit"
                  className="self-start bg-accent px-5 py-2 text-sm font-medium text-background transition-opacity hover:opacity-90"
                >
                  Save
                </button>
                <Link
                  href="/account"
                  className="text-xs text-muted underline underline-offset-4 hover:text-foreground"
                >
                  Cancel
                </Link>
              </div>
            </form>
          ) : (
            <>
              <div className="mt-2 text-sm text-foreground">
                <p>{customer?.name}</p>
                <p>{user?.email}</p>
                {customer?.date_of_birth && <p>{formatDate(customer.date_of_birth)}</p>}
                {customer?.phone && <p>{customer.phone}</p>}
                {customer?.gender && <p>{GENDER_LABELS[customer.gender] ?? customer.gender}</p>}
              </div>
              <Link
                href="/account?edit=profile"
                className="mt-3 inline-flex items-center gap-1.5 text-sm text-foreground underline underline-offset-4 hover:text-accent"
              >
                <EditIcon /> Edit
              </Link>
            </>
          )}

          {customer?.client_id && (
            <p className="mt-6 text-sm text-foreground">
              My customer number:{" "}
              <span className="font-semibold">{customer.client_id}</span>
            </p>
          )}
        </div>
      </div>

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

function EditIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-3.5 w-3.5">
      <path
        d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5Z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
