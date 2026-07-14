const ICONS = {
  facebook: (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
      <path d="M13.5 21v-8.2h2.75l.41-3.2h-3.16V7.55c0-.93.26-1.56 1.6-1.56h1.7V3.14A22.7 22.7 0 0 0 14.1 3c-2.55 0-4.3 1.56-4.3 4.42v2.18H7v3.2h2.8V21h3.7Z" />
    </svg>
  ),
  twitter: (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
      <path d="M18.24 3h3.06l-6.69 7.65L22.5 21h-6.16l-4.83-6.32L5.96 21H2.9l7.16-8.19L2 3h6.32l4.36 5.78L18.24 3Zm-1.08 16.17h1.7L7.9 4.73H6.08l11.08 14.44Z" />
    </svg>
  ),
  linkedin: (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
      <path d="M6.94 8.5H3.56V21h3.38V8.5ZM5.25 3a1.96 1.96 0 1 0 0 3.92A1.96 1.96 0 0 0 5.25 3ZM21 21v-6.98c0-3.34-1.78-4.89-4.16-4.89a3.59 3.59 0 0 0-3.25 1.8V8.5H10.2c.05 1 0 12.5 0 12.5h3.38v-6.98c0-.37.03-.75.14-1.02.3-.75 1-1.53 2.16-1.53 1.53 0 2.14 1.16 2.14 2.87V21H21Z" />
    </svg>
  ),
  instagram: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4">
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.2" cy="6.8" r="1" fill="currentColor" stroke="none" />
    </svg>
  ),
};

export type SocialPlatform = keyof typeof ICONS;

export function SocialIconLink({
  platform,
  href,
  label,
}: {
  platform: SocialPlatform;
  href: string;
  label: string;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      className="flex h-8 w-8 items-center justify-center rounded-full bg-accent text-background transition-opacity hover:opacity-85"
    >
      {ICONS[platform]}
    </a>
  );
}
