"use client";

import { toggleHomepageSection, moveHomepageSection } from "@/lib/actions/homepageSections";

interface Section {
  key: string;
  label: string;
  enabled: boolean;
  sort_order: number;
}

export function SectionsManager({ sections }: { sections: Section[] }) {
  return (
    <div className="mt-4 max-w-lg space-y-2">
      {sections.map((section, i) => (
        <div
          key={section.key}
          className="flex items-center gap-3 border border-line px-3 py-2.5"
        >
          <form
            action={toggleHomepageSection.bind(null, section.key, !section.enabled)}
          >
            <button
              type="submit"
              role="switch"
              aria-checked={section.enabled}
              aria-label={`${section.enabled ? "Disable" : "Enable"} ${section.label}`}
              className={`h-5 w-9 shrink-0 rounded-full transition-colors ${
                section.enabled ? "bg-accent" : "bg-line"
              }`}
            >
              <span
                className={`block h-4 w-4 translate-y-0.5 rounded-full bg-background transition-transform ${
                  section.enabled ? "translate-x-4.5" : "translate-x-0.5"
                }`}
              />
            </button>
          </form>

          <span
            className={`flex-1 text-sm ${
              section.enabled ? "text-foreground" : "text-muted"
            }`}
          >
            {section.label}
          </span>

          <div className="flex shrink-0 items-center gap-1">
            <form action={moveHomepageSection.bind(null, section.key, "up")}>
              <button
                type="submit"
                disabled={i === 0}
                aria-label="Move up"
                className="px-1.5 py-1 text-xs text-muted transition-colors hover:text-foreground disabled:opacity-30"
              >
                ↑
              </button>
            </form>
            <form action={moveHomepageSection.bind(null, section.key, "down")}>
              <button
                type="submit"
                disabled={i === sections.length - 1}
                aria-label="Move down"
                className="px-1.5 py-1 text-xs text-muted transition-colors hover:text-foreground disabled:opacity-30"
              >
                ↓
              </button>
            </form>
          </div>
        </div>
      ))}
    </div>
  );
}
