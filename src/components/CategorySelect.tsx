"use client";

import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import type { Category } from "@/lib/products";

/**
 * "Choose Categories" dropdown -- flattens the category tree into a single
 * select (top-level categories indented-free, children prefixed) since a
 * dropdown can't render the nested tree the old always-expanded sidebar
 * list did. Selecting an option navigates with ?category=<slug>.
 */
export function CategorySelect({
  categories,
  activeSlug,
}: {
  categories: Category[];
  activeSlug?: string;
}) {
  const t = useTranslations("shopSidebar");
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const topLevel = categories.filter((c) => !c.parent_id);
  const childrenByParent = new Map<string, Category[]>();
  for (const c of categories) {
    if (!c.parent_id) continue;
    const siblings = childrenByParent.get(c.parent_id) ?? [];
    siblings.push(c);
    childrenByParent.set(c.parent_id, siblings);
  }

  const options: { slug: string; label: string }[] = [];
  for (const top of topLevel) {
    options.push({ slug: top.slug, label: top.name });
    for (const child of childrenByParent.get(top.id) ?? []) {
      options.push({ slug: child.slug, label: `— ${child.name}` });
    }
  }

  function handleChange(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set("category", value);
    else params.delete("category");
    router.push(`${pathname}?${params.toString()}`);
  }

  if (options.length === 0) return null;

  return (
    <div className="mt-8">
      <h2 className="font-display text-base font-bold text-foreground">{t("chooseCategories")}</h2>
      <div className="relative mt-3">
        <select
          value={activeSlug ?? ""}
          onChange={(e) => handleChange(e.target.value)}
          className="w-full appearance-none rounded-lg border border-line bg-surface px-4 py-2.5 pr-9 text-sm text-foreground focus:border-foreground focus:outline-none"
        >
          <option value="">{t("allProducts")}</option>
          {options.map((option) => (
            <option key={option.slug} value={option.slug}>
              {option.label}
            </option>
          ))}
        </select>
        <ChevronIcon />
      </div>
    </div>
  );
}

function ChevronIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className="pointer-events-none absolute right-3 top-1/2 h-3 w-3 -translate-y-1/2 text-muted"
      aria-hidden
    >
      <path d="m6 9 6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
