"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { submitReview } from "@/lib/actions/reviews";

/**
 * Mirrors ContactForm.tsx's pattern exactly -- local status state, calls
 * the server action directly with the submitted FormData, swaps in a
 * confirmation message on success rather than navigating away.
 */
export function ReviewForm({ productId }: { productId: string }) {
  const t = useTranslations("reviewForm");
  const [status, setStatus] = useState<"idle" | "loading" | "done">("idle");
  const [error, setError] = useState<string | null>(null);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);

  async function handleSubmit(formData: FormData) {
    if (rating === 0) {
      setError(t("ratingRequired"));
      return;
    }
    formData.set("rating", String(rating));
    setStatus("loading");
    setError(null);
    const result = await submitReview(productId, formData);
    if (!result.ok) {
      setStatus("idle");
      setError(result.error);
      return;
    }
    setStatus("done");
  }

  if (status === "done") {
    return (
      <p className="text-sm text-foreground">
        {t("success")}
      </p>
    );
  }

  return (
    <form action={handleSubmit} className="flex max-w-md flex-col gap-4">
      <h3 className="font-display text-lg font-bold text-foreground">{t("addReview")}</h3>

      {/* Honeypot -- hidden from real visitors via CSS, not display:none
          (some bots skip fields with display:none), left in the tab order
          but visually and practically unreachable for a human. */}
      <label className="absolute left-[-9999px]" aria-hidden="true">
        {t("website")}
        <input name="website" tabIndex={-1} autoComplete="off" />
      </label>

      <div className="flex flex-col gap-1.5">
        <span id="rating-label" className="text-xs font-medium uppercase tracking-wide text-muted">
          {t("yourRating")}
        </span>
        <div
          role="radiogroup"
          aria-labelledby="rating-label"
          aria-describedby={error ? "rating-error" : undefined}
          className="flex gap-1"
          onMouseLeave={() => setHoverRating(0)}
        >
          {[1, 2, 3, 4, 5].map((value) => (
            <button
              key={value}
              type="button"
              role="radio"
              aria-checked={value === rating}
              onClick={() => setRating(value)}
              onMouseEnter={() => setHoverRating(value)}
              aria-label={t("starAriaLabel", { count: value })}
              className="rounded text-2xl leading-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            >
              <span
                className={
                  value <= (hoverRating || rating) ? "text-accent" : "text-line"
                }
              >
                ★
              </span>
            </button>
          ))}
        </div>
      </div>

      <label className="flex flex-col gap-1.5">
        <span className="text-xs font-medium uppercase tracking-wide text-muted">
          {t("yourReview")}
        </span>
        <textarea
          name="body"
          required
          rows={4}
          className="border border-line bg-transparent px-3 py-2 text-sm focus:border-foreground focus:outline-none focus:ring-2 focus:ring-accent/40"
        />
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="text-xs font-medium uppercase tracking-wide text-muted">
          {t("yourName")}
        </span>
        <input
          name="reviewer_name"
          required
          className="border border-line bg-transparent px-3 py-2 text-sm focus:border-foreground focus:outline-none focus:ring-2 focus:ring-accent/40"
        />
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="text-xs font-medium uppercase tracking-wide text-muted">
          {t("yourEmail")}
        </span>
        <input
          type="email"
          name="reviewer_email"
          required
          placeholder={t("emailPlaceholder")}
          className="border border-line bg-transparent px-3 py-2 text-sm focus:border-foreground focus:outline-none focus:ring-2 focus:ring-accent/40"
        />
        <span className="text-xs text-muted">
          {t("emailNotPublished")}
        </span>
      </label>

      {error && (
        <p id="rating-error" className="text-xs text-red-700">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={status === "loading"}
        className="self-start bg-foreground px-6 py-2.5 text-sm font-medium uppercase tracking-wide text-background transition-opacity hover:opacity-90 disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
      >
        {status === "loading" ? t("submitting") : t("submit")}
      </button>
    </form>
  );
}
