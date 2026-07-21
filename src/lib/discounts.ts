import { z } from "zod";
import { matchesSegment, type ClientFacts, type Segment } from "@/lib/segments";

export type DiscountType =
  | "amount_off_products"
  | "buy_x_get_y"
  | "amount_off_order"
  | "free_shipping";

export interface ScopeAll {
  scope: "all";
}
export interface ScopeCollections {
  scope: "collections";
  categoryIds: string[];
}
export interface ScopeProducts {
  scope: "products";
  productIds: string[];
}
export type Scope = ScopeAll | ScopeCollections | ScopeProducts;

export type Eligibility = { scope: "all" } | { scope: "segments"; segmentIds: string[] };

export type MinimumPurchase =
  | { type: "none" }
  | { type: "amount"; minCents: number }
  | { type: "quantity"; minQuantity: number };

export interface UsageLimits {
  totalLimit?: number;
  onePerCustomer: boolean;
}

export interface Combinations {
  combinesWithProduct: boolean;
  combinesWithOrder: boolean;
  combinesWithShipping: boolean;
}

interface SharedFields {
  method: "code" | "automatic";
  code?: string;
  eligibility: Eligibility;
  minimumPurchase: MinimumPurchase;
  usageLimits: UsageLimits;
  combinations: Combinations;
}

export type DiscountConfig =
  | (SharedFields & {
      discount_type: "amount_off_products";
      appliesTo: Scope;
      valueType: "percent" | "fixed";
      value: number;
    })
  | (SharedFields & {
      discount_type: "amount_off_order";
      appliesTo: ScopeAll;
      valueType: "percent" | "fixed";
      value: number;
    })
  | (SharedFields & {
      discount_type: "free_shipping";
      appliesTo: ScopeAll;
    })
  | (SharedFields & {
      discount_type: "buy_x_get_y";
      buy: { scope: Scope; quantity: number };
      get: { scope: Scope; quantity: number; valueType: "percent" | "fixed"; value: number };
    });

const scopeAllSchema = z.object({ scope: z.literal("all") });
const scopeSchema: z.ZodType<Scope> = z.discriminatedUnion("scope", [
  scopeAllSchema,
  z.object({ scope: z.literal("collections"), categoryIds: z.array(z.string()) }),
  z.object({ scope: z.literal("products"), productIds: z.array(z.string()) }),
]);

const eligibilitySchema: z.ZodType<Eligibility> = z.discriminatedUnion("scope", [
  z.object({ scope: z.literal("all") }),
  z.object({ scope: z.literal("segments"), segmentIds: z.array(z.string()) }),
]);

const minimumPurchaseSchema: z.ZodType<MinimumPurchase> = z.discriminatedUnion("type", [
  z.object({ type: z.literal("none") }),
  z.object({ type: z.literal("amount"), minCents: z.number().int().nonnegative() }),
  z.object({ type: z.literal("quantity"), minQuantity: z.number().int().positive() }),
]);

const usageLimitsSchema: z.ZodType<UsageLimits> = z.object({
  totalLimit: z.number().int().positive().optional(),
  onePerCustomer: z.boolean(),
});

const combinationsSchema: z.ZodType<Combinations> = z.object({
  combinesWithProduct: z.boolean(),
  combinesWithOrder: z.boolean(),
  combinesWithShipping: z.boolean(),
});

const sharedFieldsSchema = {
  method: z.enum(["code", "automatic"]),
  code: z.string().optional(),
  eligibility: eligibilitySchema,
  minimumPurchase: minimumPurchaseSchema,
  usageLimits: usageLimitsSchema,
  combinations: combinationsSchema,
};

export const discountConfigSchema = z
  .discriminatedUnion("discount_type", [
    z.object({
      discount_type: z.literal("amount_off_products"),
      appliesTo: scopeSchema,
      valueType: z.enum(["percent", "fixed"]),
      value: z.number().positive(),
      ...sharedFieldsSchema,
    }),
    z.object({
      discount_type: z.literal("amount_off_order"),
      appliesTo: scopeAllSchema,
      valueType: z.enum(["percent", "fixed"]),
      value: z.number().positive(),
      ...sharedFieldsSchema,
    }),
    z.object({
      discount_type: z.literal("free_shipping"),
      appliesTo: scopeAllSchema,
      ...sharedFieldsSchema,
    }),
    z.object({
      discount_type: z.literal("buy_x_get_y"),
      buy: z.object({ scope: scopeSchema, quantity: z.number().int().positive() }),
      get: z.object({
        scope: scopeSchema,
        quantity: z.number().int().positive(),
        valueType: z.enum(["percent", "fixed"]),
        value: z.number().positive(),
      }),
      ...sharedFieldsSchema,
    }),
  ])
  .refine((data) => data.method !== "code" || !!data.code?.trim(), {
    message: "Code is required when method is 'code'",
    path: ["code"],
  })
  .refine(
    (data) => {
      if (data.discount_type === "free_shipping") return true;
      if (data.discount_type === "buy_x_get_y") return data.get.valueType !== "percent" || data.get.value <= 100;
      return data.valueType !== "percent" || data.value <= 100;
    },
    { message: "Percent value can't exceed 100", path: ["value"] }
  );

export interface CartLine {
  productId: string;
  categoryIds: string[];
  quantity: number;
  unitPriceCents: number;
}

export interface EligibilityContext {
  clientId: string | null;
  clientFacts: ClientFacts | null;
  cartLines: CartLine[];
  subtotalCents: number;
  usage?: { totalUses: number; clientUses: number };
}

