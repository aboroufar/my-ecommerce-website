import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getActiveProducts, getProductBySlug } from "@/lib/products";
import { formatPrice } from "@/lib/format";
import { AddToCartButton } from "@/components/AddToCartButton";

export const revalidate = 60;
export const dynamicParams = true; // render on-demand for slugs not in the list below

export async function generateStaticParams() {
  const products = await getActiveProducts();
  return products.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return { title: "Product not found — Storefront" };
  return {
    title: `${product.name} — Storefront`,
    description: product.description ?? undefined,
  };
}

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) notFound();

  const images = [...product.product_images].sort(
    (a, b) => a.sort_order - b.sort_order
  );
  const inStock = product.stock_qty > 0;

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-12">
      <Link
        href="/products"
        className="text-xs uppercase tracking-[0.15em] text-muted transition-colors hover:text-foreground"
      >
        ← Shop all
      </Link>

      <div className="mt-6 grid grid-cols-1 gap-10 lg:grid-cols-2">
        <div className="aspect-square overflow-hidden bg-surface">
          {images[0] ? (
            <Image
              src={images[0].url}
              alt={images[0].alt_text ?? product.name}
              width={800}
              height={800}
              className="h-full w-full object-contain p-10"
              priority
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <span className="font-display text-6xl text-accent/40">
                {product.name.charAt(0)}
              </span>
            </div>
          )}
        </div>

        <div className="flex flex-col">
          <h1 className="font-display text-4xl font-bold text-foreground">
            {product.name}
          </h1>

          <div className="mt-3 text-lg font-medium text-foreground">
            {formatPrice(product.price_cents, product.currency)}
          </div>

          {product.description && (
            <p className="mt-6 max-w-md text-sm leading-relaxed text-muted">
              {product.description}
            </p>
          )}

          <div className="mt-6 flex items-center gap-2 text-xs text-muted">
            <span
              aria-hidden
              className={`h-1.5 w-1.5 rounded-full ${
                inStock ? "bg-accent" : "bg-muted"
              }`}
            />
            {inStock ? `In stock` : "Out of stock"}
            {product.sku && (
              <span className="ml-2 text-muted/70">SKU {product.sku}</span>
            )}
          </div>

          <AddToCartButton product={product} />
        </div>
      </div>
    </main>
  );
}
