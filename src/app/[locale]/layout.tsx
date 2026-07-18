import type { Metadata } from "next";
import { Figtree } from "next/font/google";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { notFound } from "next/navigation";
import "../globals.css";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { CartProvider } from "@/components/CartProvider";
import { WishlistProvider } from "@/components/WishlistProvider";
import { routing } from "@/i18n/routing";

// Figtree is a geometric sans-serif close to Avenir Next (used site-wide,
// including headings, on douglas.it) -- one typeface everywhere instead
// of a serif/sans pairing, matching that reference site's uniform look.
const figtree = Figtree({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  variable: "--font-figtree",
});

export const metadata: Metadata = {
  title: "Storefront",
  description: "E-commerce site scaffold — Next.js + Tailwind + Vercel",
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function RootLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();

  return (
    <html lang={locale} className={`h-full antialiased ${figtree.variable}`}>
      <body className="min-h-full flex flex-col font-sans">
        <NextIntlClientProvider>
          <CartProvider>
            <WishlistProvider>
              <SiteHeader />
              <div className="flex flex-1 flex-col">{children}</div>
              <SiteFooter />
            </WishlistProvider>
          </CartProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
