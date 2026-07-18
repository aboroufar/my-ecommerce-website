import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { PolicyPlaceholder } from "@/components/PolicyPlaceholder";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("privacyPage");
  return { title: t("title") };
}

export default async function PrivacyPage() {
  const t = await getTranslations("privacyPage");
  return (
    <PolicyPlaceholder
      title={t("pageTitle")}
      sections={[
        { heading: t("collectHeading"), hint: t("collectHint") },
        { heading: t("useHeading"), hint: t("useHint") },
        { heading: t("shareHeading"), hint: t("shareHint") },
        { heading: t("cookiesHeading"), hint: t("cookiesHint") },
        { heading: t("rightsHeading"), hint: t("rightsHint") },
        { heading: t("contactHeading"), hint: t("contactHint") },
      ]}
    />
  );
}
