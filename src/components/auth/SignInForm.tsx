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

  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center px-6 py-20">
      <h1 className="font-display text-2xl font-bold text-foreground">
        Sign in
      </h1>

      <form onSubmit={handleLogIn} className="mt-6 flex flex-col gap-5">
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

