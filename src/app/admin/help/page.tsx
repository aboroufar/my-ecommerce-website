import { createAdminClient } from "@/lib/supabase/admin";
import { HelpManager } from "@/components/admin/HelpManager";

export const dynamic = "force-dynamic";

export default async function AdminHelpPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const supabase = createAdminClient();
  const [{ data: categories }, { data: topics }] = await Promise.all([
    supabase
      .from("help_categories")
      .select("id, title, description, icon, sort_order")
      .order("sort_order", { ascending: true }),
    supabase
      .from("help_topics")
      .select("id, category_id, title, body_html, sort_order")
      .order("sort_order", { ascending: true }),
  ]);

  const categoriesWithTopics = (categories ?? []).map((category) => ({
    ...category,
    topics: (topics ?? []).filter((topic) => topic.category_id === category.id),
  }));

  return (
    <div>
      <h1 className="font-display text-2xl text-foreground">Help Center</h1>
      <p className="mt-2 max-w-lg text-sm text-muted">
        Manage the category groups and topics shown on the public{" "}
        <span className="text-foreground">/help</span> page. Turn the page on
        or off from{" "}
        <a href="/admin/settings" className="text-accent underline underline-offset-4 hover:opacity-80">
          Settings
        </a>
        .
      </p>

      {error && (
        <p className="mt-6 max-w-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      <div className="mt-8">
        <HelpManager categories={categoriesWithTopics} />
      </div>
    </div>
  );
}
