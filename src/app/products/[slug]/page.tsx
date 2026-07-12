import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getActiveProducts,
  getProductBySlug,
  getRecommendedProducts,
  getReviewSummary,
} from "@/lib/products";
import { formatPrice, getSaleInfo } from "@/lib/format";
import {
  ProductDetailProvider,
  ProductAddToCart,
  SelectedVariantInfo,
} from "@/components/ProductDetailInteractive";
import { ProductCard } from "@/components/ProductCard";
import { ViewingCounter } from "@/components/ViewingCounter";
import { ProductInfoTabs } from "@/components/ProductInfoTabs";
import { StarRating } from "@/components/StarRating";
import { ReviewsTabContent } from "@/components/ReviewsTabContent";

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
  const categorySlugs = product.product_categories
    .map((pc) => pc.categories?.slug)
    .filter((slug): slug is string => !!slug);
  const categoryName = product.product_categories[0]?.categories?.name;
  const recommended = await getRecommendedProducts(product.id, categorySlugs);
  const sale = getSaleInfo(product.price_cents, product.compare_at_price_cents);
  const reviewSummary = getReviewSummary(product.product_reviews);

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-12">
      <Link
        href="/products"
        className="text-xs uppercase tracking-[0.15em] text-muted transition-colors hover:text-foreground"
      >
        ← Shop all
      </Link>

      <ProductDetailProvider product={product}>
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

            {reviewSummary.count > 0 && (
              <div className="mt-2 flex items-center gap-2">
                <StarRating rating={reviewSummary.average} size="md" />
                <span className="text-sm text-muted">
                  ({reviewSummary.count} customer review{reviewSummary.count === 1 ? "" : "s"})
                </span>
              </div>
            )}

            {product.sku && (
              <div className="mt-4 text-xs uppercase tracking-wide text-muted">
                <span className="font-medium text-foreground">SKU</span>{" "}
                {product.sku}
              </div>
            )}

            {product.product_option_types.length === 0 && (
              <>
                <div className="mt-4 flex items-baseline gap-3">
                  <span className="text-2xl font-bold text-foreground">
                    {formatPrice(product.price_cents, product.currency)}
                  </span>
                  {sale.onSale && (
                    <>
                      <span className="text-lg text-muted line-through">
                        {formatPrice(product.compare_at_price_cents!, product.currency)}
                      </span>
                      <span className="bg-accent px-2 py-1 text-xs font-medium text-background">
                        −{sale.percentOff}%
                      </span>
                    </>
                  )}
                </div>
                <p className="mt-1 text-xs text-muted">Tax included at checkout.</p>
              </>
            )}

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

            <ViewingCounter />

            <ProductAddToCart />
          </div>
        </div>

        <ProductInfoTabs
          tabs={[
            {
              label: "Description",
              content: product.description ? (
                <p>{product.description}</p>
              ) : (
                <p>No description yet.</p>
              ),
            },
            {
              label: "Additional information",
              content: <SelectedVariantInfo />,
            },
            {
              label: `Reviews (${reviewSummary.count})`,
              content: <ReviewsTabContent product={product} />,
            },
          ]}
        />
      </ProductDetailProvider>

      {recommended.length > 0 && (
        <section className="mt-20 border-t border-line pt-12">
          <h2 className="font-display text-2xl font-bold text-foreground">
            You may also like
          </h2>
          <div className="mt-8 grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-4">
            {recommended.map((item) => (
              <ProductCard key={item.id} product={item} />
            ))}
          </div>
        </section>
      )}
    </main>
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
