"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function BlogSearchBox({ initialQuery = "" }: { initialQuery?: string }) {
  const router = useRouter();
  const [query, setQuery] = useState(initialQuery);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = query.trim();
    router.push(trimmed ? `/blog?q=${encodeURIComponent(trimmed)}` : "/blog");
  }

  return (
    <form onSubmit={handleSubmit} className="relative w-full">
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search posts…"
        className="w-full border border-line bg-background px-4 py-2.5 pr-11 text-sm text-foreground placeholder:text-muted focus:border-foreground focus:outline-none focus:ring-2 focus:ring-accent/40"
      />
      <button
        type="submit"
        aria-label="Search"
        className="absolute right-0 top-0 flex h-full w-10 items-center justify-center text-foreground transition-opacity hover:opacity-70"
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
