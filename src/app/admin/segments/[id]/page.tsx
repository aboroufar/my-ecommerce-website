import { notFound } from "next/navigation";
import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCustomerFacts, getMatchingCustomers, type Segment } from "@/lib/segments";
import { deleteSegment } from "@/lib/actions/segments";

export const dynamic = "force-dynamic";

export default async function SegmentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = createAdminClient();

  const [{ data: segmentRow }, customers] = await Promise.all([
    supabase
      .from("customer_segments")
      .select("id, name, condition_type, conditions, created_at")
      .eq("id", id)
      .single(),
    getCustomerFacts(supabase),
  ]);

  if (!segmentRow) notFound();

  const segment = segmentRow as unknown as Segment;
  const matching = getMatchingCustomers(customers, segment);

  return (
    <div>
      <Link href="/admin/segments" className="text-sm text-muted hover:text-foreground">
        ← Segments
      </Link>

      <div className="mt-2 flex items-center justify-between">
        <h1 className="font-display text-2xl text-foreground">{segment.name}</h1>
        <form action={deleteSegment.bind(null, segment.id)}>
          <button
            type="submit"
            className="text-sm text-red-700 underline underline-offset-4 hover:text-red-800"
          >
            Delete segment
          </button>
        </form>
      </div>

      <p className="mt-2 text-sm text-muted">
        {matching.length} matching customer{matching.length === 1 ? "" : "s"}
      </p>

      {segment.condition_type === "abandoned_checkout" && (
        <p className="mt-4 max-w-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          This segment has no matches yet -- abandoned checkouts aren&apos;t
          tracked server-side in this store, so this segment is a
          placeholder until that data exists.
        </p>
      )}

      {matching.length === 0 ? (
        <p className="mt-8 text-sm text-muted">No customers match this segment yet.</p>
      ) : (
        <table className="mt-8 w-full text-left text-sm">
          <thead className="border-b border-line text-xs uppercase tracking-wide text-muted">
            <tr>
              <th className="py-2 font-medium">Email</th>
              <th className="py-2 font-medium">Joined</th>
              <th className="py-2" />
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {matching.map((customer) => (
              <tr key={customer.id}>
                <td className="py-3 text-foreground">
                  {customer.email}
                  {customer.name && <span className="ml-2 text-muted">{customer.name}</span>}
                </td>
                <td className="py-3 text-muted">
                  {new Date(customer.created_at).toLocaleDateString()}
                </td>
                <td className="py-3 text-right">
                  <Link
                    href={`/admin/customers/${customer.id}`}
                    className="text-accent underline underline-offset-4"
                  >
                    View
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
