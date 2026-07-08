import { createAdminClient } from "@/lib/supabase/admin";
import { createCategory, deleteCategory } from "@/lib/actions/categories";

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
    .select("id, name, slug, created_at")
    .order("name", { ascending: true });

  return (
    <div>
      <h1 className="font-display text-2xl text-foreground">Categories</h1>

      {error && (
        <p className="mt-6 border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      {!categories || categories.length === 0 ? (
        <p className="mt-10 text-sm text-muted">No categories yet.</p>
      ) : (
        <table className="mt-8 w-full max-w-lg text-left text-sm">
          <thead className="border-b border-line text-xs uppercase tracking-wide text-muted">
            <tr>
              <th className="py-2 font-medium">Name</th>
              <th className="py-2 font-medium">Slug</th>
              <th className="py-2" />
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {categories.map((category) => (
              <tr key={category.id}>
                <td className="py-3 text-foreground">{category.name}</td>
                <td className="py-3 text-muted">{category.slug}</td>
                <td className="py-3 text-right">
                  <form action={deleteCategory.bind(null, category.id)}>
                    <button
                      type="submit"
                      className="text-xs text-red-700 underline underline-offset-4 hover:text-red-800"
                    >
                      Delete
                    </button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <form action={createCategory} className="mt-8 flex max-w-lg items-end gap-3">
        <label className="flex flex-1 flex-col gap-1.5">
          <span className="text-xs font-medium uppercase tracking-wide text-muted">
            Name
          </span>
          <input
            name="name"
            required
            placeholder="Skincare"
            className="border border-line bg-transparent px-3 py-2 text-sm"
          />
        </label>
        <label className="flex flex-1 flex-col gap-1.5">
          <span className="text-xs font-medium uppercase tracking-wide text-muted">
            Slug
          </span>
          <input
            name="slug"
            required
            pattern="[a-z0-9-]+"
            placeholder="skincare"
            className="border border-line bg-transparent px-3 py-2 text-sm"
          />
        </label>
        <button
          type="submit"
          className="bg-accent px-4 py-2 text-sm font-medium text-background transition-opacity hover:opacity-90"
        >
          Add
        </button>
      </form>
    </div>
  );
}
