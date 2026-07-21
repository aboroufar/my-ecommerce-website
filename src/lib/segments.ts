import { createAdminClient } from "@/lib/supabase/admin";

export interface SegmentCondition {
  field:
    | "order_count"
    | "email_subscribed"
    | "created_at"
    | "total_spent_cents"
    | "avg_order_value_cents"
    | "last_order_date"
    | "purchased_product_id"
    | "purchased_category_id";
  operator: "gte" | "gt" | "lt" | "eq";
  value: number | boolean | string;
}

export interface Segment {
  id: string;
  name: string;
  condition_type: string;
  conditions: SegmentCondition[];
  created_at: string;
}

export interface ClientFacts {
  id: string;
  email: string;
  name: string | null;
  created_at: string;
  order_count: number;
  email_subscribed: boolean;
  total_spent_cents: number;
  avg_order_value_cents: number;
  last_order_date: string | null;
  purchased_product_ids: Set<string>;
  purchased_category_ids: Set<string>;
}

// Only paid+ orders count as a real purchase -- a pending/cancelled order
// was never actually charged, same rule the Clients list uses.
const REAL_PURCHASE_STATUSES = ["paid", "fulfilled", "refunded"];

/**
 * Builds the fact set every segment is evaluated against: one row per
 * client with the derived attributes segment conditions can reference.
 * None of these are stored columns -- everything is computed in-memory
 * from orders/order_items/product_categories/newsletter_subscribers, the
 * same aggregate-in-app-code approach the rest of this file already used
 * for order_count and email_subscribed.
 */
export async function getClientFacts(
  supabase: ReturnType<typeof createAdminClient>,
  clientIds?: string[]
): Promise<ClientFacts[]> {
  const [{ data: clients }, { data: orders }, { data: subscribers }, { data: categoryLinks }] =
    await Promise.all([
      clientIds
        ? supabase.from("clients").select("id, email, name, created_at").in("id", clientIds)
        : supabase.from("clients").select("id, email, name, created_at"),
      (() => {
        let query = supabase
          .from("orders")
          .select("id, client_id, status, total_cents, created_at")
          .not("client_id", "is", null)
          .in("status", REAL_PURCHASE_STATUSES);
        if (clientIds) query = query.in("client_id", clientIds);
        return query;
      })(),
      supabase.from("newsletter_subscribers").select("email"),
      supabase.from("product_categories").select("product_id, category_id"),
    ]);

  const subscribedEmails = new Set(
    (subscribers ?? []).map((s) => s.email.toLowerCase())
  );

  const categoriesByProduct = new Map<string, Set<string>>();
  for (const link of categoryLinks ?? []) {
    const existing = categoriesByProduct.get(link.product_id) ?? new Set<string>();
    existing.add(link.category_id);
    categoriesByProduct.set(link.product_id, existing);
  }

  const qualifyingOrders = orders ?? [];
  const clientIdByOrderId = new Map<string, string>();
  const orderCountByClient = new Map<string, number>();
  const totalCentsByClient = new Map<string, number>();
  const lastOrderDateByClient = new Map<string, string>();

  for (const order of qualifyingOrders) {
    if (!order.client_id) continue;
    clientIdByOrderId.set(order.id, order.client_id);
    orderCountByClient.set(order.client_id, (orderCountByClient.get(order.client_id) ?? 0) + 1);
    totalCentsByClient.set(
      order.client_id,
      (totalCentsByClient.get(order.client_id) ?? 0) + order.total_cents
    );
    const currentLast = lastOrderDateByClient.get(order.client_id);
    if (!currentLast || order.created_at > currentLast) {
      lastOrderDateByClient.set(order.client_id, order.created_at);
    }
  }

  const qualifyingOrderIds = qualifyingOrders.map((o) => o.id);
  const { data: orderItems } =
    qualifyingOrderIds.length > 0
      ? await supabase
          .from("order_items")
          .select("order_id, product_id")
          .in("order_id", qualifyingOrderIds)
      : { data: [] as { order_id: string; product_id: string | null }[] };

  const purchasedProductIdsByClient = new Map<string, Set<string>>();
  for (const item of orderItems ?? []) {
    if (!item.product_id) continue;
    const clientId = clientIdByOrderId.get(item.order_id);
    if (!clientId) continue;
    const existing = purchasedProductIdsByClient.get(clientId) ?? new Set<string>();
    existing.add(item.product_id);
    purchasedProductIdsByClient.set(clientId, existing);
  }

  const purchasedCategoryIdsByClient = new Map<string, Set<string>>();
  for (const [clientId, productIds] of purchasedProductIdsByClient) {
    const categoryIds = new Set<string>();
    for (const productId of productIds) {
      for (const categoryId of categoriesByProduct.get(productId) ?? []) {
        categoryIds.add(categoryId);
      }
    }
    purchasedCategoryIdsByClient.set(clientId, categoryIds);
  }

  return (clients ?? []).map((client) => {
    const orderCount = orderCountByClient.get(client.id) ?? 0;
    const totalSpentCents = totalCentsByClient.get(client.id) ?? 0;
    return {
      id: client.id,
      email: client.email,
      name: client.name,
      created_at: client.created_at,
      order_count: orderCount,
      email_subscribed: subscribedEmails.has(client.email.toLowerCase()),
      total_spent_cents: totalSpentCents,
      avg_order_value_cents: orderCount > 0 ? Math.round(totalSpentCents / orderCount) : 0,
      last_order_date: lastOrderDateByClient.get(client.id) ?? null,
      purchased_product_ids: purchasedProductIdsByClient.get(client.id) ?? new Set(),
      purchased_category_ids: purchasedCategoryIdsByClient.get(client.id) ?? new Set(),
    };
  });
}

// purchased_product_id/purchased_category_id are Set-membership checks --
// only "eq" (has purchased this id) makes sense for them, so they're
// branched out of the generic numeric/string comparison below. The parser
// (segmentQuery.ts) rejects other operators for these two fields.
function matchesCondition(client: ClientFacts, condition: SegmentCondition): boolean {
  if (condition.field === "purchased_product_id") {
    return client.purchased_product_ids.has(String(condition.value));
  }
  if (condition.field === "purchased_category_id") {
    return client.purchased_category_ids.has(String(condition.value));
  }

  const actual = client[condition.field];

  switch (condition.operator) {
    case "gte":
      return typeof actual === "number" && typeof condition.value === "number"
        ? actual >= condition.value
        : String(actual) >= String(condition.value);
    case "gt":
      return typeof actual === "number" && typeof condition.value === "number"
        ? actual > condition.value
        : String(actual) > String(condition.value);
    case "lt":
      return typeof actual === "number" && typeof condition.value === "number"
        ? actual < condition.value
        : String(actual) < String(condition.value);
    case "eq":
      return actual === condition.value;
    default:
      return false;
  }
}

/**
 * A segment's conditions are ANDed together, independent predicates -- e.g.
 * WHERE purchased_category = "skincare" AND total_spent > 100 means "bought
 * skincare ever AND has spent >$100 total (any product)," not spend scoped
 * to that category. Matches Shopify's own segment behavior.
 */
export function matchesSegment(client: ClientFacts, segment: Segment): boolean {
  if (segment.condition_type === "abandoned_checkout") {
    // No server-side cart/checkout tracking exists yet (see the migration
    // comment) -- this segment type always matches nobody until that data
    // exists to evaluate against.
    return false;
  }
  return segment.conditions.every((c) => matchesCondition(client, c));
}

export function getMatchingClients(
  clients: ClientFacts[],
  segment: Segment
): ClientFacts[] {
  return clients.filter((c) => matchesSegment(c, segment));
}
