"use client";

import { useState, useTransition } from "react";
import { createTagInline } from "@/lib/actions/tags";

export interface TagOption {
  id: string;
  name: string;
}

/**
 * Lets an admin check existing tags AND create a brand-new one without
 * leaving the product form -- createTagInline returns the new tag instead
 * of redirecting (unlike createTag, used by /admin/tags's own form), so it
 * can be added to this component's local list and pre-checked without
 * losing any other in-progress edits on the page.
 */
export function TagChecklist({
  tags,
  checkedIds,
}: {
  tags: TagOption[];
  checkedIds?: string[];
}) {
  const [allTags, setAllTags] = useState(tags);
  const [checked, setChecked] = useState(new Set(checkedIds ?? []));
  const [newTagName, setNewTagName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function toggle(id: string) {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function handleAddTag() {
    const name = newTagName.trim();
    if (!name) return;
    setError(null);
    startTransition(async () => {
      const result = await createTagInline(name);
      if ("error" in result) {
        setError(result.error);
        return;
      }
      setAllTags((prev) => [...prev, result].sort((a, b) => a.name.localeCompare(b.name)));
      setChecked((prev) => new Set(prev).add(result.id));
      setNewTagName("");
    });
  }

  return (
    <div className="flex flex-col gap-3">
      {allTags.length === 0 ? (
        <p className="text-sm text-muted">No tags yet -- add one below.</p>
      ) : (
        <div className="flex flex-wrap gap-x-4 gap-y-2 rounded-md border border-line bg-background p-3">
          {allTags.map((tag) => (
            <label key={tag.id} className="flex items-center gap-2 text-sm text-foreground">
              <input
                type="checkbox"
                name="tag_ids"
                value={tag.id}
                checked={checked.has(tag.id)}
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
          className="flex-1 rounded-md border border-line bg-transparent px-3 py-1.5 text-sm"
        />
        <button
          type="button"
          onClick={handleAddTag}
          disabled={isPending || !newTagName.trim()}
          className="shrink-0 rounded-md border border-line px-3 py-1.5 text-xs font-medium uppercase tracking-wide text-foreground transition-colors hover:border-foreground disabled:opacity-50"
        >
          {isPending ? "Adding…" : "+ Add tag"}
        </button>
      </div>
      {error && <span className="text-xs text-red-700">{error}</span>}
    </div>
  );
}
