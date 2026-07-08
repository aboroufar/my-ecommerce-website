import type { Metadata } from "next";
import { ResetPasswordForm } from "@/components/account/ResetPasswordForm";

export const metadata: Metadata = {
  title: "Reset password — Storefront",
};

export default function ResetPasswordPage() {
  return <ResetPasswordForm />;
}
