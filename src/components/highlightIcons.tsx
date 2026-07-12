/**
 * Fixed icon set for per-product highlight bullets (e.g. "Cruelty free",
 * "Recyclable packaging") -- a small preset list rather than free-text/SVG
 * input, so admin-authored bullets stay visually consistent with the
 * site's existing icon style. Shared between the admin picker
 * (ProductHighlightsManager) and the PDP render.
 */
export const HIGHLIGHT_ICON_KEYS = [
  "leaf",
  "rabbit",
  "recycle",
  "shield",
  "heart",
  "droplet",
  "sun",
  "box",
] as const;

export type HighlightIconKey = (typeof HIGHLIGHT_ICON_KEYS)[number];

export const HIGHLIGHT_ICON_LABELS: Record<HighlightIconKey, string> = {
  leaf: "Leaf",
  rabbit: "Rabbit (cruelty-free)",
  recycle: "Recycle",
  shield: "Shield",
  heart: "Heart",
  droplet: "Droplet",
  sun: "Sun",
  box: "Box",
};

export function HighlightIcon({
  icon,
  className = "h-5 w-5",
}: {
  icon: string;
  className?: string;
}) {
  switch (icon as HighlightIconKey) {
    case "leaf":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={className}>
          <path d="M12 2c-4 4-6 8-6 12a6 6 0 0 0 12 0c0-4-2-8-6-12Z" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "rabbit":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={className}>
          <circle cx="12" cy="13" r="7" />
          <path d="M9 6c-1-2-1-4 0-5M15 6c1-2 1-4 0-5" strokeLinecap="round" />
        </svg>
      );
    case "recycle":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={className}>
          <circle cx="12" cy="12" r="8" strokeDasharray="2 3" />
          <circle cx="12" cy="12" r="2" />
        </svg>
      );
    case "shield":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={className}>
          <path d="M12 3l7 3v6c0 4.5-3 8-7 9-4-1-7-4.5-7-9V6l7-3Z" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "heart":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={className}>
          <path
            d="M12 20s-7-4.4-9.5-8.8C1 8 2.5 4.5 6 4.5c2 0 3.5 1.2 4.5 2.8 1-1.6 2.5-2.8 4.5-2.8 3.5 0 5 3.5 3.5 6.7C19 15.6 12 20 12 20Z"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    case "droplet":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={className}>
          <path d="M12 3s6 7 6 11a6 6 0 0 1-12 0c0-4 6-11 6-11Z" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "sun":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={className}>
          <circle cx="12" cy="12" r="4.5" />
          <path
            d="M12 2v2.5M12 19.5V22M4.9 4.9l1.8 1.8M17.3 17.3l1.8 1.8M2 12h2.5M19.5 12H22M4.9 19.1l1.8-1.8M17.3 6.7l1.8-1.8"
            strokeLinecap="round"
          />
        </svg>
      );
    case "box":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={className}>
          <path d="M3 8l9-4 9 4-9 4-9-4Z" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M3 8v9l9 4 9-4V8M12 12v9" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    default:
      return null;
  }
}
