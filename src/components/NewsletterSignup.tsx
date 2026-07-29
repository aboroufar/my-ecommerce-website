"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { subscribeToNewsletter } from "@/lib/actions/newsletter";

export function NewsletterSignup() {
  const t = useTranslations("newsletter");
  const [status, setStatus] = useState<"idle" | "loading" | "done">("idle");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(formData: FormData) {
    setStatus("loading");
    setError(null);
    const result = await subscribeToNewsletter(formData);
    if (!result.ok) {
      setStatus("idle");
      setError(result.error);
      return;
    }
    setStatus("done");
  }

  if (status === "done") {
    return (
      <p className="text-sm text-header-footer-text">
        {t("success")}
      </p>
    );
  }

  return (
    <div>
      <form action={handleSubmit} className="flex flex-col gap-2 sm:flex-row sm:gap-2">
        <input
          type="email"
          name="email"
          required
          placeholder={t("emailPlaceholder")}
          className="flex-1 rounded-full border border-header-footer-text/30 bg-transparent px-4 py-2 text-sm text-header-footer-text placeholder:text-header-footer-text/50 focus:border-header-footer-text focus:outline-none focus:ring-2 focus:ring-header-footer-text/30"
        />
        <button
          type="submit"
          disabled={status === "loading"}
          className="rounded-full bg-header-footer-text px-5 py-2 text-xs font-medium uppercase tracking-wide text-header-footer transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {status === "loading" ? t("subscribing") : t("subscribe")}
        </button>
      </form>
      {error && <p className="mt-2 text-xs text-red-300">{error}</p>}
    </div>
  );
}
