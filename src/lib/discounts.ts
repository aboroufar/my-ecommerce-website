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
export interface ScopeTags {
  scope: "tags";
  tagIds: string[];
}
export type Scope = ScopeAll | ScopeCollections | ScopeProducts | ScopeTags;

export type Eligibility = { scope: "all" } | { scope: "segments"; segmentIds: string[] };

export type MinimumPurchase =
  | { type: "none" }
  | { type: "amount"; minCents: number }
  | { type: "quantity"; minQuantity: number };

// A Buy X Get Y "buy" condition, expressed the same way as a minimum
// purchase requirement (minus "none" -- a buy condition always needs a
// real threshold) so the admin form can reuse the same
// amount-or-quantity radio pattern already used for Minimum Purchase
// Requirements.
export type BuyRequirement =
  | { type: "amount"; minCents: number }
  | { type: "quantity"; minQuantity: number };

export interface UsageLimits {
  onePerCustomer: boolean;
}

export interface Combinations {
  combinesWithProduct: boolean;
  combinesWithOrder: boolean;
  combinesWithShipping: boolean;
}

// Which "combination category" a discount type belongs to, for checking
// two discounts' combinations flags against each other at checkout.
// buy_x_get_y is itself a product discount (it discounts specific line
// items), same category as amount_off_products.
export function discountCategory(discountType: DiscountType): "product" | "order" | "shipping" {
  if (discountType === "amount_off_order") return "order";
  if (discountType === "free_shipping") return "shipping";
  return "product";
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
      appliesTo: Scope;
      valueType: "percent" | "fixed";
      value: number;
    })
  | (SharedFields & {
      discount_type: "free_shipping";
      appliesTo: Scope;
      // If set, the discount doesn't waive shipping when the actual
      // calculated shipping cost exceeds this cap (Shopify calls this
      // "Exclude shipping rates over a certain amount").
      maxShippingCents?: number;
    })
  | (SharedFields & {
      discount_type: "buy_x_get_y";
      buy: { scope: Scope; requirement: BuyRequirement };
      get: {
        scope: Scope;
        quantity: number;
        valueType: "percent" | "fixed" | "free";
        value: number;
        // Caps how many times the buy/get pairing can repeat within a
        // single order (Shopify calls this "Allocation limit" / "Set a
        // maximum number of uses per order"). Undefined means unlimited
        // repetitions -- as many times as the cart's buy-condition
        // quantity allows.
        allocationLimit?: number;
      };
    });

