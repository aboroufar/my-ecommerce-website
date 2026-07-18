import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getSessionUser } from "@/lib/auth";
import { SignUpForm } from "@/components/auth/SignUpForm";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("signUpPage");
  return { title: t("title") };
}

export default async function SignUpPage() {
  const user = await getSessionUser();
  if (user) redirect("/account");

  return <SignUpForm />;
}
