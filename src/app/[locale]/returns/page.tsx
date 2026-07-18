import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { PolicyPlaceholder } from "@/components/PolicyPlaceholder";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("returnsPage");
  return { title: t("title") };
}

export default async function ReturnsPage() {
  const t = await getTranslations("returnsPage");
  return (
    <PolicyPlaceholder
      title={t("pageTitle")}
      sections={[
        { heading: t("windowHeading"), hint: t("windowHint") },
        { heading: t("eligibleHeading"), hint: t("eligibleHint") },
        { heading: t("howToHeading"), hint: t("howToHint") },
        { heading: t("refundHeading"), hint: t("refundHint") },
        { heading: t("whoPaysHeading"), hint: t("whoPaysHint") },
        { heading: t("exchangesHeading"), hint: t("exchangesHint") },
      ]}
    />
  );
}
