import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { SignUpForm } from "@/components/auth/SignUpForm";

export const metadata: Metadata = {
  title: "Create account — Storefront",
};

export default async function SignUpPage() {
  const user = await getSessionUser();
  if (user) redirect("/account");

  return <SignUpForm />;
}
