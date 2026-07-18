"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function AccountLink() {
  const t = useTranslations("account");
  // null = not yet known (first paint before hydration/auth check resolves).
  // Rendering "Sign in" as the default avoids a layout-shift-causing blank
  // state and is the more common case anyway.
  const [signedIn, setSignedIn] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => setSignedIn(!!data.user));

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSignedIn(!!session?.user);
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <Link
      href="/account"
      aria-label={signedIn ? t("account") : t("signIn")}
      className="flex items-center gap-1.5 text-foreground transition-opacity hover:opacity-70"
    >
      <PersonIcon />
    </Link>
  );
}

function PersonIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className="h-5 w-5">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c0-4 3.5-7 8-7s8 3 8 7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
