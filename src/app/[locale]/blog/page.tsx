import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { getPublishedPosts, getBlogCategories, getBlogTags, searchPosts } from "@/lib/blog";
import { getSiteSettings } from "@/lib/siteSettings";
import { BlogPostCard } from "@/components/BlogPostCard";
import { BlogSidebar } from "@/components/BlogSidebar";

export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("blogPage");
  return { title: t("title"), description: t("description") };
}

export default async function BlogPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; tag?: string; q?: string }>;
}) {
  const { category, tag, q } = await searchParams;
  const trimmedQuery = q?.trim() ?? "";

  const [posts, categories, tags, relatedPosts, settings, t] = await Promise.all([
    trimmedQuery
      ? searchPosts(trimmedQuery)
      : getPublishedPosts({ categorySlug: category, tagSlug: tag }),
    getBlogCategories(),
    getBlogTags(),
    getPublishedPosts(),
    getSiteSettings(),
    getTranslations("blogPage"),
  ]);

  const activeCategory = categories.find((c) => c.slug === category);
  const activeTag = tags.find((t) => t.slug === tag);

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-12">
      <div className="mb-10">
        <span className="text-xs font-medium uppercase tracking-[0.2em] text-muted">
          {t("blog")}
        </span>
        <h1 className="mt-2 font-display text-3xl font-bold text-foreground">
          {trimmedQuery
            ? t("resultsFor", { query: trimmedQuery })
            : (activeCategory?.name ?? activeTag?.name ?? t("allPosts"))}
        </h1>
      </div>

      <div className="flex flex-col gap-10 lg:flex-row">
        <div className="min-w-0 flex-1">
          {posts.length === 0 ? (
            <div className="rounded-sm border border-dashed border-line px-6 py-16 text-center">
              <p className="font-display text-lg text-foreground">
                {trimmedQuery ? t("noPostsMatch") : t("noPostsYet")}
              </p>
              {(trimmedQuery || category || tag) && (
                <Link
                  href="/blog"
                  className="mt-3 inline-block text-xs font-medium uppercase tracking-wide text-foreground underline underline-offset-4"
                >
                  {t("viewAllPosts")}
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
          tags={tags}
          relatedPosts={relatedPosts.slice(0, 4)}
          settings={settings}
          activeCategorySlug={category}
          activeTagSlug={tag}
        />
      </div>
    </main>
  );
}
