"use client";

import { useState } from "react";
import Link from "next/link";
import type { Category } from "@/lib/products";

// TODO: this store's schema only has a flat `categories` table (Category
// column below). Concern/Product are presentational placeholders matching
// the reference design's taxonomy -- wire these to real data (or drop them)
// once/if this store needs that kind of faceted browsing.
const placeholderConcerns = ["New arrivals", "Best sellers", "Gifting"];
const placeholderProductTypes = ["Apparel", "Accessories", "Home"];

export function MegaMenu({ categories }: { categories: Category[] }) {
  const [openSlug, setOpenSlug] = useState<string | null>(null);

  const items = [
    ...categories.map((c) => ({ slug: c.slug, label: c.name })),
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
          <div className="grid grid-cols-1 gap-8 p-8 sm:grid-cols-[220px_1fr_1fr_1fr]">
            <div className="relative flex aspect-[4/3] items-end bg-surface p-4">
              <span className="border border-background/80 px-4 py-2 text-[10px] font-medium uppercase tracking-wide text-background">
                Find your routine
              </span>
            </div>

            <MenuColumn
              title="Category"
              links={items
                .filter((i) => i.slug !== "__shop-all")
                .map((i) => ({
                  label: i.label,
                  href: `/products?category=${i.slug}`,
                }))}
            />
            <MenuColumn
              title="Concern"
              links={placeholderConcerns.map((label) => ({
                label,
                href: "/products",
              }))}
            />
            <MenuColumn
              title="Product"
              links={placeholderProductTypes.map((label) => ({
                label,
                href: "/products",
              }))}
            />
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