const scopeAllSchema = z.object({ scope: z.literal("all") });
const scopeSchema: z.ZodType<Scope> = z.discriminatedUnion("scope", [
  scopeAllSchema,
  z.object({ scope: z.literal("collections"), categoryIds: z.array(z.string()) }),
  z.object({ scope: z.literal("products"), productIds: z.array(z.string()) }),
  z.object({ scope: z.literal("tags"), tagIds: z.array(z.string()) }),
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

const buyRequirementSchema: z.ZodType<BuyRequirement> = z.discriminatedUnion("type", [
  z.object({ type: z.literal("amount"), minCents: z.number().int().nonnegative() }),
  z.object({ type: z.literal("quantity"), minQuantity: z.number().int().positive() }),
]);

const usageLimitsSchema: z.ZodType<UsageLimits> = z.object({
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
      appliesTo: scopeSchema,
      valueType: z.enum(["percent", "fixed"]),
      value: z.number().positive(),
      ...sharedFieldsSchema,
    }),
    z.object({
      discount_type: z.literal("free_shipping"),
      appliesTo: scopeSchema,
      maxShippingCents: z.number().int().nonnegative().optional(),
      ...sharedFieldsSchema,
    }),
    z.object({
      discount_type: z.literal("buy_x_get_y"),
      buy: z.object({ scope: scopeSchema, requirement: buyRequirementSchema }),
      get: z.object({
        scope: scopeSchema,
        quantity: z.number().int().positive(),
        valueType: z.enum(["percent", "fixed", "free"]),
        value: z.number().nonnegative(),
        allocationLimit: z.number().int().positive().optional(),
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
  tagIds: string[];
  quantity: number;
  unitPriceCents: number;
}

export interface EligibilityContext {
  clientId: string | null;
  clientFacts: ClientFacts | null;
  cartLines: CartLine[];
  subtotalCents: number;
  // The shipping cost that would apply before any free_shipping discount
  // waives it -- needed to check maxShippingCents ("exclude shipping
  // rates over a certain amount"). Callers must compute this
  // independently of whether a discount ends up waiving it.
  calculatedShippingCents?: number;
  usage?: { clientUses: number };
}

export type EligibilityResult =
  | { eligible: false; reason: string }
  | { eligible: true; discountCents: number }
  | { eligible: true; freeShipping: true };

function matchesScope(scope: Scope, line: CartLine): boolean {
  if (scope.scope === "all") return true;
  if (scope.scope === "products") return scope.productIds.includes(line.productId);
  if (scope.scope === "tags") return line.tagIds.some((id) => scope.tagIds.includes(id));
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
  const usage = context.usage ?? { clientUses: 0 };
  if (usageLimits.onePerCustomer && usage.clientUses > 0) return false;
  return true;
}

function checkBuyRequirement(
  requirement: BuyRequirement,
  scope: Scope,
  context: EligibilityContext
): boolean {
  const matchingLines = context.cartLines.filter((l) => matchesScope(scope, l));
  if (requirement.type === "amount") {
    const matchingSubtotal = matchingLines.reduce((sum, l) => sum + l.unitPriceCents * l.quantity, 0);
    return matchingSubtotal >= requirement.minCents;
  }
  const matchingQuantity = matchingLines.reduce((sum, l) => sum + l.quantity, 0);
  return matchingQuantity >= requirement.minQuantity;
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
    const matchingLines = context.cartLines.filter((l) => matchesScope(config.appliesTo, l));
    if (matchingLines.length === 0) {
      return { eligible: false, reason: "No matching products in cart" };
    }
    if (
      config.maxShippingCents !== undefined &&
      context.calculatedShippingCents !== undefined &&
      context.calculatedShippingCents > config.maxShippingCents
    ) {
      return { eligible: false, reason: "Shipping rate exceeds this discount's cap" };
    }
    return { eligible: true, freeShipping: true };
  }

  if (config.discount_type === "amount_off_order") {
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

  // buy_x_get_y: the buy condition (minimum quantity or minimum purchase
  // amount within buy.scope) gates eligibility. The buy/get pairing
  // repeats as many times as the cart allows -- e.g. "buy 2 get 1" with
  // 6 qualifying items repeats 3 times, unless capped by
  // get.allocationLimit ("maximum number of uses per order"). Units are
  // expanded into a single per-unit pool (buy.requirement.type ===
  // "quantity" only -- an amount-based buy requirement has no natural
  // unit count to divide into repetitions, so it's always exactly one
  // repetition once met, still subject to allocationLimit as a no-op at
  // 1). A unit matching BOTH buy and get scope is only ever counted once
  // -- reserved as "bought" first (most-expensive-first, so the discount
  // targets the cheapest remaining units, standard customer-favorable
  // BXGY behavior) -- so overlapping scopes (or fully identical ones)
  // correctly can't double-spend the same units across both roles.
  if (!checkBuyRequirement(config.buy.requirement, config.buy.scope, context)) {
    return { eligible: false, reason: "Buy requirement not met" };
  }

  let repetitions = 1;
  let discountableUnits: number[] = [];

  if (config.buy.requirement.type === "quantity") {
    const buyMinQuantity = config.buy.requirement.minQuantity;

    // One entry per unit in the cart, tagged with which role(s) it can
    // fill. A unit matching both scopes can fill either role but not both
    // at once.
    const units: { priceCents: number; canBuy: boolean; canGet: boolean }[] = [];
    for (const line of context.cartLines) {
      const canBuy = matchesScope(config.buy.scope, line);
      const canGet = matchesScope(config.get.scope, line);
      if (!canBuy && !canGet) continue;
      for (let i = 0; i < line.quantity; i++) {
        units.push({ priceCents: line.unitPriceCents, canBuy, canGet });
      }
    }

    const buyPoolQty = units.filter((u) => u.canBuy).length;
    const getPoolQty = units.filter((u) => u.canGet).length;
    const repsFromBuyPool = Math.floor(buyPoolQty / buyMinQuantity);
    const repsFromGetPool = Math.floor(getPoolQty / config.get.quantity);
    repetitions = Math.min(repsFromBuyPool, repsFromGetPool || repsFromBuyPool);
    // When buy/get scopes overlap, the same units compete for both roles,
    // so also cap by how many complete (buy + get) groups the combined
    // pool can actually supply.
    const overlapping = units.some((u) => u.canBuy && u.canGet);
    if (overlapping) {
      repetitions = Math.min(
        repetitions,
        Math.floor(units.length / (buyMinQuantity + config.get.quantity))
      );
    }
    if (config.get.allocationLimit !== undefined) {
      repetitions = Math.min(repetitions, config.get.allocationLimit);
    }

    // Reserve buyMinQuantity * repetitions units as "bought" -- prefer
    // buy-only units first (they can't serve as "get" anyway), then the
    // most expensive buy-and-get units, so the cheapest shared units
    // remain available to be discounted.
    const buyOnly = units.filter((u) => u.canBuy && !u.canGet);
    const buyAndGet = units.filter((u) => u.canBuy && u.canGet).sort((a, b) => b.priceCents - a.priceCents);
    const neededBuyUnits = buyMinQuantity * repetitions;
    const reserved = new Set<(typeof units)[number]>();
    for (const u of buyOnly) {
      if (reserved.size >= neededBuyUnits) break;
      reserved.add(u);
    }
    for (const u of buyAndGet) {
      if (reserved.size >= neededBuyUnits) break;
      reserved.add(u);
    }

    discountableUnits = units
      .filter((u) => u.canGet && !reserved.has(u))
      .map((u) => u.priceCents);
  } else {
    if (config.get.allocationLimit !== undefined) {
      repetitions = Math.min(repetitions, config.get.allocationLimit);
    }
    discountableUnits = context.cartLines
      .filter((l) => matchesScope(config.get.scope, l))
      .flatMap((l) => Array(l.quantity).fill(l.unitPriceCents));
  }

  const maxDiscountedUnits = repetitions * config.get.quantity;
  discountableUnits.sort((a, b) => a - b);
  const discountedUnits = discountableUnits.slice(0, maxDiscountedUnits);

  if (repetitions <= 0 || discountedUnits.length === 0) {
    return { eligible: false, reason: "No matching 'get' items in cart" };
  }

  const discountCents = discountedUnits.reduce((sum, unitCents) => {
    const off =
      config.get.valueType === "free"
        ? unitCents
        : config.get.valueType === "percent"
          ? Math.round((unitCents * config.get.value) / 100)
          : Math.min(config.get.value, unitCents);
    return sum + off;
  }, 0);

  return { eligible: true, discountCents };
}
