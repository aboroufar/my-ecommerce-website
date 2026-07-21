"use client";

import { useState } from "react";
import Link from "next/link";
import { formatPrice } from "@/lib/format";
import { bulkUpdateProductStatus, bulkDeleteProducts } from "@/lib/actions/products";

interface ProductRow {
  id: string;
  name: string;
  sku: string | null;
  status: string;
  price_cents: number;
  currency: string;
  stock_qty: number;
  image_url: string | null;
}

/**
 * Self-contained client component: owns checkbox selection state and
 * renders the whole table + bulk-action bar itself. Deliberately not split
 * into a generic wrapper that takes render-prop functions as children --
 * Server Components can't pass functions as props into Client Components
 * (only serializable data and Server Action references survive that
 * boundary), so a reusable "renders whatever JSX you hand it" wrapper isn't
 * possible here. ProductsBulkTable and OrdersBulkTable duplicate the
 * selection-state logic instead.
 */
export function ProductsBulkTable({ products }: { products: ProductRow[] }) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const ids = products.map((p) => p.id);

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    setSelected((prev) => (prev.size === ids.length ? new Set() : new Set(ids)));
  }

  const selectedIds = [...selected];
  const allSelected = ids.length > 0 && selected.size === ids.length;

  return (
    <div>
      {selectedIds.length > 0 && (
        <div className="mb-4 flex items-center gap-3 border border-line bg-surface px-4 py-3">
          <span className="text-xs text-muted">{selectedIds.length} selected</span>
          <form action={bulkUpdateProductStatus} className="flex items-center gap-2">
            {selectedIds.map((id) => (
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
            {selectedIds.map((id) => (
              <input key={id} type="hidden" name="product_ids" value={id} />
            ))}
            <button
              type="submit"
              className="text-xs text-red-700 underline underline-offset-4 hover:text-red-800"
            >
              Delete selected
            </button>
          </form>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-left text-sm">
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
              <th className="py-2 pl-3 font-medium" colSpan={2}>
                Product
              </th>
              <th className="py-2 font-medium">SKU</th>
              <th className="py-2 font-medium">Status</th>
              <th className="py-2 font-medium">Price</th>
              <th className="py-2 text-right font-medium">Stock</th>
              <th className="py-2" />
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {products.map((p) => (
              <tr key={p.id}>
                <td className="py-3">
                  <input
                    type="checkbox"
                    checked={selected.has(p.id)}
                    onChange={() => toggle(p.id)}
                    aria-label={`Select ${p.name}`}
                  />
                </td>
                <td className="w-12 py-3 pl-3">
                  {p.image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element -- admin-only thumbnail
                    <img
                      src={p.image_url}
                      alt=""
                      className="h-10 w-10 rounded object-cover"
                    />
                  ) : (
                    <div className="flex h-10 w-10 items-center justify-center rounded bg-surface text-[9px] text-muted">
                      No photo
                    </div>
                  )}
                </td>
                <td className="whitespace-nowrap py-3 pl-2 text-foreground">{p.name}</td>
                <td className="whitespace-nowrap py-3 text-muted">{p.sku || "No SKU"}</td>
                <td className="whitespace-nowrap py-3">
                  <span
                    className={`rounded px-1.5 py-0.5 text-xs font-medium capitalize ${
                      p.status === "active"
                        ? "text-muted"
                        : p.status === "draft"
                          ? "bg-amber-100 text-amber-800"
                          : "bg-surface text-muted"
                    }`}
                  >
                    {p.status}
                  </span>
                </td>
                <td className="whitespace-nowrap py-3 text-foreground">
                  {formatPrice(p.price_cents, p.currency)}
                </td>
                <td className="whitespace-nowrap py-3 text-right text-foreground">
                  {p.stock_qty}
                </td>
                <td className="whitespace-nowrap py-3 pl-3 text-right">
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
      </div>
    </div>
  );
}
