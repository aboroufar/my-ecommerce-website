"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useTranslations, useLocale } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { formatPrice, getSaleInfo } from "@/lib/format";

interface SearchResult {
  id: string;
  name: string;
  slug: string;
  price_cents: number;
  compare_at_price_cents: number | null;
  currency: string;
  imageUrl: string | null;
}

// Live, in-place search: results render in a dropdown under the header
// input as the user types, no navigation required to see them. Enter (or
// "view all results") still goes to /search for the full grid.
export function InlineSearch() {
  const t = useTranslations("searchBox");
  const locale = useLocale();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [total, setTotal] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed) {
      setResults([]);
      setTotal(0);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    const timer = setTimeout(() => {
      fetch(`/api/search?q=${encodeURIComponent(trimmed)}`)
        .then((res) => res.json())
        .then((body) => {
          setResults(body.products ?? []);
          setTotal(body.total ?? 0);
        })
        .catch(() => {
          setResults([]);
          setTotal(0);
        })
        .finally(() => setIsLoading(false));
    }, 250);
    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function goToFullResults() {
    const trimmed = query.trim();
    setIsOpen(false);
    router.push(trimmed ? `/search?q=${encodeURIComponent(trimmed)}` : "/search");
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    goToFullResults();
  }

  function handleResultClick() {
    setIsOpen(false);
    setQuery("");
  }

  const trimmedQuery = query.trim();
  const showDropdown = isOpen && trimmedQuery.length > 0;

  return (
    <div ref={containerRef} className="relative hidden w-full sm:block">
      <form onSubmit={handleSubmit}>
        <div className="flex items-center gap-3 rounded-full bg-surface px-5 py-2.5 text-sm text-foreground transition-colors focus-within:ring-2 focus-within:ring-accent/40">
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setIsOpen(true)}
            placeholder={t("placeholder")}
            aria-label={t("search")}
            className="w-full flex-1 bg-transparent text-sm text-foreground placeholder:text-muted focus:outline-none"
          />
          <button
            type="submit"
            aria-label={t("search")}
            className="flex shrink-0 items-center justify-center text-foreground transition-opacity hover:opacity-70"
          >
            <SearchIcon />
          </button>
        </div>
      </form>

      {showDropdown && (
        <div className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-2xl border border-line bg-background shadow-lg">
          {isLoading ? (
            <p className="px-5 py-6 text-center text-sm text-muted">{t("searching")}</p>
          ) : results.length === 0 ? (
            <p className="px-5 py-6 text-center text-sm text-muted">
              {t("noneFoundFor", { query: trimmedQuery })}
            </p>
          ) : (
            <>
              <ul>
                {results.map((product) => {
                  const sale = getSaleInfo(product.price_cents, product.compare_at_price_cents);
                  return (
                    <li key={product.id}>
                      <a
                        href={`/${locale}/products/${product.slug}`}
                        onClick={(e) => {
                          e.preventDefault();
                          handleResultClick();
                          router.push(`/products/${product.slug}`);
                        }}
                        className="flex items-center gap-3 px-5 py-3 transition-colors hover:bg-surface"
                      >
                        <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-surface">
                          {product.imageUrl ? (
                            <Image
                              src={product.imageUrl}
                              alt={product.name}
                              width={48}
                              height={48}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="flex h-full items-center justify-center font-display text-sm text-accent/40">
                              {product.name.charAt(0)}
                            </div>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-foreground">
                            {product.name}
                          </p>
                        </div>
                        <div className="shrink-0 text-right">
                          {sale.onSale && (
                            <p className="text-xs text-muted line-through">
                              {formatPrice(product.compare_at_price_cents!, product.currency, locale)}
                            </p>
                          )}
                          <p className="text-sm font-semibold text-foreground">
                            {formatPrice(product.price_cents, product.currency, locale)}
                          </p>
                        </div>
                      </a>
                    </li>
                  );
                })}
              </ul>
              <button
                type="button"
                onClick={goToFullResults}
                className="block w-full border-t border-line px-5 py-3 text-center text-xs font-medium uppercase tracking-wide text-foreground transition-colors hover:bg-surface"
              >
                {t("viewAllResults", { count: total })}
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-4 w-4">
      <circle cx="11" cy="11" r="7" />
      <path d="m21 21-4.3-4.3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
