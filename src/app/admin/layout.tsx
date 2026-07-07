import Link from "next/link";
import { getSessionUser, isAdminEmail } from "@/lib/auth";
import { MagicLinkForm } from "@/components/auth/MagicLinkForm";
import { SignOutButton } from "@/components/auth/SignOutButton";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getSessionUser();

  if (!user) {
    return (
      <MagicLinkForm
        next="/admin"
        heading="Admin sign in"
        description="Enter your email and we'll send a one-time sign-in link. No password needed."
      />
    );
  }

  if (!isAdminEmail(user.email)) {
    return (
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
    );
  }

  return (
    <div className="mx-auto w-full max-w-5xl flex-1 px-6 py-10">
      <div className="mb-8 flex items-center justify-between border-b border-line pb-4">
        <nav className="flex items-center gap-6">
          <Link href="/admin/products" className="font-display text-lg text-foreground">
            Admin
          </Link>
          <Link
            href="/admin/products"
            className="text-sm text-muted transition-colors hover:text-foreground"
          >
            Products
          </Link>
        </nav>
        <div className="flex items-center gap-4 text-xs text-muted">
          <span>{user.email}</span>
          <SignOutButton redirectTo="/admin" />
        </div>
      </div>
      {children}
    </div>
  );
}
