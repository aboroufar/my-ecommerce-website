"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function AccountLink() {
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
    <Link href="/account" className="transition-colors hover:text-foreground">
      {signedIn ? "Account" : "Sign in"}
    </Link>
  );
}
