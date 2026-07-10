"use client";

import { useState } from "react";
import {
  createHeroSlide,
  updateHeroSlide,
  deleteHeroSlide,
  moveHeroSlide,
} from "@/lib/actions/heroSlides";
import { ImageUploadField } from "./ImageUploadField";

interface Slide {
  id: string;
  headline: string;
  description: string;
  image_url: string;
  link_url: string;
  sort_order: number;
}

export function HeroSlidesManager({ slides }: { slides: Slide[] }) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);

  return (
    <div className="mt-4 max-w-lg space-y-4">
      {slides.length === 0 && !adding && (
        <p className="text-sm text-muted">No slides yet.</p>
      )}

      {slides.map((slide, i) =>
        editingId === slide.id ? (
          <SlideForm
            key={slide.id}
            slide={slide}
            action={updateHeroSlide.bind(null, slide.id)}
            onCancel={() => setEditingId(null)}
          />
        ) : (
          <div key={slide.id} className="flex items-center gap-3 border border-line p-3">
            {/* eslint-disable-next-line @next/next/no-img-element -- admin-only thumbnail */}
            <img
              src={slide.image_url}
              alt={slide.headline}
              className="h-14 w-14 shrink-0 object-cover"
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-foreground">
                {slide.headline}
              </p>
              <p className="truncate text-xs text-muted">→ {slide.link_url}</p>
            </div>
            <div className="flex shrink-0 items-center gap-1">
              <form action={moveHeroSlide.bind(null, slide.id, "up")}>
                <button
                  type="submit"
                  disabled={i === 0}
                  aria-label="Move up"
                  className="px-1.5 py-1 text-xs text-muted transition-colors hover:text-foreground disabled:opacity-30"
                >
                  ↑
                </button>
              </form>
              <form action={moveHeroSlide.bind(null, slide.id, "down")}>
                <button
                  type="submit"
                  disabled={i === slides.length - 1}
                  aria-label="Move down"
                  className="px-1.5 py-1 text-xs text-muted transition-colors hover:text-foreground disabled:opacity-30"
                >
                  ↓
                </button>
              </form>
              <button
                type="button"
                onClick={() => setEditingId(slide.id)}
                className="px-2 py-1 text-xs text-foreground underline underline-offset-4"
              >
                Edit
              </button>
              <form action={deleteHeroSlide.bind(null, slide.id)}>
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
        <SlideForm action={createHeroSlide} onCancel={() => setAdding(false)} />
      ) : (
        <button
          type="button"
          onClick={() => setAdding(true)}
          className="border border-dashed border-line px-4 py-2 text-xs font-medium uppercase tracking-wide text-muted transition-colors hover:border-foreground hover:text-foreground"
        >
          + Add slide
        </button>
      )}
    </div>
  );
}

function SlideForm({
  slide,
  action,
  onCancel,
}: {
  slide?: Slide;
  action: (formData: FormData) => void;
  onCancel: () => void;
}) {
  return (
    <form action={action} className="space-y-3 border border-line bg-surface p-4">
      <label className="flex flex-col gap-1.5">
        <span className="text-xs text-muted">Headline</span>
        <input
          name="headline"
          defaultValue={slide?.headline}
          required
          className="border border-line bg-background px-3 py-2 text-sm"
        />
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="text-xs text-muted">Description</span>
        <textarea
          name="description"
          defaultValue={slide?.description}
          rows={2}
          className="border border-line bg-background px-3 py-2 text-sm"
        />
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="text-xs text-muted">
          Read more link (e.g. /products, /products?category=apparel, or a
          future blog post URL)
        </span>
        <input
          name="link_url"
          defaultValue={slide?.link_url ?? "/products"}
          required
          className="border border-line bg-background px-3 py-2 text-sm"
        />
      </label>

      <div>
        <span className="text-xs text-muted">Photo</span>
        <ImageUploadField defaultValue={slide?.image_url ?? ""} />
      </div>

      <div className="flex gap-2 pt-1">
        <button
          type="submit"
          className="bg-accent px-4 py-2 text-xs font-medium uppercase tracking-wide text-background transition-opacity hover:opacity-90"
        >
          {slide ? "Save" : "Add slide"}
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
