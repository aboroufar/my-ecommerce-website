import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { PolicyPlaceholder } from "@/components/PolicyPlaceholder";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("termsPage");
  return { title: t("title") };
}

export default async function TermsPage() {
  const t = await getTranslations("termsPage");
  return (
    <PolicyPlaceholder
      title={t("pageTitle")}
      sections={[
        { heading: t("acceptanceHeading"), hint: t("acceptanceHint") },
        { heading: t("ordersHeading"), hint: t("ordersHint") },
        { heading: t("shippingHeading"), hint: t("shippingHint") },
        { heading: t("returnsHeading"), hint: t("returnsHint") },
        { heading: t("ipHeading"), hint: t("ipHint") },
        { heading: t("liabilityHeading"), hint: t("liabilityHint") },
        { heading: t("lawHeading"), hint: t("lawHint") },
        { heading: t("contactHeading"), hint: t("contactHint") },
      ]}
    />
  );
}
