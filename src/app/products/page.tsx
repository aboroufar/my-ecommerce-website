import type { Metadata } from "next";
import Link from "next/link";
import { getActiveProducts, getCategories, type Category, type ProductSort } from "@/lib/products";
import { ProductCard } from "@/components/ProductCard";
import { SortDropdown } from "@/components/SortDropdown";
import { ShopSidebar } from "@/components/ShopSidebar";
import { CategoryHero } from "@/components/CategoryHero";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Shop — Storefront",
  description: "Browse the full catalog.",
};

const validSorts: ProductSort[] = ["newest", "price-asc", "price-desc", "name-asc"];

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; sort?: string }>;
}) {
  const { category, sort } = await searchParams;
  const activeSort = validSorts.includes(sort as ProductSort)
    ? (sort as ProductSort)
    : "newest";

  const [products, categories] = await Promise.all([
    getActiveProducts({ categorySlug: category, sort: activeSort }),
    getCategories(),
  ]);

  const activeCategory = categories.find((c) => c.slug === category);
  const isTopLevelCategory = !!activeCategory && !activeCategory.parent_id;
  const topLevelAncestor = activeCategory
    ? findTopLevelAncestor(categories, activeCategory)
    : undefined;

  // Scope the sidebar to just the active category's top-level department
  // (its full subtree of groups/items), rather than the entire site's
  // category tree -- it reads as "filter within this category" instead
  // of a full site nav duplicate. This applies whether the active filter
  // is the top-level category itself (e.g. Skincare) or one of its
  // groups/items (e.g. Sun Care), since both should show the same scoped
  // Skincare subtree, not just fall back to everything.
  const sidebarCategories = topLevelAncestor
    ? categorySubtree(categories, topLevelAncestor)
    : categories;

  return (
    <main className="w-full flex-1">
      <div className="border-b border-line bg-surface px-6 py-4">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4">
          <SortDropdown current={activeSort} />
          <Breadcrumb categoryName={activeCategory?.name} />
        </div>
      </div>

      {isTopLevelCategory && (
        <div className="mx-auto w-full max-w-6xl px-6 pt-6">
          <CategoryHero
            category={activeCategory}
            groups={categories.filter((c) => c.parent_id === activeCategory.id)}
          />
        </div>
      )}

      <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-6 py-12 lg:flex-row">
        <ShopSidebar categories={sidebarCategories} activeSlug={category} />

        <div className="min-w-0 flex-1">
          <div className="mb-10">
            <span className="text-xs font-medium uppercase tracking-[0.2em] text-muted">
              Catalog
            </span>
            <h1 className="mt-2 font-display text-3xl font-bold text-foreground">
              {activeCategory?.name ?? "Shop all"}
            </h1>
          </div>

          {products.length === 0 ? (
            <EmptyState hasFilter={!!category} />
          ) : (
            <div className="grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-3">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

/**
 * Walks up parent_id links from the given category to find its top-level
 * ancestor (or itself, if it's already top-level) -- e.g. "Sun Care"
 * (a group) resolves to "Skincare", so the sidebar can be scoped to the
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

/**
 * Returns the given top-level category plus every descendant (groups,
 * items), so the sidebar can show just "this category's own tree" instead
 * of every category on the site.
 */
function categorySubtree(categories: Category[], root: Category): Category[] {
  const childrenByParent = new Map<string, Category[]>();
  for (const c of categories) {
    if (!c.parent_id) continue;
    const siblings = childrenByParent.get(c.parent_id) ?? [];
    siblings.push(c);
    childrenByParent.set(c.parent_id, siblings);
  }

  const result: Category[] = [root];
  const stack = [root];
  while (stack.length > 0) {
    const current = stack.pop()!;
    for (const child of childrenByParent.get(current.id) ?? []) {
      result.push(child);
      stack.push(child);
    }
  }
  return result;
}

function Breadcrumb({ categoryName }: { categoryName?: string }) {
  return (
    <nav
      aria-label="Breadcrumb"
      className="flex items-center gap-2 text-xs uppercase tracking-wide text-muted"
    >
      <Link href="/" aria-label="Home" className="transition-colors hover:text-foreground">
        <HomeIcon />
      </Link>
      <span aria-hidden>·</span>
      <Link href="/products" className="transition-colors hover:text-foreground">
        Shop
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

function EmptyState({ hasFilter }: { hasFilter: boolean }) {
  if (hasFilter) {
    return (
      <div className="rounded-sm border border-dashed border-line px-6 py-16 text-center">
        <p className="font-display text-lg text-foreground">
          No products in this category yet.
        </p>
        <Link
          href="/products"
          className="mt-3 inline-block text-xs font-medium uppercase tracking-wide text-foreground underline underline-offset-4"
        >
          View all products
        </Link>
      </div>
    );
  }

  return (
    <div className="rounded-sm border border-dashed border-line px-6 py-16 text-center">
      <p className="font-display text-lg text-foreground">
        No products yet.
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
