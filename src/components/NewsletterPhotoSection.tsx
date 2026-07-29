import { getTranslations } from "next-intl/server";
import { NewsletterSignup } from "./NewsletterSignup";

/**
 * Dark two-column newsletter block matching the reference's photo +
 * signup layout. No admin-editable image field exists yet for this slot
 * (site_content is text-only, keyed by a fixed literal union) -- the
 * right column is a plain gradient placeholder rather than a fabricated
 * stock photo; swap in a real image once there's a place to upload one.
 */
export async function NewsletterPhotoSection() {
  const t = await getTranslations("newsletterPhoto");

  return (
    <section className="bg-header-footer text-header-footer-text">
      <div className="mx-auto grid max-w-7xl grid-cols-1 items-stretch sm:grid-cols-2">
        <div className="flex flex-col justify-center gap-4 px-6 py-16 sm:px-16">
          <h2 className="font-display text-3xl font-bold sm:text-4xl">{t("heading")}</h2>
          <p className="max-w-sm text-sm text-header-footer-text/70">{t("body")}</p>
          <div className="mt-2 max-w-md">
            <NewsletterSignup />
          </div>
        </div>
        <div
          aria-hidden
          className="hidden min-h-64 sm:block"
          style={{
            background:
              "linear-gradient(135deg, color-mix(in srgb, var(--accent) 55%, var(--header-footer)) 0%, var(--header-footer) 100%)",
          }}
        />
      </div>
    </section>
  );
}
