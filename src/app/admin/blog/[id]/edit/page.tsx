import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { updatePost, deletePost } from "@/lib/actions/blog";
import { PostForm } from "@/components/admin/PostForm";

export default async function EditPostPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const { error } = await searchParams;

  const supabase = createAdminClient();
  const [{ data: post }, { data: categories }, { data: tags }] = await Promise.all([
    supabase
      .from("blog_posts")
      .select(
        "id, title, slug, excerpt, cover_image_url, body_html, status, blog_post_categories(category_id), blog_post_tags(tag_id)"
      )
      .eq("id", id)
      .single(),
    supabase.from("blog_categories").select("id, name").order("name", { ascending: true }),
    supabase.from("tags").select("id, name").order("name", { ascending: true }),
  ]);

  if (!post) notFound();

  const categoryIds = post.blog_post_categories.map((pc) => pc.category_id);
  const tagIds = post.blog_post_tags.map((pt) => pt.tag_id);

  const updateWithId = updatePost.bind(null, id);
  const deleteWithId = deletePost.bind(null, id);

  return (
    <div>
      <h1 className="font-display text-2xl text-foreground">Edit post</h1>
      <PostForm
        action={updateWithId}
        error={error}
        submitLabel="Save changes"
        categories={categories ?? []}
        tags={tags ?? []}
        defaultValues={{
          title: post.title,
          slug: post.slug,
          excerpt: post.excerpt,
          cover_image_url: post.cover_image_url ?? "",
          body_html: post.body_html,
          status: post.status as "draft" | "published",
          categoryIds,
          tagIds,
        }}
        extraAction={
          <form action={deleteWithId}>
            <button
              type="submit"
              className="text-sm text-red-700 underline underline-offset-4 hover:text-red-800"
            >
              Delete post
            </button>
          </form>
        }
      />
    </div>
  );
}
