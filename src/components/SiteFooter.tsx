export function SiteFooter() {
  return (
    <footer className="border-t border-line">
      <div className="mx-auto max-w-6xl px-6 py-8 text-xs text-muted">
        © {new Date().getFullYear()} Storefront. All rights reserved.
      </div>
    </footer>
  );
}
