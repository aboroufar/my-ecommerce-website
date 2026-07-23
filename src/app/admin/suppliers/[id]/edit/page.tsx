import Link from "next/link";
import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { updateSupplier } from "@/lib/actions/suppliers";
import { SupplierAddressFields } from "@/components/admin/SupplierAddressFields";

export const dynamic = "force-dynamic";

const PAYMENT_TERM_LABELS: Record<string, string> = {
  none: "None",
  cod: "Cash on delivery",
  receipt: "Payment on receipt",
  advance: "Payment in advance",
  net7: "Net 7",
  net15: "Net 15",
  net30: "Net 30",
  net45: "Net 45",
  net60: "Net 60",
};

export default async function EditSupplierPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const { error } = await searchParams;
  const supabase = createAdminClient();

  const { data: supplier } = await supabase
    .from("suppliers")
    .select(
      "id, company, country, address_line1, address_line2, postal_code, city, province, contact_name, phone, email, website, notes, payment_terms, currency"
    )
    .eq("id", id)
    .single();

  if (!supplier) notFound();

  return (
    <div>
      <Link
        href="/admin/suppliers"
        className="text-xs uppercase tracking-[0.15em] text-muted transition-colors hover:text-foreground"
      >
        ← Suppliers
      </Link>

      <h1 className="mt-4 font-display text-2xl text-foreground">Edit supplier</h1>

      {error && (
        <p className="mt-6 max-w-2xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      <form
        action={updateSupplier.bind(null, id)}
        className="mt-8 flex max-w-2xl flex-col gap-8"
      >
        <section>
          <label className="flex flex-col gap-1.5">
            <span className="text-sm text-foreground">Company</span>
            <input
              name="company"
              required
              defaultValue={supplier.company}
              className="border border-line bg-background px-3 py-2 text-sm"
            />
          </label>

          <div className="mt-4">
            <SupplierAddressFields
              defaultCountry={supplier.country}
              defaultLine1={supplier.address_line1 ?? ""}
              defaultLine2={supplier.address_line2 ?? ""}
              defaultPostalCode={supplier.postal_code ?? ""}
              defaultCity={supplier.city ?? ""}
              defaultProvince={supplier.province ?? ""}
            />
          </div>

          <label className="mt-4 flex flex-col gap-1.5">
            <span className="text-sm text-foreground">Contact name</span>
            <input
              name="contact_name"
              defaultValue={supplier.contact_name ?? ""}
              className="border border-line bg-background px-3 py-2 text-sm"
            />
          </label>

          <label className="mt-4 flex flex-col gap-1.5">
            <span className="text-sm text-foreground">Phone number</span>
            <input
              type="tel"
              name="phone"
              defaultValue={supplier.phone ?? ""}
              placeholder="e.g. +39 333 1234567"
              className="border border-line bg-background px-3 py-2 text-sm"
            />
          </label>

          <label className="mt-4 flex flex-col gap-1.5">
            <span className="text-sm text-foreground">Email address</span>
            <input
              type="email"
              name="email"
              defaultValue={supplier.email ?? ""}
              className="border border-line bg-background px-3 py-2 text-sm"
            />
          </label>

          <label className="mt-4 flex flex-col gap-1.5">
            <span className="text-sm text-foreground">Website</span>
            <input
              type="url"
              name="website"
              defaultValue={supplier.website ?? ""}
              placeholder="https://"
              className="border border-line bg-background px-3 py-2 text-sm"
            />
          </label>

          <label className="mt-4 flex flex-col gap-1.5">
            <span className="text-sm text-foreground">Notes</span>
            <textarea
              name="notes"
              rows={4}
              maxLength={5000}
              defaultValue={supplier.notes ?? ""}
              className="border border-line bg-background px-3 py-2 text-sm"
            />
          </label>
        </section>

        <section>
          <h2 className="text-xs font-medium uppercase tracking-wide text-muted">
            Purchasing information
          </h2>
          <p className="mt-2 text-sm text-muted">
            This will auto populate the payment information on the purchase order.
          </p>
          <div className="mt-3 grid grid-cols-2 gap-4">
            <label className="flex flex-col gap-1.5">
              <span className="text-sm text-foreground">Payment terms</span>
              <select
                name="payment_terms"
                defaultValue={supplier.payment_terms}
                className="border border-line bg-background px-3 py-2 text-sm"
              >
                {Object.entries(PAYMENT_TERM_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-sm text-foreground">Supplier currency</span>
              <input type="hidden" name="currency" value={supplier.currency} />
              <select
                defaultValue={supplier.currency}
                disabled
                className="border border-line bg-surface px-3 py-2 text-sm text-muted"
              >
                <option value="eur">Euro (EUR €)</option>
              </select>
            </label>
          </div>
        </section>

        <div className="flex items-center gap-4">
          <button
            type="submit"
            className="bg-accent px-4 py-2 text-xs font-medium uppercase tracking-wide text-background transition-opacity hover:opacity-90"
          >
            Save
          </button>
          <Link
            href="/admin/suppliers"
            className="text-xs text-muted underline underline-offset-4 hover:text-foreground"
          >
            Discard
          </Link>
        </div>
      </form>
    </div>
  );
}
