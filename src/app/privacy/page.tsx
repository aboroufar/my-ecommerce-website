import type { Metadata } from "next";
import { PolicyPlaceholder } from "@/components/PolicyPlaceholder";

export const metadata: Metadata = {
  title: "Privacy Policy — Storefront",
};

export default function PrivacyPage() {
  return (
    <PolicyPlaceholder
      title="Privacy Policy"
      sections={[
        {
          heading: "What information we collect",
          hint: "e.g. name, email, shipping address, payment details (handled by Stripe, never stored directly), browsing/cookie data.",
        },
        {
          heading: "How we use it",
          hint: "e.g. processing orders, sending order updates, marketing emails (only if subscribed), improving the site.",
        },
        {
          heading: "Who we share it with",
          hint: "e.g. Stripe (payments), Resend (email), Supabase (hosting/database), shipping carriers.",
        },
        {
          heading: "Cookies",
          hint: "What cookies this site sets and why (e.g. cart contents, session).",
        },
        {
          heading: "Your rights",
          hint: "How customers can request their data, ask for deletion, or opt out of marketing.",
        },
        {
          heading: "Contact",
          hint: "Who to contact with privacy questions.",
        },
      ]}
    />
  );
}
