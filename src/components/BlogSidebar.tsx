import Link from "next/link";
import type { BlogCategory, BlogPostSummary } from "@/lib/blog";
import { BlogSearchBox } from "./BlogSearchBox";

export function BlogSidebar({
  categories,
  recentPosts,
  activeCategorySlug,
}: {
  categories: BlogCategory[];
  recentPosts: BlogPostSummary[];
  activeCategorySlug?: string;
}) {
  return (
    <aside className="w-full shrink-0 space-y-8 lg:w-72">
      <div className="rounded-lg bg-surface p-6">
        <BlogSearchBox />
      </div>

      {categories.length > 0 && (
        <div className="rounded-lg bg-surface p-6">
          <h2 className="font-display text-base font-bold text-foreground">
            Categories
          </h2>
          <ul className="mt-3 space-y-2 text-sm">
            <li>
              <Link
                href="/blog"
                className={`transition-colors hover:text-foreground ${
                  !activeCategorySlug ? "font-semibold text-foreground" : "text-muted"
                }`}
              >
                All posts
              </Link>
            </li>
            {categories.map((category) => (
              <li key={category.id}>
                <Link
                  href={`/blog?category=${category.slug}`}
                  className={`transition-colors hover:text-foreground ${
                    activeCategorySlug === category.slug
                      ? "font-semibold text-foreground"
                      : "text-muted"
                  }`}
                >
                  {category.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      {recentPosts.length > 0 && (
        <div className="rounded-lg bg-surface p-6">
          <h2 className="font-display text-base font-bold text-foreground">
            Recent posts
          </h2>
          <ul className="mt-4 space-y-4">
            {recentPosts.map((post) => (
              <li key={post.id}>
                <Link href={`/blog/${post.slug}`} className="group block">
                  <p className="text-sm font-medium text-foreground group-hover:text-accent">
                    {post.title}
                  </p>
                  {post.published_at && (
                    <p className="mt-0.5 text-xs text-muted">
                      {new Date(post.published_at).toLocaleDateString()}
                    </p>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </aside>
  );
}
