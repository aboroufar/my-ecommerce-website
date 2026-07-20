"use client";

import { useState, type ReactNode } from "react";
import {
  createCategory,
  updateCategory,
  deleteCategory,
  setCategoryProducts,
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
  display_only?: boolean;
  featured_in_grid?: boolean;
}

interface ProductRef {
  id: string;
  name: string;
  categoryIds: string[];
}

export function CategoriesManager({
  categories,
  visibleIds,
  products,
}: {
  categories: Category[];
  visibleIds?: string[];
  products?: ProductRef[];
}) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [managingId, setManagingId] = useState<string | null>(null);
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
        managing={managingId === category.id}
        visible={visibleIdSet ? visibleIdSet.has(category.id) : true}
        products={products}
        onEdit={() => {
          setEditingId(category.id);
          setManagingId(null);
        }}
        onCancel={() => setEditingId(null)}
        onToggleManage={() =>
          setManagingId((id) => (id === category.id ? null : category.id))
        }
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

const TIER_LABELS = ["Category", "Group"] as const;
const TIER_STYLES = [
  "bg-foreground text-background",
  "bg-accent/15 text-accent",
] as const;

function TierBadge({ depth }: { depth: number }) {
  const i = Math.min(depth, TIER_STYLES.length - 1);
  return (
    <span
      className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide ${TIER_STYLES[i]}`}
    >
      {TIER_LABELS[i]}
    </span>
  );
}

function CategoryRow({
  category,
  categories,
  depth,
  editing,
  managing,
  visible,
  products,
  onEdit,
  onCancel,
  onToggleManage,
}: {
  category: Category;
  categories: Category[];
  depth: number;
  editing: boolean;
  managing: boolean;
  visible: boolean;
  products?: ProductRef[];
  onEdit: () => void;
  onCancel: () => void;
  onToggleManage: () => void;
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
    <div className="border border-line">
      <div className="flex items-center gap-3 p-3">
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
            {category.featured_in_grid && (
              <span
                className="shrink-0 rounded bg-violet-100 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-violet-800"
                title="Eligible to appear as one of the 5 random tiles in the homepage's Brand Highlights section."
              >
                Brand Highlights
              </span>
            )}
            {category.display_only ? (
              <span
                className="shrink-0 rounded bg-sky-100 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-sky-800"
                title="Shown on the homepage category grid as a plain image tile -- not clickable, doesn't need any products, and doesn't appear in the header menu or /products filters."
              >
                Display only
              </span>
            ) : (
              !visible && (
                <span
                  className="shrink-0 rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-amber-800"
                  title="No Active products in this category (or its groups) yet, so it's hidden from the header menu, homepage, and /products filters."
                >
                  Not visible
                </span>
              )
            )}
            <p className="truncate text-sm font-medium text-foreground">
              {category.name}
            </p>
          </div>
          <p className="truncate text-xs text-muted">{category.slug}</p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {products && (
            <button
              type="button"
              onClick={onToggleManage}
              className="px-2 py-1 text-xs text-foreground underline underline-offset-4"
            >
              {managing ? "Close" : "Manage products"}
            </button>
          )}
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
      {managing && products && (
        <CategoryProductPicker category={category} products={products} />
      )}
    </div>
  );
}

function CategoryProductPicker({
  category,
  products,
}: {
  category: Category;
  products: ProductRef[];
}) {
  if (products.length === 0) {
    return (
      <p className="border-t border-line p-3 text-xs text-muted">
        No products yet -- add some in Admin → Products.
      </p>
    );
  }

  return (
    <form
      action={setCategoryProducts}
      className="space-y-3 border-t border-line bg-surface p-3"
    >
      <input type="hidden" name="category_id" value={category.id} />
      <ul className="max-h-64 space-y-1 overflow-y-auto">
        {products.map((product) => (
          <li key={product.id}>
            <label className="flex items-center gap-2 text-sm text-foreground">
              <input
                type="checkbox"
                name="product_ids"
                value={product.id}
                defaultChecked={product.categoryIds.includes(category.id)}
              />
              {product.name}
            </label>
          </li>
        ))}
      </ul>
      <button
        type="submit"
        className="bg-accent px-4 py-2 text-xs font-medium uppercase tracking-wide text-background transition-opacity hover:opacity-90"
      >
        Save products
      </button>
    </form>
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
  // A category can't be its own parent, and (to keep the hierarchy to two
  // levels) categories that already have a parent aren't offered as a
  // parent option -- that would make a 3rd level. Use tags for anything
  // finer-grained than a Group.
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
    (c) => c.id !== category?.id && depthOf(c) < 1
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
        <label className="flex items-center gap-2 text-sm text-foreground">
          <input
            type="checkbox"
            name="display_only"
            defaultChecked={category?.display_only ?? false}
          />
          Display only -- show as a plain tile on the homepage grid, not
          clickable, no products needed
        </label>
      )}

      {resultingDepth === 0 && (
        <label className="flex items-center gap-2 text-sm text-foreground">
          <input
            type="checkbox"
            name="featured_in_grid"
            defaultChecked={category?.featured_in_grid ?? false}
          />
          Show in Brand Highlights -- eligible to appear as one of the 5
          random tiles in the homepage&apos;s Brand Highlights section
        </label>
      )}

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
