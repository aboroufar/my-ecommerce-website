export function SiteFooter() {
  return (
    <footer className="border-t border-line bg-background">
      <div className="mx-auto max-w-6xl px-6 py-10 text-xs uppercase tracking-wide text-muted">
        © {new Date().getFullYear()} Storefront. All rights reserved.
      </div>
    </footer>
  );
}
