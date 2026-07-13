import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { deletePost } from "@/lib/actions/blog";

export const dynamic = "force-dynamic";

export default async function AdminBlogPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const supabase = createAdminClient();
  const { data: posts } = await supabase
    .from("blog_posts")
    .select("id, title, slug, status, published_at, created_at")
    .order("created_at", { ascending: false });

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl text-foreground">Blog</h1>
        <div className="flex items-center gap-4">
          <Link
            href="/admin/blog/categories"
            className="text-sm text-muted underline underline-offset-4 hover:text-foreground"
          >
            Manage categories
          </Link>
          <Link
            href="/admin/blog/new"
            className="bg-accent px-4 py-2 text-sm font-medium text-background transition-opacity hover:opacity-90"
          >
            New post
          </Link>
        </div>
      </div>

      {error && (
        <p className="mt-6 border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      {!posts || posts.length === 0 ? (
        <p className="mt-10 text-sm text-muted">
          No posts yet. Click &quot;New post&quot; to write your first one.
        </p>
      ) : (
        <table className="mt-8 w-full text-left text-sm">
          <thead className="border-b border-line text-xs uppercase tracking-wide text-muted">
            <tr>
              <th className="py-2 font-medium">Title</th>
              <th className="py-2 font-medium">Status</th>
              <th className="py-2 font-medium">Date</th>
              <th className="py-2" />
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {posts.map((post) => (
              <tr key={post.id}>
                <td className="py-3 text-foreground">{post.title}</td>
                <td className="py-3">
                  <span
                    className={`rounded px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide ${
                      post.status === "published"
                        ? "bg-green-100 text-green-800"
                        : "bg-surface text-muted"
                    }`}
                  >
                    {post.status}
                  </span>
                </td>
                <td className="py-3 text-muted">
                  {new Date(post.published_at ?? post.created_at).toLocaleDateString()}
                </td>
                <td className="py-3 text-right">
                  <div className="flex items-center justify-end gap-3">
                    <Link
                      href={`/admin/blog/${post.id}/edit`}
                      className="text-xs text-foreground underline underline-offset-4"
                    >
                      Edit
                    </Link>
                    <form action={deletePost.bind(null, post.id)}>
                      <button
                        type="submit"
                        className="text-xs text-red-700 underline underline-offset-4 hover:text-red-800"
                      >
                        Delete
                      </button>
                    </form>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
