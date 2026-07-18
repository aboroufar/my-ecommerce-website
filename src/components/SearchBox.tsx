"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";

export function SearchBox({ initialQuery = "" }: { initialQuery?: string }) {
  const t = useTranslations("searchBox");
  const router = useRouter();
  const [query, setQuery] = useState(initialQuery);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = query.trim();
    router.push(trimmed ? `/search?q=${encodeURIComponent(trimmed)}` : "/search");
  }

  return (
    <form onSubmit={handleSubmit} className="relative w-full max-w-xl">
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={t("placeholder")}
        autoFocus
        className="w-full border border-line bg-transparent px-4 py-3 pr-12 text-sm text-foreground placeholder:text-muted focus:border-foreground focus:outline-none focus:ring-2 focus:ring-accent/40"
      />
      <button
        type="submit"
        aria-label={t("search")}
        className="absolute right-0 top-0 flex h-full w-12 items-center justify-center text-foreground transition-opacity hover:opacity-70"
      >
        <SearchIcon />
      </button>
    </form>
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
