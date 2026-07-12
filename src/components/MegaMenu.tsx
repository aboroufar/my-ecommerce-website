"use client";

import { useState } from "react";
import Link from "next/link";
import type { Category } from "@/lib/products";
import type { MenuColumn as MenuColumnData } from "@/lib/menu";

export function MegaMenu({
  categories,
  categoriesLabel = "Categories",
  extraColumns = [],
}: {
  categories: Category[];
  categoriesLabel?: string;
  extraColumns?: MenuColumnData[];
}) {
  const topLevelCategories = categories.filter((c) => !c.parent_id);
  const childrenByParent = new Map<string, Category[]>();
  for (const c of categories) {
    if (!c.parent_id) continue;
    const siblings = childrenByParent.get(c.parent_id) ?? [];
    siblings.push(c);
    childrenByParent.set(c.parent_id, siblings);
  }

  return (
    <div className="flex items-center gap-8">
      <CategoriesDropdown
        label={categoriesLabel}
        topLevelCategories={topLevelCategories}
        childrenByParent={childrenByParent}
      />
      <nav className="hidden items-center gap-8 text-xs font-medium uppercase tracking-wide text-foreground sm:flex">
        {extraColumns.map((column) =>
          column.title === "Home" ? (
            <ColumnDropdown
              key={column.id}
              column={{
                ...column,
                items: [
                  ...column.items,
                  ...topLevelCategories.map((category, i) => ({
                    id: `category-${category.id}`,
                    label: `${category.name} Home`,
                    href: `/products?category=${category.slug}`,
                    sort_order: column.items.length + i,
                  })),
                ],
              }}
            />
          ) : (
            <ColumnDropdown key={column.id} column={column} />
          )
        )}
      </nav>
    </div>
  );
}

function CategoriesDropdown({
  label,
  topLevelCategories,
  childrenByParent,
}: {
  label: string;
  topLevelCategories: Category[];
  childrenByParent: Map<string, Category[]>;
}) {
  const [open, setOpen] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(
    topLevelCategories[0]?.id ?? null
  );

  // The active top-level category's direct children are "groups" (e.g.
  // "Face Cream Set"), each rendered as its own column headed by the
  // group name, listing that group's own children (e.g. "Matte
  // Foundation") underneath -- a true 3-level drill-down, not just a
  // flat list chunked into columns.
  const activeGroups = activeId ? childrenByParent.get(activeId) ?? [] : [];

  if (topLevelCategories.length === 0) return null;

  return (
    <div
      className="relative"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        type="button"
        className="flex items-center gap-2 py-2 text-sm font-semibold uppercase tracking-wide text-foreground transition-colors hover:text-accent"
      >
        {label} <MenuIcon />
      </button>

      {open && (
        <div className="absolute left-0 top-full z-50 flex w-max max-w-[95vw] gap-8 rounded-sm bg-background p-6 shadow-xl ring-1 ring-line/60">
          <ul className="w-52 shrink-0 space-y-0.5">
            {topLevelCategories.map((category) => {
              const hasChildren = (childrenByParent.get(category.id) ?? []).length > 0;
              const isActive = activeId === category.id;
              return (
                <li key={category.id} className="relative">
                  <span
                    className={`absolute left-0 top-1/2 h-4 w-0.5 -translate-y-1/2 rounded-full bg-accent transition-all duration-200 ease-out ${
                      isActive ? "opacity-100" : "opacity-0"
                    }`}
                  />
                  <Link
                    href={`/products?category=${category.slug}`}
                    onMouseEnter={() => setActiveId(category.id)}
                    className={`flex items-center justify-between rounded-sm px-3 py-2 text-sm font-medium transition-all duration-200 ease-out ${
                      isActive
                        ? "translate-x-1.5 text-accent"
                        : "text-foreground hover:translate-x-1.5 hover:text-accent"
                    }`}
                  >
                    {category.name}
                    {hasChildren && (
                      <ChevronRightIcon
                        className={`transition-transform duration-200 ease-out ${isActive ? "translate-x-0.5" : ""}`}
                      />
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>

          <div className="flex flex-1 items-start gap-10 border-l border-line/50 pl-8">
            {activeGroups.length === 0 ? (
              <p className="text-sm text-muted">No subcategories yet.</p>
            ) : (
              activeGroups.map((group) => {
                const items = childrenByParent.get(group.id) ?? [];
                return (
                  <div key={group.id} className="w-40 shrink-0">
                    <Link
                      href={`/products?category=${group.slug}`}
                      className="font-display text-sm font-bold normal-case tracking-normal text-foreground transition-colors duration-200 hover:text-accent"
                    >
                      {group.name}
                    </Link>
                    {items.length > 0 && (
                      <ul className="mt-3 space-y-2.5 normal-case tracking-normal text-muted">
                        {items.map((item) => (
                          <li key={item.id}>
                            <Link
                              href={`/products?category=${item.slug}`}
                              className="inline-block text-sm transition-all duration-200 ease-out hover:translate-x-1 hover:text-foreground"
                            >
                              {item.name}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function ColumnDropdown({ column }: { column: MenuColumnData }) {
  const [open, setOpen] = useState(false);

  return (
    <div
      className="relative"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        type="button"
        className="flex items-center gap-1 py-2 transition-colors hover:text-accent"
      >
        {column.title}
        <ChevronDownIcon />
      </button>

      {open && column.items.length > 0 && (
        <div className="absolute left-0 top-full z-50 w-56 border border-line bg-background p-4 shadow-lg">
          <ul className="space-y-2 normal-case tracking-normal text-muted">
            {column.items.map((item) => (
              <li key={item.id}>
                <Link
                  href={item.href}
                  className="block transition-colors hover:text-foreground"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function MenuIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4">
      <path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ChevronDownIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3 w-3">
      <path d="m6 9 6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ChevronRightIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={`h-3.5 w-3.5 text-muted ${className}`}>
      <path d="m9 6 6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
