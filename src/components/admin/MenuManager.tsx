"use client";

import { useState } from "react";
import {
  createMenuColumn,
  deleteMenuColumn,
  toggleMenuColumn,
  createMenuItem,
  deleteMenuItem,
} from "@/lib/actions/menu";

interface MenuItem {
  id: string;
  label: string;
  href: string;
}

interface MenuColumn {
  id: string;
  title: string;
  enabled: boolean;
  items: MenuItem[];
}

export function MenuManager({ columns }: { columns: MenuColumn[] }) {
  const [addingColumn, setAddingColumn] = useState(false);

  return (
    <div className="max-w-2xl space-y-6">
      {columns.map((column) => (
        <div key={column.id} className="border border-line p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <form action={toggleMenuColumn.bind(null, column.id, !column.enabled)}>
                <button
                  type="submit"
                  role="switch"
                  aria-checked={column.enabled}
                  aria-label={`${column.enabled ? "Disable" : "Enable"} ${column.title}`}
                  className={`h-5 w-9 shrink-0 rounded-full transition-colors ${
                    column.enabled ? "bg-accent" : "bg-line"
                  }`}
                >
                  <span
                    className={`block h-4 w-4 translate-y-0.5 rounded-full bg-background transition-transform ${
                      column.enabled ? "translate-x-4.5" : "translate-x-0.5"
                    }`}
                  />
                </button>
              </form>
              <h3 className="font-display text-base font-bold text-foreground">
                {column.title}
              </h3>
            </div>
            <form action={deleteMenuColumn.bind(null, column.id)}>
              <button
                type="submit"
                className="text-xs text-red-700 underline underline-offset-4 hover:text-red-800"
              >
                Delete column
              </button>
            </form>
          </div>

          <ul className="mt-4 space-y-2">
            {column.items.map((item) => (
              <li
                key={item.id}
                className="flex items-center justify-between gap-3 text-sm"
              >
                <span className="text-foreground">
                  {item.label}{" "}
                  <span className="text-xs text-muted">→ {item.href}</span>
                </span>
                <form action={deleteMenuItem.bind(null, item.id)}>
                  <button
                    type="submit"
                    className="shrink-0 text-xs text-red-700 underline underline-offset-4 hover:text-red-800"
                  >
                    Delete
                  </button>
                </form>
              </li>
            ))}
          </ul>

          <form
            action={createMenuItem}
            className="mt-4 flex flex-wrap items-end gap-2"
          >
            <input type="hidden" name="column_id" value={column.id} />
            <label className="flex flex-col gap-1">
              <span className="text-xs text-muted">Label</span>
              <input
                name="label"
                required
                placeholder="New arrivals"
                className="border border-line bg-transparent px-2 py-1.5 text-sm"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs text-muted">Link</span>
              <input
                name="href"
                required
                placeholder="/products"
                className="border border-line bg-transparent px-2 py-1.5 text-sm"
              />
            </label>
            <button
              type="submit"
              className="bg-accent px-3 py-1.5 text-xs font-medium text-background transition-opacity hover:opacity-90"
            >
              + Add link
            </button>
          </form>
        </div>
      ))}

      {addingColumn ? (
        <form
          action={createMenuColumn}
          className="flex items-end gap-2 border border-line bg-surface p-4"
        >
          <label className="flex flex-1 flex-col gap-1.5">
            <span className="text-xs text-muted">Column title</span>
            <input
              name="title"
              required
              placeholder="Concern"
              autoFocus
              className="border border-line bg-background px-3 py-2 text-sm"
            />
          </label>
          <button
            type="submit"
            className="bg-accent px-4 py-2 text-xs font-medium uppercase tracking-wide text-background transition-opacity hover:opacity-90"
          >
            Add
          </button>
          <button
            type="button"
            onClick={() => setAddingColumn(false)}
            className="px-4 py-2 text-xs font-medium uppercase tracking-wide text-muted hover:text-foreground"
          >
            Cancel
          </button>
        </form>
      ) : (
        <button
          type="button"
          onClick={() => setAddingColumn(true)}
          className="border border-dashed border-line px-4 py-2 text-xs font-medium uppercase tracking-wide text-muted transition-colors hover:border-foreground hover:text-foreground"
        >
          + Add column
        </button>
      )}
    </div>
  );
}
