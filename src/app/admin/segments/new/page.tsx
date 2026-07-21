import { createSegment } from "@/lib/actions/segments";

export default async function NewSegmentPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <div>
      <h1 className="font-display text-2xl text-foreground">Create segment</h1>
      <p className="mt-2 max-w-lg text-sm text-muted">
        A segment matches customers by one condition -- pick the field,
        comparison, and value.
      </p>

      {error && (
        <p className="mt-6 max-w-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      <form
        action={createSegment}
        className="mt-8 flex max-w-md flex-col gap-4 border border-line bg-surface p-5"
      >
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-medium uppercase tracking-wide text-muted">Name</span>
          <input
            name="name"
            required
            placeholder="e.g. VIP customers"
            className="border border-line bg-background px-3 py-2 text-sm"
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-medium uppercase tracking-wide text-muted">Field</span>
          <select
            name="field"
            defaultValue="order_count"
            className="border border-line bg-background px-3 py-2 text-sm"
          >
            <option value="order_count">Order count</option>
            <option value="email_subscribed">Email subscribed</option>
            <option value="created_at">Joined date</option>
          </select>
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-medium uppercase tracking-wide text-muted">
            Comparison
          </span>
          <select
            name="operator"
            defaultValue="gte"
            className="border border-line bg-background px-3 py-2 text-sm"
          >
            <option value="gte">is at least (≥)</option>
            <option value="gt">is more than (&gt;)</option>
            <option value="lt">is less than (&lt;)</option>
            <option value="eq">is exactly</option>
          </select>
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-medium uppercase tracking-wide text-muted">Value</span>
          <input
            name="value"
            required
            placeholder="e.g. 1, true/false, or a date"
            className="border border-line bg-background px-3 py-2 text-sm"
          />
          <span className="text-xs text-muted">
            For &quot;Email subscribed&quot; use true or false. For
            &quot;Joined date&quot; use YYYY-MM-DD.
          </span>
        </label>

        <div className="flex gap-2 pt-1">
          <button
            type="submit"
            className="bg-accent px-4 py-2 text-xs font-medium uppercase tracking-wide text-background transition-opacity hover:opacity-90"
          >
            Create segment
          </button>
        </div>
      </form>
    </div>
  );
}
