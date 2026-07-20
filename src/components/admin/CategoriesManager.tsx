"use client";

import { useState } from "react";
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

  return (
    <div className="max-w-lg space-y-4">
      {categories.length === 0 && !adding && (
        <p className="text-sm text-muted">No categories yet.</p>
      )}

      {categories.map((category) => (
        <CategoryRow
          key={category.id}
          category={category}
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
      ))}

      {adding ? (
        <CategoryForm action={createCategory} onCancel={() => setAdding(false)} />
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
  editing,
  managing,
  visible,
  products,
  onEdit,
  onCancel,
  onToggleManage,
}: {
  category: Category;
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
                  title="No Active products in this category yet, so it's hidden from the header menu, homepage, and /products filters."
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

      <label className="flex items-center gap-2 text-sm text-foreground">
        <input
          type="checkbox"
          name="display_only"
          defaultChecked={category?.display_only ?? false}
        />
        Display only -- show as a plain tile on the homepage grid, not
        clickable, no products needed
      </label>

      <label className="flex items-center gap-2 text-sm text-foreground">
        <input
          type="checkbox"
          name="featured_in_grid"
          defaultChecked={category?.featured_in_grid ?? false}
        />
        Show in Brand Highlights -- eligible to appear as one of the 5
        random tiles in the homepage&apos;s Brand Highlights section
      </label>

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
