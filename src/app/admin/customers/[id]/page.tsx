import Link from "next/link";
import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatPrice } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function AdminCustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = createAdminClient();

  const { data: customer } = await supabase
    .from("customers")
    .select("id, email, name, created_at")
    .eq("id", id)
    .single();

  if (!customer) notFound();

  const [{ data: orders }, { data: addresses }] = await Promise.all([
    supabase
      .from("orders")
      .select("id, status, total_cents, currency, created_at")
      .eq("customer_id", id)
      .order("created_at", { ascending: false }),
    supabase
      .from("addresses")
      .select("id, line1, line2, city, region, postal_code, country, is_default")
      .eq("customer_id", id),
  ]);

  return (
    <div>
      <Link
        href="/admin/customers"
        className="text-xs uppercase tracking-[0.15em] text-muted transition-colors hover:text-foreground"
      >
        ← Customers
      </Link>

      <h1 className="mt-4 font-display text-2xl text-foreground">
        {customer.email}
      </h1>
      <p className="mt-1 text-sm text-muted">
        {customer.name && `${customer.name} · `}
        Joined {new Date(customer.created_at).toLocaleDateString()}
      </p>

      <div className="mt-8">
        <h2 className="text-xs font-medium uppercase tracking-wide text-muted">
          Orders
        </h2>
        {!orders || orders.length === 0 ? (
          <p className="mt-3 text-sm text-muted">No orders yet.</p>
        ) : (
          <ul className="mt-3 divide-y divide-line">
            {orders.map((order) => (
              <li
                key={order.id}
                className="flex items-center justify-between py-3 text-sm"
              >
                <div>
                  <Link
                    href={`/admin/orders/${order.id}`}
                    className="text-foreground hover:underline"
                  >
                    Order #{order.id.slice(0, 8)}
                  </Link>
                  <p className="mt-1 text-xs text-muted">
                    {new Date(order.created_at).toLocaleDateString()} ·{" "}
                    <span className="capitalize">{order.status}</span>
                  </p>
                </div>
                <span className="text-foreground">
                  {formatPrice(order.total_cents, order.currency)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="mt-8">
        <h2 className="text-xs font-medium uppercase tracking-wide text-muted">
          Saved addresses
        </h2>
        {!addresses || addresses.length === 0 ? (
          <p className="mt-3 text-sm text-muted">No saved addresses.</p>
        ) : (
          <ul className="mt-3 space-y-4">
            {addresses.map((address) => (
              <li key={address.id} className="text-sm text-foreground">
                {address.line1}
                {address.line2 ? `, ${address.line2}` : ""}
                <br />
                {address.city}
                {address.region ? `, ${address.region}` : ""}{" "}
                {address.postal_code}
                <br />
                {address.country}
                {address.is_default && (
                  <span className="ml-2 text-xs text-muted">(default)</span>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
