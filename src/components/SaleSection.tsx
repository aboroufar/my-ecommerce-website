import Link from "next/link";
import type { ProductSummary } from "@/lib/products";
import { getSaleInfo } from "@/lib/format";
import { ProductCard } from "./ProductCard";

/**
 * Real sale products only -- filtered from compare_at_price_cents, the same
 * field that drives the "Sale" badge on ProductCard. No countdown timer:
 * there's no real sale-end timestamp anywhere in the schema, and a fake one
 * would just be manufactured urgency.
 */
export function SaleSection({ products }: { products: ProductSummary[] }) {
  const saleProducts = products.filter(
    (p) => getSaleInfo(p.price_cents, p.compare_at_price_cents).onSale
  );

  if (saleProducts.length === 0) return null;

  return (
    <section className="mx-auto w-full max-w-7xl px-6 py-16 sm:px-16">
      <div className="flex items-end justify-between">
        <h2 className="font-display text-3xl font-bold text-foreground">
          Products on sale
        </h2>
        <Link
          href="/products"
          className="text-xs font-medium uppercase tracking-wide text-foreground underline underline-offset-4"
        >
          View all
        </Link>
      </div>

      <div className="mt-8 grid grid-cols-2 gap-x-6 gap-y-12 sm:grid-cols-3 lg:grid-cols-5">
        {saleProducts.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
}
