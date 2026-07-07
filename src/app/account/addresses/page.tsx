import { createClient } from "@/lib/supabase/server";
import { addAddress, deleteAddress } from "@/lib/actions/addresses";

export const dynamic = "force-dynamic";

export default async function AddressesPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const supabase = await createClient();
  const { data: addresses } = await supabase
    .from("addresses")
    .select("id, line1, line2, city, region, postal_code, country")
    .order("created_at", { ascending: false });

  return (
    <div>
      <h1 className="font-display text-2xl text-foreground">
        Saved addresses
      </h1>

      {error && (
        <p className="mt-6 border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      {addresses && addresses.length > 0 && (
        <ul className="mt-8 divide-y divide-line">
          {addresses.map((a) => (
            <li key={a.id} className="flex items-start justify-between py-4">
              <p className="text-sm text-foreground">
                {a.line1}
                {a.line2 ? `, ${a.line2}` : ""}
                <br />
                {a.city}
                {a.region ? `, ${a.region}` : ""} {a.postal_code}
                <br />
                {a.country}
              </p>
              <form action={deleteAddress.bind(null, a.id)}>
                <button
                  type="submit"
                  className="text-xs text-red-700 underline underline-offset-4 hover:text-red-800"
                >
                  Remove
                </button>
              </form>
            </li>
          ))}
        </ul>
      )}

      <h2 className="mt-10 text-sm font-medium text-foreground">
        Add a new address
      </h2>
      <form action={addAddress} className="mt-4 flex max-w-md flex-col gap-3">
        <input
          name="line1"
          required
          placeholder="Address line 1"
          className="border border-line bg-transparent px-3 py-2 text-sm"
        />
        <input
          name="line2"
          placeholder="Address line 2 (optional)"
          className="border border-line bg-transparent px-3 py-2 text-sm"
        />
        <div className="grid grid-cols-2 gap-3">
          <input
            name="city"
            required
            placeholder="City"
            className="border border-line bg-transparent px-3 py-2 text-sm"
          />
          <input
            name="region"
            placeholder="State / region"
            className="border border-line bg-transparent px-3 py-2 text-sm"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <input
            name="postal_code"
            required
            placeholder="Postal code"
            className="border border-line bg-transparent px-3 py-2 text-sm"
          />
          <input
            name="country"
            required
            placeholder="Country"
            className="border border-line bg-transparent px-3 py-2 text-sm"
          />
        </div>
        <button
          type="submit"
          className="mt-2 self-start bg-accent px-5 py-2 text-sm font-medium text-background transition-opacity hover:opacity-90"
        >
          Save address
        </button>
      </form>
    </div>
  );
}
