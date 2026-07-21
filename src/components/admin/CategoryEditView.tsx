"use client";

import { useState } from "react";
import Link from "next/link";
import { deleteCategory, setCategoryProducts } from "@/lib/actions/categories";
import { ImageUploadField } from "./ImageUploadField";

interface CategoryValues {
  id?: string;
  name?: string;
  slug?: string;
  image_url?: string | null;
  hero_image_url?: string | null;
  hero_headline?: string | null;
  hero_eyebrow?: string | null;
  display_only?: boolean;
  featured_in_grid?: boolean;
}

export interface ProductGridItem {
  id: string;
  name: string;
  status: string;
  image_url: string | null;
  inCategory: boolean;
}

export function CategoryEditView({
  action,
  category,
  error,
  submitLabel,
  products,
}: {
  action: (formData: FormData) => void;
  category?: CategoryValues;
  error?: string;
  submitLabel: string;
  products?: ProductGridItem[];
}) {
  return (
    <div className="flex flex-col gap-6">
      {error && (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      <form action={action} className="flex flex-col gap-4 rounded-lg border border-line bg-surface p-5">
        <div className="flex items-start gap-4">
          <div className="shrink-0">
            <ImageUploadField defaultValue={category?.image_url ?? ""} />
          </div>
          <div className="flex min-w-0 flex-1 flex-col gap-3">
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-medium uppercase tracking-wide text-muted">Name</span>
              <input
                name="name"
                defaultValue={category?.name}
                required
                placeholder="Skincare"
                className="rounded-md border border-line bg-transparent px-3 py-2 text-lg font-medium"
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-medium uppercase tracking-wide text-muted">Slug</span>
              <input
                name="slug"
                defaultValue={category?.slug}
                required
                pattern="[a-z0-9-]+"
                placeholder="skincare"
                className="rounded-md border border-line bg-transparent px-3 py-2 text-sm"
              />
            </label>
          </div>
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

        <div className="space-y-3 border-t border-line pt-4">
          <p className="text-xs text-muted">
            Category landing page (shown at the top of /products for this
            category)
          </p>

          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium uppercase tracking-wide text-muted">Hero photo</span>
            <ImageUploadField
              fieldName="hero_image_url"
              defaultValue={category?.hero_image_url ?? ""}
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium uppercase tracking-wide text-muted">Hero headline</span>
            <input
              name="hero_headline"
              defaultValue={category?.hero_headline ?? ""}
              placeholder="BubbleBath Set"
              className="rounded-md border border-line bg-transparent px-3 py-2 text-sm"
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium uppercase tracking-wide text-muted">Hero eyebrow</span>
            <input
              name="hero_eyebrow"
              defaultValue={category?.hero_eyebrow ?? "Everything you may need"}
              placeholder="Everything you may need"
              className="rounded-md border border-line bg-transparent px-3 py-2 text-sm"
            />
          </label>
        </div>

        <div className="flex items-center gap-4 border-t border-line pt-4">
          <button
            type="submit"
            className="rounded-md bg-accent px-6 py-2.5 text-sm font-medium text-background transition-opacity hover:opacity-90"
          >
            {submitLabel}
          </button>
          <Link href="/admin/categories" className="text-sm text-muted hover:text-foreground">
            Cancel
          </Link>
        </div>
      </form>

      {category?.id && (
        <form action={deleteCategory.bind(null, category.id)} className="self-start">
          <button
            type="submit"
            className="text-sm text-red-700 underline underline-offset-4 hover:text-red-800"
          >
            Delete category
          </button>
        </form>
      )}

      {category?.id && products && (
        <CategoryProductGrid categoryId={category.id} products={products} />
      )}
    </div>
  );
}

function CategoryProductGrid({
  categoryId,
  products,
}: {
  categoryId: string;
  products: ProductGridItem[];
}) {
  const [managing, setManaging] = useState(false);
  const memberCount = products.filter((p) => p.inCategory).length;

  return (
    <div className="rounded-lg border border-line bg-surface p-5">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-foreground">
          Products <span className="ml-1 text-muted">{memberCount}</span>
        </h2>
        {products.length > 0 && (
          <button
            type="button"
            onClick={() => setManaging((v) => !v)}
            className="text-xs text-accent underline underline-offset-4"
          >
            {managing ? "Done" : "Manage products"}
          </button>
        )}
      </div>

      {products.length === 0 ? (
        <p className="mt-4 text-sm text-muted">No products yet -- add some in Admin → Products.</p>
      ) : managing ? (
        <form action={setCategoryProducts} className="mt-4 space-y-4">
          <input type="hidden" name="category_id" value={categoryId} />
          <div className="grid max-h-[480px] grid-cols-2 gap-3 overflow-y-auto pr-1 sm:grid-cols-3 md:grid-cols-4">
            {products.map((product) => (
              <label
                key={product.id}
                className="flex cursor-pointer flex-col gap-2 rounded-md border border-line p-2 has-[:checked]:border-accent has-[:checked]:bg-accent/5"
              >
                <div className="flex items-center justify-between">
                  <input type="checkbox" name="product_ids" value={product.id} defaultChecked={product.inCategory} />
                  {product.status !== "active" && (
                    <span className="rounded bg-amber-100 px-1 py-0.5 text-[9px] font-medium uppercase text-amber-800">
                      {product.status}
                    </span>
                  )}
                </div>
                {product.image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element -- admin-only thumbnail
                  <img src={product.image_url} alt="" className="aspect-square w-full rounded object-cover" />
                ) : (
                  <div className="flex aspect-square w-full items-center justify-center rounded bg-background text-[10px] text-muted">
                    No photo
                  </div>
                )}
                <span className="line-clamp-2 text-xs text-foreground">{product.name}</span>
              </label>
            ))}
          </div>
          <button
            type="submit"
            className="rounded-md bg-accent px-4 py-2 text-xs font-medium uppercase tracking-wide text-background transition-opacity hover:opacity-90"
          >
            Save products
          </button>
        </form>
      ) : memberCount === 0 ? (
        <p className="mt-4 text-sm text-muted">
          No products in this category yet. Click &quot;Manage products&quot; to add some.
        </p>
      ) : (
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {products
            .filter((p) => p.inCategory)
            .map((product) => (
              <div key={product.id} className="flex flex-col gap-2">
                {product.image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element -- admin-only thumbnail
                  <img src={product.image_url} alt="" className="aspect-square w-full rounded object-cover" />
                ) : (
                  <div className="flex aspect-square w-full items-center justify-center rounded bg-background text-[10px] text-muted">
                    No photo
                  </div>
                )}
                <span className="line-clamp-2 text-xs text-foreground">{product.name}</span>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}
