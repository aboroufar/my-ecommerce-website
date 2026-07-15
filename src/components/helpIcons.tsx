/**
 * Fixed icon set for Help Center category groups (e.g. "Orders & Payment",
 * "Shipping") -- same small-preset pattern as highlightIcons.tsx, kept as
 * its own file since it's a semantically distinct icon set used in a
 * different context.
 */
export const HELP_ICON_KEYS = ["card", "chat", "return", "person", "document"] as const;

export type HelpIconKey = (typeof HELP_ICON_KEYS)[number];

export const HELP_ICON_LABELS: Record<HelpIconKey, string> = {
  card: "Card (orders & payment)",
  chat: "Chat (support)",
  return: "Return (returns & complaints)",
  person: "Person (account)",
  document: "Document (policies)",
};

export function HelpIcon({
  icon,
  className = "h-5 w-5",
}: {
  icon: string;
  className?: string;
}) {
  switch (icon as HelpIconKey) {
    case "card":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={className}>
          <rect x="3" y="5" width="18" height="14" rx="2" />
          <path d="M3 10h18" strokeLinecap="round" />
        </svg>
      );
    case "chat":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={className}>
          <path
            d="M4 5h16v11H8l-4 4V5Z"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    case "return":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={className}>
          <path d="M4 12a8 8 0 1 0 2.3-5.7" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M4 4v4h4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "person":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={className}>
          <circle cx="12" cy="8" r="3.5" />
          <path d="M4.5 20c1.5-4 5-6 7.5-6s6 2 7.5 6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "document":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={className}>
          <path d="M6 3h8l4 4v14H6V3Z" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M14 3v4h4M9 12h6M9 16h6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    default:
      return null;
  }
}
