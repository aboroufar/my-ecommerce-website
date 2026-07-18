import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { ResetPasswordForm } from "@/components/account/ResetPasswordForm";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("account");
  return { title: t("resetPasswordTitle") };
}

export default function ResetPasswordPage() {
  return <ResetPasswordForm />;
}
