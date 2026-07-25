"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { setOrderNote } from "@/lib/actions/orderNotesAndTags";

/**
 * Order detail page's "Notes" sidebar card -- a single freeform field
 * (matching Shopify's own Notes card), shown as static text with a
 * pencil-icon edit trigger, or "No notes from customer" when empty.
 * Distinct from OrderCommentForm/Timeline, which is a running log.
 */
export function OrderNoteEditor({ orderId, notes }: { orderId: string; notes: string | null }) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(notes ?? "");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleSave() {
    setError(null);
    startTransition(async () => {
      const result = await setOrderNote(orderId, value.trim());
      if ("error" in result) {
        setError(result.error);
        return;
      }
      setEditing(false);
      router.refresh();
    });
  }

  function handleCancel() {
    setValue(notes ?? "");
    setError(null);
    setEditing(false);
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-medium uppercase tracking-wide text-muted">Notes</h2>
        {!editing && (
          <button
            type="button"
            onClick={() => setEditing(true)}
            aria-label="Edit notes"
            className="text-muted transition-colors hover:text-foreground"
          >
            <PencilIcon className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {editing ? (
        <div className="mt-3">
          <textarea
            value={value}
            onChange={(e) => setValue(e.target.value)}
            rows={3}
            autoFocus
            disabled={isPending}
            className="w-full border border-line bg-background px-2 py-1.5 text-sm text-foreground focus:outline-none"
          />
          {error && <p className="mt-1 text-xs text-red-700">{error}</p>}
          <div className="mt-2 flex gap-3">
            <button
              type="button"
              onClick={handleSave}
              disabled={isPending}
              className="bg-accent px-3 py-1.5 text-xs font-medium uppercase tracking-wide text-background transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {isPending ? "Saving…" : "Save"}
            </button>
            <button
              type="button"
              onClick={handleCancel}
              disabled={isPending}
              className="text-xs text-muted underline underline-offset-4 hover:text-foreground"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <p className="mt-3 whitespace-pre-wrap text-sm text-foreground">
          {notes || <span className="text-muted">No notes from customer</span>}
        </p>
      )}
    </div>
  );
}

function PencilIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className={className}>
      <path
        d="M4 20h4l10.5-10.5a2.1 2.1 0 0 0-3-3L5 17v3Z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
