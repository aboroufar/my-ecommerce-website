"use client";

import { useState } from "react";
import { uploadProductImage } from "@/lib/actions/upload";

export function ImageUploadField({
  defaultValue = "",
}: {
  defaultValue?: string;
}) {
  const [url, setUrl] = useState(defaultValue);
  const [status, setStatus] = useState<"idle" | "uploading">("idle");
  const [error, setError] = useState<string | null>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setStatus("uploading");
    setError(null);
    const result = await uploadProductImage(file);
    setStatus("idle");

    if ("error" in result) {
      setError(result.error);
      return;
    }
    setUrl(result.url);
  }

  return (
    <div className="flex flex-col gap-2">
      <input type="hidden" name="image_url" value={url} />

      {url && (
        // eslint-disable-next-line @next/next/no-img-element -- admin-only
        // preview thumbnail of a freshly uploaded/edited image; not worth
        // routing through next/image's optimizer for this one spot.
        <img
          src={url}
          alt="Product image preview"
          className="h-32 w-32 border border-line object-cover"
        />
      )}

      <input
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif"
        onChange={handleFileChange}
        disabled={status === "uploading"}
        className="text-sm text-foreground file:mr-3 file:border file:border-line file:bg-transparent file:px-3 file:py-1.5 file:text-sm"
      />

      {status === "uploading" && (
        <span className="text-xs text-muted">Uploading…</span>
      )}
      {error && <span className="text-xs text-red-700">{error}</span>}

      <label className="mt-1 flex flex-col gap-1.5">
        <span className="text-xs font-medium uppercase tracking-wide text-muted">
          Or paste an image URL
        </span>
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://..."
          className="border border-line bg-transparent px-3 py-2 text-sm"
        />
      </label>
    </div>
  );
}
