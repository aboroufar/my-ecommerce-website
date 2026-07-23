import Link from "next/link";
import { createSupplier } from "@/lib/actions/suppliers";
import { SupplierAddressFields } from "@/components/admin/SupplierAddressFields";

export default async function NewSupplierPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <div>
      <Link
        href="/admin/suppliers"
        className="text-xs uppercase tracking-[0.15em] text-muted transition-colors hover:text-foreground"
      >
        ← Suppliers
      </Link>

      <h1 className="mt-4 font-display text-2xl text-foreground">Create supplier</h1>

      {error && (
        <p className="mt-6 max-w-2xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      <form action={createSupplier} className="mt-8 flex max-w-2xl flex-col gap-8">
        <section>
          <label className="flex flex-col gap-1.5">
            <span className="text-sm text-foreground">Company</span>
            <input
              name="company"
              required
              className="border border-line bg-background px-3 py-2 text-sm"
            />
          </label>

          <div className="mt-4">
            <SupplierAddressFields />
          </div>

          <label className="mt-4 flex flex-col gap-1.5">
            <span className="text-sm text-foreground">Contact name</span>
            <input
              name="contact_name"
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

          <label className="mt-4 flex flex-col gap-1.5">
            <span className="text-sm text-foreground">Email address</span>
            <input
              type="email"
              name="email"
              className="border border-line bg-background px-3 py-2 text-sm"
            />
          </label>

          <label className="mt-4 flex flex-col gap-1.5">
            <span className="text-sm text-foreground">Website</span>
            <input
              type="url"
              name="website"
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
                defaultValue="none"
                className="border border-line bg-background px-3 py-2 text-sm"
              >
                <option value="none">None</option>
                <option value="cod">Cash on delivery</option>
                <option value="receipt">Payment on receipt</option>
                <option value="advance">Payment in advance</option>
                <option value="net7">Net 7</option>
                <option value="net15">Net 15</option>
                <option value="net30">Net 30</option>
                <option value="net45">Net 45</option>
                <option value="net60">Net 60</option>
              </select>
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-sm text-foreground">Supplier currency</span>
              {/* This store is single-currency (see AGENTS.md conventions and
                  every other currency column in this app) -- shown as a
                  fixed field rather than a real picker. A plain disabled
                  <select> wouldn't submit its value at all, so the actual
                  value travels via this hidden input instead. */}
              <input type="hidden" name="currency" value="eur" />
              <select
                defaultValue="eur"
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
