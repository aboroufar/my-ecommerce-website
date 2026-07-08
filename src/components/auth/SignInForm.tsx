"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function SignInForm({ next = "/account" }: { next?: string }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<"idle" | "loading">("idle");
  const [error, setError] = useState<string | null>(null);
  const [resetSent, setResetSent] = useState(false);

  async function handleLogIn(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    setStatus("idle");
    if (error) {
      setError(error.message);
      return;
    }
    router.push(next);
    router.refresh();
  }

  async function handleForgotPassword() {
    if (!email) {
      setError("Enter your email above first, then click this link.");
      return;
    }
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/account/reset-password`,
    });
    if (error) {
      setError(error.message);
      return;
    }
    setResetSent(true);
  }

  async function handleGoogleSignIn() {
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
      },
    });
    if (error) setError(error.message);
  }

  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center px-6 py-20">
      <h1 className="font-display text-2xl font-bold text-foreground">
        Sign in
      </h1>

      <GoogleButton onClick={handleGoogleSignIn} />

      <div className="my-6 flex items-center gap-4 text-xs uppercase tracking-wide text-muted">
        <span className="h-px flex-1 bg-line" />
        or
        <span className="h-px flex-1 bg-line" />
      </div>

      <form onSubmit={handleLogIn} className="flex flex-col gap-5">
        <Field
          label="Email"
          type="email"
          required
          placeholder="Enter your email"
          value={email}
          onChange={setEmail}
        />
        <Field
          label="Password"
          type="password"
          required
          placeholder="Enter your password"
          value={password}
          onChange={setPassword}
        />

        {error && <p className="text-sm text-red-700">{error}</p>}
        {resetSent && (
          <p className="text-sm text-foreground">
            Check your email for a link to reset your password.
          </p>
        )}

        <button
          type="submit"
          disabled={status === "loading"}
          className="bg-foreground px-6 py-3.5 text-sm font-medium uppercase tracking-wide text-background transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {status === "loading" ? "Logging in…" : "Log in"}
        </button>

        <button
          type="button"
          onClick={handleForgotPassword}
          className="self-start text-xs font-medium uppercase tracking-wide text-foreground underline underline-offset-4"
        >
          Forgot your password?
        </button>
      </form>

      <p className="mt-6 text-xs text-muted">
        Prefer not to use a password?{" "}
        <Link
          href="/auth/magic-link"
          className="text-foreground underline underline-offset-4"
        >
          Email me a sign-in link instead
        </Link>
        .
      </p>

      <hr className="my-10 border-line" />

      <h2 className="font-display text-3xl font-bold uppercase leading-tight text-foreground">
        Don&apos;t have an account?
      </h2>

      <Link
        href="/auth/sign-up"
        className="mt-6 inline-block bg-foreground px-6 py-3.5 text-center text-sm font-medium uppercase tracking-wide text-background transition-opacity hover:opacity-90"
      >
        Create account
      </Link>
    </main>
  );
}

function Field({
  label,
  type,
  required,
  placeholder,
  value,
  onChange,
}: {
  label: string;
  type: string;
  required?: boolean;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="flex flex-col gap-2">
      <span className="text-xs font-medium uppercase tracking-wide text-foreground">
        {label}
        {required && "*"}
      </span>
      <input
        type={type}
        required={required}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="border border-line bg-transparent px-4 py-3 text-sm text-foreground placeholder:text-muted focus:border-foreground focus:outline-none"
      />
    </label>
  );
}

export function GoogleButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="mt-6 flex w-full items-center justify-center gap-3 border border-line px-6 py-3.5 text-sm font-medium text-foreground transition-colors hover:border-foreground"
    >
      <GoogleIcon />
      Continue with Google
    </button>
  );
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4">
      <path
        fill="#4285F4"
        d="M23.52 12.27c0-.85-.08-1.67-.22-2.45H12v4.64h6.47c-.28 1.5-1.13 2.77-2.4 3.63v3.02h3.89c2.27-2.09 3.58-5.17 3.58-8.84Z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.96-1.08 7.95-2.92l-3.89-3.02c-1.08.72-2.45 1.15-4.06 1.15-3.12 0-5.77-2.11-6.71-4.94H1.28v3.11A12 12 0 0 0 12 24Z"
      />
      <path
        fill="#FBBC05"
        d="M5.29 14.27a7.2 7.2 0 0 1 0-4.54V6.62H1.28a12 12 0 0 0 0 10.76l4.01-3.11Z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.45-3.45C17.95 1.19 15.24 0 12 0A12 12 0 0 0 1.28 6.62l4.01 3.11C6.23 6.9 8.88 4.75 12 4.75Z"
      />
    </svg>
  );
}
