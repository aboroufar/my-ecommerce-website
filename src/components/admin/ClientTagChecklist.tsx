"use client";

import { useState, useTransition } from "react";
import { createClientTagInline, setClientTags } from "@/lib/actions/clientTags";

export interface TagOption {
  id: string;
  name: string;
}

/**
 * Self-contained tag editor for the client detail page's sidebar -- unlike
 * DiscountTagChecklist (which reports back to a parent form's state for a
 * single page-level submit), the client detail page has no such form, so
 * this saves immediately via setClientTags on every toggle/add, matching
 * how the rest of that page's inline actions (Edit/Delete) work.
 */
export function ClientTagChecklist({
  clientId,
  tags,
  selectedIds,
}: {
  clientId: string;
  tags: TagOption[];
  selectedIds: string[];
}) {
  const [allTags, setAllTags] = useState(tags);
  const [checked, setChecked] = useState(new Set(selectedIds));
  const [newTagName, setNewTagName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function toggle(id: string) {
    const next = new Set(checked);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setChecked(next);
    startTransition(async () => {
      await setClientTags(clientId, Array.from(next));
    });
  }

  function handleAddTag() {
    const name = newTagName.trim();
    if (!name) return;
    setError(null);
    startTransition(async () => {
      const result = await createClientTagInline(name);
      if ("error" in result) {
        setError(result.error);
        return;
      }
      setAllTags((prev) => [...prev, result].sort((a, b) => a.name.localeCompare(b.name)));
      const next = new Set(checked).add(result.id);
      setChecked(next);
      setNewTagName("");
      await setClientTags(clientId, Array.from(next));
    });
  }

  return (
    <div className="flex flex-col gap-2">
      {allTags.length === 0 ? (
        <p className="text-sm text-muted">No tags yet -- add one below.</p>
      ) : (
        <div className="flex flex-wrap gap-x-4 gap-y-2">
          {allTags.map((tag) => (
            <label key={tag.id} className="flex items-center gap-2 text-sm text-foreground">
              <input
                type="checkbox"
                checked={checked.has(tag.id)}
                onChange={() => toggle(tag.id)}
                disabled={isPending}
              />
              {tag.name}
            </label>
          ))}
        </div>
      )}

      <div className="mt-1 flex gap-2">
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
          className="flex-1 border border-line bg-background px-2 py-1 text-xs"
        />
        <button
          type="button"
          onClick={handleAddTag}
          disabled={isPending || !newTagName.trim()}
          className="shrink-0 border border-line px-2 py-1 text-xs font-medium uppercase tracking-wide text-foreground transition-colors hover:border-foreground disabled:opacity-50"
        >
          + Add
        </button>
      </div>
      {error && <span className="text-xs text-red-700">{error}</span>}
    </div>
  );
}
