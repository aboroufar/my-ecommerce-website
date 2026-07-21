import Link from "next/link";
import { deleteCategory } from "@/lib/actions/categories";

interface Category {
  id: string;
  name: string;
  slug: string;
  image_url: string | null;
  display_only?: boolean;
  featured_in_grid?: boolean;
}

export function CategoriesManager({
  categories,
  visibleIds,
}: {
  categories: Category[];
  visibleIds?: string[];
}) {
  const visibleIdSet = visibleIds ? new Set(visibleIds) : null;

  return (
    <div className="max-w-lg space-y-4">
      {categories.length === 0 && (
        <p className="text-sm text-muted">No categories yet.</p>
      )}

      {categories.map((category) => (
        <div key={category.id} className="flex items-center gap-3 border border-line p-3">
          {category.image_url ? (
            // eslint-disable-next-line @next/next/no-img-element -- admin-only thumbnail
            <img
              src={category.image_url}
              alt={category.name}
              className="h-14 w-14 shrink-0 rounded object-cover"
            />
          ) : (
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded bg-surface text-xs text-muted">
              No photo
            </div>
          )}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              {category.featured_in_grid && (
                <span
                  className="shrink-0 rounded bg-violet-100 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-violet-800"
                  title="Eligible to appear as one of the 5 random tiles in the homepage's Brand Highlights section."
                >
                  Brand Highlights
                </span>
              )}
              {category.display_only ? (
                <span
                  className="shrink-0 rounded bg-sky-100 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-sky-800"
                  title="Shown on the homepage category grid as a plain image tile -- not clickable, doesn't need any products, and doesn't appear in the header menu or /products filters."
                >
                  Display only
                </span>
              ) : (
                visibleIdSet &&
                !visibleIdSet.has(category.id) && (
                  <span
                    className="shrink-0 rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-amber-800"
                    title="No Active products in this category yet, so it's hidden from the header menu, homepage, and /products filters."
                  >
                    Not visible
                  </span>
                )
              )}
              <p className="truncate text-sm font-medium text-foreground">{category.name}</p>
            </div>
            <p className="truncate text-xs text-muted">{category.slug}</p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Link
              href={`/admin/categories/${category.id}/edit`}
              className="px-2 py-1 text-xs text-foreground underline underline-offset-4"
            >
              Edit
            </Link>
            <form action={deleteCategory.bind(null, category.id)}>
              <button
                type="submit"
                className="px-2 py-1 text-xs text-red-700 underline underline-offset-4 hover:text-red-800"
              >
                Delete
              </button>
            </form>
          </div>
        </div>
      ))}

      <Link
        href="/admin/categories/new"
        className="block border border-dashed border-line px-4 py-2 text-center text-xs font-medium uppercase tracking-wide text-muted transition-colors hover:border-foreground hover:text-foreground"
      >
        + Add category
      </Link>
    </div>
  );
}
