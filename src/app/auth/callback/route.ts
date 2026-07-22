import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/admin";

  // Google/Supabase report a cancelled or failed OAuth attempt via
  // "?error=" (+ "?error_description=") instead of "?code=" -- e.g. the
  // user closes the consent screen, or denies access. Without this check
  // that case fell through silently to the same redirect as a missing
  // code, discarding the actual reason. Redirecting to `next` (not a fixed
  // page) rather than always to /admin keeps the customer-facing Google
  // sign-in (SignInForm/SignUpForm, both pass next=/account) landing back
  // where the user started, with the error visible via ?error=.
  const oauthError = searchParams.get("error_description") ?? searchParams.get("error");
  if (oauthError) {
    const redirectUrl = new URL(`${origin}${next}`);
    redirectUrl.searchParams.set("error", oauthError);
    return NextResponse.redirect(redirectUrl);
  }

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      // Nudge a customer with an incomplete profile (date_of_birth/gender
      // still null -- the case for every brand-new signup, since sign-up
      // is email-only now with no other fields collected) to
      // /account/complete-profile once, right after login. Scoped to
      // `next` starting with /account so this never fires for the admin
      // sign-in flow (next=/admin), which has no such concept. Skippable
      // (the page itself links back to /account), not a hard gate.
      if (next.startsWith("/account") && !next.startsWith("/account/complete-profile") && data.user) {
        const { data: client } = await supabase
          .from("clients")
          .select("date_of_birth, gender")
          .eq("id", data.user.id)
          .single();
        if (client && !client.date_of_birth && !client.gender) {
          return NextResponse.redirect(`${origin}/account/complete-profile`);
        }
      }
      return NextResponse.redirect(`${origin}${next}`);
    }
    const redirectUrl = new URL(`${origin}${next}`);
    redirectUrl.searchParams.set("error", error.message);
    return NextResponse.redirect(redirectUrl);
  }

  // No code and no explicit OAuth error -- just send back to the intended
  // destination, which will show its own sign-in form since there's no
  // valid session.
  return NextResponse.redirect(`${origin}${next}`);
}
