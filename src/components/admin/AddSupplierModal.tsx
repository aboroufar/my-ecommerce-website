"use client";

import { useState, useTransition } from "react";
import { createSupplierInline } from "@/lib/actions/suppliers";

/**
 * Quick supplier creation from inside the purchase order form -- only
 * asks for Company (every other supplier field can be filled in later
 * from /admin/suppliers), mirroring DiscountTypeModal's backdrop-modal
 * pattern. Reports the new supplier back to the parent so it can be
 * selected immediately without leaving the PO form.
 */
export function AddSupplierModal({
  onCreated,
}: {
  onCreated: (supplier: { id: string; company: string }) => void;
}) {
  const [open, setOpen] = useState(false);
  const [company, setCompany] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function close() {
    setOpen(false);
    setCompany("");
    setError(null);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = company.trim();
    if (!trimmed) return;
    setError(null);
    startTransition(async () => {
      const result = await createSupplierInline(trimmed);
      if ("error" in result) {
        setError(result.error);
        return;
      }
      onCreated(result);
      close();
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-left text-xs text-accent underline underline-offset-4"
      >
        + Create new supplier
      </button>

      {open && (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm border border-line bg-surface">
            <div className="flex items-center justify-between border-b border-line px-5 py-4">
              <h2 className="font-display text-lg text-foreground">Create supplier</h2>
              <button
                type="button"
                onClick={close}
                className="text-muted hover:text-foreground"
                aria-label="Close"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleSubmit} className="px-5 py-4">
              <label className="flex flex-col gap-1.5">
                <span className="text-sm text-foreground">Company</span>
                <input
                  autoFocus
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  disabled={isPending}
                  className="border border-line bg-background px-3 py-2 text-sm"
                />
              </label>
              {error && <p className="mt-2 text-xs text-red-700">{error}</p>}
              <p className="mt-2 text-xs text-muted">
                Add contact info, address, and payment terms later from Suppliers.
              </p>
              <div className="mt-4 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={close}
                  className="text-sm text-muted underline underline-offset-4 hover:text-foreground"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending || !company.trim()}
                  className="bg-accent px-4 py-2 text-xs font-medium uppercase tracking-wide text-background transition-opacity hover:opacity-90 disabled:opacity-50"
                >
                  {isPending ? "Creating…" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
