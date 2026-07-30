import type { Metadata } from "next";
import { Figtree } from "next/font/google";
import "../globals.css";
import { getSessionUser, isAdminEmail, getAdminRole } from "@/lib/auth";
import { MagicLinkForm } from "@/components/auth/MagicLinkForm";
import { SignOutButton } from "@/components/auth/SignOutButton";
import { AdminSidebar } from "@/components/admin/AdminSidebar";

// /admin sits outside src/app/[locale] (unprefixed, English-only, per
// AGENTS.md) and there is no shared src/app/layout.tsx above it -- so it
// needs its own <html>/<body> and font loading, otherwise Next.js falls
// back to an unstyled shell (no globals.css, no Tailwind, no Figtree) and
// every className in this file and every admin page is a no-op. Mirrors
// src/app/[locale]/layout.tsx's setup, minus the locale/
// NextIntlClientProvider/CartProvider/WishlistProvider pieces that don't
// apply to admin.
const figtree = Figtree({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  variable: "--font-figtree",
});

export const metadata: Metadata = {
  title: "Admin — Storefront",
  description: "Store administration",
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getSessionUser();

  if (!user) {
    return (
      <html lang="en" className={`h-full antialiased ${figtree.variable}`}>
        <body className="min-h-full flex flex-col font-sans">
          <MagicLinkForm
            next="/admin"
            heading="Admin sign in"
            description="Enter your email and we'll send a one-time sign-in link. No password needed."
          />
        </body>
      </html>
    );
  }

  if (!(await isAdminEmail(user.email))) {
    return (
      <html lang="en" className={`h-full antialiased ${figtree.variable}`}>
        <body className="min-h-full flex flex-col font-sans">
          <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center px-6 py-20 text-center">
            <h1 className="font-display text-2xl text-foreground">
              Not authorized
            </h1>
            <p className="mt-2 text-sm text-muted">
              {user.email} isn&apos;t on the admin list for this store.
            </p>
            <div className="mt-6">
              <SignOutButton redirectTo="/admin" />
            </div>
          </main>
        </body>
      </html>
    );
  }

  const role = await getAdminRole(user.email);

  return (
    <html lang="en" className={`h-full antialiased ${figtree.variable}`}>
      {/* Shopify-style admin canvas: a light gray page background with
          white cards floating on top, distinct from the storefront's
          cream/white surfaces. Scoped to this subtree only (admin has its
          own <html>/<body>, no shared parent with [locale]) so it can't
          leak into customer-facing pages. */}
      <body className="min-h-full font-sans" style={{ backgroundColor: "#f1f1f1" }}>
        <div className="flex min-h-screen">
          <AdminSidebar userEmail={user.email ?? ""} role={role} />
          <div className="min-w-0 flex-1 overflow-y-auto">
            <div className="mx-auto w-full max-w-5xl px-6 py-8">{children}</div>
          </div>
        </div>
      </body>
    </html>
  );
}
