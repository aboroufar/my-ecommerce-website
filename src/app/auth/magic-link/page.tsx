import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { MagicLinkForm } from "@/components/auth/MagicLinkForm";

export const metadata: Metadata = {
  title: "Sign in with a magic link — Storefront",
};

export default async function MagicLinkPage() {
  const user = await getSessionUser();
  if (user) redirect("/account");

  return <MagicLinkForm next="/account" />;
}
