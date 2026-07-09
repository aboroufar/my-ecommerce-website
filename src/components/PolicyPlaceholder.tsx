/**
 * Placeholder structure for a legal/policy page -- section headers a real
 * policy would need, with a hint about what belongs in each, but no actual
 * legal text. Real policy content (return windows, data-retention periods,
 * specific legal commitments) is a business decision that shouldn't be
 * invented on a customer's behalf; this exists so the site doesn't link to
 * a 404 while you write or source the real thing.
 */
export function PolicyPlaceholder({
  title,
  sections,
}: {
  title: string;
  sections: { heading: string; hint: string }[];
}) {
  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-16">
      <span className="text-xs font-medium uppercase tracking-[0.2em] text-muted">
        Legal
      </span>
      <h1 className="mt-2 font-display text-3xl font-bold text-foreground">
        {title}
      </h1>

      <div className="mt-6 border border-dashed border-line bg-surface px-4 py-3">
        <p className="text-xs text-muted">
          This page is a placeholder. Replace the sections below with your
          actual {title.toLowerCase()} before launch.
        </p>
      </div>

      <div className="mt-10 space-y-8">
        {sections.map((section) => (
          <section key={section.heading}>
            <h2 className="font-display text-lg font-bold text-foreground">
              {section.heading}
            </h2>
            <p className="mt-2 text-sm italic leading-relaxed text-muted">
              {section.hint}
            </p>
          </section>
        ))}
      </div>
    </main>
  );
}
