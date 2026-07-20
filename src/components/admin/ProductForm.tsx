import type { ProductGender, ProductStatus } from "@/lib/supabase/types";
import { ImageGalleryManager, type GalleryImage } from "./ImageGalleryManager";
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

interface PackageOption {
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
    <div className="flex flex-wrap gap-x-4 gap-y-2 rounded-md border border-line bg-background p-3">
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
    <div className="space-y-4 rounded-md border border-line bg-background p-3">
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
  weight_text?: string | null;
  dimensions_text?: string | null;
  packageProfileId?: string | null;
  stock_qty?: number;
  status?: ProductStatus;
  is_popular?: boolean;
  brandId?: string | null;
  gender?: ProductGender | null;
  images?: GalleryImage[];
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
  packageProfiles,
}: {
  action: (formData: FormData) => void;
  defaultValues?: ProductFormValues;
  error?: string;
  submitLabel: string;
  extraAction?: React.ReactNode;
  categories: CategoryOption[];
  tags: TagOption[];
  brands: BrandOption[];
  packageProfiles: PackageOption[];
}) {
  return (
    <form action={action} className="mt-8 flex flex-col gap-6">
      {error && (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
        {/* Main column: title/description/media, pricing & inventory, variants */}
        <div className="flex min-w-0 flex-col gap-6">
          <Card>
            <Field label="Title">
              <input
                name="name"
                required
                defaultValue={defaultValues?.name}
                className="rounded-md border border-line bg-transparent px-3 py-2 text-sm"
              />
            </Field>

            <Field label="Slug" hint="Used in the URL, e.g. classic-tee">
              <input
                name="slug"
                required
                pattern="[a-z0-9-]+"
                defaultValue={defaultValues?.slug}
                className="rounded-md border border-line bg-transparent px-3 py-2 text-sm"
              />
            </Field>

            <Field label="Description">
              <textarea
                name="description"
                rows={5}
                defaultValue={defaultValues?.description ?? ""}
                className="rounded-md border border-line bg-transparent px-3 py-2 text-sm"
              />
            </Field>
          </Card>

          <Card title="Media" hint="First image is the primary one shown in the shop.">
            <ImageGalleryManager defaults={defaultValues?.images} />
          </Card>

          <Card title="Pricing">
            <div className="grid grid-cols-2 gap-4">
              <Field label="Price">
                <PriceInput name="price" required defaultValue={defaultValues?.price} />
              </Field>
              <Field label="Compare-at price" hint="Optional. Higher than price to show a sale badge.">
                <PriceInput
                  name="compare_at_price"
                  defaultValue={defaultValues?.compare_at_price ?? undefined}
                />
              </Field>
            </div>
          </Card>

          <Card title="Inventory">
            <div className="grid grid-cols-2 gap-4">
              <Field label="SKU" hint="Optional">
                <input
                  name="sku"
                  defaultValue={defaultValues?.sku ?? ""}
                  className="rounded-md border border-line bg-transparent px-3 py-2 text-sm"
                />
              </Field>
              <Field label="Quantity">
                <input
                  name="stock_qty"
                  type="number"
                  step="1"
                  min="0"
                  required
                  defaultValue={defaultValues?.stock_qty ?? 0}
                  className="rounded-md border border-line bg-transparent px-3 py-2 text-sm"
                />
              </Field>
            </div>
          </Card>

          <Card
            title="Shipping"
            hint="Used when this product has no variants (or as a fallback for variants that don't set their own)."
          >
            <div className="grid grid-cols-2 gap-4">
              <Field label="Weight" hint="e.g. 0.5 kg">
                <input
                  name="weight_text"
                  defaultValue={defaultValues?.weight_text ?? ""}
                  placeholder="0.5 kg"
                  className="rounded-md border border-line bg-transparent px-3 py-2 text-sm"
                />
              </Field>
              <Field label="Dimensions" hint="e.g. 10 × 5 × 3 cm">
                <input
                  name="dimensions_text"
                  defaultValue={defaultValues?.dimensions_text ?? ""}
                  placeholder="10 × 5 × 3 cm"
                  className="rounded-md border border-line bg-transparent px-3 py-2 text-sm"
                />
              </Field>
            </div>

            <Field
              label="Package"
              hint="Optional. Manage reusable package profiles from Admin → Packages."
            >
              <select
                name="package_profile_id"
                defaultValue={defaultValues?.packageProfileId ?? ""}
                className="rounded-md border border-line bg-transparent px-3 py-2 text-sm"
              >
                <option value="">None</option>
                {packageProfiles.map((profile) => (
                  <option key={profile.id} value={profile.id}>
                    {profile.name}
                  </option>
                ))}
              </select>
            </Field>
          </Card>

          <Card
            title="Variants"
            hint="Add option types like Size or Skin type to sell this product in priced/stocked variants instead of one fixed price. Each combination gets its own price, stock, weight and dimensions."
          >
            <ProductOptionsManager defaults={defaultValues?.options} />
          </Card>

          <Card
            title="Highlight bullets"
            hint="Shown on the product page above Add to cart, e.g. &quot;Cruelty free&quot;."
          >
            <ProductHighlightsManager defaults={defaultValues?.highlights} />
          </Card>
        </div>

        {/* Sidebar: status, product organization */}
        <div className="flex min-w-0 flex-col gap-6">
          <Card title="Status">
            <select
              name="status"
              defaultValue={defaultValues?.status ?? "draft"}
              className="rounded-md border border-line bg-transparent px-3 py-2 text-sm"
            >
              <option value="draft">Draft (hidden from shop)</option>
              <option value="active">Active</option>
              <option value="archived">Archived</option>
            </select>

            <label className="mt-1 flex items-center gap-2 text-sm text-foreground">
              <input
                type="checkbox"
                name="is_popular"
                defaultChecked={defaultValues?.is_popular ?? false}
              />
              Show a &quot;Popular&quot; badge
            </label>
          </Card>

          <Card title="Product organization">
            <Field label="Vendor" hint="Manage the vendor list from Admin → Brands.">
              <select
                name="brand_id"
                defaultValue={defaultValues?.brandId ?? ""}
                className="rounded-md border border-line bg-transparent px-3 py-2 text-sm"
              >
                <option value="">None</option>
                {brands.map((brand) => (
                  <option key={brand.id} value={brand.id}>
                    {brand.name}
                  </option>
                ))}
              </select>
              {brands.length === 0 && (
                <p className="mt-1 text-xs text-muted">No vendors yet -- add some in Admin → Brands.</p>
              )}
            </Field>

            <Field label="Gender" hint="Used for storefront filtering.">
              <select
                name="gender"
                defaultValue={defaultValues?.gender ?? ""}
                className="rounded-md border border-line bg-transparent px-3 py-2 text-sm"
              >
                <option value="">Not specified</option>
                <option value="women">Women</option>
                <option value="men">Men</option>
                <option value="unisex">Unisex</option>
              </select>
            </Field>

            {categories.length > 0 && (
              <Field
                label="Collections"
                hint="Tag at whichever level fits -- a top-level Category, a Group, or a specific Item underneath it."
              >
                <CategoryTree categories={categories} checkedIds={defaultValues?.categoryIds} />
              </Field>
            )}

            <Field label="Tags">
              <TagChecklist tags={tags} checkedIds={defaultValues?.tagIds} />
            </Field>
          </Card>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button
          type="submit"
          className="rounded-md bg-accent px-6 py-2.5 text-sm font-medium text-background transition-opacity hover:opacity-90"
        >
          {submitLabel}
        </button>
        {extraAction}
      </div>
    </form>
  );
}

function Card({
  title,
  hint,
  children,
}: {
  title?: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 rounded-lg border border-line bg-surface p-5">
      {title && (
        <div>
          <h2 className="text-sm font-semibold text-foreground">{title}</h2>
          {hint && <p className="mt-1 text-xs text-muted">{hint}</p>}
        </div>
      )}
      {children}
    </div>
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

function PriceInput({
  name,
  required,
  defaultValue,
}: {
  name: string;
  required?: boolean;
  defaultValue?: number;
}) {
  return (
    <div className="flex items-center rounded-md border border-line focus-within:ring-2 focus-within:ring-accent/40">
      <span className="pl-3 text-sm text-muted">€</span>
      <input
        name={name}
        type="number"
        step="0.01"
        min="0"
        required={required}
        defaultValue={defaultValue}
        className="w-full bg-transparent px-2 py-2 text-sm focus:outline-none"
      />
    </div>
  );
}
