"use client";

import { useRouter, useSearchParams } from "next/navigation";

const FINANCIAL_STATUS_OPTIONS = ["pending", "paid", "partially_refunded", "refunded", "voided"] as const;
const FULFILLMENT_STATUS_OPTIONS = ["unfulfilled", "partially_fulfilled", "fulfilled", "cancelled"] as const;

/**
 * Top search/filter bar for /admin/orders -- a horizontal bar above the
 * table (search box + two independent status dropdowns + Date range),
 * matching the pattern AdminProductsFilterBar uses for /admin/products.
 * Two separate financial_status/fulfillment_status params replace the
 * old single `status` param, since the two tracks are independent (see
 * the orders schema split) -- filtering by both at once (e.g. "paid" +
 * "unfulfilled") is a real, useful combination a single dropdown
 * couldn't express. Every control writes straight into the URL's
 * search params (router.push), so filters are shareable/bookmarkable
 * and survive a page refresh.
 */
export function AdminOrdersFilterBar() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const q = searchParams.get("q") ?? "";
  const financialStatus = searchParams.get("financial_status") ?? "";
  const fulfillmentStatus = searchParams.get("fulfillment_status") ?? "";
  const from = searchParams.get("from") ?? "";
  const to = searchParams.get("to") ?? "";

  const hasFilters = q || financialStatus || fulfillmentStatus || from || to;

  function pushParams(mutate: (params: URLSearchParams) => void) {
    const params = new URLSearchParams(searchParams.toString());
    mutate(params);
    router.push(`/admin/orders?${params.toString()}`);
  }

  function setParam(key: string, value: string) {
    pushParams((params) => {
      if (value) params.set(key, value);
      else params.delete(key);
    });
  }

  return (
    <div className="flex flex-col gap-3 border border-line bg-surface p-3">
      <div className="flex flex-wrap items-center gap-3">
        <input
          type="search"
          defaultValue={q}
          placeholder="Search order # or client email"
          onKeyDown={(e) => {
            if (e.key === "Enter") setParam("q", e.currentTarget.value.trim());
          }}
          onBlur={(e) => setParam("q", e.currentTarget.value.trim())}
          className="min-w-[240px] flex-1 border border-line bg-background px-3 py-1.5 text-sm"
        />

        <select
          value={financialStatus}
          onChange={(e) => setParam("financial_status", e.target.value)}
          className="border border-line bg-background px-2.5 py-1.5 text-sm capitalize"
        >
          <option value="">All payment statuses</option>
          {FINANCIAL_STATUS_OPTIONS.map((value) => (
            <option key={value} value={value} className="capitalize">
              {value.replace(/_/g, " ")}
            </option>
          ))}
        </select>

        <select
          value={fulfillmentStatus}
          onChange={(e) => setParam("fulfillment_status", e.target.value)}
          className="border border-line bg-background px-2.5 py-1.5 text-sm capitalize"
        >
          <option value="">All fulfillment statuses</option>
          {FULFILLMENT_STATUS_OPTIONS.map((value) => (
            <option key={value} value={value} className="capitalize">
              {value.replace(/_/g, " ")}
            </option>
          ))}
        </select>

        <label className="flex items-center gap-1.5 text-sm text-muted">
          From
          <input
            type="date"
            value={from}
            onChange={(e) => setParam("from", e.target.value)}
            className="border border-line bg-background px-2 py-1.5 text-sm"
          />
        </label>

        <label className="flex items-center gap-1.5 text-sm text-muted">
          To
          <input
            type="date"
            value={to}
            onChange={(e) => setParam("to", e.target.value)}
            className="border border-line bg-background px-2 py-1.5 text-sm"
          />
        </label>

        {hasFilters && (
          <button
            type="button"
            onClick={() => router.push("/admin/orders")}
            className="ml-auto text-xs text-accent underline underline-offset-4 hover:opacity-80"
          >
            Clear all
          </button>
        )}
      </div>
    </div>
  );
}
