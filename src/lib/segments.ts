import { createAdminClient } from "@/lib/supabase/admin";

export interface SegmentCondition {
  field: "order_count" | "email_subscribed" | "created_at";
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

export interface CustomerFacts {
  id: string;
  email: string;
  name: string | null;
  created_at: string;
  order_count: number;
  email_subscribed: boolean;
}

/**
 * Builds the fact set every segment is evaluated against: one row per
 * customer with the derived attributes segment conditions can reference
 * (order_count, email_subscribed). None of these are stored columns --
 * order_count is computed from orders the same way the Customers list
 * page already does, and email_subscribed is a join against
 * newsletter_subscribers by lowercased email (that table isn't linked to
 * customers by a foreign key).
 */
export async function getCustomerFacts(
  supabase: ReturnType<typeof createAdminClient>
): Promise<CustomerFacts[]> {
  const [{ data: customers }, { data: orders }, { data: subscribers }] = await Promise.all([
    supabase.from("customers").select("id, email, name, created_at"),
    // Only paid+ orders count as a real purchase -- a pending/cancelled
    // order was never actually charged, same rule the Customers list uses.
    supabase
      .from("orders")
      .select("customer_id, status")
      .not("customer_id", "is", null)
      .in("status", ["paid", "fulfilled", "refunded"]),
    supabase.from("newsletter_subscribers").select("email"),
  ]);

  const orderCountByCustomer = new Map<string, number>();
  for (const order of orders ?? []) {
    if (!order.customer_id) continue;
    orderCountByCustomer.set(
      order.customer_id,
      (orderCountByCustomer.get(order.customer_id) ?? 0) + 1
    );
  }

  const subscribedEmails = new Set(
    (subscribers ?? []).map((s) => s.email.toLowerCase())
  );

  return (customers ?? []).map((c) => ({
    id: c.id,
    email: c.email,
    name: c.name,
    created_at: c.created_at,
    order_count: orderCountByCustomer.get(c.id) ?? 0,
    email_subscribed: subscribedEmails.has(c.email.toLowerCase()),
  }));
}

function matchesCondition(customer: CustomerFacts, condition: SegmentCondition): boolean {
  const actual = customer[condition.field];

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
 * A segment's conditions are ANDed together -- every sample segment only
 * ever needs one condition, but this keeps the door open for combining a
 * few without needing OR/grouping logic.
 */
export function matchesSegment(customer: CustomerFacts, segment: Segment): boolean {
  if (segment.condition_type === "abandoned_checkout") {
    // No server-side cart/checkout tracking exists yet (see the migration
    // comment) -- this segment type always matches nobody until that data
    // exists to evaluate against.
    return false;
  }
  return segment.conditions.every((c) => matchesCondition(customer, c));
}

export function getMatchingCustomers(
  customers: CustomerFacts[],
  segment: Segment
): CustomerFacts[] {
  return customers.filter((c) => matchesSegment(c, segment));
}
