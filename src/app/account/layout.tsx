import Link from "next/link";
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

  return (
    <div className="mx-auto w-full max-w-3xl flex-1 px-6 py-10">
      <div className="mb-8 flex items-center justify-between border-b border-line pb-4">
        <nav className="flex items-center gap-6">
          <Link href="/account" className="font-display text-lg text-foreground">
            Account
          </Link>
          <Link
            href="/account/orders"
            className="text-sm text-muted transition-colors hover:text-foreground"
          >
            Orders
          </Link>
          <Link
            href="/account/addresses"
            className="text-sm text-muted transition-colors hover:text-foreground"
          >
            Addresses
          </Link>
          <Link
            href="/account/wishlist"
            className="text-sm text-muted transition-colors hover:text-foreground"
          >
            Wishlist
          </Link>
        </nav>
        <div className="flex items-center gap-4 text-xs text-muted">
          <span>{user.email}</span>
          <SignOutButton redirectTo="/account" />
        </div>
      </div>
      {children}
    </div>
  );
}
