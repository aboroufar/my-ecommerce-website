"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAdminUser } from "@/lib/auth";

async function requireAdmin() {
  const user = await getAdminUser();
  if (!user) redirect("/admin");
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const postSchema = z.object({
  title: z.string().min(1, "Title is required"),
  slug: z
    .string()
    .min(1, "Slug is required")
    .regex(/^[a-z0-9-]+$/, "Slug: lowercase letters, numbers, hyphens only"),
  excerpt: z.string().optional().default(""),
  cover_image_url: z.union([z.string().min(1), z.literal("")]).optional(),
  body_html: z.string().optional().default(""),
  status: z.enum(["draft", "published"]),
  author_name: z.string().optional().default(""),
  author_photo_url: z.string().optional().default(""),
  author_bio: z.string().optional().default(""),
  author_facebook_url: z.string().optional().default(""),
  author_twitter_url: z.string().optional().default(""),
  author_linkedin_url: z.string().optional().default(""),
});

async function setPostCategories(postId: string, categoryIds: string[]) {
  const supabase = createAdminClient();
  await supabase.from("blog_post_categories").delete().eq("post_id", postId);
  if (categoryIds.length > 0) {
    await supabase
      .from("blog_post_categories")
      .insert(categoryIds.map((category_id) => ({ post_id: postId, category_id })));
  }
}

async function setPostTags(postId: string, tagIds: string[]) {
  const supabase = createAdminClient();
  await supabase.from("blog_post_tags").delete().eq("post_id", postId);
  if (tagIds.length > 0) {
    await supabase
      .from("blog_post_tags")
      .insert(tagIds.map((tag_id) => ({ post_id: postId, tag_id })));
  }
}

export async function createPost(formData: FormData) {
  await requireAdmin();

  const parsed = postSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    redirect(
      `/admin/blog/new?error=${encodeURIComponent(parsed.error.issues[0].message)}`
    );
  }

  const { cover_image_url, excerpt, status, ...rest } = parsed.data;
  const supabase = createAdminClient();

  const { data: post, error } = await supabase
    .from("blog_posts")
    .insert({
      ...rest,
      status,
      excerpt: excerpt || null,
      cover_image_url: cover_image_url || null,
      published_at: status === "published" ? new Date().toISOString() : null,
    })
    .select("id")
    .single();

  if (error || !post) {
    const message =
      error?.code === "23505" ? "That slug is already in use." : error?.message;
    redirect(
      `/admin/blog/new?error=${encodeURIComponent(message ?? "Failed to create post")}`
    );
  }

  await setPostCategories(post.id, formData.getAll("category_ids") as string[]);
  await setPostTags(post.id, formData.getAll("tag_ids") as string[]);

  revalidatePath("/blog");
  revalidatePath("/admin/blog");
  redirect("/admin/blog");
}

export async function updatePost(id: string, formData: FormData) {
  await requireAdmin();

  const parsed = postSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    redirect(
      `/admin/blog/${id}/edit?error=${encodeURIComponent(parsed.error.issues[0].message)}`
    );
  }

  const { cover_image_url, excerpt, status, ...rest } = parsed.data;
  const supabase = createAdminClient();

  const { data: existing } = await supabase
    .from("blog_posts")
    .select("status, published_at, slug")
    .eq("id", id)
    .single();

  // published_at is set the first time a post goes live, then left alone
  // on subsequent edits -- re-publishing shouldn't bump its date, and
  // moving back to draft doesn't clear it (so it "remembers" when it was
  // originally published if re-published later).
  const publishedAt =
    status === "published" && existing?.status !== "published"
      ? new Date().toISOString()
      : (existing?.published_at ?? null);

  const { error } = await supabase
    .from("blog_posts")
    .update({
      ...rest,
      status,
      excerpt: excerpt || null,
      cover_image_url: cover_image_url || null,
      published_at: publishedAt,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) {
    const message =
      error.code === "23505" ? "That slug is already in use." : error.message;
    redirect(`/admin/blog/${id}/edit?error=${encodeURIComponent(message)}`);
  }

  await setPostCategories(id, formData.getAll("category_ids") as string[]);
  await setPostTags(id, formData.getAll("tag_ids") as string[]);

  revalidatePath("/blog");
  if (existing?.slug) revalidatePath(`/blog/${existing.slug}`);
  revalidatePath(`/blog/${rest.slug}`);
  revalidatePath("/admin/blog");
  redirect("/admin/blog");
}

export async function deletePost(id: string) {
  await requireAdmin();

  const supabase = createAdminClient();
  const { error } = await supabase.from("blog_posts").delete().eq("id", id);

  if (error) {
    redirect(
      `/admin/blog?error=${encodeURIComponent("Could not delete: " + error.message)}`
    );
  }

  revalidatePath("/blog");
  revalidatePath("/admin/blog");
  redirect("/admin/blog");
}

const categorySchema = z.object({
  name: z.string().min(1, "Name is required"),
});

export async function createBlogCategory(formData: FormData) {
  await requireAdmin();

  const parsed = categorySchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    redirect(`/admin/blog/categories?error=${encodeURIComponent(parsed.error.issues[0].message)}`);
  }

  const supabase = createAdminClient();
  const { error } = await supabase.from("blog_categories").insert({
    name: parsed.data.name,
    slug: slugify(parsed.data.name),
  });

  if (error) {
    const message =
      error.code === "23505" ? "That category already exists." : error.message;
    redirect(`/admin/blog/categories?error=${encodeURIComponent(message)}`);
  }

  revalidatePath("/admin/blog/categories");
  revalidatePath("/blog", "layout");
  redirect("/admin/blog/categories");
}

export async function deleteBlogCategory(id: string) {
  await requireAdmin();

  const supabase = createAdminClient();
  const { error } = await supabase.from("blog_categories").delete().eq("id", id);

  if (error) {
    redirect(
      `/admin/blog/categories?error=${encodeURIComponent("Could not delete: " + error.message)}`
    );
  }

  revalidatePath("/admin/blog/categories");
  revalidatePath("/blog", "layout");
  redirect("/admin/blog/categories");
}
