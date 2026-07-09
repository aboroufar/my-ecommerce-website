import type { Metadata } from "next";
import { PolicyPlaceholder } from "@/components/PolicyPlaceholder";

export const metadata: Metadata = {
  title: "Terms of Service — Storefront",
};

export default function TermsPage() {
  return (
    <PolicyPlaceholder
      title="Terms of Service"
      sections={[
        {
          heading: "Acceptance of terms",
          hint: "What using this site or making a purchase means the customer agrees to.",
        },
        {
          heading: "Orders and payment",
          hint: "e.g. prices are re-verified server-side at checkout, when a charge is considered final, accepted payment methods.",
        },
        {
          heading: "Shipping and delivery",
          hint: "Reference your Shipping & Delivery page, or restate the key terms here.",
        },
        {
          heading: "Returns and refunds",
          hint: "Reference your Returns Policy page, or restate the key terms here.",
        },
        {
          heading: "Intellectual property",
          hint: "Ownership of site content, product images, and branding.",
        },
        {
          heading: "Limitation of liability",
          hint: "Standard liability disclaimers -- get real legal review for this section specifically.",
        },
        {
          heading: "Governing law",
          hint: "Which jurisdiction's laws apply to disputes.",
        },
        {
          heading: "Contact",
          hint: "Who to contact with questions about these terms.",
        },
      ]}
    />
  );
}
