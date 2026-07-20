import type { Metadata } from "next";
import Link from "next/link";
import { Figtree } from "next/font/google";
import "../globals.css";
import { getSessionUser, isAdminEmail } from "@/lib/auth";
import { MagicLinkForm } from "@/components/auth/MagicLinkForm";
import { SignOutButton } from "@/components/auth/SignOutButton";

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

  return (
    <html lang="en" className={`h-full antialiased ${figtree.variable}`}>
      <body className="min-h-full flex flex-col font-sans">
        <div className="mx-auto w-full max-w-5xl flex-1 px-6 py-10">
          <div className="mb-8 flex flex-wrap items-center justify-between gap-y-3 border-b border-line pb-4">
            <nav className="flex flex-wrap items-center gap-x-6 gap-y-2">
              <Link href="/admin/products" className="font-display text-lg text-foreground">
                Admin
              </Link>
              <Link
                href="/admin/products"
                className="text-sm text-muted transition-colors hover:text-foreground"
              >
                Products
              </Link>
              <Link
                href="/admin/orders"
                className="text-sm text-muted transition-colors hover:text-foreground"
              >
                Orders
              </Link>
              <Link
                href="/admin/customers"
                className="text-sm text-muted transition-colors hover:text-foreground"
              >
                Customers
              </Link>
              <Link
                href="/admin/reviews"
                className="text-sm text-muted transition-colors hover:text-foreground"
              >
                Reviews
              </Link>
              <Link
                href="/admin/categories"
                className="text-sm text-muted transition-colors hover:text-foreground"
              >
                Categories
              </Link>
              <Link
                href="/admin/tags"
                className="text-sm text-muted transition-colors hover:text-foreground"
              >
                Tags
              </Link>
              <Link
                href="/admin/blog"
                className="text-sm text-muted transition-colors hover:text-foreground"
              >
                Blog
              </Link>
              <Link
                href="/admin/menu"
                className="text-sm text-muted transition-colors hover:text-foreground"
              >
                Menu
              </Link>
              <Link
                href="/admin/brands"
                className="text-sm text-muted transition-colors hover:text-foreground"
              >
                Brands
              </Link>
              <Link
                href="/admin/content"
                className="text-sm text-muted transition-colors hover:text-foreground"
              >
                Content
              </Link>
              <Link
                href="/admin/help"
                className="text-sm text-muted transition-colors hover:text-foreground"
              >
                Help
              </Link>
              <Link
                href="/admin/discounts"
                className="text-sm text-muted transition-colors hover:text-foreground"
              >
                Discounts
              </Link>
              <Link
                href="/admin/settings"
                className="text-sm text-muted transition-colors hover:text-foreground"
              >
                Settings
              </Link>
            </nav>
            <div className="flex items-center gap-4 text-xs text-muted">
              <span>{user.email}</span>
              <SignOutButton redirectTo="/admin" />
            </div>
          </div>
          {children}
        </div>
      </body>
    </html>
  );
}
