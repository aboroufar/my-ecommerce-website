"use client";

import { useState } from "react";
import { createBrand, updateBrand, deleteBrand, moveBrand } from "@/lib/actions/brands";
import { ImageUploadField } from "./ImageUploadField";

interface Brand {
  id: string;
  name: string;
  logo_url: string;
  link_url: string | null;
}

export function BrandsManager({ brands }: { brands: Brand[] }) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);

  return (
    <div className="max-w-lg space-y-4">
      {brands.length === 0 && !adding && (
        <p className="text-sm text-muted">
          No brands yet. The brand bar won&apos;t show on the homepage until
          you add at least one.
        </p>
      )}

      {brands.map((brand, i) =>
        editingId === brand.id ? (
          <BrandForm
            key={brand.id}
            brand={brand}
            action={updateBrand.bind(null, brand.id)}
            onCancel={() => setEditingId(null)}
          />
        ) : (
          <div key={brand.id} className="flex items-center gap-3 border border-line p-3">
            {/* eslint-disable-next-line @next/next/no-img-element -- admin-only thumbnail */}
            <img
              src={brand.logo_url}
              alt={brand.name}
              className="h-14 w-14 shrink-0 object-contain"
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-foreground">
                {brand.name}
              </p>
              {brand.link_url && (
                <p className="truncate text-xs text-muted">{brand.link_url}</p>
              )}
            </div>
            <div className="flex shrink-0 items-center gap-1">
              <form action={moveBrand.bind(null, brand.id, "up")}>
                <button
                  type="submit"
                  disabled={i === 0}
                  aria-label="Move up"
                  className="px-1.5 py-1 text-xs text-muted transition-colors hover:text-foreground disabled:opacity-30"
                >
                  ↑
                </button>
              </form>
              <form action={moveBrand.bind(null, brand.id, "down")}>
                <button
                  type="submit"
                  disabled={i === brands.length - 1}
                  aria-label="Move down"
                  className="px-1.5 py-1 text-xs text-muted transition-colors hover:text-foreground disabled:opacity-30"
                >
                  ↓
                </button>
              </form>
              <button
                type="button"
                onClick={() => setEditingId(brand.id)}
                className="px-2 py-1 text-xs text-foreground underline underline-offset-4"
              >
                Edit
              </button>
              <form action={deleteBrand.bind(null, brand.id)}>
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
        <BrandForm action={createBrand} onCancel={() => setAdding(false)} />
      ) : (
        <button
          type="button"
          onClick={() => setAdding(true)}
          className="border border-dashed border-line px-4 py-2 text-xs font-medium uppercase tracking-wide text-muted transition-colors hover:border-foreground hover:text-foreground"
        >
          + Add brand
        </button>
      )}
    </div>
  );
}

function BrandForm({
  brand,
  action,
  onCancel,
}: {
  brand?: Brand;
  action: (formData: FormData) => void;
  onCancel: () => void;
}) {
  return (
    <form action={action} className="space-y-3 border border-line bg-surface p-4">
      <label className="flex flex-col gap-1.5">
        <span className="text-xs text-muted">Brand name</span>
        <input
          name="name"
          defaultValue={brand?.name}
          required
          className="border border-line bg-background px-3 py-2 text-sm"
        />
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="text-xs text-muted">Link (optional)</span>
        <input
          name="link_url"
          type="url"
          defaultValue={brand?.link_url ?? ""}
          placeholder="https://..."
          className="border border-line bg-background px-3 py-2 text-sm"
        />
      </label>

      <div>
        <span className="text-xs text-muted">Logo</span>
        <ImageUploadField defaultValue={brand?.logo_url ?? ""} fieldName="logo_url" />
      </div>

      <div className="flex gap-2 pt-1">
        <button
          type="submit"
          className="bg-accent px-4 py-2 text-xs font-medium uppercase tracking-wide text-background transition-opacity hover:opacity-90"
        >
          {brand ? "Save" : "Add brand"}
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
