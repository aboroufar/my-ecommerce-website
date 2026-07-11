import type { ProductStatus } from "@/lib/supabase/types";
import { ImageUploadField } from "./ImageUploadField";

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
  image_url?: string;
  categoryIds?: string[];
}

export function ProductForm({
  action,
  defaultValues,
  error,
  submitLabel,
  extraAction,
  categories,
}: {
  action: (formData: FormData) => void;
  defaultValues?: ProductFormValues;
  error?: string;
  submitLabel: string;
  extraAction?: React.ReactNode;
  categories: { id: string; name: string; parent_id: string | null }[];
}) {
  const byId = new Map(categories.map((c) => [c.id, c]));
  const depthOf = (c: { parent_id: string | null }): number => {
    let depth = 0;
    let current: { parent_id: string | null } | undefined = c;
    while (current?.parent_id) {
      current = byId.get(current.parent_id);
      depth += 1;
    }
    return depth;
  };
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

      <Field
        label="Product image"
        hint="Upload a file, or paste a URL below. Replaces the existing image if editing."
      >
        <ImageUploadField defaultValue={defaultValues?.image_url ?? ""} />
      </Field>

      {categories.length > 0 && (
        <Field label="Categories" hint="Tag at whichever level fits -- a top category, a group, or a specific product line.">
          <div className="flex flex-wrap gap-x-4 gap-y-2">
            {categories.map((category) => (
              <label
                key={category.id}
                className="flex items-center gap-2 text-sm text-foreground"
              >
                <input
                  type="checkbox"
                  name="category_ids"
                  value={category.id}
                  defaultChecked={defaultValues?.categoryIds?.includes(category.id)}
                />
                {"— ".repeat(depthOf(category))}
                {category.name}
              </label>
            ))}
          </div>
        </Field>
      )}

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
