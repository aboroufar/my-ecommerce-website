"use client";

import { useState } from "react";
import { sendContactMessage } from "@/lib/actions/contact";

export function ContactForm() {
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
      <p className="text-sm text-foreground">
        Thanks — your message has been sent. We&apos;ll get back to you soon.
      </p>
    );
  }

  return (
    <form action={handleSubmit} className="flex flex-col gap-4">
      <label className="flex flex-col gap-1.5">
        <span className="text-xs font-medium uppercase tracking-wide text-muted">
          Name
        </span>
        <input
          name="name"
          required
          className="rounded-md border border-line bg-surface px-4 py-3 text-sm text-foreground placeholder:text-muted focus:border-foreground focus:outline-none"
        />
      </label>
      <label className="flex flex-col gap-1.5">
        <span className="text-xs font-medium uppercase tracking-wide text-muted">
          Email
        </span>
        <input
          type="email"
          name="email"
          required
          placeholder="you@example.com"
          className="rounded-md border border-line bg-surface px-4 py-3 text-sm text-foreground placeholder:text-muted focus:border-foreground focus:outline-none"
        />
      </label>
      <label className="flex flex-col gap-1.5">
        <span className="text-xs font-medium uppercase tracking-wide text-muted">
          Message
        </span>
        <textarea
          name="message"
          required
          rows={5}
          className="rounded-md border border-line bg-surface px-4 py-3 text-sm text-foreground placeholder:text-muted focus:border-foreground focus:outline-none"
        />
      </label>

      {error && <p className="text-xs text-red-700">{error}</p>}

      <button
        type="submit"
        disabled={status === "loading"}
        className="self-start rounded-full bg-accent px-8 py-3 text-sm font-semibold uppercase tracking-wide text-background transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {status === "loading" ? "Sending…" : "Submit"}
      </button>
    </form>
  );
}
