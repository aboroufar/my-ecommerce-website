"use client";

import { useId, useState } from "react";

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
  const tabIdPrefix = useId();

  if (tabs.length === 0) return null;

  return (
    <div className="mt-16 border-t border-line pt-8">
      <div className="flex gap-6 overflow-x-auto border-b border-line" role="tablist" aria-label="Product information">
        {tabs.map((tab, i) => (
          <button
            key={`${tabIdPrefix}-${tab.label}`}
            type="button"
            onClick={() => setActive(i)}
            onKeyDown={(event) => {
              if (event.key === "ArrowRight") setActive((active + 1) % tabs.length);
              if (event.key === "ArrowLeft") setActive((active - 1 + tabs.length) % tabs.length);
              if (event.key === "Home") setActive(0);
              if (event.key === "End") setActive(tabs.length - 1);
            }}
            id={`${tabIdPrefix}-tab-${i}`}
            aria-controls={`${tabIdPrefix}-panel-${i}`}
            aria-selected={active === i}
            role="tab"
            tabIndex={active === i ? 0 : -1}
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
      <div
        id={`${tabIdPrefix}-panel-${active}`}
        aria-labelledby={`${tabIdPrefix}-tab-${active}`}
        role="tabpanel"
        tabIndex={0}
        className="pt-6 text-sm leading-relaxed text-muted"
      >
        {tabs[active].content}
      </div>
    </div>
  );
}
