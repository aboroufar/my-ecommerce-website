import { getTranslations, getLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { getSessionUser } from "@/lib/auth";
import { SignInForm } from "@/components/auth/SignInForm";
import { SignOutButton } from "@/components/auth/SignOutButton";

export default async function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getSessionUser();

  if (!user) {
    return <SignInForm next="/account" />;
  }

  const [t, locale] = await Promise.all([
    getTranslations("account"),
    getLocale(),
  ]);

  return (
    <div className="mx-auto w-full max-w-3xl flex-1 px-6 py-10">
      <div className="mb-8 flex items-center justify-between border-b border-line pb-4">
        <nav className="flex items-center gap-6">
          <Link href="/account" className="font-display text-lg text-foreground">
            {t("account")}
          </Link>
          <Link
            href="/account/orders"
            className="text-sm text-muted transition-colors hover:text-foreground"
          >
            {t("orders")}
          </Link>
          <Link
            href="/account/addresses"
            className="text-sm text-muted transition-colors hover:text-foreground"
          >
            {t("addresses")}
          </Link>
          <Link
            href="/account/wishlist"
            className="text-sm text-muted transition-colors hover:text-foreground"
          >
            {t("wishlist")}
          </Link>
        </nav>
        <div className="flex items-center gap-4 text-xs text-muted">
          <span>{user.email}</span>
          <SignOutButton redirectTo={`/${locale}/account`} label={t("signOut")} />
        </div>
      </div>
      {children}
    </div>
  );
}
