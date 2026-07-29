import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { NewsletterSignup } from "./NewsletterSignup";
import { PaymentIcons } from "./PaymentIcons";
import { getSiteContent } from "@/lib/content";
import { getSiteSettings } from "@/lib/siteSettings";

export async function SiteFooter() {
  const [content, settings, t] = await Promise.all([
    getSiteContent(),
    getSiteSettings(),
    getTranslations("footer"),
  ]);

  return (
    <footer className="bg-header-footer text-header-footer-text">
      <div className="mx-auto max-w-7xl px-6 py-16 sm:px-16">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <span className="font-display text-xl font-bold uppercase tracking-wide">
              {settings.site_name}
            </span>
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-header-footer-text/70">
              {content["footer.about_text"]}
            </p>
          </div>

          <div>
            <h3 className="font-display text-base font-bold">{t("help")}</h3>
            <ul className="mt-3 space-y-2 text-sm text-header-footer-text/70">
              <li>
                <Link href="/products" className="transition-colors hover:text-header-footer-text">
                  {t("shopAll")}
                </Link>
              </li>
              <li>
                <Link href="/cart" className="transition-colors hover:text-header-footer-text">
                  {t("cart")}
                </Link>
              </li>
              <li>
                <Link href="/shipping" className="transition-colors hover:text-header-footer-text">
                  {t("shipping")}
                </Link>
              </li>
              <li>
                <Link href="/faq" className="transition-colors hover:text-header-footer-text">
                  {t("faq")}
                </Link>
              </li>
              <li>
                <Link href="/returns" className="transition-colors hover:text-header-footer-text">
                  {t("returns")}
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-display text-base font-bold">{t("accounts")}</h3>
            <ul className="mt-3 space-y-2 text-sm text-header-footer-text/70">
              <li>
                <Link href="/account" className="transition-colors hover:text-header-footer-text">
                  {t("signIn")}
                </Link>
              </li>
              <li>
                <Link href="/account/orders" className="transition-colors hover:text-header-footer-text">
                  {t("trackOrder")}
                </Link>
              </li>
              <li>
                <Link href="/contact" className="transition-colors hover:text-header-footer-text">
                  {t("contactUs")}
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-display text-base font-bold">
              {t("subscribeHeading")}
            </h3>
            <p className="mt-3 text-sm text-header-footer-text/70">
              {t("subscribeText")}
            </p>
            <div className="mt-4">
              <NewsletterSignup />
            </div>
          </div>
        </div>

        <div className="mt-14 border-t border-header-footer-text/20 pt-6">
          <PaymentIcons />
          <div className="mt-4 flex flex-col items-center gap-2 text-xs uppercase tracking-wide text-header-footer-text/70">
            <p>© {new Date().getFullYear()} {settings.site_name}. {t("rightsReserved")}</p>
            <div className="flex items-center gap-4">
              <Link href="/privacy" className="transition-colors hover:text-header-footer-text">
                {t("privacy")}
              </Link>
              <Link href="/terms" className="transition-colors hover:text-header-footer-text">
                {t("terms")}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
