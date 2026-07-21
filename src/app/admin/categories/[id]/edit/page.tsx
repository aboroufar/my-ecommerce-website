import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { updateCategory } from "@/lib/actions/categories";
import { CategoryEditView, type ProductGridItem } from "@/components/admin/CategoryEditView";

export const dynamic = "force-dynamic";

export default async function EditCategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const { error } = await searchParams;

  const supabase = createAdminClient();
  const [{ data: category }, { data: products }] = await Promise.all([
    supabase
      .from("categories")
      .select(
        "id, name, slug, image_url, hero_image_url, hero_headline, hero_eyebrow, display_only, featured_in_grid"
      )
      .eq("id", id)
      .single(),
    supabase
      .from("products")
      .select("id, name, status, product_images(url, sort_order), product_categories(category_id)")
      .order("name", { ascending: true }),
  ]);

  if (!category) notFound();

  const productItems: ProductGridItem[] = (products ?? []).map((p) => {
    const primaryImage = [...p.product_images].sort((a, b) => a.sort_order - b.sort_order)[0];
    return {
      id: p.id,
      name: p.name,
      status: p.status,
      image_url: primaryImage?.url ?? null,
      inCategory: p.product_categories.some((pc) => pc.category_id === id),
    };
  });

  const updateWithId = updateCategory.bind(null, id);

  return (
    <div>
      <h1 className="font-display text-2xl text-foreground">Edit category</h1>
      <div className="mt-8">
        <CategoryEditView
          action={updateWithId}
          category={category}
          error={error}
          submitLabel="Save changes"
          products={productItems}
        />
      </div>
    </div>
  );
}
