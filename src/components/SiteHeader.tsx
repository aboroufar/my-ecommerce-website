import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { CartLink } from "./CartLink";
import { AccountLink } from "./AccountLink";
import { LocaleSwitcher } from "./LocaleSwitcher";
import { InlineSearch } from "./InlineSearch";
import { MegaMenu, MegaMenuColumns } from "./MegaMenu";
import { getCategories } from "@/lib/products";
import { getSiteSettings } from "@/lib/siteSettings";
import { getMenuColumns } from "@/lib/menu";

export async function SiteHeader() {
  const [allCategories, settings, menuColumns, t] = await Promise.all([
    getCategories(),
    getSiteSettings(),
    getMenuColumns(),
    getTranslations("nav"),
  ]);
  // Display-only categories are homepage-grid decoration, not real
  // navigation destinations -- keep them out of the menu/mobile nav.
  const categories = allCategories.filter((c) => !c.display_only);

  return (
    <header className="sticky top-0 z-40 border-b border-line/80 bg-background/95 shadow-[0_1px_0_rgba(32,30,28,0.03)] backdrop-blur">
      <div className="bg-foreground px-6 py-2 text-xs text-background">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="hidden items-center gap-6 sm:flex">
            {settings.header_email && (
              <Link
                href={`mailto:${settings.header_email}`}
                className="flex items-center gap-1.5 transition-opacity hover:opacity-80"
              >
                <MailIcon /> {settings.header_email}
              </Link>
            )}
            {settings.header_phone && (
              <span className="flex items-center gap-1.5">
                <PhoneIcon /> {settings.header_phone}
              </span>
            )}
            {settings.header_address && (
              <span className="flex items-center gap-1.5">
                <PinIcon /> {settings.header_address}
              </span>
            )}
          </div>
          <LocaleSwitcher />
        </div>
      </div>

      <div className="px-4 py-3 sm:px-6 sm:py-4">
        <div className="mx-auto grid max-w-7xl grid-cols-[auto_minmax(0,36rem)_auto] items-center gap-4 sm:gap-6">
          <div className="flex justify-start">
            <Link
              href="/"
              className="flex shrink-0 items-center gap-2 font-display text-xl font-bold uppercase tracking-[0.06em] text-foreground sm:gap-3 sm:text-3xl"
            >
              {settings.site_logo_url && (
                // eslint-disable-next-line @next/next/no-img-element -- brand
                // logo comes from an admin-controlled external URL/Storage
                // bucket; not worth routing through next/image for a single
                // small header mark.
                <img
                  src={settings.site_logo_url}
                  alt=""
                  className="h-9 w-9 shrink-0 rounded-full object-cover sm:h-12 sm:w-12"
                />
              )}
              {settings.site_name}
            </Link>
          </div>

          <InlineSearch />

          <div className="flex shrink-0 items-center justify-end gap-3 sm:gap-5">
            <Link
              href="/search"
              aria-label={t("search")}
              className="flex h-10 w-10 items-center justify-center rounded-full text-foreground transition-colors hover:bg-accent-soft sm:hidden"
            >
              <SearchIcon />
            </Link>
            {settings.header_email && (
              <Link
                href={`mailto:${settings.header_email}`}
                className="hidden text-sm text-foreground transition-opacity hover:opacity-70 lg:inline"
              >
                {settings.header_email}
              </Link>
            )}
            <AccountLink />
            <Link
              href="/account/wishlist"
              aria-label={t("wishlist")}
              className="text-foreground transition-opacity hover:opacity-70"
            >
              <HeartIcon />
            </Link>
            <CartLink />
          </div>
        </div>
      </div>

      <div className="hidden border-t border-line px-6 py-3 sm:block">
        <div className="mx-auto grid max-w-7xl grid-cols-[1fr_auto_1fr] items-center gap-6">
          <div className="flex justify-start">
            <MegaMenu
              categories={categories}
              categoriesLabel={settings.categories_menu_label}
            />
          </div>
          <MegaMenuColumns categories={categories} extraColumns={menuColumns} />
          <div className="flex justify-end">
            <Link
              href="/contact"
              className="hidden rounded-full bg-accent px-5 py-2 text-xs font-semibold uppercase tracking-wide text-background transition-opacity hover:opacity-90 sm:inline-block"
            >
              {t("contactUs")}
            </Link>
          </div>
        </div>
      </div>

      <nav aria-label="Product categories" className="flex items-center gap-6 overflow-x-auto border-t border-line px-4 py-3 text-sm font-normal tracking-normal text-foreground sm:hidden">
        {categories.map((category) => (
          <Link
            key={category.id}
            href={`/products?category=${category.slug}`}
            className="shrink-0 transition-colors hover:text-accent"
          >
            {category.name}
          </Link>
        ))}
        <Link href="/products" className="shrink-0 transition-colors hover:text-accent">
          {t("shopAll")}
        </Link>
      </nav>
    </header>
  );
}

function MailIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-3.5 w-3.5">
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m3 7 9 6 9-6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function PhoneIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-3.5 w-3.5">
      <path
        d="M4 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L14 13l5 2v4a2 2 0 0 1-2 2A15 15 0 0 1 2 6a2 2 0 0 1 2-2Z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function PinIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-3.5 w-3.5">
      <path d="M12 21s7-6.5 7-12a7 7 0 1 0-14 0c0 5.5 7 12 7 12Z" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="12" cy="9" r="2.5" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
      <circle cx="11" cy="11" r="7" />
      <path d="m21 21-4.3-4.3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function HeartIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className="h-5 w-5">
      <path
        d="M12 20s-7-4.4-9.5-8.8C1 8 2.5 4.5 6 4.5c2 0 3.5 1.2 4.5 2.8 1-1.6 2.5-2.8 4.5-2.8 3.5 0 5 3.5 3.5 6.7C19 15.6 12 20 12 20Z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
