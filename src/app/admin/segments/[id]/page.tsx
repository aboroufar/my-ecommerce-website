import { notFound } from "next/navigation";
import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { getClientFacts, type Segment } from "@/lib/segments";
import { serializeSegmentQuery } from "@/lib/segmentQuery";
import { updateSegment, deleteSegment } from "@/lib/actions/segments";
import { SegmentQueryEditor } from "@/components/admin/SegmentQueryEditor";

export const dynamic = "force-dynamic";

export default async function SegmentDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const { error } = await searchParams;
  const supabase = createAdminClient();

  const [{ data: segmentRow }, clients] = await Promise.all([
    supabase
      .from("client_segments")
      .select("id, name, condition_type, conditions, created_at, query_text")
      .eq("id", id)
      .single(),
    getClientFacts(supabase),
  ]);

  if (!segmentRow) notFound();

  const segment = segmentRow as unknown as Segment & { query_text: string | null };
  const queryText = segment.query_text ?? serializeSegmentQuery(segment.conditions);

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

      {error && (
        <p className="mt-6 max-w-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      <div className="mt-8 max-w-2xl">
        <SegmentQueryEditor
          clients={clients}
          initialName={segment.name}
          initialQueryText={queryText}
          action={updateSegment.bind(null, segment.id)}
        />
      </div>
    </div>
  );
}
