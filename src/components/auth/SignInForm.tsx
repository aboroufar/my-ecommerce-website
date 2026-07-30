"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/client";

export function SignInForm({
  next = "/account",
  googleSigninEnabled = true,
}: {
  next?: string;
  googleSigninEnabled?: boolean;
}) {
  const t = useTranslations("signInForm");
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  // Surfaces OAuth failures redirected back from /auth/callback (e.g. the
  // user cancelled the Google consent screen, or the exchange failed) --
  // without this, that error was silently discarded and the page just
  // looked like the "Continue with Google" button did nothing.
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
        {t("title")}
      </h1>

      {googleSigninEnabled && (
        <>
          <GoogleButton onClick={handleGoogleSignIn} />
          <div className="my-6 flex items-center gap-4 text-xs uppercase tracking-wide text-muted">
            <span className="h-px flex-1 bg-line" />
            {t("or")}
            <span className="h-px flex-1 bg-line" />
          </div>
        </>
      )}

      {error && <p className="mt-4 text-sm text-red-700">{error}</p>}

      <Link
        href="/auth/magic-link"
        className={`flex w-full items-center justify-center border border-line px-6 py-3.5 text-sm font-medium uppercase tracking-wide text-foreground transition-colors hover:border-foreground ${
          googleSigninEnabled ? "" : "mt-6"
        }`}
      >
        {t("emailMeLink")}
      </Link>
    </main>
  );
}

export function GoogleButton({ onClick }: { onClick: () => void }) {
  const t = useTranslations("signInForm");
  return (
    <button
      type="button"
      onClick={onClick}
      className="mt-6 flex w-full items-center justify-center gap-3 border border-line px-6 py-3.5 text-sm font-medium text-foreground transition-colors hover:border-foreground"
    >
      <GoogleIcon />
      {t("continueWithGoogle")}
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

