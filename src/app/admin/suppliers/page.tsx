import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { deleteSupplier } from "@/lib/actions/suppliers";

export const dynamic = "force-dynamic";

export default async function AdminSuppliersPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const supabase = createAdminClient();
  const { data: suppliers } = await supabase
    .from("suppliers")
    .select("id, company, contact_name, email, phone, city, country")
    .order("company", { ascending: true });

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl text-foreground">Suppliers</h1>
        <Link
          href="/admin/suppliers/new"
          className="bg-accent px-4 py-2 text-sm font-medium text-background transition-opacity hover:opacity-90"
        >
          Create supplier
        </Link>
      </div>

      {error && (
        <p className="mt-6 max-w-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      {!suppliers || suppliers.length === 0 ? (
        <p className="mt-10 text-sm text-muted">No suppliers yet.</p>
      ) : (
        <table className="mt-8 w-full text-left text-sm">
          <thead className="border-b border-line text-xs uppercase tracking-wide text-muted">
            <tr>
              <th className="py-2 font-medium">Company</th>
              <th className="py-2 font-medium">Contact</th>
              <th className="py-2 font-medium">Email</th>
              <th className="py-2 font-medium">Phone</th>
              <th className="py-2 font-medium">Location</th>
              <th className="py-2" />
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {suppliers.map((supplier) => (
              <tr key={supplier.id}>
                <td className="py-3 text-foreground">{supplier.company}</td>
                <td className="py-3 text-muted">{supplier.contact_name || "—"}</td>
                <td className="py-3 text-muted">{supplier.email || "—"}</td>
                <td className="py-3 text-muted">{supplier.phone || "—"}</td>
                <td className="py-3 text-muted">
                  {[supplier.city, supplier.country].filter(Boolean).join(", ") || "—"}
                </td>
                <td className="py-3 text-right">
                  <div className="flex items-center justify-end gap-3">
                    <Link
                      href={`/admin/suppliers/${supplier.id}/edit`}
                      className="text-accent underline underline-offset-4"
                    >
                      Edit
                    </Link>
                    <form action={deleteSupplier.bind(null, supplier.id)}>
                      <button
                        type="submit"
                        className="text-red-700 underline underline-offset-4 hover:text-red-800"
                      >
                        Delete
                      </button>
                    </form>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
