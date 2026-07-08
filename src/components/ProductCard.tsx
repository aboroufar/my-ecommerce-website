import Link from "next/link";
import Image from "next/image";
import type { ProductSummary } from "@/lib/products";
import { formatPrice } from "@/lib/format";

export function ProductCard({ product }: { product: ProductSummary }) {
  const image = [...product.product_images].sort(
    (a, b) => a.sort_order - b.sort_order
  )[0];

  return (
    <Link href={`/products/${product.slug}`} className="group block">
      <div className="relative aspect-square overflow-hidden bg-surface">
        {image ? (
          <Image
            src={image.url}
            alt={image.alt_text ?? product.name}
            fill
            sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
            className="object-contain p-6 transition-transform duration-300 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <span className="font-display text-2xl text-accent/40">
              {product.name.charAt(0)}
            </span>
          </div>
        )}
      </div>

      <div className="mt-4">
        <h3 className="font-display text-lg text-foreground">
          {product.name}
        </h3>

        <div className="mt-3 border-t border-line pt-3">
          <span className="text-sm font-medium text-foreground">
            {formatPrice(product.price_cents, product.currency)}
          </span>
        </div>
      </div>
    </Link>
  );
}
