import { getSiteContent } from "@/lib/content";
import { updateSiteContent } from "@/lib/actions/content";

export const dynamic = "force-dynamic";

export default async function AdminContentPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; saved?: string }>;
}) {
  const { error, saved } = await searchParams;
  const content = await getSiteContent();

  return (
    <div>
      <h1 className="font-display text-2xl text-foreground">
        Homepage content
      </h1>
      <p className="mt-2 max-w-lg text-sm text-muted">
        Edit the footer text shown on every page. Changes go live
        immediately.
      </p>

      {error && (
        <p className="mt-6 max-w-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}
      {saved && (
        <p className="mt-6 max-w-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
          Saved.
        </p>
      )}

      <form action={updateSiteContent} className="mt-8 max-w-lg space-y-10">
        <fieldset className="space-y-4">
          <legend className="text-xs font-medium uppercase tracking-wide text-muted">
            Footer
          </legend>
          <label className="flex flex-col gap-1.5">
            <span className="text-xs text-muted">About text</span>
            <textarea
              name="footer.about_text"
              defaultValue={content["footer.about_text"]}
              required
              rows={3}
              className="border border-line bg-transparent px-3 py-2 text-sm"
            />
          </label>
        </fieldset>

        <button
          type="submit"
          className="bg-accent px-6 py-2.5 text-sm font-medium text-background transition-opacity hover:opacity-90"
        >
          Save changes
        </button>
      </form>
    </div>
  );
}
