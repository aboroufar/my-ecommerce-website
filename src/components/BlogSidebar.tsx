import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import type { BlogCategory, BlogPostSummary, BlogTag } from "@/lib/blog";
import type { SiteSettings } from "@/lib/siteSettings";
import { BlogSearchBox } from "./BlogSearchBox";
import { SocialIconLink, type SocialPlatform } from "./SocialIconLink";

export async function BlogSidebar({
  categories,
  tags,
  relatedPosts,
  settings,
  activeCategorySlug,
  activeTagSlug,
}: {
  categories: BlogCategory[];
  tags: BlogTag[];
  relatedPosts: BlogPostSummary[];
  settings: SiteSettings;
  activeCategorySlug?: string;
  activeTagSlug?: string;
}) {
  const t = await getTranslations("blogSidebar");
  const allSocialLinks: { platform: SocialPlatform; url: string; label: string }[] = [
    { platform: "facebook", url: settings.social_facebook_url, label: "Facebook" },
    { platform: "twitter", url: settings.social_twitter_url, label: "Twitter" },
    { platform: "linkedin", url: settings.social_linkedin_url, label: "LinkedIn" },
    { platform: "instagram", url: settings.social_instagram_url, label: "Instagram" },
  ];
  const socialLinks = allSocialLinks.filter((s) => s.url);

  return (
    <aside className="w-full shrink-0 space-y-8 rounded-lg bg-surface p-6 lg:w-72">
      <BlogSearchBox />

      {categories.length > 0 && (
        <div>
          <h2 className="font-display text-base font-bold text-foreground">
            {t("categories")}
          </h2>
          <ul className="mt-3 space-y-2 text-sm">
            <li>
              <Link
                href="/blog"
                className={`transition-colors hover:text-foreground ${
                  !activeCategorySlug ? "font-semibold text-foreground" : "text-muted"
                }`}
              >
                {t("allPosts")}
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

      {relatedPosts.length > 0 && (
        <div>
          <h2 className="font-display text-base font-bold text-foreground">
            {t("relatedPost")}
          </h2>
          <ul className="mt-4 space-y-4">
            {relatedPosts.map((post) => {
              const category = post.blog_post_categories
                .map((pc) => pc.blog_categories)
                .find((c): c is { name: string; slug: string } => !!c);
              return (
                <li key={post.id}>
                  <Link href={`/blog/${post.slug}`} className="group flex gap-3">
                    <div className="relative h-16 w-16 shrink-0 overflow-hidden bg-line">
                      {post.cover_image_url && (
                        <Image
                          src={post.cover_image_url}
                          alt=""
                          fill
                          sizes="64px"
                          className="object-cover"
                        />
                      )}
                    </div>
                    <div className="min-w-0">
                      {category && (
                        <span className="text-xs font-medium uppercase tracking-wide text-accent-text underline-offset-4 group-hover:underline">
                          {category.name}
                        </span>
                      )}
                      <p className="mt-0.5 text-sm font-medium leading-snug text-foreground group-hover:text-accent">
                        {post.title}
                      </p>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {tags.length > 0 && (
        <div>
          <h2 className="font-display text-base font-bold text-foreground">
            {t("tags")}
          </h2>
          <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1">
            {tags.map((tag) => (
              <Link
                key={tag.id}
                href={`/blog?tag=${tag.slug}`}
                className={`text-sm underline underline-offset-4 transition-colors ${
                  activeTagSlug === tag.slug
                    ? "font-semibold text-foreground"
                    : "text-muted hover:text-foreground"
                }`}
              >
                {tag.name}
              </Link>
            ))}
          </div>
        </div>
      )}

      {socialLinks.length > 0 && (
        <div>
          <h2 className="font-display text-base font-bold text-foreground">
            {t("followUs")}
          </h2>
          <div className="mt-3 flex items-center gap-2">
            {socialLinks.map((s) => (
              <SocialIconLink
                key={s.platform}
                platform={s.platform}
                href={s.url}
                label={s.label}
              />
            ))}
          </div>
        </div>
      )}
    </aside>
  );
}
