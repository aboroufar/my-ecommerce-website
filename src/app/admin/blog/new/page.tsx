import { createAdminClient } from "@/lib/supabase/admin";
import { createPost } from "@/lib/actions/blog";
import { PostForm } from "@/components/admin/PostForm";

export default async function NewPostPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const supabase = createAdminClient();
  const [{ data: categories }, { data: tags }] = await Promise.all([
    supabase.from("blog_categories").select("id, name").order("name", { ascending: true }),
    supabase.from("tags").select("id, name").order("name", { ascending: true }),
  ]);

  return (
    <div>
      <h1 className="font-display text-2xl text-foreground">New post</h1>
      <PostForm
        action={createPost}
        error={error}
        submitLabel="Create post"
        categories={categories ?? []}
        tags={tags ?? []}
      />
    </div>
  );
}
