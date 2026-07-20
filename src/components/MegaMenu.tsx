"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import type { Category } from "@/lib/products";
import type { MenuColumn as MenuColumnData } from "@/lib/menu";

// Shared by both dropdown variants below: hover opens/closes the panel for
// mouse users, but the trigger button also toggles on click and closes on
// Escape or an outside click, so keyboard-only users (who can't hover) can
// still open, navigate, and dismiss the menu.
function useMenuDisclosure() {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open]);

  return { open, setOpen, containerRef };
}

export function MegaMenu({
  categories,
  categoriesLabel,
  extraColumns = [],
}: {
  categories: Category[];
  categoriesLabel?: string;
  extraColumns?: MenuColumnData[];
}) {
  const t = useTranslations("nav");

  return <CategoriesDropdown label={categoriesLabel ?? t("categories")} categories={categories} />;
}

export function MegaMenuColumns({
  categories,
  extraColumns = [],
}: {
  categories: Category[];
  extraColumns?: MenuColumnData[];
}) {
  const topLevelCategories = categories;

  return (
    <nav className="hidden items-center gap-8 text-sm font-normal tracking-normal text-foreground sm:flex">
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
  );
}

function CategoriesDropdown({
  label,
  categories,
}: {
  label: string;
  categories: Category[];
}) {
  const { open, setOpen, containerRef } = useMenuDisclosure();

  if (categories.length === 0) return null;

  return (
    <div
      ref={containerRef}
      className="relative"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-haspopup="true"
        aria-expanded={open}
        className="flex items-center gap-2 rounded-full py-2 text-sm font-normal tracking-normal text-foreground transition-colors hover:text-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
      >
        {label} <MenuIcon />
      </button>

      {open && (
        <div className="absolute left-0 top-full z-50 w-52 rounded-lg border border-line bg-background p-3 shadow-md">
          <ul className="space-y-0.5">
            {categories.map((category) => (
              <li key={category.id}>
                <Link
                  href={`/products?category=${category.slug}`}
                  className="block rounded-lg px-3 py-2 text-sm font-medium text-foreground transition-all duration-200 ease-out hover:translate-x-1.5 hover:text-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                >
                  {category.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function ColumnDropdown({ column }: { column: MenuColumnData }) {
  const { open, setOpen, containerRef } = useMenuDisclosure();

  // A column with exactly one item has nothing to disclose -- render it as
  // a plain link instead of a dropdown trigger with an empty-feeling
  // chevron, matching how single-destination nav items (e.g. "Promo") read
  // on reference sites like douglas.it.
  if (column.items.length === 1) {
    const [item] = column.items;
    return (
      <Link
        href={item.href}
        className="flex items-center gap-1 rounded-full py-2 text-sm font-normal tracking-normal transition-colors hover:text-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
      >
        {column.title}
      </Link>
    );
  }

  return (
    <div
      ref={containerRef}
      className="relative"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-haspopup="true"
        aria-expanded={open}
        className="flex items-center gap-1 rounded-full py-2 text-sm font-normal tracking-normal transition-colors hover:text-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
      >
        {column.title}
        <ChevronDownIcon />
      </button>

      {open && column.items.length > 0 && (
        <div className="absolute left-0 top-full z-50 w-56 rounded-lg border border-line bg-background p-4 shadow-md">
          <ul className="space-y-2 normal-case tracking-normal text-muted">
            {column.items.map((item) => (
              <li key={item.id}>
                <Link
                  href={item.href}
                  className="block rounded transition-colors hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
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

