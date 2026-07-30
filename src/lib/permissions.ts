/**
 * Fixed role set, matching real admin sidebar groupings. Not a
 * user-defined/custom-role system on purpose: this app has ~30 admin
 * pages, and building a Shopify-style role builder (named roles + a
 * per-page permission matrix) would be a lot of schema/UI for an app
 * with a single store owner and a handful of collaborators.
 *
 * This file is client-safe (no next/headers or Supabase imports) so
 * AdminSidebar ("use client") can filter nav items by role without
 * pulling server-only auth code into the client bundle. The actual
 * server-side auth check lives in src/lib/permissions.server.ts.
 */
export type AdminRole = "admin" | "products" | "orders" | "discounts" | "content";

export const ADMIN_ROLES: { value: AdminRole; label: string; description: string }[] = [
  { value: "admin", label: "Administrator", description: "Full access to every admin section." },
  {
    value: "products",
    label: "Products & Inventory",
    description: "Products, Categories, Tags, Brands, Packages, Suppliers, Purchase orders, Reviews.",
  },
  { value: "orders", label: "Orders & Clients", description: "Orders, Clients, Segments." },
  { value: "discounts", label: "Discounts", description: "Discount codes only." },
  {
    value: "content",
    label: "Content & Marketing",
    description: "Blog, Menu, Content, Settings.",
  },
];

/**
 * Every admin section, one per sidebar destination (plus "users" for
 * the Users/Roles pages, which only the admin role gets). AdminSidebar
 * filters nav items by these, and every server action calls
 * requireSection(...) with the section it belongs to.
 */
export type AdminSection =
  | "products"
  | "categories"
  | "tags"
  | "brands"
  | "packages"
  | "suppliers"
  | "purchaseOrders"
  | "reviews"
  | "orders"
  | "clients"
  | "segments"
  | "discounts"
  | "blog"
  | "menu"
  | "content"
  | "help"
  | "settings"
  | "payments"
  | "checkout"
  | "customerAccounts"
  | "users";

const ROLE_SECTIONS: Record<AdminRole, AdminSection[] | "all"> = {
  admin: "all",
  products: [
    "products",
    "categories",
    "tags",
    "brands",
    "packages",
    "suppliers",
    "purchaseOrders",
    "reviews",
  ],
  orders: ["orders", "clients", "segments"],
  discounts: ["discounts"],
  content: ["blog", "menu", "content", "help", "settings", "payments", "checkout", "customerAccounts"],
};

export function roleHasSection(role: AdminRole, section: AdminSection): boolean {
  const sections = ROLE_SECTIONS[role];
  return sections === "all" || sections.includes(section);
}

export function sectionsForRole(role: AdminRole): AdminSection[] | "all" {
  return ROLE_SECTIONS[role];
}
