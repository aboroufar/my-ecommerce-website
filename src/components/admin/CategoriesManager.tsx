"use client";

import { useState, type ReactNode } from "react";
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
  hero_image_url?: string | null;
  hero_headline?: string | null;
  hero_eyebrow?: string | null;
}

export function CategoriesManager({
  categories,
  visibleIds,
}: {
  categories: Category[];
  visibleIds?: string[];
}) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const visibleIdSet = visibleIds ? new Set(visibleIds) : null;

  const topLevel = categories.filter((c) => !c.parent_id);
  const childrenByParent = new Map<string, Category[]>();
  for (const c of categories) {
    if (!c.parent_id) continue;
    const siblings = childrenByParent.get(c.parent_id) ?? [];
    siblings.push(c);
    childrenByParent.set(c.parent_id, siblings);
  }

  const renderRow = (category: Category, depth: number): ReactNode => (
    <div key={category.id} className="space-y-2">
      <CategoryRow
        category={category}
        categories={categories}
        depth={depth}
        editing={editingId === category.id}
        visible={visibleIdSet ? visibleIdSet.has(category.id) : true}
        onEdit={() => setEditingId(category.id)}
        onCancel={() => setEditingId(null)}
      />
      {(childrenByParent.get(category.id) ?? []).length > 0 && (
        <div className="ml-6 space-y-2 border-l border-line pl-4">
          {childrenByParent
            .get(category.id)!
            .map((child) => renderRow(child, depth + 1))}
        </div>
      )}
    </div>
  );

  return (
    <div className="max-w-lg space-y-4">
      {categories.length === 0 && !adding && (
        <p className="text-sm text-muted">No categories yet.</p>
      )}

      {topLevel.map((category) => renderRow(category, 0))}

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

const TIER_LABELS = ["Category", "Group", "Item"] as const;
const TIER_STYLES = [
  "bg-foreground text-background",
  "bg-accent/15 text-accent",
  "bg-surface text-muted",
] as const;

function TierBadge({ depth }: { depth: number }) {
  return (
    <span
      className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide ${TIER_STYLES[depth] ?? TIER_STYLES[2]}`}
    >
      {TIER_LABELS[depth] ?? "Item"}
    </span>
  );
}

function CategoryRow({
  category,
  categories,
  depth,
  editing,
  visible,
  onEdit,
  onCancel,
}: {
  category: Category;
  categories: Category[];
  depth: number;
  editing: boolean;
  visible: boolean;
  onEdit: () => void;
  onCancel: () => void;
}) {
  if (editing) {
    return (
      <CategoryForm
        category={category}
        categories={categories}
        depth={depth}
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
        <div className="flex items-center gap-2">
          <TierBadge depth={depth} />
          {!visible && (
            <span
              className="shrink-0 rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-amber-800"
              title="No Active products in this category (or its groups/items) yet, so it's hidden from the header menu, homepage, and /products filters."
            >
              Not visible
            </span>
          )}
          <p className="truncate text-sm font-medium text-foreground">
            {category.name}
          </p>
        </div>
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
  depth,
  action,
  onCancel,
}: {
  category?: Category;
  categories: Category[];
  depth?: number;
  action: (formData: FormData) => void;
  onCancel: () => void;
}) {
  // A category can't be its own parent, and (to keep the hierarchy to
  // three levels) categories whose own parent already has a parent aren't
  // offered as a parent option -- that would make a 4th level.
  const byId = new Map(categories.map((c) => [c.id, c]));
  const depthOf = (c: Category): number => {
    let d = 0;
    let current: Category | undefined = c;
    while (current?.parent_id) {
      current = byId.get(current.parent_id);
      d += 1;
    }
    return d;
  };

  // categories comes back sorted alphabetically by name, which scrambles
  // the tree in a flat <select> -- e.g. a top-level category and its own
  // children can end up scattered far apart among unrelated categories,
  // making it easy to pick the wrong parent by mistake (this caused a real
  // product mis-categorization bug). Re-sort depth-first so every group of
  // siblings is listed immediately after its parent, in tree order.
  const childrenByParentId = new Map<string, Category[]>();
  for (const c of categories) {
    if (!c.parent_id) continue;
    const siblings = childrenByParentId.get(c.parent_id) ?? [];
    siblings.push(c);
    childrenByParentId.set(c.parent_id, siblings);
  }
  const eligible = categories.filter(
    (c) => c.id !== category?.id && depthOf(c) < 2
  );
  const eligibleIds = new Set(eligible.map((c) => c.id));
  const parentOptions: Category[] = [];
  function addInTreeOrder(c: Category) {
    if (eligibleIds.has(c.id)) parentOptions.push(c);
    for (const child of childrenByParentId.get(c.id) ?? []) {
      addInTreeOrder(child);
    }
  }
  for (const top of categories.filter((c) => !c.parent_id)) {
    addInTreeOrder(top);
  }

  const [selectedParentId, setSelectedParentId] = useState(
    category?.parent_id ?? ""
  );
  const resultingDepth = selectedParentId
    ? depthOf(byId.get(selectedParentId)!) + 1
    : 0;
  const tierLabel = TIER_LABELS[resultingDepth] ?? "Item";

  return (
    <form action={action} className="space-y-3 border border-line bg-surface p-4">
      <div className="flex items-center gap-2">
        <TierBadge depth={depth ?? resultingDepth} />
        <span className="text-xs text-muted">
          {category ? `Editing this ${tierLabel.toLowerCase()}` : `New ${tierLabel.toLowerCase()}`}
        </span>
      </div>

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
        <span className="text-xs text-muted">
          Parent (leave blank for a top-level Category)
        </span>
        <select
          name="parent_id"
          value={selectedParentId}
          onChange={(e) => setSelectedParentId(e.target.value)}
          className="border border-line bg-background px-3 py-2 text-sm"
        >
          <option value="">None -- top-level Category</option>
          {parentOptions.map((c) => (
            <option key={c.id} value={c.id}>
              {"— ".repeat(depthOf(c))}
              {c.name} ({TIER_LABELS[depthOf(c)]})
            </option>
          ))}
        </select>
      </label>

      <div>
        <span className="text-xs text-muted">Photo</span>
        <ImageUploadField defaultValue={category?.image_url ?? ""} />
      </div>

      {resultingDepth === 0 && (
        <div className="space-y-3 border-t border-line pt-3">
          <p className="text-xs text-muted">
            Category landing page (shown at the top of /products for this
            category)
          </p>

          <label className="flex flex-col gap-1.5">
            <span className="text-xs text-muted">Hero photo</span>
            <ImageUploadField
              fieldName="hero_image_url"
              defaultValue={category?.hero_image_url ?? ""}
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-xs text-muted">Hero headline</span>
            <input
              name="hero_headline"
              defaultValue={category?.hero_headline ?? ""}
              placeholder="BubbleBath Set"
              className="border border-line bg-background px-3 py-2 text-sm"
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-xs text-muted">Hero eyebrow</span>
            <input
              name="hero_eyebrow"
              defaultValue={category?.hero_eyebrow ?? "Everything you may need"}
              placeholder="Everything you may need"
              className="border border-line bg-background px-3 py-2 text-sm"
            />
          </label>
        </div>
      )}

      <div className="flex gap-2 pt-1">
        <button
          type="submit"
          className="bg-accent px-4 py-2 text-xs font-medium uppercase tracking-wide text-background transition-opacity hover:opacity-90"
        >
          {category ? "Save" : `Add ${tierLabel.toLowerCase()}`}
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
