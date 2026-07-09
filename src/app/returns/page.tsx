import type { Metadata } from "next";
import { PolicyPlaceholder } from "@/components/PolicyPlaceholder";

export const metadata: Metadata = {
  title: "Returns Policy — Storefront",
};

export default function ReturnsPage() {
  return (
    <PolicyPlaceholder
      title="Returns Policy"
      sections={[
        {
          heading: "Return window",
          hint: "e.g. how many days after delivery a customer can request a return.",
        },
        {
          heading: "Eligible items",
          hint: "Condition requirements (unused, original packaging, etc.) and any non-returnable categories.",
        },
        {
          heading: "How to start a return",
          hint: "The actual process -- e.g. contact support, use a self-serve portal, print a label.",
        },
        {
          heading: "Refund method and timing",
          hint: "e.g. refunded to original payment method, how long it takes to process once received.",
        },
        {
          heading: "Who pays return shipping",
          hint: "Customer-paid vs. free returns, and under what conditions.",
        },
        {
          heading: "Exchanges",
          hint: "Whether exchanges are offered as an alternative to a refund.",
        },
      ]}
    />
  );
}
