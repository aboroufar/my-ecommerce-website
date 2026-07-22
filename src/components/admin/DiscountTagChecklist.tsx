"use client";

import { useState, useTransition } from "react";
import { createDiscountLabelInline } from "@/lib/actions/discountLabels";

export interface TagOption {
  id: string;
  name: string;
}

/**
 * Controlled (not FormData-name-based) tag checklist for assigning
 * organizational tags directly to a discount record -- distinct from the
 * "Applies to" Scope tag option, which controls which products a
 * discount's effect applies to. Reports selections back to DiscountForm's
 * own state instead of relying on checkbox name/FormData, same reasoning
 * as ProductChecklist. Reuses createTagInline so new tags can be created
 * without leaving the form, same as the product-form TagChecklist --
 * but against discount_labels, a pool separate from product tags.
 */
export function DiscountTagChecklist({
  tags,
  selectedIds,
  onChange,
}: {
  tags: TagOption[];
  selectedIds: Set<string>;
  onChange: (next: Set<string>) => void;
}) {
  const [allTags, setAllTags] = useState(tags);
  const [newTagName, setNewTagName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function toggle(id: string) {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    onChange(next);
  }

  function handleAddTag() {
    const name = newTagName.trim();
    if (!name) return;
    setError(null);
    startTransition(async () => {
      const result = await createDiscountLabelInline(name);
      if ("error" in result) {
        setError(result.error);
        return;
      }
      setAllTags((prev) => [...prev, result].sort((a, b) => a.name.localeCompare(b.name)));
      toggle(result.id);
      setNewTagName("");
    });
  }

  return (
    <div className="flex flex-col gap-2">
      {allTags.length === 0 ? (
        <p className="text-sm text-muted">No tags yet -- add one below.</p>
      ) : (
        <div className="flex flex-wrap gap-x-4 gap-y-2 rounded-md border border-line bg-background p-3">
          {allTags.map((tag) => (
            <label key={tag.id} className="flex items-center gap-2 text-sm text-foreground">
              <input
                type="checkbox"
                checked={selectedIds.has(tag.id)}
                onChange={() => toggle(tag.id)}
              />
              {tag.name}
            </label>
          ))}
        </div>
      )}

      <div className="flex gap-2">
        <input
          value={newTagName}
          onChange={(e) => setNewTagName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleAddTag();
            }
          }}
          placeholder="New tag name"
          disabled={isPending}
          className="flex-1 border border-line bg-background px-3 py-1.5 text-sm"
        />
        <button
          type="button"
          onClick={handleAddTag}
          disabled={isPending || !newTagName.trim()}
          className="shrink-0 border border-line px-3 py-1.5 text-xs font-medium uppercase tracking-wide text-foreground transition-colors hover:border-foreground disabled:opacity-50"
        >
          {isPending ? "Adding…" : "+ Add tag"}
        </button>
      </div>
      {error && <span className="text-xs text-red-700">{error}</span>}
    </div>
  );
}