export type EligibilityResult =
  | { eligible: false; reason: string }
  | { eligible: true; discountCents: number }
  | { eligible: true; freeShipping: true };

function matchesScope(scope: Scope, line: CartLine): boolean {
  if (scope.scope === "all") return true;
  if (scope.scope === "products") return scope.productIds.includes(line.productId);
  return line.categoryIds.some((id) => scope.categoryIds.includes(id));
}

function checkMinimumPurchase(minimumPurchase: MinimumPurchase, context: EligibilityContext): boolean {
  if (minimumPurchase.type === "none") return true;
  if (minimumPurchase.type === "amount") return context.subtotalCents >= minimumPurchase.minCents;
  const totalQuantity = context.cartLines.reduce((sum, l) => sum + l.quantity, 0);
  return totalQuantity >= minimumPurchase.minQuantity;
}

function checkEligibility(
  eligibility: Eligibility,
  context: EligibilityContext,
  segmentsById: Map<string, Segment>
): boolean {
  if (eligibility.scope === "all") return true;
  if (!context.clientFacts) return false;
  // A client qualifies if they match ANY of the listed segments (an OR
  // across segment membership) -- distinct from a segment's own
  // conditions, which are ANDed internally.
  return eligibility.segmentIds.some((id) => {
    const segment = segmentsById.get(id);
    return segment ? matchesSegment(context.clientFacts!, segment) : false;
  });
}

function checkUsageLimits(usageLimits: UsageLimits, context: EligibilityContext): boolean {
  const usage = context.usage ?? { totalUses: 0, clientUses: 0 };
  if (usageLimits.totalLimit !== undefined && usage.totalUses >= usageLimits.totalLimit) return false;
  if (usageLimits.onePerCustomer && usage.clientUses > 0) return false;
  return true;
}

/**
 * Evaluates whether a discount currently qualifies against a given cart/
 * client, and if so, what it's worth. Pure and side-effect-free so it can
 * be called from the checkout route (with real usage counts) and, later,
 * from an admin "would this apply" preview (with synthetic ones).
 */
export function evaluateDiscountEligibility(
  config: DiscountConfig,
  context: EligibilityContext,
  segmentsById: Map<string, Segment> = new Map()
): EligibilityResult {
  if (!checkEligibility(config.eligibility, context, segmentsById)) {
    return { eligible: false, reason: "Client is not eligible for this discount" };
  }
  if (!checkMinimumPurchase(config.minimumPurchase, context)) {
    return { eligible: false, reason: "Cart does not meet the minimum purchase requirement" };
  }
  if (!checkUsageLimits(config.usageLimits, context)) {
    return { eligible: false, reason: "Discount usage limit reached" };
  }

  if (config.discount_type === "free_shipping") {
    return { eligible: true, freeShipping: true };
  }

  if (config.discount_type === "amount_off_order") {
    const discountCents =
      config.valueType === "percent"
        ? Math.round((context.subtotalCents * config.value) / 100)
        : config.value;
    return { eligible: true, discountCents: Math.min(discountCents, context.subtotalCents) };
  }

  if (config.discount_type === "amount_off_products") {
    const matchingLines = context.cartLines.filter((l) => matchesScope(config.appliesTo, l));
    if (matchingLines.length === 0) {
      return { eligible: false, reason: "No matching products in cart" };
    }
    const matchingSubtotal = matchingLines.reduce((sum, l) => sum + l.unitPriceCents * l.quantity, 0);
    const discountCents =
      config.valueType === "percent"
        ? Math.round((matchingSubtotal * config.value) / 100)
        : Math.min(config.value, matchingSubtotal);
    return { eligible: true, discountCents };
  }

  // buy_x_get_y: buy-quantity requirement must be met by units in
  // buy.scope; the discount applies to the cheapest get.quantity units in
  // get.scope that aren't also counted toward the buy requirement (a unit
  // can't be both a "buy" unit and a "get" unit).
  const buyQualifyingQuantity = context.cartLines
    .filter((l) => matchesScope(config.buy.scope, l))
    .reduce((sum, l) => sum + l.quantity, 0);
  if (buyQualifyingQuantity < config.buy.quantity) {
    return { eligible: false, reason: "Buy quantity requirement not met" };
  }

  const getCandidateUnits: number[] = [];
  for (const line of context.cartLines) {
    if (!matchesScope(config.get.scope, line)) continue;
    for (let i = 0; i < line.quantity; i++) getCandidateUnits.push(line.unitPriceCents);
  }
  // Reserve `buy.quantity` units (cheapest-first is customer-unfavorable;
  // reserve the most expensive units as "bought" so the discount targets
  // the cheapest remaining units -- standard, customer-favorable BXGY
  // behavior) before computing which units are actually discounted.
  getCandidateUnits.sort((a, b) => b - a);
  const remainingAfterBuy = getCandidateUnits.slice(config.buy.quantity);
  remainingAfterBuy.sort((a, b) => a - b);
  const discountedUnits = remainingAfterBuy.slice(0, config.get.quantity);

  if (discountedUnits.length === 0) {
    return { eligible: false, reason: "No matching 'get' items in cart" };
  }

  const discountCents = discountedUnits.reduce((sum, unitCents) => {
    const off =
      config.get.valueType === "percent" ? Math.round((unitCents * config.get.value) / 100) : Math.min(config.get.value, unitCents);
    return sum + off;
  }, 0);

  return { eligible: true, discountCents };
}
