import Link from "next/link";
import { getSessionUser } from "@/lib/auth";

export default async function AccountOverviewPage() {
  const user = await getSessionUser();

  return (
    <div>
      <h1 className="font-display text-2xl text-foreground">Welcome back</h1>
      <p className="mt-2 text-sm text-muted">{user?.email}</p>

      <div className="mt-8 flex gap-4">
        <Link
          href="/account/orders"
          className="border border-line px-4 py-2 text-sm text-foreground transition-colors hover:border-foreground"
        >
          Order history
        </Link>
        <Link
          href="/account/addresses"
          className="border border-line px-4 py-2 text-sm text-foreground transition-colors hover:border-foreground"
        >
          Saved addresses
        </Link>
      </div>
    </div>
  );
}
