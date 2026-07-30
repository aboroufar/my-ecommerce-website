// Shopify-style settings section: a white rounded card floating on the
// admin's gray page canvas, replacing the old bordered-block-on-white
// pattern. Shared by every /admin/settings/* page so section styling
// stays in one place.
export function SettingsCard({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-lg border border-neutral-200 bg-white p-5 shadow-sm">
      <h2 className="text-sm font-semibold text-neutral-900">{title}</h2>
      {description && <p className="mt-1 max-w-lg text-sm text-neutral-500">{description}</p>}
      <div className="mt-4 max-w-lg">{children}</div>
    </section>
  );
}
