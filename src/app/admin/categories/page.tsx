import { createAdminClient } from "@/lib/supabase/admin";
import { CategoriesManager } from "@/components/admin/CategoriesManager";
import { getCategoryIdsWithActiveProducts } from "@/lib/products";

export const dynamic = "force-dynamic";

export default async function AdminCategoriesPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const supabase = createAdminClient();
  const { data: categories } = await supabase
    .from("categories")
    .select(
      "id, name, slug, image_url, parent_id, hero_image_url, hero_headline, hero_eyebrow, display_only"
    )
    .order("name", { ascending: true });

  const visibleIds = await getCategoryIdsWithActiveProducts(
    supabase,
    categories ?? []
  );

  return (
    <div>
      <h1 className="font-display text-2xl text-foreground">Categories</h1>
      <p className="mt-2 max-w-lg text-sm text-muted">
        The homepage category grid and header menu update automatically
        when you add, edit, or delete a category here -- just add a photo
        so it doesn&apos;t fall back to a placeholder image. Give a category
        a parent to nest it as a Group or Item under a top-level Category.
        Top-level categories can also have a hero photo/headline shown at
        the top of their /products page. A category only appears on the
        storefront once it (or one of its groups/items) has at least one
        product set to Active -- categories marked &quot;Not visible&quot;
        below are hidden until then. Mark a top-level category
        &quot;Display only&quot; to show it as a plain image tile on the
        homepage grid without a product requirement -- it won&apos;t be
        clickable and won&apos;t appear in the header menu or /products
        filters.
      </p>

      {error && (
        <p className="mt-6 max-w-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      <div className="mt-8">
        <CategoriesManager
          categories={categories ?? []}
          visibleIds={[...visibleIds]}
        />
      </div>
    </div>
  );
}
