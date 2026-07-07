import type { ProductStatus } from "@/lib/supabase/types";

interface ProductFormValues {
  name?: string;
  slug?: string;
  description?: string | null;
  price?: number; // dollars, not cents -- this is a display/input concern
  sku?: string | null;
  stock_qty?: number;
  status?: ProductStatus;
  image_url?: string;
}

export function ProductForm({
  action,
  defaultValues,
  error,
  submitLabel,
  extraAction,
}: {
  action: (formData: FormData) => void;
  defaultValues?: ProductFormValues;
  error?: string;
  submitLabel: string;
  extraAction?: React.ReactNode;
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
        <Field label="Stock quantity">
          <input
            name="stock_qty"
            type="number"
            step="1"
            min="0"
            required
            defaultValue={defaultValues?.stock_qty ?? 0}
            className="border border-line bg-transparent px-3 py-2 text-sm"
          />
        </Field>
      </div>

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

      <Field
        label="Image URL"
        hint="Paste a URL — e.g. a public Supabase Storage link. Replaces the existing image if editing."
      >
        <input
          name="image_url"
          type="url"
          placeholder="https://..."
          defaultValue={defaultValues?.image_url ?? ""}
          className="border border-line bg-transparent px-3 py-2 text-sm"
        />
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
