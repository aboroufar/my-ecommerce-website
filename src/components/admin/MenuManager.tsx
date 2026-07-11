"use client";

import { useState } from "react";
import Link from "next/link";
import {
  createMenuColumn,
  updateMenuColumn,
  deleteMenuColumn,
  toggleMenuColumn,
  moveMenuColumn,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
  moveMenuItem,
} from "@/lib/actions/menu";
import { updateCategoriesMenuLabel } from "@/lib/actions/siteSettings";

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

interface Category {
  id: string;
  name: string;
  slug: string;
  parent_id: string | null;
}

export function MenuManager({
  columns,
  categories,
  categoriesMenuLabel,
}: {
  columns: MenuColumn[];
  categories: Category[];
  categoriesMenuLabel: string;
}) {
  const [addingColumn, setAddingColumn] = useState(false);
  const [editingLabel, setEditingLabel] = useState(false);

  return (
    <div className="max-w-4xl">
      {editingLabel ? (
        <form
          action={updateCategoriesMenuLabel}
          className="mb-4 flex max-w-sm items-end gap-2"
        >
          <label className="flex flex-1 flex-col gap-1.5">
            <span className="text-xs text-muted">Categories column label</span>
            <input
              name="categories_menu_label"
              defaultValue={categoriesMenuLabel}
              required
              autoFocus
              className="border border-line bg-surface px-3 py-2 text-sm"
            />
          </label>
          <button
            type="submit"
            className="bg-accent px-4 py-2 text-xs font-medium uppercase tracking-wide text-background transition-opacity hover:opacity-90"
          >
            Save
          </button>
          <button
            type="button"
            onClick={() => setEditingLabel(false)}
            className="px-4 py-2 text-xs font-medium uppercase tracking-wide text-muted hover:text-foreground"
          >
            Cancel
          </button>
        </form>
      ) : (
        <button
          type="button"
          onClick={() => setEditingLabel(true)}
          className="mb-4 text-xs font-medium uppercase tracking-wide text-muted transition-colors hover:text-foreground"
        >
          Categories column label:{" "}
          <span className="text-foreground underline underline-offset-4">
            {categoriesMenuLabel}
          </span>
        </button>
      )}

      <p className="mb-4 text-xs font-medium uppercase tracking-wide text-muted">
        This is how the header dropdown will look
      </p>
      <div className="flex flex-wrap items-start gap-6 border border-line bg-surface p-6">
        <CategoryColumnPreview categories={categories} label={categoriesMenuLabel} />
        {columns.map((column, i) => (
          <ColumnEditor
            key={column.id}
            column={column}
            index={i}
            total={columns.length}
          />
        ))}
      </div>

      {addingColumn ? (
        <form
          action={createMenuColumn}
          className="mt-6 flex max-w-md items-end gap-2 border border-line bg-surface p-4"
        >
          <label className="flex flex-1 flex-col gap-1.5">
            <span className="text-xs text-muted">New column title</span>
            <input
              name="title"
              required
              placeholder="e.g. Concern, Collection"
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
          className="mt-6 border border-dashed border-line px-4 py-2 text-xs font-medium uppercase tracking-wide text-muted transition-colors hover:border-foreground hover:text-foreground"
        >
          + Add column
        </button>
      )}
    </div>
  );
}

function renderPreviewRow(
  c: Category,
  childrenByParent: Map<string, Category[]>
) {
  const children = childrenByParent.get(c.id) ?? [];
  return (
    <li key={c.id}>
      <span className="text-foreground">{c.name}</span>
      {children.length > 0 && (
        <ul className="mt-1 space-y-1 border-l border-line pl-3">
          {children.map((child) => renderPreviewRow(child, childrenByParent))}
        </ul>
      )}
    </li>
  );
}

function CategoryColumnPreview({
  categories,
  label,
}: {
  categories: Category[];
  label: string;
}) {
  const topLevel = categories.filter((c) => !c.parent_id);
  const childrenByParent = new Map<string, Category[]>();
  for (const c of categories) {
    if (!c.parent_id) continue;
    const siblings = childrenByParent.get(c.parent_id) ?? [];
    siblings.push(c);
    childrenByParent.set(c.parent_id, siblings);
  }

  return (
    <div className="w-56 shrink-0 border border-line bg-background p-4">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-sm font-bold text-foreground">
          {label}
        </h3>
        <span className="text-[10px] uppercase tracking-wide text-muted">
          Auto
        </span>
      </div>
      <p className="mt-1 text-xs text-muted">
        Built automatically from your{" "}
        <Link href="/admin/categories" className="text-accent underline underline-offset-4 hover:opacity-80">
          Categories page
        </Link>
        .
      </p>
      <ul className="mt-3 space-y-2 text-sm text-muted">
        {topLevel.length === 0 ? (
          <li className="italic">No categories yet</li>
        ) : (
          topLevel.map((c) => renderPreviewRow(c, childrenByParent))
        )}
      </ul>
    </div>
  );
}

