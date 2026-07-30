"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SignOutButton } from "@/components/auth/SignOutButton";
import { roleHasSection, type AdminRole, type AdminSection } from "@/lib/permissions";

interface ChildNavItem {
  href: string;
  label: string;
  section: AdminSection;
  // One extra level, only for Users -> Roles today. Not a general recursive
  // tree -- SidebarLink renders this level without its own active/expand
  // logic, it's just always shown alongside its sibling children whenever
  // the top-level parent is active.
  children?: { href: string; label: string; section: AdminSection }[];
}

interface NavItem {
  href: string;
  label: string;
  icon: (props: { className?: string }) => React.ReactNode;
  section: AdminSection;
  children?: ChildNavItem[];
}

const NAV_ITEMS: NavItem[] = [
  { href: "/admin/products", label: "Products", icon: TagIcon, section: "products" },
  { href: "/admin/orders", label: "Orders", icon: InboxIcon, section: "orders" },
  {
    href: "/admin/clients",
    label: "Clients",
    icon: PersonIcon,
    section: "clients",
    children: [{ href: "/admin/segments", label: "Segments", section: "segments" }],
  },
  { href: "/admin/reviews", label: "Reviews", icon: StarIcon, section: "reviews" },
  { href: "/admin/categories", label: "Categories", icon: FolderIcon, section: "categories" },
  { href: "/admin/tags", label: "Tags", icon: HashIcon, section: "tags" },
  { href: "/admin/blog", label: "Blog", icon: DocumentIcon, section: "blog" },
  { href: "/admin/menu", label: "Menu", icon: MenuIcon, section: "menu" },
  { href: "/admin/brands", label: "Brands", icon: BadgeIcon, section: "brands" },
  { href: "/admin/packages", label: "Packages", icon: BoxIcon, section: "packages" },
  { href: "/admin/suppliers", label: "Suppliers", icon: TruckIcon, section: "suppliers" },
  {
    href: "/admin/purchase-orders",
    label: "Purchase orders",
    icon: ClipboardIcon,
    section: "purchaseOrders",
  },
  { href: "/admin/content", label: "Content", icon: ImageIcon, section: "content" },
  { href: "/admin/discounts", label: "Discounts", icon: DiscountIcon, section: "discounts" },
];

const FOOTER_ITEMS: NavItem[] = [
  {
    href: "/admin/settings",
    label: "Settings",
    icon: GearIcon,
    section: "settings",
    children: [
      { href: "/admin/settings/general", label: "General", section: "settings" },
      { href: "/admin/settings/shipping", label: "Shipping and delivery", section: "settings" },
      { href: "/admin/settings/payments", label: "Payments", section: "payments" },
      { href: "/admin/settings/checkout", label: "Checkout", section: "checkout" },
      {
        href: "/admin/settings/customer-accounts",
        label: "Customer accounts",
        section: "customerAccounts",
      },
      {
        href: "/admin/users",
        label: "Users",
        section: "users",
        children: [{ href: "/admin/users/roles", label: "Roles", section: "users" }],
      },
    ],
  },
  { href: "/admin/help", label: "Help", icon: HelpIcon, section: "help" },
];

// A nav item is "active" for its own route and every sub-route under it
// (e.g. /admin/products/new, /admin/products/[id]/edit), but /admin/products
// must not also light up for /admin/products-something -- hence the exact
// match or a trailing "/" boundary, not a bare startsWith.
function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

// A parent is also "active" (and so should keep its children expanded)
// whenever the current path matches one of its children's hrefs -- Settings'
// Users/Roles children live under /admin/users, not /admin/settings/..., so
// matching only the parent's own href would collapse the whole child list
// while on those pages.
function isParentActive(pathname: string, item: NavItem) {
  return (
    isActive(pathname, item.href) ||
    (item.children?.some((child) => isActive(pathname, child.href)) ?? false)
  );
}

