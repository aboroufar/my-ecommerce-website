import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { getClientFacts, getMatchingClients, type Segment } from "@/lib/segments";
import { SegmentsTable } from "@/components/admin/SegmentsTable";

export const dynamic = "force-dynamic";

export default async function AdminSegmentsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const supabase = createAdminClient();

  const [{ data: segments }, clients] = await Promise.all([
    supabase
      .from("client_segments")
      .select("id, name, condition_type, conditions, created_at")
      .order("created_at", { ascending: true }),
    getClientFacts(supabase),
  ]);

  const totalClients = clients.length;
  const rows = (segments ?? []).map((s) => {
    const segment = s as unknown as Segment;
    const matching = getMatchingClients(clients, segment);
    return {
      id: segment.id,
      name: segment.name,
      created_at: segment.created_at,
      matchCount: matching.length,
      percentOfClients:
        totalClients === 0 ? 0 : Math.round((matching.length / totalClients) * 100),
    };
  });

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl text-foreground">Segments</h1>
        <Link
          href="/admin/segments/new"
          className="bg-accent px-4 py-2 text-sm font-medium text-background transition-opacity hover:opacity-90"
        >
          Create segment
        </Link>
      </div>

      <p className="mt-2 max-w-lg text-sm text-muted">
        A segment is a saved query that matches a set of clients based on
        their order history and account data. Click a segment to see its
        matching clients.
      </p>

      {error && (
        <p className="mt-6 max-w-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      <div className="mt-8">
        {rows.length === 0 ? (
          <p className="text-sm text-muted">No segments yet.</p>
        ) : (
          <SegmentsTable segments={rows} />
        )}
      </div>
    </div>
  );
}
