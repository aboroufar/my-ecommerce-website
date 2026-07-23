import Link from "next/link";
import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatPrice } from "@/lib/format";
import { deleteClientAccount } from "@/lib/actions/clients";
import { getClientFacts } from "@/lib/segments";
import { ClientTagChecklist } from "@/components/admin/ClientTagChecklist";
import { ClientNoteForm } from "@/components/admin/ClientNoteForm";

export const dynamic = "force-dynamic";

/**
 * A lightweight stand-in for Shopify's RFM (Recency/Frequency/Monetary)
 * segmentation -- not a real scoring model, just order_count/total_spent
 * bucketed into the same tier names Shopify's UI uses, computed from
 * ClientFacts (already fetched for the Segments feature) rather than a
 * new query.
 */
function rfmTier(orderCount: number, totalSpentCents: number): string {
  if (orderCount === 0) return "Prospect";
  if (orderCount === 1) return "New customer";
  if (orderCount >= 5 || totalSpentCents >= 50000) return "Champion";
  return "Repeat customer";
}

export default async function AdminClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = createAdminClient();

  const { data: client } = await supabase
    .from("clients")
    .select(
      "id, email, name, phone, created_at, sms_marketing_consent, whatsapp_marketing_consent"
    )
    .eq("id", id)
    .single();

  if (!client) notFound();

  const [
    { data: orders },
    { data: addresses },
    { data: subscriber },
    { data: allTags },
    { data: tagLinks },
    { data: notes },
    [facts],
  ] = await Promise.all([
    supabase
      .from("orders")
      .select("id, status, total_cents, currency, created_at")
      .eq("client_id", id)
      .order("created_at", { ascending: false }),
    supabase
      .from("addresses")
      .select("id, line1, line2, city, region, postal_code, country, is_default")
      .eq("client_id", id),
    supabase
      .from("newsletter_subscribers")
      .select("email")
      .eq("email", client.email.toLowerCase())
      .maybeSingle(),
    supabase.from("client_tags").select("id, name").order("name", { ascending: true }),
    supabase.from("client_tag_links").select("tag_id").eq("client_id", id),
    supabase
      .from("client_notes")
      .select("id, body, created_at")
      .eq("client_id", id)
      .order("created_at", { ascending: false }),
    getClientFacts(supabase, [id]),
  ]);

  const orderCount = facts?.order_count ?? 0;
  const totalSpentCents = facts?.total_spent_cents ?? 0;
  const lastOrder = orders?.[0];
  const currency = lastOrder?.currency ?? "eur";

  const timelineEvents = [
    ...(notes ?? []).map((n) => ({
      id: n.id,
      kind: "note" as const,
      body: n.body,
      created_at: n.created_at,
    })),
    {
      id: "created",
      kind: "system" as const,
      body: "You created this client.",
      created_at: client.created_at,
    },
  ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  return (
    <div>
      <Link
        href="/admin/clients"
        className="text-xs uppercase tracking-[0.15em] text-muted transition-colors hover:text-foreground"
      >
        ← Clients
      </Link>

      <div className="mt-4 flex items-center justify-between">
        <h1 className="font-display text-2xl text-foreground">
          {client.name || client.email}
        </h1>
        <div className="flex items-center gap-4">
          <Link
            href={`/admin/clients/${client.id}/edit`}
            className="text-sm text-foreground underline underline-offset-4 hover:text-accent"
          >
            Edit
          </Link>
          <form action={deleteClientAccount.bind(null, client.id)}>
            <button
              type="submit"
              className="text-sm text-red-700 underline underline-offset-4 hover:text-red-800"
            >
              Delete
            </button>
          </form>
        </div>
      </div>

      {/* Stat cards */}
      <div className="mt-6 grid grid-cols-2 gap-px border border-line bg-line sm:grid-cols-4">
        <div className="bg-background p-4">
          <p className="text-xs uppercase tracking-wide text-muted">Amount spent</p>
          <p className="mt-1 text-lg text-foreground">{formatPrice(totalSpentCents, currency, "en")}</p>
        </div>
        <div className="bg-background p-4">
          <p className="text-xs uppercase tracking-wide text-muted">Orders</p>
          <p className="mt-1 text-lg text-foreground">{orderCount}</p>
        </div>
        <div className="bg-background p-4">
          <p className="text-xs uppercase tracking-wide text-muted">Client since</p>
          <p className="mt-1 text-lg text-foreground">
            {new Date(client.created_at).toLocaleDateString()}
          </p>
        </div>
        <div className="bg-background p-4">
          <p className="text-xs uppercase tracking-wide text-muted">RFM group</p>
          <p className="mt-1 text-lg text-foreground">{rfmTier(orderCount, totalSpentCents)}</p>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Main column */}
        <div className="flex flex-col gap-8 lg:col-span-2">
          <div>
            <h2 className="text-xs font-medium uppercase tracking-wide text-muted">
              Last order placed
            </h2>
            {!lastOrder ? (
              <p className="mt-3 text-sm text-muted">This client hasn&apos;t placed any orders yet.</p>
            ) : (
              <Link
                href={`/admin/orders/${lastOrder.id}`}
                className="mt-3 flex items-center justify-between border border-line p-3 text-sm hover:border-foreground"
              >
                <div>
                  <span className="text-foreground">Order #{lastOrder.id.slice(0, 8)}</span>
                  <p className="mt-1 text-xs text-muted">
                    {new Date(lastOrder.created_at).toLocaleDateString()} ·{" "}
                    <span className="capitalize">{lastOrder.status}</span>
                  </p>
                </div>
                <span className="text-foreground">
                  {formatPrice(lastOrder.total_cents, lastOrder.currency, "en")}
                </span>
              </Link>
            )}
          </div>

          <div>
            <h2 className="text-xs font-medium uppercase tracking-wide text-muted">
              All orders
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
                      {formatPrice(order.total_cents, order.currency, "en")}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div>
            <h2 className="text-xs font-medium uppercase tracking-wide text-muted">
              Timeline
            </h2>
            <div className="mt-3">
              <ClientNoteForm clientId={client.id} />
              <ul className="mt-4 flex flex-col gap-4">
                {timelineEvents.map((event) => (
                  <li key={event.id} className="border-l-2 border-line pl-4 text-sm">
                    <p className="text-foreground">{event.body}</p>
                    <p className="mt-0.5 text-xs text-muted">
                      {new Date(event.created_at).toLocaleString()}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="flex flex-col gap-6">
          <div className="border border-line p-4">
            <h2 className="text-xs font-medium uppercase tracking-wide text-muted">
              Contact information
            </h2>
            <p className="mt-3 text-sm text-foreground">{client.email}</p>
            {client.phone && <p className="mt-1 text-sm text-foreground">{client.phone}</p>}
          </div>

          <div className="border border-line p-4">
            <h2 className="text-xs font-medium uppercase tracking-wide text-muted">
              Default address
            </h2>
            {(() => {
              const defaultAddress = addresses?.find((a) => a.is_default) ?? addresses?.[0];
              if (!defaultAddress) {
                return <p className="mt-3 text-sm text-muted">No saved addresses.</p>;
              }
              return (
                <p className="mt-3 text-sm text-foreground">
                  {defaultAddress.line1}
                  {defaultAddress.line2 ? `, ${defaultAddress.line2}` : ""}
                  <br />
                  {defaultAddress.city}
                  {defaultAddress.region ? `, ${defaultAddress.region}` : ""}{" "}
                  {defaultAddress.postal_code}
                  <br />
                  {defaultAddress.country}
                </p>
              );
            })()}
          </div>

          <div className="border border-line p-4">
            <h2 className="text-xs font-medium uppercase tracking-wide text-muted">
              Marketing subscriptions
            </h2>
            <ul className="mt-3 flex flex-col gap-1 text-sm text-foreground">
              <li>Email: {subscriber ? "Subscribed" : "Not subscribed"}</li>
              <li>SMS: {client.sms_marketing_consent ? "Subscribed" : "Not subscribed"}</li>
              <li>WhatsApp: {client.whatsapp_marketing_consent ? "Subscribed" : "Not subscribed"}</li>
            </ul>
          </div>

          <div className="border border-line p-4">
            <h2 className="text-xs font-medium uppercase tracking-wide text-muted">Tags</h2>
            <div className="mt-3">
              <ClientTagChecklist
                clientId={client.id}
                tags={allTags ?? []}
                selectedIds={(tagLinks ?? []).map((l) => l.tag_id)}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
