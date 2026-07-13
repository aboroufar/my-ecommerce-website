import type { Metadata } from "next";
import Link from "next/link";
import { getPublishedPosts, getBlogCategories, searchPosts } from "@/lib/blog";
import { BlogPostCard } from "@/components/BlogPostCard";
import { BlogSidebar } from "@/components/BlogSidebar";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Blog — Storefront",
  description: "Guides, tips, and news from the Storefront team.",
};

export default async function BlogPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; q?: string }>;
}) {
  const { category, q } = await searchParams;
  const trimmedQuery = q?.trim() ?? "";

  const [posts, categories, recentPosts] = await Promise.all([
    trimmedQuery
      ? searchPosts(trimmedQuery)
      : getPublishedPosts({ categorySlug: category }),
    getBlogCategories(),
    getPublishedPosts(),
  ]);

  const activeCategory = categories.find((c) => c.slug === category);

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-12">
      <div className="mb-10">
        <span className="text-xs font-medium uppercase tracking-[0.2em] text-muted">
          Blog
        </span>
        <h1 className="mt-2 font-display text-3xl font-bold text-foreground">
          {trimmedQuery
            ? `Results for "${trimmedQuery}"`
            : (activeCategory?.name ?? "All posts")}
        </h1>
      </div>

      <div className="flex flex-col gap-10 lg:flex-row">
        <div className="min-w-0 flex-1">
          {posts.length === 0 ? (
            <div className="rounded-sm border border-dashed border-line px-6 py-16 text-center">
              <p className="font-display text-lg text-foreground">
                {trimmedQuery ? "No posts match your search." : "No posts yet."}
              </p>
              {(trimmedQuery || category) && (
                <Link
                  href="/blog"
                  className="mt-3 inline-block text-xs font-medium uppercase tracking-wide text-foreground underline underline-offset-4"
                >
                  View all posts
                </Link>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-x-8 gap-y-12 sm:grid-cols-2">
              {posts.map((post) => (
                <BlogPostCard key={post.id} post={post} />
              ))}
            </div>
          )}
        </div>

        <BlogSidebar
          categories={categories}
          recentPosts={recentPosts.slice(0, 4)}
          activeCategorySlug={category}
        />
      </div>
    </main>
  );
}
