"use client";

import { useState } from "react";
import { uploadProductImage } from "@/lib/actions/upload";

export interface GalleryImage {
  url: string;
  alt_text: string;
}

/**
 * Multi-image manager for a product's media. product_images already
 * supports many rows per product (url, alt_text, sort_order) -- this is
 * the first component to actually use that instead of a single
 * image_url field. Holds the ordered list in local state and serializes
 * to one hidden JSON field (name="images_json"), same pattern as
 * options_json/highlights_json: submits atomically with the rest of the
 * form, and the server action replaces the full product_images set for
 * this product rather than diffing individual rows.
 */
export function ImageGalleryManager({ defaults }: { defaults?: GalleryImage[] }) {
  const [images, setImages] = useState<GalleryImage[]>(defaults ?? []);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;

    setUploading(true);
    setError(null);
    const uploaded: GalleryImage[] = [];
    for (const file of files) {
      const result = await uploadProductImage(file);
      if ("error" in result) {
        setError(result.error);
        continue;
      }
      uploaded.push({ url: result.url, alt_text: "" });
    }
    setImages((prev) => [...prev, ...uploaded]);
    setUploading(false);
    e.target.value = "";
  }

  function removeImage(index: number) {
    setImages((prev) => prev.filter((_, i) => i !== index));
  }

  function moveImage(index: number, direction: -1 | 1) {
    setImages((prev) => {
      const target = index + direction;
      if (target < 0 || target >= prev.length) return prev;
      const next = [...prev];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  function updateAltText(index: number, alt_text: string) {
    setImages((prev) => prev.map((img, i) => (i === index ? { ...img, alt_text } : img)));
  }

  return (
    <div className="flex flex-col gap-3">
      <input type="hidden" name="images_json" value={JSON.stringify(images)} />

      {images.length > 0 && (
        <ul className="grid grid-cols-3 gap-3 sm:grid-cols-4">
          {images.map((image, index) => (
            <li key={image.url + index} className="flex flex-col gap-1.5">
              <div className="relative aspect-square overflow-hidden rounded-md border border-line bg-surface">
                {/* eslint-disable-next-line @next/next/no-img-element -- admin-only
                    thumbnail grid of freshly uploaded/edited images; not worth
                    routing through next/image's optimizer for this spot. */}
                <img src={image.url} alt="" className="h-full w-full object-cover" />
                {index === 0 && (
                  <span className="absolute left-1.5 top-1.5 rounded bg-foreground px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-background">
                    Primary
                  </span>
                )}
              </div>
              <input
                value={image.alt_text}
                onChange={(e) => updateAltText(index, e.target.value)}
                placeholder="Alt text (optional)"
                className="border border-line bg-transparent px-2 py-1 text-xs"
              />
              <div className="flex items-center justify-between text-xs">
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => moveImage(index, -1)}
                    disabled={index === 0}
                    aria-label="Move earlier"
                    className="text-muted transition-colors hover:text-foreground disabled:opacity-30"
                  >
                    ←
                  </button>
                  <button
                    type="button"
                    onClick={() => moveImage(index, 1)}
                    disabled={index === images.length - 1}
                    aria-label="Move later"
                    className="text-muted transition-colors hover:text-foreground disabled:opacity-30"
                  >
                    →
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => removeImage(index)}
                  className="text-red-700 underline underline-offset-4 hover:text-red-800"
                >
                  Remove
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <label className="flex flex-col gap-1.5">
        <input
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif"
          multiple
          onChange={handleFileChange}
          disabled={uploading}
          className="text-sm text-foreground file:mr-3 file:rounded-md file:border file:border-line file:bg-transparent file:px-3 file:py-1.5 file:text-sm"
        />
      </label>

      {uploading && <span className="text-xs text-muted">Uploading…</span>}
      {error && <span className="text-xs text-red-700">{error}</span>}
    </div>
  );
}