function ColumnEditor({
  column,
  index,
  total,
}: {
  column: MenuColumn;
  index: number;
  total: number;
}) {
  const [editingTitle, setEditingTitle] = useState(false);
  const [addingItem, setAddingItem] = useState(false);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);

  return (
    <div
      className={`w-56 shrink-0 border bg-background p-4 ${
        column.enabled ? "border-line" : "border-dashed border-line opacity-50"
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <form action={moveMenuColumn.bind(null, column.id, "up")}>
            <button
              type="submit"
              disabled={index === 0}
              aria-label="Move column left"
              className="text-xs text-muted transition-colors hover:text-foreground disabled:opacity-30"
            >
              ←
            </button>
          </form>
          <form action={moveMenuColumn.bind(null, column.id, "down")}>
            <button
              type="submit"
              disabled={index === total - 1}
              aria-label="Move column right"
              className="text-xs text-muted transition-colors hover:text-foreground disabled:opacity-30"
            >
              →
            </button>
          </form>
        </div>
        <form action={toggleMenuColumn.bind(null, column.id, !column.enabled)}>
          <button
            type="submit"
            role="switch"
            aria-checked={column.enabled}
            aria-label={`${column.enabled ? "Disable" : "Enable"} ${column.title}`}
            className={`h-4 w-7 shrink-0 rounded-full transition-colors ${
              column.enabled ? "bg-accent" : "bg-line"
            }`}
          >
            <span
              className={`block h-3 w-3 translate-y-0.5 rounded-full bg-background transition-transform ${
                column.enabled ? "translate-x-3.5" : "translate-x-0.5"
              }`}
            />
          </button>
        </form>
      </div>

      {editingTitle ? (
        <form
          action={updateMenuColumn.bind(null, column.id)}
          className="mt-2 flex gap-1"
        >
          <input
            name="title"
            defaultValue={column.title}
            required
            autoFocus
            className="w-full border border-line bg-surface px-2 py-1 text-sm"
          />
          <button type="submit" className="text-xs text-foreground underline">
            Save
          </button>
        </form>
      ) : (
        <button
          type="button"
          onClick={() => setEditingTitle(true)}
          className="mt-2 block font-display text-sm font-bold text-foreground hover:underline"
        >
          {column.title}
        </button>
      )}

      <ul className="mt-3 space-y-2">
        {column.items.map((item, i) =>
          editingItemId === item.id ? (
            <li key={item.id}>
              <ItemForm
                item={item}
                action={updateMenuItem.bind(null, item.id)}
                onDone={() => setEditingItemId(null)}
              />
            </li>
          ) : (
            <li key={item.id} className="group text-sm">
              <div className="flex items-start justify-between gap-1">
                <button
                  type="button"
                  onClick={() => setEditingItemId(item.id)}
                  className="text-left text-foreground hover:underline"
                >
                  {item.label}
                  <span className="block text-[10px] text-muted">
                    → {item.href}
                  </span>
                </button>
                <div className="flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                  <form action={moveMenuItem.bind(null, item.id, column.id, "up")}>
                    <button
                      type="submit"
                      disabled={i === 0}
                      aria-label="Move up"
                      className="text-xs text-muted hover:text-foreground disabled:opacity-30"
                    >
                      ↑
                    </button>
                  </form>
                  <form action={moveMenuItem.bind(null, item.id, column.id, "down")}>
                    <button
                      type="submit"
                      disabled={i === column.items.length - 1}
                      aria-label="Move down"
                      className="text-xs text-muted hover:text-foreground disabled:opacity-30"
                    >
                      ↓
                    </button>
                  </form>
                  <form action={deleteMenuItem.bind(null, item.id)}>
                    <button
                      type="submit"
                      aria-label="Delete"
                      className="text-xs text-red-700 hover:text-red-800"
                    >
                      ×
                    </button>
                  </form>
                </div>
              </div>
            </li>
          )
        )}
      </ul>

      {addingItem ? (
        <div className="mt-3">
          <ItemForm
            action={createMenuItem}
            columnId={column.id}
            onDone={() => setAddingItem(false)}
          />
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setAddingItem(true)}
          className="mt-3 text-xs font-medium uppercase tracking-wide text-muted transition-colors hover:text-foreground"
        >
          + Add link
        </button>
      )}

      <form action={deleteMenuColumn.bind(null, column.id)} className="mt-4 border-t border-line pt-2">
        <button
          type="submit"
          className="text-xs text-red-700 underline underline-offset-4 hover:text-red-800"
        >
          Delete column
        </button>
      </form>
    </div>
  );
}

function ItemForm({
  item,
  columnId,
  action,
  onDone,
}: {
  item?: MenuItem;
  columnId?: string;
  action: (formData: FormData) => void;
  onDone: () => void;
}) {
  return (
    <form action={action} className="space-y-1.5 border border-line bg-surface p-2">
      {columnId && <input type="hidden" name="column_id" value={columnId} />}
      <input
        name="label"
        defaultValue={item?.label}
        required
        placeholder="Label"
        autoFocus
        className="w-full border border-line bg-background px-2 py-1 text-xs"
      />
      <input
        name="href"
        defaultValue={item?.href}
        required
        placeholder="/products"
        className="w-full border border-line bg-background px-2 py-1 text-xs"
      />
      <div className="flex gap-2">
        <button
          type="submit"
          className="bg-accent px-2 py-1 text-[10px] font-medium uppercase tracking-wide text-background"
        >
          Save
        </button>
        <button
          type="button"
          onClick={onDone}
          className="text-[10px] font-medium uppercase tracking-wide text-muted hover:text-foreground"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
