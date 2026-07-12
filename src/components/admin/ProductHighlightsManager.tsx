"use client";

import { useState } from "react";
import {
  HIGHLIGHT_ICON_KEYS,
  HIGHLIGHT_ICON_LABELS,
  HighlightIcon,
  type HighlightIconKey,
} from "@/components/highlightIcons";

interface HighlightState {
  label: string;
  icon: HighlightIconKey;
}

export type ProductHighlightsDefaults = HighlightState[];

/**
 * Repeatable list of per-product trust-badge bullets (e.g. "Cruelty
 * free"), each with a label and an icon picked from a fixed set --
 * replaces the old hardcoded 3-bullet list that used to render
 * identically on every PDP. Holds state locally and serializes to a
 * single hidden JSON field (name="highlights_json"), matching
 * ProductOptionsManager's pattern, since this must save atomically with
 * product create/update.
 */
export function ProductHighlightsManager({
  defaults,
}: {
  defaults?: ProductHighlightsDefaults;
}) {
  const [highlights, setHighlights] = useState<HighlightState[]>(
    defaults ?? []
  );

  function addHighlight() {
    setHighlights((prev) => [...prev, { label: "", icon: "leaf" }]);
  }

  function removeHighlight(index: number) {
    setHighlights((prev) => prev.filter((_, i) => i !== index));
  }

  function updateLabel(index: number, label: string) {
    setHighlights((prev) =>
      prev.map((h, i) => (i === index ? { ...h, label } : h))
    );
  }

  function updateIcon(index: number, icon: HighlightIconKey) {
    setHighlights((prev) =>
      prev.map((h, i) => (i === index ? { ...h, icon } : h))
    );
  }

  const payload = highlights.filter((h) => h.label.trim());

  return (
    <div className="space-y-3">
      <input type="hidden" name="highlights_json" value={JSON.stringify(payload)} />

      {highlights.length === 0 && (
        <p className="text-sm text-muted">
          No highlight bullets yet -- add one to show a trust badge (e.g.
          &quot;Cruelty free&quot;) on this product&apos;s page.
        </p>
      )}

      <div className="space-y-2">
        {highlights.map((highlight, index) => (
          <div key={index} className="flex items-center gap-2">
            <span className="text-accent">
              <HighlightIcon icon={highlight.icon} />
            </span>
            <select
              value={highlight.icon}
              onChange={(e) => updateIcon(index, e.target.value as HighlightIconKey)}
              className="border border-line bg-background px-2 py-1.5 text-xs"
            >
              {HIGHLIGHT_ICON_KEYS.map((key) => (
                <option key={key} value={key}>
                  {HIGHLIGHT_ICON_LABELS[key]}
                </option>
              ))}
            </select>
            <input
              value={highlight.label}
              onChange={(e) => updateLabel(index, e.target.value)}
              placeholder="e.g. Cruelty free"
              className="flex-1 border border-line bg-background px-2.5 py-1.5 text-sm"
            />
            <button
              type="button"
              onClick={() => removeHighlight(index)}
              className="shrink-0 text-xs text-red-700 underline underline-offset-4 hover:text-red-800"
            >
              Remove
            </button>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={addHighlight}
        className="border border-dashed border-line px-4 py-2 text-xs font-medium uppercase tracking-wide text-muted transition-colors hover:border-foreground hover:text-foreground"
      >
        + Add highlight
      </button>
    </div>
  );
}
