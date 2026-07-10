import { createAdminClient } from "@/lib/supabase/admin";
import { CategoriesManager } from "@/components/admin/CategoriesManager";

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
    .select("id, name, slug, image_url")
    .order("name", { ascending: true });

  return (
    <div>
      <h1 className="font-display text-2xl text-foreground">Categories</h1>
      <p className="mt-2 max-w-lg text-sm text-muted">
        The homepage category grid updates automatically when you add,
        edit, or delete a category here -- just add a photo so it doesn&apos;t
        fall back to a placeholder image.
      </p>

      {error && (
        <p className="mt-6 max-w-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      <div className="mt-8">
        <CategoriesManager categories={categories ?? []} />
      </div>
    </div>
  );
}
