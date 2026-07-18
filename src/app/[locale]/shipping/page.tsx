import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("shippingPage");
  return { title: t("title") };
}

export default async function ShippingPage() {
  const t = await getTranslations("shippingPage");

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-16">
      <span className="text-xs font-medium uppercase tracking-[0.2em] text-muted">
        {t("eyebrow")}
      </span>
      <h1 className="mt-2 font-display text-3xl font-bold text-foreground">
        {t("heading")}
      </h1>

      <div className="mt-10 space-y-8 text-sm leading-relaxed text-muted">
        <section>
          <h2 className="font-display text-lg font-bold text-foreground">
            {t("processingTimeTitle")}
          </h2>
          <p className="mt-2">
            {t("processingTimeBody")}
          </p>
        </section>

        <section>
          <h2 className="font-display text-lg font-bold text-foreground">
            {t("whereWeShipTitle")}
          </h2>
          <p className="mt-2">
            {t("whereWeShipBody")}
          </p>
        </section>

        <section>
          <h2 className="font-display text-lg font-bold text-foreground">
            {t("shippingCostTitle")}
          </h2>
          <p className="mt-2">
            {t("shippingCostBody")}
          </p>
        </section>

        <section className="border-t border-line pt-8">
          <h2 className="font-display text-lg font-bold text-foreground">
            {t("questionTitle")}
          </h2>
          <p className="mt-2">
            {t("questionBodyStart")}{" "}
            <Link
              href="/account/orders"
              className="text-foreground underline underline-offset-4"
            >
              {t("questionBodyYourAccount")}
            </Link>
            {t("questionBodyOr")}{" "}
            <Link
              href="/faq"
              className="text-foreground underline underline-offset-4"
            >
              {t("questionBodyFaq")}
            </Link>{" "}
            {t("questionBodyEnd")}
          </p>
        </section>
      </div>
    </main>
  );
}
