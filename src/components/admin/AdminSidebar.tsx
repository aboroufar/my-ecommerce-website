"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SignOutButton } from "@/components/auth/SignOutButton";

interface NavItem {
  href: string;
  label: string;
  icon: (props: { className?: string }) => React.ReactNode;
}

const NAV_ITEMS: NavItem[] = [
  { href: "/admin/products", label: "Products", icon: TagIcon },
  { href: "/admin/orders", label: "Orders", icon: InboxIcon },
  { href: "/admin/clients", label: "Clients", icon: PersonIcon },
  { href: "/admin/segments", label: "Segments", icon: SegmentIcon },
  { href: "/admin/reviews", label: "Reviews", icon: StarIcon },
  { href: "/admin/categories", label: "Categories", icon: FolderIcon },
  { href: "/admin/tags", label: "Tags", icon: HashIcon },
  { href: "/admin/blog", label: "Blog", icon: DocumentIcon },
  { href: "/admin/menu", label: "Menu", icon: MenuIcon },
  { href: "/admin/brands", label: "Brands", icon: BadgeIcon },
  { href: "/admin/packages", label: "Packages", icon: BoxIcon },
  { href: "/admin/suppliers", label: "Suppliers", icon: TruckIcon },
  { href: "/admin/content", label: "Content", icon: ImageIcon },
  { href: "/admin/discounts", label: "Discounts", icon: DiscountIcon },
];

const FOOTER_ITEMS: NavItem[] = [
  { href: "/admin/settings", label: "Settings", icon: GearIcon },
  { href: "/admin/help", label: "Help", icon: HelpIcon },
];

// A nav item is "active" for its own route and every sub-route under it
// (e.g. /admin/products/new, /admin/products/[id]/edit), but /admin/products
// must not also light up for /admin/products-something -- hence the exact
// match or a trailing "/" boundary, not a bare startsWith.
function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AdminSidebar({ userEmail }: { userEmail: string }) {
  const pathname = usePathname();

  return (
    <aside className="flex h-screen w-60 shrink-0 flex-col border-r border-line bg-surface">
      <Link
        href="/admin/products"
        className="flex items-center gap-2 px-5 py-5 font-display text-lg font-semibold text-foreground"
      >
        Admin
      </Link>

      <nav className="flex-1 overflow-y-auto px-3 pb-4">
        <ul className="flex flex-col gap-0.5">
          {NAV_ITEMS.map((item) => (
            <SidebarLink key={item.href} item={item} active={isActive(pathname, item.href)} />
          ))}
        </ul>
      </nav>

      <div className="border-t border-line px-3 py-3">
        <ul className="flex flex-col gap-0.5">
          {FOOTER_ITEMS.map((item) => (
            <SidebarLink key={item.href} item={item} active={isActive(pathname, item.href)} />
          ))}
        </ul>
        <div className="mt-3 flex items-center justify-between gap-2 px-2.5 text-xs text-muted">
          <span className="truncate">{userEmail}</span>
          <SignOutButton redirectTo="/admin" label="Sign out" />
        </div>
      </div>
    </aside>
  );
}

function SidebarLink({ item, active }: { item: NavItem; active: boolean }) {
  const Icon = item.icon;
  return (
    <li>
      <Link
        href={item.href}
        aria-current={active ? "page" : undefined}
        className={`flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm transition-colors ${
          active
            ? "bg-accent-soft font-medium text-foreground"
            : "text-muted hover:bg-accent-soft/60 hover:text-foreground"
        }`}
      >
        <Icon className="h-4.5 w-4.5 shrink-0" />
        {item.label}
      </Link>
    </li>
  );
}

function TagIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className={className}>
      <path
        d="M20 12.5 12.5 20a1.5 1.5 0 0 1-2.12 0l-6.38-6.38a1.5 1.5 0 0 1 0-2.12L11.5 4h6A2.5 2.5 0 0 1 20 6.5v6Z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="15" cy="9" r="1.25" fill="currentColor" stroke="none" />
    </svg>
  );
}

function InboxIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className={className}>
      <path
        d="M3 13 5.5 5h13L21 13v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-5Z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M3 13h5l1.5 2.5h5L16 13h5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function PersonIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className={className}>
      <circle cx="12" cy="8" r="3.25" />
      <path d="M5 20c1.2-3.6 4-5.5 7-5.5s5.8 1.9 7 5.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function SegmentIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className={className}>
      <circle cx="9" cy="7" r="2.75" />
      <path d="M4.5 19c.9-2.7 2.5-4 4.5-4s3.6 1.3 4.5 4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M15 6h5M15 10h5M15 14h3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function StarIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className={className}>
      <path
        d="m12 4 2.35 4.76 5.25.76-3.8 3.7.9 5.23L12 15.9l-4.7 2.55.9-5.23-3.8-3.7 5.25-.76L12 4Z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function FolderIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className={className}>
      <path
        d="M4 6.5A1.5 1.5 0 0 1 5.5 5h4l2 2.5h7A1.5 1.5 0 0 1 20 9v8.5A1.5 1.5 0 0 1 18.5 19h-13A1.5 1.5 0 0 1 4 17.5v-11Z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function HashIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className={className}>
      <path d="M9 4 7 20M17 4l-2 16M4 9h16M3.2 15h16" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function DocumentIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className={className}>
      <path
        d="M7 3.5h7L18.5 8v12a1.5 1.5 0 0 1-1.5 1.5H7A1.5 1.5 0 0 1 5.5 20V5A1.5 1.5 0 0 1 7 3.5Z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M14 3.5V8h4.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M8.5 13h7M8.5 16.5h7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function MenuIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className={className}>
      <path d="M4 6.5h16M4 12h16M4 17.5h10" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function BadgeIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className={className}>
      <circle cx="12" cy="9" r="5" />
      <path d="M9 13.5 7 20l5-2.5 5 2.5-2-6.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function BoxIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className={className}>
      <path d="M3.5 8 12 4l8.5 4-8.5 4-8.5-4Z" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M3.5 8v8L12 20l8.5-4V8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M12 12v8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function TruckIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className={className}>
      <path d="M3 6.5h10v9H3z" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M13 10h4l3.5 3v2.5H13z" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="7" cy="17.5" r="1.75" />
      <circle cx="17" cy="17.5" r="1.75" />
    </svg>
  );
}

function ImageIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className={className}>
      <rect x="3.5" y="5" width="17" height="14" rx="1.5" />
      <circle cx="9" cy="10" r="1.5" />
      <path d="m5 17 4.5-4.5L13 16l3-3 3 4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function DiscountIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className={className}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="m9 15 6-6M9.5 9.75h.01M14.5 14.25h.01" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function GearIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className={className}>
      <circle cx="12" cy="12" r="3" />
      <path
        d="M19.4 13.5a1.7 1.7 0 0 0 .34 1.87l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.7 1.7 0 0 0-1.87-.34 1.7 1.7 0 0 0-1.04 1.56V19.5a2 2 0 1 1-4 0v-.09a1.7 1.7 0 0 0-1.04-1.56 1.7 1.7 0 0 0-1.87.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.7 1.7 0 0 0 .34-1.87 1.7 1.7 0 0 0-1.56-1.04H4.5a2 2 0 1 1 0-4h.09a1.7 1.7 0 0 0 1.56-1.04 1.7 1.7 0 0 0-.34-1.87l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.7 1.7 0 0 0 1.87.34H10.6a1.7 1.7 0 0 0 1.04-1.56V4.5a2 2 0 1 1 4 0v.09a1.7 1.7 0 0 0 1.04 1.56 1.7 1.7 0 0 0 1.87-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.7 1.7 0 0 0-.34 1.87V10.6a1.7 1.7 0 0 0 1.56 1.04H19.5a2 2 0 1 1 0 4h-.09a1.7 1.7 0 0 0-1.56 1.04Z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function HelpIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className={className}>
      <circle cx="12" cy="12" r="8.5" />
      <path
        d="M9.5 9.25a2.5 2.5 0 1 1 3.6 2.24c-.7.35-1.1.9-1.1 1.51v.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="17" r="0.15" fill="currentColor" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  );
}
