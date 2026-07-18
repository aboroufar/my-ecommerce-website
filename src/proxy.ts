import createMiddleware from "next-intl/middleware";
import type { NextRequest } from "next/server";
import { routing } from "@/i18n/routing";
import { updateSession } from "@/lib/supabase/middleware";

const handleLocale = createMiddleware(routing);

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Admin/API routes stay unprefixed and untouched by locale detection --
  // only the Supabase session refresh applies to them.
  if (pathname.startsWith("/admin") || pathname.startsWith("/api")) {
    return await updateSession(request);
  }

  const intlResponse = handleLocale(request);

  // A redirect/rewrite for locale resolution takes priority -- the
  // Supabase session cookie refresh isn't needed on a response that's
  // about to redirect anyway.
  if (intlResponse.headers.get("location") || intlResponse.headers.get("x-middleware-rewrite")) {
    return intlResponse;
  }

  const supabaseResponse = await updateSession(request);
  supabaseResponse.cookies.getAll().forEach((cookie) => {
    intlResponse.cookies.set(cookie.name, cookie.value, cookie);
  });
  return intlResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
