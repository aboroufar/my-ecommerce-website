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

const featureBullets = [
  { label: "Thoughtfully sourced materials", icon: <LeafIcon /> },
  { label: "Cruelty free", icon: <RabbitIcon /> },
  { label: "Eco-conscious packaging", icon: <RecycleIcon /> },
];

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
  const categoryName = product.product_categories[0]?.categories?.name;

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
          {categoryName && (
            <span className="text-xs font-medium uppercase tracking-[0.2em] text-muted">
              {categoryName}
            </span>
          )}

          <h1 className="mt-2 font-display text-4xl font-bold text-foreground">
            {product.name}
          </h1>

          {product.sku && (
            <div className="mt-4 text-xs uppercase tracking-wide text-muted">
              <span className="font-medium text-foreground">SKU</span>{" "}
              {product.sku}
            </div>
          )}

          <div className="mt-4 text-2xl font-bold text-foreground">
            {formatPrice(product.price_cents, product.currency)}
          </div>
          <p className="mt-1 text-xs text-muted">Tax included at checkout.</p>

          <div className="mt-4 flex items-center gap-2 text-sm font-medium text-foreground">
            {!inStock && <WarningIcon />}
            {inStock ? "In stock" : "Out of stock"}
          </div>

          <ul className="mt-6 space-y-3 border-y border-line py-6">
            {featureBullets.map((feature) => (
              <li
                key={feature.label}
                className="flex items-center gap-3 text-sm text-foreground"
              >
                <span className="text-accent">{feature.icon}</span>
                {feature.label}
              </li>
            ))}
          </ul>

          {product.description && (
            <p className="mt-6 max-w-md text-sm leading-relaxed text-muted">
              {product.description}
            </p>
          )}

          <AddToCartButton product={product} />
        </div>
      </div>
    </main>
  );
}

function WarningIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-4 w-4">
      <path d="M12 9v4M12 17h.01" strokeLinecap="round" />
      <path d="M10.3 3.9 2.5 17.5a1.5 1.5 0 0 0 1.3 2.25h16.4a1.5 1.5 0 0 0 1.3-2.25L13.7 3.9a1.5 1.5 0 0 0-2.6 0Z" strokeLinejoin="round" />
    </svg>
  );
}

function LeafIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-5 w-5">
      <path d="M12 2c-4 4-6 8-6 12a6 6 0 0 0 12 0c0-4-2-8-6-12Z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function RabbitIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-5 w-5">
      <circle cx="12" cy="13" r="7" />
      <path d="M9 6c-1-2-1-4 0-5M15 6c1-2 1-4 0-5" strokeLinecap="round" />
    </svg>
  );
}

function RecycleIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-5 w-5">
      <circle cx="12" cy="12" r="8" strokeDasharray="2 3" />
      <circle cx="12" cy="12" r="2" />
    </svg>
  );
}
