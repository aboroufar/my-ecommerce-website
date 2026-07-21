"use client";

import Link from "next/link";
import { toggleDiscountCode, deleteDiscountCode } from "@/lib/actions/discounts";
import { DiscountTypeModal } from "./DiscountTypeModal";
import type { DiscountConfig } from "@/lib/discounts";

interface DiscountCode {
  id: string;
  code: string;
  discount_type: string;
  config: unknown;
  active: boolean;
  expires_at: string | null;
  tags: string[];
}

const TYPE_LABELS: Record<string, string> = {
  amount_off_products: "Amount off products",
  buy_x_get_y: "Buy X get Y",
  amount_off_order: "Amount off order",
  free_shipping: "Free shipping",
};

function formatValue(discountCode: DiscountCode) {
  const config = discountCode.config as DiscountConfig;
  if (config.discount_type === "free_shipping") return "Free shipping";
  if (config.discount_type === "buy_x_get_y") {
    if (config.get.valueType === "free") return "Free";
    return config.get.valueType === "percent" ? `${config.get.value}% off` : `€${(config.get.value / 100).toFixed(2)} off`;
  }
  return config.valueType === "percent" ? `${config.value}%` : `€${(config.value / 100).toFixed(2)}`;
}

function formatMethod(discountCode: DiscountCode) {
  const config = discountCode.config as DiscountConfig;
  return config.method === "code" ? discountCode.code : "Automatic";
}

export function DiscountCodesManager({ codes }: { codes: DiscountCode[] }) {
  return (
    <div className="max-w-3xl">
      {codes.length > 0 && (
        <table className="w-full text-left text-sm">
          <thead className="border-b border-line text-xs uppercase tracking-wide text-muted">
            <tr>
              <th className="py-2 font-medium">Code / Method</th>
              <th className="py-2 font-medium">Type</th>
              <th className="py-2 font-medium">Value</th>
              <th className="py-2 font-medium">Tags</th>
              <th className="py-2 font-medium">Expires</th>
              <th className="py-2 font-medium">Status</th>
              <th className="py-2" />
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {codes.map((discountCode) => (
              <tr key={discountCode.id}>
                <td className="py-3">
                  <Link
                    href={`/admin/discounts/${discountCode.id}/edit`}
                    className="font-medium text-foreground hover:underline"
                  >
                    {formatMethod(discountCode)}
                  </Link>
                </td>
                <td className="py-3 text-muted">
                  {TYPE_LABELS[discountCode.discount_type] ?? discountCode.discount_type}
                </td>
                <td className="py-3 text-foreground">{formatValue(discountCode)}</td>
                <td className="py-3 text-muted">
                  {discountCode.tags.length > 0 ? discountCode.tags.join(", ") : "—"}
                </td>
                <td className="py-3 text-muted">
                  {discountCode.expires_at
                    ? new Date(discountCode.expires_at).toLocaleDateString()
                    : "Never"}
                </td>
                <td className="py-3">
                  <form action={toggleDiscountCode.bind(null, discountCode.id, discountCode.active)}>
                    <button
                      type="submit"
                      className={
                        discountCode.active
                          ? "bg-accent px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-background"
                          : "border border-line px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted"
                      }
                    >
                      {discountCode.active ? "Active" : "Inactive"}
                    </button>
                  </form>
                </td>
                <td className="py-3 text-right">
                  <form action={deleteDiscountCode.bind(null, discountCode.id)}>
                    <button
                      type="submit"
                      className="text-xs text-red-700 underline underline-offset-4 hover:text-red-800"
                    >
                      Remove
                    </button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <div className="mt-6">
        <DiscountTypeModal />
      </div>
    </div>
  );
}
