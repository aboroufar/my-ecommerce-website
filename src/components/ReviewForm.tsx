"use client";

import { useState } from "react";
import { submitReview } from "@/lib/actions/reviews";

/**
 * Mirrors ContactForm.tsx's pattern exactly -- local status state, calls
 * the server action directly with the submitted FormData, swaps in a
 * confirmation message on success rather than navigating away.
 */
export function ReviewForm({ productId }: { productId: string }) {
  const [status, setStatus] = useState<"idle" | "loading" | "done">("idle");
  const [error, setError] = useState<string | null>(null);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);

  async function handleSubmit(formData: FormData) {
    if (rating === 0) {
      setError("Please select a rating.");
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
        Thanks — your review will appear once it&apos;s approved.
      </p>
    );
  }

  return (
    <form action={handleSubmit} className="flex max-w-md flex-col gap-4">
      <h3 className="font-display text-lg font-bold text-foreground">Add a review</h3>

      {/* Honeypot -- hidden from real visitors via CSS, not display:none
          (some bots skip fields with display:none), left in the tab order
          but visually and practically unreachable for a human. */}
      <label className="absolute left-[-9999px]" aria-hidden="true">
        Website
        <input name="website" tabIndex={-1} autoComplete="off" />
      </label>

      <div className="flex flex-col gap-1.5">
        <span className="text-xs font-medium uppercase tracking-wide text-muted">
          Your rating
        </span>
        <div className="flex gap-1" onMouseLeave={() => setHoverRating(0)}>
          {[1, 2, 3, 4, 5].map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setRating(value)}
              onMouseEnter={() => setHoverRating(value)}
              aria-label={`${value} star${value === 1 ? "" : "s"}`}
              className="text-2xl leading-none"
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
          Your review
        </span>
        <textarea
          name="body"
          required
          rows={4}
          className="border border-line bg-transparent px-3 py-2 text-sm"
        />
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="text-xs font-medium uppercase tracking-wide text-muted">
          Your name
        </span>
        <input
          name="reviewer_name"
          required
          className="border border-line bg-transparent px-3 py-2 text-sm"
        />
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="text-xs font-medium uppercase tracking-wide text-muted">
          Your email
        </span>
        <input
          type="email"
          name="reviewer_email"
          required
          placeholder="you@example.com"
          className="border border-line bg-transparent px-3 py-2 text-sm"
        />
        <span className="text-xs text-muted">
          Your email address will not be published.
        </span>
      </label>

      {error && <p className="text-xs text-red-700">{error}</p>}

      <button
        type="submit"
        disabled={status === "loading"}
        className="self-start bg-foreground px-6 py-2.5 text-sm font-medium uppercase tracking-wide text-background transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {status === "loading" ? "Submitting…" : "Submit"}
      </button>
    </form>
  );
}
