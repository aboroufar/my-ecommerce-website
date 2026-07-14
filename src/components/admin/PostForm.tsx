"use client";

import { ImageUploadField } from "./ImageUploadField";
import { RichTextEditor } from "./RichTextEditor";

interface CategoryOption {
  id: string;
  name: string;
}

interface TagOption {
  id: string;
  name: string;
}

interface PostFormValues {
  title?: string;
  slug?: string;
  excerpt?: string | null;
  cover_image_url?: string;
  body_html?: string;
  status?: "draft" | "published";
  categoryIds?: string[];
  tagIds?: string[];
}

export function PostForm({
  action,
  defaultValues,
  error,
  submitLabel,
  extraAction,
  categories,
  tags,
}: {
  action: (formData: FormData) => void;
  defaultValues?: PostFormValues;
  error?: string;
  submitLabel: string;
  extraAction?: React.ReactNode;
  categories: CategoryOption[];
  tags: TagOption[];
}) {
  return (
    <form action={action} className="mt-8 flex max-w-2xl flex-col gap-5">
      {error && (
        <p className="border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      <Field label="Title">
        <input
          name="title"
          required
          defaultValue={defaultValues?.title}
          className="border border-line bg-transparent px-3 py-2 text-sm"
        />
      </Field>

      <Field label="Slug" hint="Used in the URL, e.g. skin-care-basics">
        <input
          name="slug"
          required
          pattern="[a-z0-9-]+"
          defaultValue={defaultValues?.slug}
          className="border border-line bg-transparent px-3 py-2 text-sm"
        />
      </Field>

      <Field
        label="Excerpt"
        hint="Shown on the blog listing and used as the page description. Falls back to a trimmed version of the body if left blank."
      >
        <textarea
          name="excerpt"
          rows={3}
          defaultValue={defaultValues?.excerpt ?? ""}
          className="border border-line bg-transparent px-3 py-2 text-sm"
        />
      </Field>

      <Field label="Cover image">
        <ImageUploadField
          defaultValue={defaultValues?.cover_image_url ?? ""}
          fieldName="cover_image_url"
        />
      </Field>

      <div className="flex flex-col gap-1.5">
        <span className="text-xs font-medium uppercase tracking-wide text-muted">
          Body
        </span>
        <RichTextEditor defaultValue={defaultValues?.body_html ?? ""} />
      </div>

      {categories.length > 0 && (
        <Field label="Categories">
          <div className="flex flex-wrap gap-x-4 gap-y-2 border border-line bg-surface p-4">
            {categories.map((category) => (
              <label key={category.id} className="flex items-center gap-2 text-sm text-foreground">
                <input
                  type="checkbox"
                  name="category_ids"
                  value={category.id}
                  defaultChecked={defaultValues?.categoryIds?.includes(category.id)}
                />
                {category.name}
              </label>
            ))}
          </div>
        </Field>
      )}

      <Field
        label="Tags"
        hint="Manage the tag list from Admin → Tags (shared with product tags)."
      >
        <div className="flex flex-wrap gap-x-4 gap-y-2 border border-line bg-surface p-4">
          {tags.length === 0 && <p className="text-sm text-muted">No tags yet.</p>}
          {tags.map((tag) => (
            <label key={tag.id} className="flex items-center gap-2 text-sm text-foreground">
              <input
                type="checkbox"
                name="tag_ids"
                value={tag.id}
                defaultChecked={defaultValues?.tagIds?.includes(tag.id)}
              />
              {tag.name}
            </label>
          ))}
        </div>
      </Field>

      <Field label="Status">
        <select
          name="status"
          defaultValue={defaultValues?.status ?? "draft"}
          className="max-w-[calc(50%-8px)] border border-line bg-transparent px-3 py-2 text-sm"
        >
          <option value="draft">Draft (hidden from the blog)</option>
          <option value="published">Published</option>
        </select>
      </Field>

      <div className="mt-2 flex items-center gap-4">
        <button
          type="submit"
          className="bg-accent px-6 py-2.5 text-sm font-medium text-background transition-opacity hover:opacity-90"
        >
          {submitLabel}
        </button>
        {extraAction}
      </div>
    </form>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs font-medium uppercase tracking-wide text-muted">
        {label}
      </span>
      {children}
      {hint && <span className="text-xs text-muted">{hint}</span>}
    </label>
  );
}
