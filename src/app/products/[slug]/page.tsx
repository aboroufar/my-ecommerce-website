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
import { getSiteSettings } from "@/lib/siteSettings";
import { formatPrice, getSaleInfo } from "@/lib/format";
import {
  ProductDetailProvider,
  ProductAddToCart,
  SelectedVariantInfo,
} from "@/components/ProductDetailInteractive";
import { ProductCard } from "@/components/ProductCard";
import { ProductInfoTabs } from "@/components/ProductInfoTabs";
import { StarRating } from "@/components/StarRating";
import { ReviewsTabContent } from "@/components/ReviewsTabContent";
import { HighlightIcon } from "@/components/highlightIcons";
import { WishlistButton } from "@/components/WishlistButton";

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
  const [product, siteSettings] = await Promise.all([
    getProductBySlug(slug),
    getSiteSettings(),
  ]);

  if (!product) notFound();

  const images = [...product.product_images].sort(
    (a, b) => a.sort_order - b.sort_order
  );
  const categorySlugs = product.product_categories
    .map((pc) => pc.categories?.slug)
    .filter((slug): slug is string => !!slug);
  const categoryName = product.product_categories[0]?.categories?.name;
  const tags = product.product_tags
    .map((pt) => pt.tags)
    .filter((tag): tag is { name: string; slug: string } => !!tag);
  const recommended = await getRecommendedProducts(product.id, categorySlugs);
  const sale = getSaleInfo(product.price_cents, product.compare_at_price_cents);
  const reviewsEnabled = siteSettings.reviews_enabled;
  const reviewSummary = getReviewSummary(product.product_reviews);
  const highlights = [...product.product_highlights].sort(
    (a, b) => a.sort_order - b.sort_order
  );

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

            {reviewsEnabled && reviewSummary.count > 0 && (
              <div className="mt-2 flex items-center gap-2">
                <StarRating rating={reviewSummary.average} size="md" />
                <span className="text-sm text-muted">
                  ({reviewSummary.count} customer review{reviewSummary.count === 1 ? "" : "s"})
                </span>
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

            {highlights.length > 0 && (
              <ul className="mt-6 space-y-3 border-y border-line py-6">
                {highlights.map((highlight) => (
                  <li
                    key={highlight.id}
                    className="flex items-center gap-3 text-sm text-foreground"
                  >
                    <span className="text-accent">
                      <HighlightIcon icon={highlight.icon} />
                    </span>
                    {highlight.label}
                  </li>
                ))}
              </ul>
            )}

            <ProductAddToCart />

            <div className="mt-3">
              <WishlistButton productId={product.id} />
            </div>

            <dl className="mt-6 space-y-1.5 text-sm">
              {categoryName && (
                <div className="flex gap-2">
                  <dt className="text-muted">Category:</dt>
                  <dd>
                    <Link
                      href={`/products?category=${product.product_categories[0]?.categories?.slug}`}
                      className="text-foreground underline-offset-4 hover:underline"
                    >
                      {categoryName}
                    </Link>
                  </dd>
                </div>
              )}
              {tags.length > 0 && (
                <div className="flex gap-2">
                  <dt className="text-muted">Tags:</dt>
                  <dd className="flex flex-wrap gap-x-2">
                    {tags.map((tag) => (
                      <Link
                        key={tag.slug}
                        href={`/products?tag=${tag.slug}`}
                        className="text-foreground underline-offset-4 hover:underline"
                      >
                        {tag.name}
                      </Link>
                    ))}
                  </dd>
                </div>
              )}
              {product.sku && (
                <div className="flex gap-2">
                  <dt className="text-muted">SKU:</dt>
                  <dd className="text-foreground">{product.sku}</dd>
                </div>
              )}
            </dl>
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
            ...(reviewsEnabled
              ? [
                  {
                    label: `Reviews (${reviewSummary.count})`,
                    content: <ReviewsTabContent product={product} />,
                  },
                ]
              : []),
          ]}
        />
      </ProductDetailProvider>

      {recommended.length > 0 && (
        <section className="mt-20 border-t border-line pt-12">
          <h2 className="font-display text-2xl font-bold text-foreground">
            Related items
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

