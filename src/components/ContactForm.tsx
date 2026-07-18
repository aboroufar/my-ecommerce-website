"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { sendContactMessage } from "@/lib/actions/contact";

export function ContactForm() {
  const t = useTranslations("contactForm");
  const [status, setStatus] = useState<"idle" | "loading" | "done">("idle");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(formData: FormData) {
    setStatus("loading");
    setError(null);
    const result = await sendContactMessage(formData);
    if (!result.ok) {
      setStatus("idle");
      setError(result.error);
      return;
    }
    setStatus("done");
  }

  if (status === "done") {
    return (
      <p className="text-sm text-foreground" role="status" aria-live="polite">
        {t("success")}
      </p>
    );
  }

  return (
    <form action={handleSubmit} className="flex flex-col gap-4" aria-live="polite">
      <label className="flex flex-col gap-1.5">
        <span className="text-xs font-medium uppercase tracking-wide text-muted">
          {t("name")}
        </span>
        <input
          name="name"
          required
          className="rounded-md border border-line bg-surface px-4 py-3 text-sm text-foreground placeholder:text-muted focus:border-foreground focus:outline-none focus:ring-2 focus:ring-accent/40"
        />
      </label>
      <label className="flex flex-col gap-1.5">
        <span className="text-xs font-medium uppercase tracking-wide text-muted">
          {t("email")}
        </span>
        <input
          type="email"
          name="email"
          required
          placeholder={t("emailPlaceholder")}
          className="rounded-md border border-line bg-surface px-4 py-3 text-sm text-foreground placeholder:text-muted focus:border-foreground focus:outline-none focus:ring-2 focus:ring-accent/40"
        />
      </label>
      <label className="flex flex-col gap-1.5">
        <span className="text-xs font-medium uppercase tracking-wide text-muted">
          {t("message")}
        </span>
        <textarea
          name="message"
          required
          rows={5}
          className="rounded-md border border-line bg-surface px-4 py-3 text-sm text-foreground placeholder:text-muted focus:border-foreground focus:outline-none focus:ring-2 focus:ring-accent/40"
        />
      </label>

      {error && <p className="text-xs text-red-700">{error}</p>}

      <button
        type="submit"
        disabled={status === "loading"}
        className="self-start rounded-full bg-accent px-8 py-3 text-sm font-semibold uppercase tracking-wide text-background transition-all duration-300 ease-[cubic-bezier(.4,0,.2,1)] hover:-translate-y-0.5 hover:opacity-90 hover:shadow-md disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
      >
        {status === "loading" ? t("sending") : t("submit")}
      </button>
    </form>
  );
}
