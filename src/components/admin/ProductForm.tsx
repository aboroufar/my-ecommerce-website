import type { ProductGender, ProductStatus } from "@/lib/supabase/types";
import { ImageUploadField } from "./ImageUploadField";
import { ProductOptionsManager, type ProductOptionsDefaults } from "./ProductOptionsManager";
import {
  ProductHighlightsManager,
  type ProductHighlightsDefaults,
} from "./ProductHighlightsManager";

interface CategoryOption {
  id: string;
  name: string;
  parent_id: string | null;
}

interface TagOption {
  id: string;
  name: string;
}

interface BrandOption {
  id: string;
  name: string;
}

function TagChecklist({
  tags,
  checkedIds,
}: {
  tags: TagOption[];
  checkedIds?: string[];
}) {
  if (tags.length === 0) {
    return <p className="text-sm text-muted">No tags yet -- add some in Admin → Tags.</p>;
  }

  return (
    <div className="flex flex-wrap gap-x-4 gap-y-2 border border-line bg-surface p-4">
      {tags.map((tag) => (
        <label key={tag.id} className="flex items-center gap-2 text-sm text-foreground">
          <input
            type="checkbox"
            name="tag_ids"
            value={tag.id}
            defaultChecked={checkedIds?.includes(tag.id)}
          />
          {tag.name}
        </label>
      ))}
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

function CategoryTree({
  categories,
  checkedIds,
}: {
  categories: CategoryOption[];
  checkedIds?: string[];
}) {
  const topLevel = categories.filter((c) => !c.parent_id);
  const childrenByParent = new Map<string, CategoryOption[]>();
  for (const c of categories) {
    if (!c.parent_id) continue;
    const siblings = childrenByParent.get(c.parent_id) ?? [];
    siblings.push(c);
    childrenByParent.set(c.parent_id, siblings);
  }

  const renderNode = (category: CategoryOption, depth: number): React.ReactNode => (
    <div key={category.id} className={depth === 0 ? "space-y-1.5" : "mt-1.5 space-y-1.5"}>
      <label className="flex items-center gap-2 text-sm text-foreground">
        <input
          type="checkbox"
          name="category_ids"
          value={category.id}
          defaultChecked={checkedIds?.includes(category.id)}
        />
        <TierBadge depth={depth} />
        {category.name}
      </label>
      {(childrenByParent.get(category.id) ?? []).length > 0 && (
        <div className="ml-6 space-y-1.5 border-l border-line pl-4">
          {childrenByParent.get(category.id)!.map((child) => renderNode(child, depth + 1))}
        </div>
      )}
    </div>
  );

  if (topLevel.length === 0) {
    return <p className="text-sm text-muted">No categories yet.</p>;
  }

  return (
    <div className="space-y-4 border border-line bg-surface p-4">
      {topLevel.map((category) => renderNode(category, 0))}
    </div>
  );
}

interface ProductFormValues {
  name?: string;
  slug?: string;
  description?: string | null;
  price?: number; // dollars, not cents -- this is a display/input concern
  compare_at_price?: number | null; // dollars, same reasoning
  sku?: string | null;
  stock_qty?: number;
  status?: ProductStatus;
  is_popular?: boolean;
  brandId?: string | null;
  gender?: ProductGender | null;
  image_url?: string;
  categoryIds?: string[];
  tagIds?: string[];
  options?: ProductOptionsDefaults;
  highlights?: ProductHighlightsDefaults;
}

export function ProductForm({
  action,
  defaultValues,
  error,
  submitLabel,
  extraAction,
  categories,
  tags,
  brands,
}: {
  action: (formData: FormData) => void;
  defaultValues?: ProductFormValues;
  error?: string;
  submitLabel: string;
  extraAction?: React.ReactNode;
  categories: CategoryOption[];
  tags: TagOption[];
  brands: BrandOption[];
}) {
  return (
    <form action={action} className="mt-8 flex max-w-lg flex-col gap-5">
      {error && (
        <p className="border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      <Field label="Name">
        <input
          name="name"
          required
          defaultValue={defaultValues?.name}
          className="border border-line bg-transparent px-3 py-2 text-sm"
        />
      </Field>

      <Field label="Slug" hint="Used in the URL, e.g. classic-tee">
        <input
          name="slug"
          required
          pattern="[a-z0-9-]+"
          defaultValue={defaultValues?.slug}
          className="border border-line bg-transparent px-3 py-2 text-sm"
        />
      </Field>

      <Field label="Description">
        <textarea
          name="description"
          rows={4}
          defaultValue={defaultValues?.description ?? ""}
          className="border border-line bg-transparent px-3 py-2 text-sm"
        />
      </Field>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Price (USD)">
          <input
            name="price"
            type="number"
            step="0.01"
            min="0"
            required
            defaultValue={defaultValues?.price}
            className="border border-line bg-transparent px-3 py-2 text-sm"
          />
        </Field>
        <Field
          label="Compare-at price (USD)"
          hint="Optional. Set higher than price to show a sale badge."
        >
          <input
            name="compare_at_price"
            type="number"
            step="0.01"
            min="0"
            defaultValue={defaultValues?.compare_at_price ?? ""}
            className="border border-line bg-transparent px-3 py-2 text-sm"
          />
        </Field>
      </div>

      <Field label="Stock quantity">
        <input
          name="stock_qty"
          type="number"
          step="1"
          min="0"
          required
          defaultValue={defaultValues?.stock_qty ?? 0}
          className="max-w-[calc(50%-8px)] border border-line bg-transparent px-3 py-2 text-sm"
        />
      </Field>

      <div className="grid grid-cols-2 gap-4">
        <Field label="SKU" hint="Optional">
          <input
            name="sku"
            defaultValue={defaultValues?.sku ?? ""}
            className="border border-line bg-transparent px-3 py-2 text-sm"
          />
        </Field>
        <Field label="Status">
          <select
            name="status"
            defaultValue={defaultValues?.status ?? "draft"}
            className="border border-line bg-transparent px-3 py-2 text-sm"
          >
            <option value="draft">Draft (hidden from shop)</option>
            <option value="active">Active</option>
            <option value="archived">Archived</option>
          </select>
        </Field>
      </div>

      <label className="flex items-center gap-2 text-sm text-foreground">
        <input
          type="checkbox"
          name="is_popular"
          defaultChecked={defaultValues?.is_popular ?? false}
        />
        Show a &quot;Popular&quot; badge on this product
      </label>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Brand" hint="Optional. Manage the brand list from Admin → Brands.">
          <select
            name="brand_id"
            defaultValue={defaultValues?.brandId ?? ""}
            className="border border-line bg-transparent px-3 py-2 text-sm"
          >
            <option value="">No brand</option>
            {brands.map((brand) => (
              <option key={brand.id} value={brand.id}>
                {brand.name}
              </option>
            ))}
          </select>
          {brands.length === 0 && (
            <p className="mt-1 text-xs text-muted">No brands yet -- add some in Admin → Brands.</p>
          )}
        </Field>
        <Field label="Gender" hint="Optional. Used for storefront filtering.">
          <select
            name="gender"
            defaultValue={defaultValues?.gender ?? ""}
            className="border border-line bg-transparent px-3 py-2 text-sm"
          >
            <option value="">Not specified</option>
            <option value="women">Women</option>
            <option value="men">Men</option>
            <option value="unisex">Unisex</option>
          </select>
        </Field>
      </div>

      <Field
        label="Product image"
        hint="Upload a file, or paste a URL below. Replaces the existing image if editing."
      >
        <ImageUploadField defaultValue={defaultValues?.image_url ?? ""} />
      </Field>

      {categories.length > 0 && (
        <Field
          label="Categories"
          hint="Tag at whichever level fits -- a top-level Category, a Group, or a specific Item underneath it."
        >
          <CategoryTree categories={categories} checkedIds={defaultValues?.categoryIds} />
        </Field>
      )}

      <Field
        label="Tags"
        hint="Shown as clickable labels on the product page. Manage the tag list from Admin → Tags."
      >
        <TagChecklist tags={tags} checkedIds={defaultValues?.tagIds} />
      </Field>

      <Field
        label="Options"
        hint="Optional. Add option types like Size or Skin type to sell this product in priced/stocked variants instead of one fixed price. Each combination gets its own price, stock, weight and dimensions."
      >
        <ProductOptionsManager defaults={defaultValues?.options} />
      </Field>

      <Field
        label="Highlight bullets"
        hint="Shown on the product page above Add to cart, e.g. &quot;Cruelty free&quot;."
      >
        <ProductHighlightsManager defaults={defaultValues?.highlights} />
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
