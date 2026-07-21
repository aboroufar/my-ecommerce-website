import { createAdminClient } from "@/lib/supabase/admin";
import { getClientFacts } from "@/lib/segments";
import { createSegment } from "@/lib/actions/segments";
import { SegmentQueryEditor } from "@/components/admin/SegmentQueryEditor";

export const dynamic = "force-dynamic";

const DEFAULT_QUERY_TEXT = `FROM clients
SHOW email, order_count
WHERE order_count >= 1`;

export default async function NewSegmentPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const supabase = createAdminClient();
  const clients = await getClientFacts(supabase);

  return (
    <div>
      <h1 className="font-display text-2xl text-foreground">Create segment</h1>
      <p className="mt-2 max-w-lg text-sm text-muted">
        Write a query to match clients by order history and account data.
        Results below update as you type.
      </p>

      {error && (
        <p className="mt-6 max-w-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      <div className="mt-8 max-w-2xl">
        <SegmentQueryEditor
          clients={clients}
          initialName=""
          initialQueryText={DEFAULT_QUERY_TEXT}
          action={createSegment}
        />
      </div>
    </div>
  );
}
