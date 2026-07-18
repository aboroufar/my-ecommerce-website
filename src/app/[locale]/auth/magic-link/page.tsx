import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getSessionUser } from "@/lib/auth";
import { MagicLinkForm } from "@/components/auth/MagicLinkForm";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("magicLinkPage");
  return { title: t("title") };
}

export default async function MagicLinkPage() {
  const user = await getSessionUser();
  if (user) redirect("/account");

  const t = await getTranslations("magicLinkForm");

  return (
    <MagicLinkForm
      next="/account"
      heading={t("heading")}
      description={t("description")}
      emailPlaceholder={t("emailPlaceholder")}
      checkEmailText={t("checkEmail")}
      sendingText={t("sending")}
      sendButtonText={t("sendMagicLink")}
      errorText={t("genericError")}
    />
  );
}
