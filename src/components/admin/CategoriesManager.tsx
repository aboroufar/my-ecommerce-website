"use client";

import { useState } from "react";
import {
  createCategory,
  updateCategory,
  deleteCategory,
} from "@/lib/actions/categories";
import { ImageUploadField } from "./ImageUploadField";

interface Category {
  id: string;
  name: string;
  slug: string;
  image_url: string | null;
  parent_id: string | null;
}

export function CategoriesManager({ categories }: { categories: Category[] }) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);

  const topLevel = categories.filter((c) => !c.parent_id);
  const childrenByParent = new Map<string, Category[]>();
  for (const c of categories) {
    if (!c.parent_id) continue;
    const siblings = childrenByParent.get(c.parent_id) ?? [];
    siblings.push(c);
    childrenByParent.set(c.parent_id, siblings);
  }

  return (
    <div className="max-w-lg space-y-4">
      {categories.length === 0 && !adding && (
        <p className="text-sm text-muted">No categories yet.</p>
      )}

      {topLevel.map((category) => (
        <div key={category.id} className="space-y-2">
          <CategoryRow
            category={category}
            categories={categories}
            editing={editingId === category.id}
            onEdit={() => setEditingId(category.id)}
            onCancel={() => setEditingId(null)}
          />
          {(childrenByParent.get(category.id) ?? []).length > 0 && (
            <div className="ml-6 space-y-2 border-l border-line pl-4">
              {childrenByParent.get(category.id)!.map((child) => (
                <CategoryRow
                  key={child.id}
                  category={child}
                  categories={categories}
                  editing={editingId === child.id}
                  onEdit={() => setEditingId(child.id)}
                  onCancel={() => setEditingId(null)}
                />
              ))}
            </div>
          )}
        </div>
      ))}

      {adding ? (
        <CategoryForm
          categories={categories}
          action={createCategory}
          onCancel={() => setAdding(false)}
        />
      ) : (
        <button
          type="button"
          onClick={() => setAdding(true)}
          className="border border-dashed border-line px-4 py-2 text-xs font-medium uppercase tracking-wide text-muted transition-colors hover:border-foreground hover:text-foreground"
        >
          + Add category
        </button>
      )}
    </div>
  );
}

function CategoryRow({
  category,
  categories,
  editing,
  onEdit,
  onCancel,
}: {
  category: Category;
  categories: Category[];
  editing: boolean;
  onEdit: () => void;
  onCancel: () => void;
}) {
  if (editing) {
    return (
      <CategoryForm
        category={category}
        categories={categories}
        action={updateCategory.bind(null, category.id)}
        onCancel={onCancel}
      />
    );
  }

  return (
    <div className="flex items-center gap-3 border border-line p-3">
      {category.image_url ? (
        // eslint-disable-next-line @next/next/no-img-element -- admin-only thumbnail
        <img
          src={category.image_url}
          alt={category.name}
          className="h-14 w-14 shrink-0 rounded object-cover"
        />
      ) : (
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded bg-surface text-xs text-muted">
          No photo
        </div>
      )}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-foreground">
          {category.name}
        </p>
        <p className="truncate text-xs text-muted">{category.slug}</p>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <button
          type="button"
          onClick={onEdit}
          className="px-2 py-1 text-xs text-foreground underline underline-offset-4"
        >
          Edit
        </button>
        <form action={deleteCategory.bind(null, category.id)}>
          <button
            type="submit"
            className="px-2 py-1 text-xs text-red-700 underline underline-offset-4 hover:text-red-800"
          >
            Delete
          </button>
        </form>
      </div>
    </div>
  );
}

function CategoryForm({
  category,
  categories,
  action,
  onCancel,
}: {
  category?: Category;
  categories: Category[];
  action: (formData: FormData) => void;
  onCancel: () => void;
}) {
  // A category can't be its own parent, and (to keep the hierarchy to two
  // levels) categories that already have a parent aren't offered as a
  // parent option either.
  const parentOptions = categories.filter(
    (c) => c.id !== category?.id && !c.parent_id
  );

  return (
    <form action={action} className="space-y-3 border border-line bg-surface p-4">
      <label className="flex flex-col gap-1.5">
        <span className="text-xs text-muted">Name</span>
        <input
          name="name"
          defaultValue={category?.name}
          required
          placeholder="Skincare"
          className="border border-line bg-background px-3 py-2 text-sm"
        />
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="text-xs text-muted">Slug</span>
        <input
          name="slug"
          defaultValue={category?.slug}
          required
          pattern="[a-z0-9-]+"
          placeholder="skincare"
          className="border border-line bg-background px-3 py-2 text-sm"
        />
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="text-xs text-muted">Parent category (optional)</span>
        <select
          name="parent_id"
          defaultValue={category?.parent_id ?? ""}
          className="border border-line bg-background px-3 py-2 text-sm"
        >
          <option value="">None -- top-level category</option>
          {parentOptions.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </label>

      <div>
        <span className="text-xs text-muted">Photo</span>
        <ImageUploadField defaultValue={category?.image_url ?? ""} />
      </div>

      <div className="flex gap-2 pt-1">
        <button
          type="submit"
          className="bg-accent px-4 py-2 text-xs font-medium uppercase tracking-wide text-background transition-opacity hover:opacity-90"
        >
          {category ? "Save" : "Add category"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-xs font-medium uppercase tracking-wide text-muted hover:text-foreground"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
