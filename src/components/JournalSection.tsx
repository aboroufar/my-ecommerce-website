import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { getPublishedPosts } from "@/lib/blog";

/**
 * Editorial 3-card block reusing real published blog posts (no fake
 * content) -- matches the reference's "Clear Answers, Better Skin"
 * journal section. Renders nothing if there are fewer than 3 published
 * posts, same "don't fake data" discipline as elsewhere in this app.
 */
export async function JournalSection() {
  const [posts, t] = await Promise.all([
    getPublishedPosts(),
    getTranslations("journalSection"),
  ]);

  if (posts.length < 3) return null;
  const featured = posts.slice(0, 3);

  return (
    <section className="mx-auto max-w-7xl px-6 py-16 sm:px-16">
      <div className="text-center">
        <span className="text-xs font-medium uppercase tracking-[0.2em] text-accent-text">
          {t("eyebrow")}
        </span>
        <h2 className="mt-2 font-display text-3xl font-bold text-foreground sm:text-4xl">
          {t("heading")}
        </h2>
      </div>

      <div className="mt-10 grid grid-cols-1 gap-8 sm:grid-cols-3">
        {featured.map((post) => (
          <article key={post.id}>
            <Link href={`/blog/${post.slug}`} className="group block">
              <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-accent-soft">
                {post.cover_image_url ? (
                  <Image
                    src={post.cover_image_url}
                    alt={post.title}
                    fill
                    sizes="(min-width: 640px) 33vw, 100vw"
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <span className="font-display text-4xl text-accent/40">
                      {post.title.charAt(0)}
                    </span>
                  </div>
                )}
              </div>
            </Link>

            <h3 className="mt-4 font-display text-lg font-bold text-foreground">
              <Link href={`/blog/${post.slug}`} className="hover:text-accent">
                {post.title}
              </Link>
            </h3>

            {post.excerpt && (
              <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-muted">
                {post.excerpt}
              </p>
            )}

            <Link
              href={`/blog/${post.slug}`}
              className="mt-3 inline-flex items-center gap-1 text-xs font-medium uppercase tracking-wide text-foreground underline underline-offset-4"
            >
              {t("readMore")}
              <ArrowIcon />
            </Link>
          </article>
        ))}
      </div>
    </section>
  );
}

function ArrowIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3 w-3">
      <path d="M7 17 17 7M9 7h8v8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
