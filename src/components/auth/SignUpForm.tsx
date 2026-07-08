"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { GoogleButton } from "./SignInForm";

export function SignUpForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "sent">("idle");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?next=/account`,
      },
    });
    if (error) {
      setStatus("idle");
      setError(error.message);
      return;
    }
    setStatus("sent");
  }

  async function handleGoogleSignIn() {
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=/account`,
      },
    });
    if (error) setError(error.message);
  }

  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center px-6 py-20">
      <h1 className="font-display text-2xl font-bold text-foreground">
        Create account
      </h1>

      <GoogleButton onClick={handleGoogleSignIn} />

      <div className="my-6 flex items-center gap-4 text-xs uppercase tracking-wide text-muted">
        <span className="h-px flex-1 bg-line" />
        or
        <span className="h-px flex-1 bg-line" />
      </div>

      {status === "sent" ? (
        <p className="text-sm text-foreground">
          Check your email to confirm your account.
        </p>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <label className="flex flex-col gap-2">
            <span className="text-xs font-medium uppercase tracking-wide text-foreground">
              Email*
            </span>
            <input
              type="email"
              required
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="border border-line bg-transparent px-4 py-3 text-sm text-foreground placeholder:text-muted focus:border-foreground focus:outline-none"
            />
          </label>
          <label className="flex flex-col gap-2">
            <span className="text-xs font-medium uppercase tracking-wide text-foreground">
              Password*
            </span>
            <input
              type="password"
              required
              minLength={6}
              placeholder="At least 6 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="border border-line bg-transparent px-4 py-3 text-sm text-foreground placeholder:text-muted focus:border-foreground focus:outline-none"
            />
          </label>

          {error && <p className="text-sm text-red-700">{error}</p>}

          <button
            type="submit"
            disabled={status === "loading"}
            className="bg-foreground px-6 py-3.5 text-sm font-medium uppercase tracking-wide text-background transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {status === "loading" ? "Creating account…" : "Create account"}
          </button>
        </form>
      )}

      <p className="mt-6 text-xs text-muted">
        Already have an account?{" "}
        <Link
          href="/account"
          className="text-foreground underline underline-offset-4"
        >
          Sign in
        </Link>
        .
      </p>
    </main>
  );
}
