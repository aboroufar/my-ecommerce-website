import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import {
  getActiveProducts,
  getCategories,
  getTags,
  parsePriceParam,
  type Category,
  type ProductSort,
} from "@/lib/products";
import { ProductCard } from "@/components/ProductCard";
import { SortDropdown } from "@/components/SortDropdown";
import { CategoryFilterBar } from "@/components/CategoryFilterBar";

export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("productsPage");
  return { title: t("title"), description: t("description") };
}

const validSorts: ProductSort[] = ["newest", "price-asc", "price-desc", "name-asc"];

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{
    category?: string;
    tag?: string;
    sort?: string;
    minPrice?: string;
    maxPrice?: string;
  }>;
}) {
  const { category, tag, sort, minPrice, maxPrice } = await searchParams;
  const activeSort = validSorts.includes(sort as ProductSort)
    ? (sort as ProductSort)
    : "newest";
  const minPriceCents = parsePriceParam(minPrice);
  const maxPriceCents = parsePriceParam(maxPrice);

  const [products, allCategories, allTags, t] = await Promise.all([
    getActiveProducts({
      categorySlug: category,
      tagSlug: tag,
      sort: activeSort,
      minPriceCents,
      maxPriceCents,
    }),
    getCategories(),
    tag ? getTags() : Promise.resolve([]),
    getTranslations("productsPage"),
  ]);
  const activeTag = allTags.find((t) => t.slug === tag);
  // Display-only categories are homepage-grid decoration, not real
  // filters -- keep them out of the filter bar/category tree.
  const categories = allCategories.filter((c) => !c.display_only);

  const activeCategory = categories.find((c) => c.slug === category);
  const topLevelAncestor = activeCategory
    ? findTopLevelAncestor(categories, activeCategory)
    : undefined;

  // Scope the filter bar to just the active category's top-level department
  // (its direct sibling groups), rather than the entire site's category
  // tree -- it reads as "filter within this department" instead of a full
  // site nav duplicate. Falls back to top-level categories when nothing is
  // selected yet.
  const filterCategories = topLevelAncestor
    ? categories.filter((c) => c.parent_id === topLevelAncestor.id)
    : categories.filter((c) => !c.parent_id);

  return (
    <main className="w-full flex-1">
      <div className="border-b border-line bg-surface px-6 py-4">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4">
          <SortDropdown current={activeSort} />
          <Breadcrumb categoryName={activeCategory?.name ?? activeTag?.name} t={t} />
        </div>
      </div>

      <CategoryFilterBar
        categories={filterCategories}
        activeSlug={category}
        allCategorySlug={topLevelAncestor?.slug}
        minPrice={minPrice}
        maxPrice={maxPrice}
      />

      <div className="mx-auto w-full max-w-6xl px-6 py-12">
        <div className="mb-10">
          <span className="text-xs font-medium uppercase tracking-[0.2em] text-muted">
            {t("catalog")}
          </span>
          <h1 className="mt-2 font-display text-3xl font-bold text-foreground">
            {activeCategory?.name ?? activeTag?.name ?? t("shopAll")}
          </h1>
        </div>

        {products.length === 0 ? (
          <EmptyState hasFilter={!!category || !!tag} t={t} />
        ) : (
          <div className="grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-3 lg:grid-cols-4">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

/**
 * Walks up parent_id links from the given category to find its top-level
 * ancestor (or itself, if it's already top-level) -- e.g. "Sun Care"
 * (a group) resolves to "Skincare", so the filter bar can be scoped to the
 * right department regardless of which tier of the tree is active.
 */
function findTopLevelAncestor(categories: Category[], category: Category): Category {
  const byId = new Map(categories.map((c) => [c.id, c]));
  let current = category;
  while (current.parent_id) {
    const parent = byId.get(current.parent_id);
    if (!parent) break;
    current = parent;
  }
  return current;
}

function Breadcrumb({
  categoryName,
  t,
}: {
  categoryName?: string;
  t: Awaited<ReturnType<typeof getTranslations>>;
}) {
  return (
    <nav
      aria-label={t("breadcrumb")}
      className="flex items-center gap-2 text-xs uppercase tracking-wide text-muted"
    >
      <Link href="/" aria-label={t("breadcrumbHome")} className="transition-colors hover:text-foreground">
        <HomeIcon />
      </Link>
      <span aria-hidden>·</span>
      <Link href="/products" className="transition-colors hover:text-foreground">
        {t("shop")}
      </Link>
      {categoryName && (
        <>
          <span aria-hidden>·</span>
          <span className="text-foreground">{categoryName}</span>
        </>
      )}
    </nav>
  );
}

function HomeIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-4 w-4">
      <path
        d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1v-9Z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function EmptyState({
  hasFilter,
  t,
}: {
  hasFilter: boolean;
  t: Awaited<ReturnType<typeof getTranslations>>;
}) {
  if (hasFilter) {
    return (
      <div className="rounded-sm border border-dashed border-line px-6 py-16 text-center">
        <p className="font-display text-lg text-foreground">
          {t("emptyFilteredHeading")}
        </p>
        <Link
          href="/products"
          className="mt-3 inline-block text-xs font-medium uppercase tracking-wide text-foreground underline underline-offset-4"
        >
          {t("viewAllProducts")}
        </Link>
      </div>
    );
  }

  return (
    <div className="rounded-sm border border-dashed border-line px-6 py-16 text-center">
      <p className="font-display text-lg text-foreground">
        {t("emptyHeading")}
      </p>
      <p className="mx-auto mt-2 max-w-sm text-sm text-muted">
        Once your Supabase project is connected and migrated, products marked{" "}
        <code className="text-xs">status = &apos;active&apos;</code> will show up
        here automatically. Run <code className="text-xs">supabase/seed.sql</code>{" "}
        for sample data.
      </p>
    </div>
  );
}
