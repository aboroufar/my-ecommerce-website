"use client";

import { useState } from "react";
import { subscribeToNewsletter } from "@/lib/actions/newsletter";

export function NewsletterSignup() {
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
      <p className="text-sm text-foreground">
        You&apos;re on the list — thanks for subscribing.
      </p>
    );
  }

  return (
    <div>
      <form action={handleSubmit} className="flex flex-col gap-2 sm:flex-row sm:gap-0">
        <input
          type="email"
          name="email"
          required
          placeholder="you@example.com"
          className="flex-1 border border-line bg-transparent px-3 py-2 text-sm text-foreground placeholder:text-muted focus:border-foreground focus:outline-none sm:border-r-0"
        />
        <button
          type="submit"
          disabled={status === "loading"}
          className="bg-foreground px-5 py-2 text-xs font-medium uppercase tracking-wide text-background transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {status === "loading" ? "Subscribing…" : "Subscribe"}
        </button>
      </form>
      {error && <p className="mt-2 text-xs text-red-700">{error}</p>}
    </div>
  );
}
