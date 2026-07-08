const badges = [
  {
    label: "Vegan Safe",
    icon: (
      <path d="M12 2c-4 4-6 8-6 12a6 6 0 0 0 12 0c0-4-2-8-6-12Z" />
    ),
  },
  {
    label: "Cruelty Free",
    icon: (
      <>
        <circle cx="12" cy="13" r="7" />
        <path d="M9 6c-1-2-1-4 0-5M15 6c1-2 1-4 0-5" />
      </>
    ),
  },
  {
    label: "Non-Comedogenic",
    icon: (
      <>
        <circle cx="12" cy="12" r="8" strokeDasharray="2 3" />
        <circle cx="12" cy="12" r="2" />
      </>
    ),
  },
];

export function TrustBadges() {
  return (
    <div className="border-b border-line px-6 py-6">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-x-10 gap-y-4 sm:justify-start">
        {badges.map((badge) => (
          <div
            key={badge.label}
            className="flex items-center gap-2 text-sm font-medium text-foreground"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="var(--color-accent)"
              strokeWidth="1.5"
              className="h-6 w-6"
              aria-hidden
            >
              {badge.icon}
            </svg>
            {badge.label}
          </div>
        ))}
      </div>
    </div>
  );
}