export function AdminSidebar({ userEmail, role }: { userEmail: string; role: AdminRole }) {
  const pathname = usePathname();

  // Nav items (and their children) are filtered to whatever the role
  // covers -- a restricted role never even sees a link to a section its
  // server actions would reject, matching this app's "hide nav + block
  // actions" enforcement approach.
  const visibleNavItems = NAV_ITEMS.filter((item) => roleHasSection(role, item.section));
  const visibleFooterItems = FOOTER_ITEMS.map((item) => ({
    ...item,
    children: item.children
      ?.filter((child) => roleHasSection(role, child.section))
      .map((child) => ({
        ...child,
        children: child.children?.filter((grandchild) => roleHasSection(role, grandchild.section)),
      })),
  })).filter((item) => roleHasSection(role, item.section));

  return (
    <aside className="flex h-screen w-60 shrink-0 flex-col bg-white">
      <Link
        href="/admin/products"
        className="flex items-center gap-2 px-5 py-5 text-sm font-semibold text-neutral-900"
      >
        <StoreIcon className="h-5 w-5 shrink-0 text-neutral-700" />
        Admin
      </Link>

      <nav className="flex-1 overflow-y-auto px-3 pb-4">
        <ul className="flex flex-col gap-0.5">
          {visibleNavItems.map((item) => (
            <SidebarLink
              key={item.href}
              item={item}
              active={isParentActive(pathname, item)}
              pathname={pathname}
            />
          ))}
        </ul>
      </nav>

      <div className="border-t border-neutral-200 px-3 py-3">
        <ul className="flex flex-col gap-0.5">
          {visibleFooterItems.map((item) => (
            <SidebarLink
              key={item.href}
              item={item}
              active={isParentActive(pathname, item)}
              pathname={pathname}
            />
          ))}
        </ul>
        <div className="mt-3 flex items-center gap-2 rounded-md px-2.5 py-2">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-blue-500 text-xs font-semibold text-white">
            {userEmail.slice(0, 2).toUpperCase()}
          </span>
          <span className="min-w-0 flex-1 truncate text-xs text-neutral-600">{userEmail}</span>
          <SignOutButton redirectTo="/admin" label="Sign out" />
        </div>
      </div>
    </aside>
  );
}

function SidebarLink({
  item,
  active,
  pathname,
}: {
  item: NavItem;
  active: boolean;
  pathname: string;
}) {
  const Icon = item.icon;
  // Children stay visible whenever the parent section is active, matching
  // the Shopify pattern of an always-expanded child list under the parent
  // (not a collapsible toggle) -- this app has at most one child per item,
  // so there's no need for independent expand/collapse state.
  return (
    <li>
      <Link
        href={item.href}
        aria-current={active ? "page" : undefined}
        className={`flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm transition-colors ${
          active
            ? "bg-neutral-100 font-medium text-neutral-900"
            : "text-neutral-700 hover:bg-neutral-100 hover:text-neutral-900"
        }`}
      >
        <Icon className="h-4.5 w-4.5 shrink-0" />
        {item.label}
      </Link>
      {item.children && active && (
        <ul className="mt-0.5 flex flex-col gap-0.5 pl-8">
          {item.children.map((child) => {
            const childActive =
              isActive(pathname, child.href) ||
              (child.children?.some((gc) => isActive(pathname, gc.href)) ?? false);
            return (
              <li key={child.href}>
                <Link
                  href={child.href}
                  aria-current={isActive(pathname, child.href) ? "page" : undefined}
                  className={`flex items-center rounded-md px-2.5 py-1.5 text-sm transition-colors ${
                    childActive
                      ? "bg-neutral-100 font-medium text-neutral-900"
                      : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900"
                  }`}
                >
                  {child.label}
                </Link>
                {child.children && childActive && (
                  <ul className="mt-0.5 flex flex-col gap-0.5 pl-4">
                    {child.children.map((grandchild) => {
                      const grandchildActive = isActive(pathname, grandchild.href);
                      return (
                        <li key={grandchild.href}>
                          <Link
                            href={grandchild.href}
                            aria-current={grandchildActive ? "page" : undefined}
                            className={`flex items-center rounded-md px-2.5 py-1.5 text-sm transition-colors ${
                              grandchildActive
                                ? "bg-neutral-100 font-medium text-neutral-900"
                                : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900"
                            }`}
                          >
                            {grandchild.label}
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </li>
  );
}

function StoreIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className={className}>
      <path d="M4 9.5 5.5 4h13L20 9.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M4 9.5a2 2 0 0 0 4 0 2 2 0 0 0 4 0 2 2 0 0 0 4 0 2 2 0 0 0 4 0" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5 9.5V19a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V9.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M9.5 20v-5a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1v5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
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

function ClipboardIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className={className}>
      <rect x="5.5" y="4.5" width="13" height="16" rx="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M9 4.5V4a2 2 0 0 1 4 0v.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M8.5 10.5h7M8.5 14h7M8.5 17.5h4" strokeLinecap="round" strokeLinejoin="round" />
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
