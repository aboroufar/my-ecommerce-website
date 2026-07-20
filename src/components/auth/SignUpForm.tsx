"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/client";
import { GoogleButton } from "./SignInForm";

export function SignUpForm() {
  const t = useTranslations("signUpForm");
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "sent">("idle");
  const [error, setError] = useState<string | null>(null);

  // Surfaces OAuth failures redirected back from /auth/callback (e.g. the
  // user cancelled the Google consent screen) -- otherwise silently
  // discarded, and "Continue with Google" just looked like it did nothing.
  useEffect(() => {
    const oauthError = searchParams.get("error");
    if (oauthError) {
      setError(oauthError);
      const url = new URL(window.location.href);
      url.searchParams.delete("error");
      window.history.replaceState({}, "", url);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run once on
    // mount only; re-reading searchParams on every render would fight the
    // replaceState cleanup above.
  }, []);

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
        {t("title")}
      </h1>

      <GoogleButton onClick={handleGoogleSignIn} />

      <div className="my-6 flex items-center gap-4 text-xs uppercase tracking-wide text-muted">
        <span className="h-px flex-1 bg-line" />
        {t("or")}
        <span className="h-px flex-1 bg-line" />
      </div>

      {status === "sent" ? (
        <p className="text-sm text-foreground">
          {t("checkEmail")}
        </p>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <label className="flex flex-col gap-2">
            <span className="text-xs font-medium uppercase tracking-wide text-foreground">
              {t("email")}
            </span>
            <input
              type="email"
              required
              placeholder={t("emailPlaceholder")}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="border border-line bg-transparent px-4 py-3 text-sm text-foreground placeholder:text-muted focus:border-foreground focus:outline-none focus:ring-2 focus:ring-accent/40"
            />
          </label>
          <label className="flex flex-col gap-2">
            <span className="text-xs font-medium uppercase tracking-wide text-foreground">
              {t("password")}
            </span>
            <input
              type="password"
              required
              minLength={6}
              placeholder={t("passwordPlaceholder")}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="border border-line bg-transparent px-4 py-3 text-sm text-foreground placeholder:text-muted focus:border-foreground focus:outline-none focus:ring-2 focus:ring-accent/40"
            />
          </label>

          {error && <p className="text-sm text-red-700">{error}</p>}

          <button
            type="submit"
            disabled={status === "loading"}
            className="bg-foreground px-6 py-3.5 text-sm font-medium uppercase tracking-wide text-background transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {status === "loading" ? t("creating") : t("createAccount")}
          </button>
        </form>
      )}

      <p className="mt-6 text-xs text-muted">
        {t("alreadyHaveAccount")}{" "}
        <Link
          href="/account"
          className="text-foreground underline underline-offset-4"
        >
          {t("signIn")}
        </Link>
        .
      </p>
    </main>
  );
}
