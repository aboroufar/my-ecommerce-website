import Image from "next/image";
import Link from "next/link";
import type { BlogCategory, BlogPostSummary } from "@/lib/blog";
import type { Tag } from "@/lib/products";
import type { SiteSettings } from "@/lib/siteSettings";
import { BlogSearchBox } from "./BlogSearchBox";
import { SocialIconLink, type SocialPlatform } from "./SocialIconLink";

export function BlogSidebar({
  categories,
  tags,
  relatedPosts,
  settings,
  activeCategorySlug,
  activeTagSlug,
}: {
  categories: BlogCategory[];
  tags: Tag[];
  relatedPosts: BlogPostSummary[];
  settings: SiteSettings;
  activeCategorySlug?: string;
  activeTagSlug?: string;
}) {
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

      {relatedPosts.length > 0 && (
        <div>
          <h2 className="font-display text-base font-bold text-foreground">
            Related post
          </h2>
          <ul className="mt-4 space-y-4">
            {relatedPosts.map((post) => {
              const category = post.blog_post_categories
                .map((pc) => pc.blog_categories)
                .find((c): c is { name: string; slug: string } => !!c);
              return (
                <li key={post.id}>
                  <Link href={`/blog/${post.slug}`} className="group flex gap-3">
                    <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-md bg-line">
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
                        <span className="text-xs font-medium uppercase tracking-wide text-accent underline-offset-4 group-hover:underline">
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

      <Link
        href="/products"
        className="group relative block aspect-[4/3] overflow-hidden rounded-lg"
      >
        <Image
          src="https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=600&q=80"
          alt="Shop skincare"
          fill
          sizes="288px"
          className="object-cover transition-transform duration-300 group-hover:scale-105"
        />
        <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-foreground/70 via-foreground/10 to-transparent p-5 text-background">
          <span className="font-display text-3xl font-bold">$37</span>
          <span className="mt-1 text-sm font-medium">Best skin care</span>
        </div>
      </Link>

      {tags.length > 0 && (
        <div>
          <h2 className="font-display text-base font-bold text-foreground">
            Tags
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
            Follow Us
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
