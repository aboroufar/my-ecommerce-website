import Image from "next/image";
import { getTranslations, getLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { formatDate } from "@/lib/format";
import type { BlogPostSummary } from "@/lib/blog";

export async function BlogPostCard({ post }: { post: BlogPostSummary }) {
  const categories = post.blog_post_categories
    .map((pc) => pc.blog_categories)
    .filter((c): c is { name: string; slug: string } => !!c);
  const [t, locale] = await Promise.all([
    getTranslations("blog"),
    getLocale(),
  ]);

  return (
    <article>
      <Link href={`/blog/${post.slug}`} className="group block">
        <div className="relative aspect-[16/10] overflow-hidden bg-surface">
          {post.cover_image_url ? (
            <Image
              src={post.cover_image_url}
              alt={post.title}
              fill
              sizes="(min-width: 1024px) 40vw, 100vw"
              className="object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <span className="font-display text-4xl text-accent/40">
                {post.title.charAt(0)}
              </span>
            </div>
          )}
          {post.published_at && (
            <span className="absolute left-3 top-3 rounded-full bg-background/90 px-3 py-1 text-xs font-medium text-foreground">
              {formatDate(post.published_at, locale)}
            </span>
          )}
        </div>
      </Link>

      {categories.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-x-3 gap-y-1">
          {categories.map((category) => (
            <Link
              key={category.slug}
              href={`/blog?category=${category.slug}`}
              className="text-xs font-medium uppercase tracking-wide text-accent-text underline-offset-4 hover:underline"
            >
              {category.name}
            </Link>
          ))}
        </div>
      )}

      <h3 className="mt-2 font-display text-lg font-bold text-foreground">
        <Link href={`/blog/${post.slug}`} className="hover:text-accent">
          {post.title}
        </Link>
      </h3>

      {post.excerpt && (
        <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-muted">
          {post.excerpt}
        </p>
      )}

      <Link
        href={`/blog/${post.slug}`}
        className="mt-3 inline-block text-xs font-medium uppercase tracking-wide text-foreground underline underline-offset-4"
      >
        {t("readMore")}
      </Link>
    </article>
  );
}
