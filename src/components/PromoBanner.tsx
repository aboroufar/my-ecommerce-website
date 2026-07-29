import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";

/**
 * Full-width promo strip between the sale and bestsellers sections,
 * matching the reference's mid-page discount callout. Copy is static
 * (no site_settings field exists for freeform promo copy yet) --
 * flagged as a follow-up if the admin wants this editable.
 */
export async function PromoBanner() {
  const t = await getTranslations("promoBanner");

  return (
    <section className="bg-accent-soft">
      <div className="mx-auto flex max-w-7xl flex-col items-center gap-4 px-6 py-14 text-center sm:px-16">
        <span className="text-xs font-medium uppercase tracking-[0.2em] text-accent-text">
          {t("eyebrow")}
        </span>
        <h2 className="font-display text-3xl font-bold text-foreground sm:text-4xl">
          {t("heading")}
        </h2>
        <p className="max-w-md text-sm text-muted">{t("body")}</p>
        <Link
          href="/products"
          className="mt-2 inline-block rounded-full bg-foreground px-8 py-3 text-xs font-semibold uppercase tracking-wide text-background transition-opacity hover:opacity-90"
        >
          {t("cta")}
        </Link>
      </div>
    </section>
  );
}
