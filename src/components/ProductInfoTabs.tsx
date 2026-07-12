"use client";

import { useState } from "react";

interface Tab {
  label: string;
  content: React.ReactNode;
}

/**
 * Simple two-panel tabbed section (Description / Additional information).
 * No tabs library in this codebase and none needed for two static panels
 * -- plain local state for the active index.
 */
export function ProductInfoTabs({ tabs }: { tabs: Tab[] }) {
  const [active, setActive] = useState(0);

  if (tabs.length === 0) return null;

  return (
    <div className="mt-16 border-t border-line pt-8">
      <div className="flex gap-8 border-b border-line">
        {tabs.map((tab, i) => (
          <button
            key={tab.label}
            type="button"
            onClick={() => setActive(i)}
            className={`-mb-px border-b-2 pb-3 text-sm font-medium transition-colors ${
              active === i
                ? "border-foreground text-foreground"
                : "border-transparent text-muted hover:text-foreground"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className="pt-6 text-sm leading-relaxed text-muted">
        {tabs[active].content}
      </div>
    </div>
  );
}
