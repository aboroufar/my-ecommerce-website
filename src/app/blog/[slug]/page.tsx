import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getPostBySlug,
  getPublishedPosts,
  getBlogCategories,
  getRelatedPosts,
} from "@/lib/blog";
import { getTags } from "@/lib/products";
import { BlogPostCard } from "@/components/BlogPostCard";
import { BlogSidebar } from "@/components/BlogSidebar";

export const revalidate = 60;
export const dynamicParams = true;

export async function generateStaticParams() {
  const posts = await getPublishedPosts();
  return posts.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) return { title: "Post not found — Storefront" };
  return {
    title: `${post.title} — Storefront`,
    description: post.excerpt ?? undefined,
  };
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [post, categories, tags, recentPosts] = await Promise.all([
    getPostBySlug(slug),
    getBlogCategories(),
    getTags(),
    getPublishedPosts(),
  ]);

  if (!post) notFound();

  const postCategories = post.blog_post_categories
    .map((pc) => pc.blog_categories)
    .filter((c): c is { name: string; slug: string } => !!c);
  const postTags = post.blog_post_tags
    .map((pt) => pt.tags)
    .filter((t): t is { name: string; slug: string } => !!t);

  const related = await getRelatedPosts(
    post.id,
    postCategories.map((c) => c.slug)
  );

  const hasAuthor = !!post.author_name;

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-12">
      <nav className="flex items-center gap-2 text-xs uppercase tracking-wide text-muted">
        <Link href="/" className="transition-colors hover:text-foreground">
          Home
        </Link>
        <span aria-hidden>/</span>
        <Link href="/blog" className="transition-colors hover:text-foreground">
          Blog
        </Link>
        <span aria-hidden>/</span>
        <span className="text-foreground">{post.title}</span>
      </nav>

      <div className="mt-8 flex flex-col gap-10 lg:flex-row">
        <article className="min-w-0 flex-1">
          {post.cover_image_url && (
            <div className="relative aspect-[16/9] overflow-hidden rounded-lg bg-surface">
              <Image
                src={post.cover_image_url}
                alt={post.title}
                fill
                sizes="(min-width: 1024px) 60vw, 100vw"
                className="object-cover"
                priority
              />
            </div>
          )}

          {postCategories.length > 0 && (
            <div className="mt-6 flex flex-wrap gap-x-3 gap-y-1">
              {postCategories.map((category) => (
                <Link
                  key={category.slug}
                  href={`/blog?category=${category.slug}`}
                  className="text-xs font-medium uppercase tracking-wide text-accent underline-offset-4 hover:underline"
                >
                  {category.name}
                </Link>
              ))}
            </div>
          )}

          <h1 className="mt-3 font-display text-4xl font-bold text-foreground">
            {post.title}
          </h1>

          {post.published_at && (
            <p className="mt-2 text-xs text-muted">
              {new Date(post.published_at).toLocaleDateString()}
            </p>
          )}

          <div
            className="prose-blog mt-8 max-w-none text-sm leading-relaxed text-foreground [&_blockquote]:my-6 [&_blockquote]:border-l-2 [&_blockquote]:border-accent [&_blockquote]:pl-4 [&_blockquote]:font-display [&_blockquote]:text-xl [&_blockquote]:font-bold [&_blockquote]:italic [&_h2]:mt-8 [&_h2]:font-display [&_h2]:text-2xl [&_h2]:font-bold [&_h2]:text-foreground [&_h3]:mt-6 [&_h3]:font-display [&_h3]:text-lg [&_h3]:font-bold [&_h3]:text-foreground [&_img]:my-4 [&_img]:rounded-lg [&_li]:ml-5 [&_li]:list-disc [&_p]:my-4"
            dangerouslySetInnerHTML={{ __html: post.body_html }}
          />

          {postTags.length > 0 && (
            <div className="mt-10 flex flex-wrap items-center gap-2 border-t border-line pt-6">
              <span className="text-xs font-medium uppercase tracking-wide text-muted">
                Tags:
              </span>
              {postTags.map((tag) => (
                <Link
                  key={tag.slug}
                  href={`/blog?tag=${tag.slug}`}
                  className="rounded-full bg-surface px-3 py-1 text-xs text-foreground transition-colors hover:bg-line/60"
                >
                  {tag.name}
                </Link>
              ))}
            </div>
          )}

          {hasAuthor && (
            <div className="mt-10 flex gap-4 rounded-lg bg-surface p-6">
              {post.author_photo_url && (
                <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-full">
                  <Image
                    src={post.author_photo_url}
                    alt={post.author_name}
                    fill
                    sizes="80px"
                    className="object-cover"
                  />
                </div>
              )}
              <div>
                <h2 className="font-display text-lg font-bold text-foreground">
                  {post.author_name}
                </h2>
                {post.author_bio && (
                  <p className="mt-1 text-sm leading-relaxed text-muted">
                    {post.author_bio}
                  </p>
                )}
                <div className="mt-3 flex items-center gap-3">
                  {post.author_facebook_url && (
                    <a
                      href={post.author_facebook_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-accent underline underline-offset-4"
                    >
                      Facebook
                    </a>
                  )}
                  {post.author_twitter_url && (
                    <a
                      href={post.author_twitter_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-accent underline underline-offset-4"
                    >
                      Twitter
                    </a>
                  )}
                  {post.author_linkedin_url && (
                    <a
                      href={post.author_linkedin_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-accent underline underline-offset-4"
                    >
                      LinkedIn
                    </a>
                  )}
                </div>
              </div>
            </div>
          )}

          {related.length > 0 && (
            <section className="mt-14 border-t border-line pt-10">
              <h2 className="font-display text-xl font-bold text-foreground">
                Related posts
              </h2>
              <div className="mt-6 grid grid-cols-1 gap-x-8 gap-y-10 sm:grid-cols-2">
                {related.map((item) => (
                  <BlogPostCard key={item.id} post={item} />
                ))}
              </div>
            </section>
          )}
        </article>

        <BlogSidebar categories={categories} tags={tags} recentPosts={recentPosts.slice(0, 4)} />
      </div>
    </main>
  );
}
