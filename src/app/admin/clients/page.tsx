import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatPrice } from "@/lib/format";
import { getClientFacts, getMatchingClients, type Segment } from "@/lib/segments";
import { ClientSegmentFilter } from "@/components/admin/ClientSegmentFilter";
import { deleteClientAccount } from "@/lib/actions/clients";

export const dynamic = "force-dynamic";

export default async function AdminClientsPage({
  searchParams,
}: {
  searchParams: Promise<{ segment?: string }>;
}) {
  const { segment: segmentId } = await searchParams;
  const supabase = createAdminClient();

  const [{ data: clients }, { data: orders }, { data: segments }] = await Promise.all([
    supabase
      .from("clients")
      .select("id, email, name, created_at")
      .order("created_at", { ascending: false }),
    // Only paid+ orders count toward "total spent" -- a pending/cancelled
    // order was never actually charged.
    supabase
      .from("orders")
      .select("client_id, total_cents, currency, status")
      .not("client_id", "is", null)
      .in("status", ["paid", "fulfilled", "refunded"]),
    supabase
      .from("client_segments")
      .select("id, name, condition_type, conditions, created_at")
      .order("name", { ascending: true }),
  ]);

  const statsByClient = new Map<
    string,
    { orderCount: number; totalCents: number; currency: string }
  >();
  for (const order of orders ?? []) {
    if (!order.client_id) continue;
    const existing = statsByClient.get(order.client_id) ?? {
      orderCount: 0,
      totalCents: 0,
      currency: order.currency,
    };
    existing.orderCount += 1;
    existing.totalCents += order.total_cents;
    statsByClient.set(order.client_id, existing);
  }

  const activeSegment = (segments ?? []).find((s) => s.id === segmentId) as
    | Segment
    | undefined;

  let visibleClients = clients ?? [];
  if (activeSegment) {
    const facts = await getClientFacts(supabase);
    const matchingIds = new Set(getMatchingClients(facts, activeSegment).map((c) => c.id));
    visibleClients = visibleClients.filter((c) => matchingIds.has(c.id));
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl text-foreground">Clients</h1>
        <div className="flex items-center gap-4">
          <ClientSegmentFilter segments={segments ?? []} activeSegmentId={segmentId} />
          <Link
            href="/admin/clients/new"
            className="bg-accent px-4 py-2 text-sm font-medium text-background transition-opacity hover:opacity-90"
          >
            Add client
          </Link>
        </div>
      </div>

      {activeSegment && (
        <p className="mt-2 text-sm text-muted">
          Showing clients in <span className="font-medium text-foreground">{activeSegment.name}</span>{" "}
          ({visibleClients.length} of {clients?.length ?? 0}) --{" "}
          <Link href="/admin/clients" className="underline underline-offset-4 hover:text-foreground">
            clear filter
          </Link>
        </p>
      )}

      {!visibleClients || visibleClients.length === 0 ? (
        <p className="mt-10 text-sm text-muted">
          {activeSegment ? "No clients match this segment." : "No clients yet."}
        </p>
      ) : (
        <table className="mt-8 w-full text-left text-sm">
          <thead className="border-b border-line text-xs uppercase tracking-wide text-muted">
            <tr>
              <th className="py-2 font-medium">Email</th>
              <th className="py-2 font-medium">Joined</th>
              <th className="py-2 font-medium">Orders</th>
              <th className="py-2 font-medium">Total spent</th>
              <th className="py-2" />
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {visibleClients.map((client) => {
              const stats = statsByClient.get(client.id);
              return (
                <tr key={client.id}>
                  <td className="py-3 text-foreground">
                    {client.email}
                    {client.name && (
                      <span className="ml-2 text-muted">{client.name}</span>
                    )}
                  </td>
                  <td className="py-3 text-muted">
                    {new Date(client.created_at).toLocaleDateString()}
                  </td>
                  <td className="py-3 text-foreground">
                    {stats?.orderCount ?? 0}
                  </td>
                  <td className="py-3 text-foreground">
                    {stats
                      ? formatPrice(stats.totalCents, stats.currency)
                      : "—"}
                  </td>
                  <td className="py-3 text-right">
                    <div className="flex items-center justify-end gap-3">
                      <Link
                        href={`/admin/clients/${client.id}`}
                        className="text-accent underline underline-offset-4"
                      >
                        View
                      </Link>
                      <Link
                        href={`/admin/clients/${client.id}/edit`}
                        className="text-foreground underline underline-offset-4"
                      >
                        Edit
                      </Link>
                      <form action={deleteClientAccount.bind(null, client.id)}>
                        <button
                          type="submit"
                          className="text-red-700 underline underline-offset-4 hover:text-red-800"
                        >
                          Delete
                        </button>
                      </form>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}
