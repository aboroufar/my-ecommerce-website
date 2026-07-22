"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function MagicLinkForm({
  next,
  heading = "Sign in",
  description = "Enter your email and we'll send a one-time sign-in link. No password to manage.",
  emailPlaceholder = "you@example.com",
  checkEmailText = "Check your email for a sign-in link.",
  sendingText = "Sending…",
  sendButtonText = "Send magic link",
  errorText = "Something went wrong. Please try again.",
}: {
  next: string;
  heading?: string;
  description?: string;
  emailPlaceholder?: string;
  checkEmailText?: string;
  sendingText?: string;
  sendButtonText?: string;
  errorText?: string;
}) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">(
    "idle"
  );
  const [errorDetail, setErrorDetail] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
      },
    });
    if (error) {
      console.error("signInWithOtp failed:", error);
      setErrorDetail(error.message);
      setStatus("error");
    } else {
      setErrorDetail(null);
      setStatus("sent");
    }
  }

  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center px-6 py-20">
      <h1 className="font-display text-2xl text-foreground">{heading}</h1>
      <p className="mt-2 text-sm text-muted">{description}</p>

      {status === "sent" ? (
        <p className="mt-6 text-sm text-foreground">
          {checkEmailText}
        </p>
      ) : (
        <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-3">
          <input
            type="email"
            required
            placeholder={emailPlaceholder}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="border border-line bg-transparent px-3 py-2 text-sm"
          />
          <button
            type="submit"
            disabled={status === "sending"}
            className="bg-accent px-4 py-2 text-sm font-medium text-background transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {status === "sending" ? sendingText : sendButtonText}
          </button>
          {status === "error" && (
            <p className="text-sm text-red-700">
              {errorText}
              {errorDetail && (
                <span className="mt-1 block text-xs text-red-500">
                  {errorDetail}
                </span>
              )}
            </p>
          )}
        </form>
      )}
    </main>
  );
}
