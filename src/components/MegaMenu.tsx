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
  const [openSlug, setOpenSlug] = useState<string | null>(null);

  const topLevelCategories = categories.filter((c) => !c.parent_id);
  const childrenByParent = new Map<string, Category[]>();
  for (const c of categories) {
    if (!c.parent_id) continue;
    const siblings = childrenByParent.get(c.parent_id) ?? [];
    siblings.push(c);
    childrenByParent.set(c.parent_id, siblings);
  }

  const items = [
    ...topLevelCategories.map((c) => ({ slug: c.slug, label: c.name })),
    { slug: "__shop-all", label: "Shop" },
  ];

  const openItem = items.find((i) => i.slug === openSlug) ?? null;

  return (
    <div className="relative" onMouseLeave={() => setOpenSlug(null)}>
      <nav className="hidden items-center gap-8 text-xs font-medium uppercase tracking-wide text-foreground sm:flex">
        {items.map((item) => {
          const isShopAll = item.slug === "__shop-all";
          const href = isShopAll ? "/products" : `/products?category=${item.slug}`;
          const isOpen = openSlug === item.slug;

          return (
            <Link
              key={item.slug}
              href={href}
              onMouseEnter={() => setOpenSlug(item.slug)}
              className={`flex items-center gap-1 py-2 transition-colors hover:text-accent ${
                isOpen ? "text-accent" : ""
              }`}
            >
              {item.label}
              <ChevronIcon />
            </Link>
          );
        })}
      </nav>

      {openItem && (
        <div className="absolute right-0 top-full z-50 w-[min(90vw,760px)] border border-line bg-background shadow-lg">
          <div
            className="grid grid-cols-1 gap-8 p-8"
            style={{
              gridTemplateColumns: `220px repeat(${1 + extraColumns.length}, 1fr)`,
            }}
          >
            <div className="relative flex aspect-[4/3] items-end bg-surface p-4">
              <span className="border border-background/80 px-4 py-2 text-[10px] font-medium uppercase tracking-wide text-background">
                Find your routine
              </span>
            </div>

            <div>
              <h3 className="font-display text-base font-bold normal-case tracking-normal text-foreground">
                {categoriesLabel}
              </h3>
              <ul className="mt-3 space-y-3 normal-case tracking-normal text-muted">
                {topLevelCategories.map((category) => {
                  const children = childrenByParent.get(category.id) ?? [];
                  return (
                    <li key={category.id}>
                      <Link
                        href={`/products?category=${category.slug}`}
                        className="font-medium text-foreground transition-colors hover:text-accent"
                      >
                        {category.name}
                      </Link>
                      {children.length > 0 && (
                        <ul className="mt-1.5 space-y-1.5 border-l border-line pl-3">
                          {children.map((child) => (
                            <li key={child.id}>
                              <Link
                                href={`/products?category=${child.slug}`}
                                className="transition-colors hover:text-foreground"
                              >
                                {child.name}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
            {extraColumns.map((column) => (
              <MenuColumn
                key={column.id}
                title={column.title}
                links={column.items.map((item) => ({
                  label: item.label,
                  href: item.href,
                }))}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function MenuColumn({
  title,
  links,
}: {
  title: string;
  links: { label: string; href: string }[];
}) {
  return (
    <div>
      <h3 className="font-display text-base font-bold normal-case tracking-normal text-foreground">
        {title}
      </h3>
      <ul className="mt-3 space-y-2 normal-case tracking-normal text-muted">
        {links.map((link) => (
          <li key={link.label}>
            <Link href={link.href} className="transition-colors hover:text-foreground">
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ChevronIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3 w-3">
      <path d="m6 9 6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
