import { createAdminClient } from "@/lib/supabase/admin";
import { createTag, deleteTag } from "@/lib/actions/tags";

export const dynamic = "force-dynamic";

export default async function AdminTagsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const supabase = createAdminClient();
  const { data: tags } = await supabase
    .from("tags")
    .select("id, name, slug")
    .order("name", { ascending: true });

  return (
    <div>
      <h1 className="font-display text-2xl text-foreground">Tags</h1>
      <p className="mt-2 max-w-lg text-sm text-muted">
        Tags are assigned to products from each product&apos;s edit page and
        shown as clickable labels on its product page -- clicking one filters
        /products to everything sharing that tag.
      </p>

      {error && (
        <p className="mt-6 max-w-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      <div className="mt-8 max-w-sm space-y-4">
        {(!tags || tags.length === 0) && (
          <p className="text-sm text-muted">No tags yet.</p>
        )}

        {tags && tags.length > 0 && (
          <ul className="divide-y divide-line border border-line">
            {tags.map((tag) => (
              <li key={tag.id} className="flex items-center justify-between px-3 py-2">
                <span className="text-sm text-foreground">{tag.name}</span>
                <form action={deleteTag.bind(null, tag.id)}>
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

        <form action={createTag} className="flex gap-3">
          <input
            name="name"
            required
            placeholder="e.g. Natural"
            className="flex-1 border border-line bg-transparent px-3 py-2 text-sm"
          />
          <button
            type="submit"
            className="bg-accent px-4 py-2 text-sm font-medium text-background transition-opacity hover:opacity-90"
          >
            Add tag
          </button>
        </form>
      </div>
    </div>
  );
}
