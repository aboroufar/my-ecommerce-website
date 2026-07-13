import { createAdminClient } from "@/lib/supabase/admin";
import { createBlogCategory, deleteBlogCategory } from "@/lib/actions/blog";

export const dynamic = "force-dynamic";

export default async function AdminBlogCategoriesPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const supabase = createAdminClient();
  const { data: categories } = await supabase
    .from("blog_categories")
    .select("id, name, slug")
    .order("name", { ascending: true });

  return (
    <div>
      <h1 className="font-display text-2xl text-foreground">Blog categories</h1>
      <p className="mt-2 max-w-lg text-sm text-muted">
        Assign categories to a post from its edit page. These are separate
        from product categories.
      </p>

      {error && (
        <p className="mt-6 max-w-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      <div className="mt-8 max-w-sm space-y-4">
        {(!categories || categories.length === 0) && (
          <p className="text-sm text-muted">No categories yet.</p>
        )}

        {categories && categories.length > 0 && (
          <ul className="divide-y divide-line border border-line">
            {categories.map((category) => (
              <li key={category.id} className="flex items-center justify-between px-3 py-2">
                <span className="text-sm text-foreground">{category.name}</span>
                <form action={deleteBlogCategory.bind(null, category.id)}>
                  <button
                    type="submit"
                    className="text-xs text-red-700 underline underline-offset-4 hover:text-red-800"
                  >
                    Delete
                  </button>
                </form>
              </li>
            ))}
          </ul>
        )}

        <form action={createBlogCategory} className="flex gap-3">
          <input
            name="name"
            required
            placeholder="e.g. Skincare tips"
            className="flex-1 border border-line bg-transparent px-3 py-2 text-sm"
          />
          <button
            type="submit"
            className="bg-accent px-4 py-2 text-sm font-medium text-background transition-opacity hover:opacity-90"
          >
            Add category
          </button>
        </form>
      </div>
    </div>
  );
}
