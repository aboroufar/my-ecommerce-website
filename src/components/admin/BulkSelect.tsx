"use client";

import { useState } from "react";

/**
 * Client-side checkbox selection for a table of admin rows, paired with a
 * bulk-action form. The form itself (status dropdown, submit button) is
 * passed in as `bulkForm` since its shape differs between products/orders --
 * this component only owns the "which rows are checked" state and injects
 * hidden inputs carrying the selected ids into that form on submit.
 */
export function BulkSelect({
  ids,
  bulkForm,
  children,
}: {
  ids: string[];
  bulkForm: (selected: string[]) => React.ReactNode;
  children: (props: {
    isSelected: (id: string) => boolean;
    toggle: (id: string) => void;
    allSelected: boolean;
    toggleAll: () => void;
  }) => React.ReactNode;
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set());

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    setSelected((prev) => (prev.size === ids.length ? new Set() : new Set(ids)));
  }

  return (
    <div>
      {selected.size > 0 && (
        <div className="mb-4 flex items-center gap-3 border border-line bg-surface px-4 py-3">
          <span className="text-xs text-muted">{selected.size} selected</span>
          {bulkForm([...selected])}
        </div>
      )}

      {children({
        isSelected: (id) => selected.has(id),
        toggle,
        allSelected: ids.length > 0 && selected.size === ids.length,
        toggleAll,
      })}
    </div>
  );
}
