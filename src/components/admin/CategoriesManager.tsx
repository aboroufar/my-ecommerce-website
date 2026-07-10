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
}

export function CategoriesManager({ categories }: { categories: Category[] }) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);

  return (
    <div className="max-w-lg space-y-4">
      {categories.length === 0 && !adding && (
        <p className="text-sm text-muted">No categories yet.</p>
      )}

      {categories.map((category) =>
        editingId === category.id ? (
          <CategoryForm
            key={category.id}
            category={category}
            action={updateCategory.bind(null, category.id)}
            onCancel={() => setEditingId(null)}
          />
        ) : (
          <div
            key={category.id}
            className="flex items-center gap-3 border border-line p-3"
          >
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
                onClick={() => setEditingId(category.id)}
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
        )
      )}

      {adding ? (
        <CategoryForm
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

function CategoryForm({
  category,
  action,
  onCancel,
}: {
  category?: Category;
  action: (formData: FormData) => void;
  onCancel: () => void;
}) {
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
