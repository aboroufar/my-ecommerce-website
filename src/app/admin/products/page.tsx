import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatPrice } from "@/lib/format";
import { bulkUpdateProductStatus, bulkDeleteProducts } from "@/lib/actions/products";
import { BulkSelect } from "@/components/admin/BulkSelect";

// Admins need to see live data including drafts/just-changed stock --
// no ISR caching here.
export const dynamic = "force-dynamic";

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const supabase = createAdminClient();
  const { data: products } = await supabase
    .from("products")
    .select("id, name, slug, price_cents, currency, status, stock_qty")
    .order("created_at", { ascending: false });

  const ids = (products ?? []).map((p) => p.id);

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl text-foreground">Products</h1>
        <Link
          href="/admin/products/new"
          className="bg-accent px-4 py-2 text-sm font-medium text-background transition-opacity hover:opacity-90"
        >
          New product
        </Link>
      </div>

      {error && (
        <p className="mt-6 border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      {!products || products.length === 0 ? (
        <p className="mt-10 text-sm text-muted">
          No products yet. Click &quot;New product&quot; to add your first one.
        </p>
      ) : (
        <div className="mt-8">
          <BulkSelect
            ids={ids}
            bulkForm={(selected) => (
              <>
                <form action={bulkUpdateProductStatus} className="flex items-center gap-2">
                  {selected.map((id) => (
                    <input key={id} type="hidden" name="product_ids" value={id} />
                  ))}
                  <select
                    name="bulk_status"
                    defaultValue="active"
                    className="border border-line bg-background px-2 py-1.5 text-xs"
                  >
                    <option value="draft">Set to draft</option>
                    <option value="active">Set to active</option>
                    <option value="archived">Set to archived</option>
                  </select>
                  <button
                    type="submit"
                    className="bg-accent px-3 py-1.5 text-xs font-medium text-background transition-opacity hover:opacity-90"
                  >
                    Apply
                  </button>
                </form>
                <form action={bulkDeleteProducts}>
                  {selected.map((id) => (
                    <input key={id} type="hidden" name="product_ids" value={id} />
                  ))}
                  <button
                    type="submit"
                    className="text-xs text-red-700 underline underline-offset-4 hover:text-red-800"
                  >
                    Delete selected
                  </button>
                </form>
              </>
            )}
          >
            {({ isSelected, toggle, allSelected, toggleAll }) => (
              <table className="w-full text-left text-sm">
                <thead className="border-b border-line text-xs uppercase tracking-wide text-muted">
                  <tr>
                    <th className="w-8 py-2">
                      <input
                        type="checkbox"
                        checked={allSelected}
                        onChange={toggleAll}
                        aria-label="Select all products"
                      />
                    </th>
                    <th className="py-2 font-medium">Name</th>
                    <th className="py-2 font-medium">Status</th>
                    <th className="py-2 font-medium">Price</th>
                    <th className="py-2 font-medium">Stock</th>
                    <th className="py-2" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {products.map((p) => (
                    <tr key={p.id}>
                      <td className="py-3">
                        <input
                          type="checkbox"
                          checked={isSelected(p.id)}
                          onChange={() => toggle(p.id)}
                          aria-label={`Select ${p.name}`}
                        />
                      </td>
                      <td className="py-3 text-foreground">{p.name}</td>
                      <td className="py-3 text-muted capitalize">{p.status}</td>
                      <td className="py-3 text-foreground">
                        {formatPrice(p.price_cents, p.currency)}
                      </td>
                      <td className="py-3 text-foreground">{p.stock_qty}</td>
                      <td className="py-3 text-right">
                        <Link
                          href={`/admin/products/${p.id}/edit`}
                          className="text-accent underline underline-offset-4"
                        >
                          Edit
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </BulkSelect>
        </div>
      )}
    </div>
  );
}
