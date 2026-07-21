"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ProductChecklist, type ProductOption } from "./ProductChecklist";
import type { DiscountConfig, DiscountType, Scope } from "@/lib/discounts";

interface CategoryOption {
  id: string;
  name: string;
}

interface SegmentOption {
  id: string;
  name: string;
}

interface DiscountFormValues {
  code?: string;
  active?: boolean;
  starts_at?: string;
  expires_at?: string | null;
  config?: DiscountConfig;
}

// Splits an ISO timestamp into separate <input type="date">/<input
// type="time"> values (local time, since that's what the admin is
// setting the schedule in).
function splitDateTime(iso?: string | null): { date: string; time: string } {
  if (!iso) return { date: "", time: "" };
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return { date: "", time: "" };
  const pad = (n: number) => String(n).padStart(2, "0");
  return {
    date: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`,
    time: `${pad(d.getHours())}:${pad(d.getMinutes())}`,
  };
}

function combineDateTime(date: string, time: string): string | null {
  if (!date) return null;
  const combined = new Date(`${date}T${time || "00:00"}`);
  return Number.isNaN(combined.getTime()) ? null : combined.toISOString();
}

const VALUE_TYPE_LABELS = { percent: "Percentage", fixed: "Fixed amount" } as const;

// Uppercase alphanumeric, no ambiguous characters (no O/0/I/1), matching
// the style of generate_client_id() used elsewhere in this codebase.
const CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
function generateDiscountCode(length = 12): string {
  let result = "";
  for (let i = 0; i < length; i++) {
    result += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
  }
  return result;
}

function ScopePicker({
  scope,
  onChange,
  categories,
  products,
}: {
  scope: Scope;
  onChange: (next: Scope) => void;
  categories: CategoryOption[];
  products: ProductOption[];
}) {
  return (
    <div className="flex flex-col gap-2">
      <select
        value={scope.scope}
        onChange={(e) => {
          const next = e.target.value as Scope["scope"];
          if (next === "all") onChange({ scope: "all" });
          else if (next === "collections") onChange({ scope: "collections", categoryIds: [] });
          else onChange({ scope: "products", productIds: [] });
        }}
        className="border border-line bg-background px-2.5 py-1.5 text-sm"
      >
        <option value="all">All products</option>
        <option value="collections">Specific collections</option>
        <option value="products">Specific products</option>
      </select>

      {scope.scope === "collections" && (
        <div className="max-h-48 space-y-1.5 overflow-y-auto rounded-md border border-line bg-background p-3">
          {categories.length === 0 ? (
            <p className="text-sm text-muted">No collections yet.</p>
          ) : (
            categories.map((category) => (
              <label key={category.id} className="flex items-center gap-2 text-sm text-foreground">
                <input
                  type="checkbox"
                  checked={scope.categoryIds.includes(category.id)}
                  onChange={() => {
                    const set = new Set(scope.categoryIds);
                    if (set.has(category.id)) set.delete(category.id);
                    else set.add(category.id);
                    onChange({ scope: "collections", categoryIds: [...set] });
                  }}
                />
                {category.name}
              </label>
            ))
          )}
        </div>
      )}

      {scope.scope === "products" && (
        <ProductChecklist
          products={products}
          selectedIds={new Set(scope.productIds)}
          onChange={(next) => onChange({ scope: "products", productIds: [...next] })}
        />
      )}
    </div>
  );
}

export function DiscountForm({
  discountType,
  categories,
  products,
  segments,
  initialValues,
  action,
}: {
  discountType: DiscountType;
  categories: CategoryOption[];
  products: ProductOption[];
  segments: SegmentOption[];
  initialValues?: DiscountFormValues;
  action: (formData: FormData) => void;
}) {
  const initialConfig = initialValues?.config;

  const [method, setMethod] = useState<"code" | "automatic">(initialConfig?.method ?? "code");
  const [code, setCode] = useState(initialValues?.code ?? initialConfig?.code ?? "");
  const [active, setActive] = useState(initialValues?.active ?? true);

  const initialStart = splitDateTime(initialValues?.starts_at);
  const [startDate, setStartDate] = useState(
    initialStart.date || splitDateTime(new Date().toISOString()).date
  );
  const [startTime, setStartTime] = useState(
    initialStart.time || splitDateTime(new Date().toISOString()).time
  );

  const initialEnd = splitDateTime(initialValues?.expires_at);
  const [hasEndDate, setHasEndDate] = useState(!!initialValues?.expires_at);
  const [endDate, setEndDate] = useState(initialEnd.date);
  const [endTime, setEndTime] = useState(initialEnd.time || "23:59");

  const [valueType, setValueType] = useState<"percent" | "fixed">(
    (initialConfig && "valueType" in initialConfig && initialConfig.valueType) || "percent"
  );
  const [value, setValue] = useState<number>(
    (initialConfig && "value" in initialConfig && initialConfig.value) || 0
  );
  const [appliesTo, setAppliesTo] = useState<Scope>(
    (initialConfig && "appliesTo" in initialConfig && initialConfig.appliesTo) || { scope: "all" }
  );

  const [buyScope, setBuyScope] = useState<Scope>(
    (initialConfig?.discount_type === "buy_x_get_y" && initialConfig.buy.scope) || { scope: "all" }
  );
  const [buyQuantity, setBuyQuantity] = useState(
    (initialConfig?.discount_type === "buy_x_get_y" && initialConfig.buy.quantity) || 1
  );
  const [getScope, setGetScope] = useState<Scope>(
    (initialConfig?.discount_type === "buy_x_get_y" && initialConfig.get.scope) || { scope: "all" }
  );
  const [getQuantity, setGetQuantity] = useState(
    (initialConfig?.discount_type === "buy_x_get_y" && initialConfig.get.quantity) || 1
  );
  const [getValueType, setGetValueType] = useState<"percent" | "fixed">(
    (initialConfig?.discount_type === "buy_x_get_y" && initialConfig.get.valueType) || "percent"
  );
  const [getValue, setGetValue] = useState(
    (initialConfig?.discount_type === "buy_x_get_y" && initialConfig.get.value) || 100
  );

  const [eligibilityScope, setEligibilityScope] = useState<"all" | "segments">(
    initialConfig?.eligibility.scope ?? "all"
  );
  const [segmentIds, setSegmentIds] = useState<Set<string>>(
    new Set(
      initialConfig?.eligibility.scope === "segments" ? initialConfig.eligibility.segmentIds : []
    )
  );

  const [minPurchaseType, setMinPurchaseType] = useState<"none" | "amount" | "quantity">(
    initialConfig?.minimumPurchase.type ?? "none"
  );
  const [minAmountEuros, setMinAmountEuros] = useState(
    initialConfig?.minimumPurchase.type === "amount" ? initialConfig.minimumPurchase.minCents / 100 : 0
  );
  const [minQuantity, setMinQuantity] = useState(
    initialConfig?.minimumPurchase.type === "quantity" ? initialConfig.minimumPurchase.minQuantity : 1
  );

  const [totalLimitEnabled, setTotalLimitEnabled] = useState(
    initialConfig?.usageLimits.totalLimit !== undefined
  );
  const [totalLimit, setTotalLimit] = useState(initialConfig?.usageLimits.totalLimit ?? 100);
  const [onePerCustomer, setOnePerCustomer] = useState(
    initialConfig?.usageLimits.onePerCustomer ?? false
  );

  const configJson = useMemo(() => {
    const shared = {
      method,
      code: method === "code" ? code.trim().toUpperCase() : undefined,
      eligibility:
        eligibilityScope === "all"
          ? { scope: "all" as const }
          : { scope: "segments" as const, segmentIds: [...segmentIds] },
      minimumPurchase:
        minPurchaseType === "none"
          ? { type: "none" as const }
          : minPurchaseType === "amount"
            ? { type: "amount" as const, minCents: Math.round(minAmountEuros * 100) }
            : { type: "quantity" as const, minQuantity },
      usageLimits: {
        totalLimit: totalLimitEnabled ? totalLimit : undefined,
        onePerCustomer,
      },
      // Combinations are informational-only in v1 (see admin form section
      // below) -- always false, and enforced as such by the checkout route.
      combinations: {
        combinesWithProduct: false,
        combinesWithOrder: false,
        combinesWithShipping: false,
      },
    };

    let config: DiscountConfig;
    if (discountType === "free_shipping") {
      config = { discount_type: "free_shipping", appliesTo: { scope: "all" }, ...shared };
    } else if (discountType === "amount_off_order") {
      config = { discount_type: "amount_off_order", appliesTo: { scope: "all" }, valueType, value, ...shared };
    } else if (discountType === "amount_off_products") {
      config = { discount_type: "amount_off_products", appliesTo, valueType, value, ...shared };
    } else {
      config = {
        discount_type: "buy_x_get_y",
        buy: { scope: buyScope, quantity: buyQuantity },
        get: { scope: getScope, quantity: getQuantity, valueType: getValueType, value: getValue },
        ...shared,
      };
    }
    return JSON.stringify(config);
  }, [
    discountType,
    method,
    code,
    eligibilityScope,
    segmentIds,
    minPurchaseType,
    minAmountEuros,
    minQuantity,
    totalLimitEnabled,
    totalLimit,
    onePerCustomer,
    valueType,
    value,
    appliesTo,
    buyScope,
    buyQuantity,
    getScope,
    getQuantity,
    getValueType,
    getValue,
  ]);

  return (
    <form action={action} className="flex max-w-2xl flex-col gap-6">
      <input type="hidden" name="discount_type" value={discountType} />
      <input type="hidden" name="configJson" value={configJson} />

      <section className="border border-line bg-surface p-4">
        <h2 className="text-xs font-medium uppercase tracking-wide text-muted">Method</h2>
        <div className="mt-3 flex gap-2">
          <button
            type="button"
            onClick={() => setMethod("code")}
            className={
              method === "code"
                ? "bg-accent px-3 py-1.5 text-sm text-background"
                : "border border-line px-3 py-1.5 text-sm text-foreground"
            }
          >
            Discount code
          </button>
          <button
            type="button"
            onClick={() => setMethod("automatic")}
            className={
              method === "automatic"
                ? "bg-accent px-3 py-1.5 text-sm text-background"
                : "border border-line px-3 py-1.5 text-sm text-foreground"
            }
          >
            Automatic discount
          </button>
        </div>
        {method === "code" && (
          <div className="mt-3 max-w-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium uppercase tracking-wide text-muted">
                Discount code
              </span>
              <button
                type="button"
                onClick={() => setCode(generateDiscountCode())}
                className="text-xs text-accent-text underline underline-offset-4 hover:opacity-80"
              >
                Generate random code
              </button>
            </div>
            <input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              required
              placeholder="e.g. SAVE10"
              className="mt-1.5 w-full border border-line bg-background px-3 py-2 text-sm uppercase"
            />
          </div>
        )}
      </section>

      {discountType !== "free_shipping" && discountType !== "buy_x_get_y" && (
        <section className="border border-line bg-surface p-4">
          <h2 className="text-xs font-medium uppercase tracking-wide text-muted">Discount value</h2>
          <div className="mt-3 flex gap-2">
            <select
              value={valueType}
              onChange={(e) => setValueType(e.target.value as "percent" | "fixed")}
              className="border border-line bg-background px-2.5 py-1.5 text-sm"
            >
              {Object.entries(VALUE_TYPE_LABELS).map(([v, label]) => (
                <option key={v} value={v}>
                  {label}
                </option>
              ))}
            </select>
            <div className="relative">
              <input
                type="number"
                min={0}
                step={valueType === "percent" ? 1 : 0.01}
                value={valueType === "percent" ? value : value / 100}
                onChange={(e) => {
                  const raw = parseFloat(e.target.value) || 0;
                  setValue(valueType === "percent" ? raw : Math.round(raw * 100));
                }}
                className="w-32 border border-line bg-background px-2.5 py-1.5 pr-7 text-sm"
              />
              <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-muted">
                {valueType === "percent" ? "%" : "€"}
              </span>
            </div>
          </div>

          {discountType === "amount_off_products" && (
            <div className="mt-4">
              <h3 className="text-xs font-medium uppercase tracking-wide text-muted">Applies to</h3>
              <div className="mt-2">
                <ScopePicker
                  scope={appliesTo}
                  onChange={setAppliesTo}
                  categories={categories}
                  products={products}
                />
              </div>
            </div>
          )}
        </section>
      )}

      {discountType === "buy_x_get_y" && (
        <section className="border border-line bg-surface p-4">
          <h2 className="text-xs font-medium uppercase tracking-wide text-muted">Discount value</h2>

          <div className="mt-3">
            <h3 className="text-xs font-medium uppercase tracking-wide text-muted">Customer buys</h3>
            <div className="mt-2 flex items-center gap-2">
              <span className="text-sm text-muted">Quantity</span>
              <input
                type="number"
                min={1}
                value={buyQuantity}
                onChange={(e) => setBuyQuantity(parseInt(e.target.value, 10) || 1)}
                className="w-20 border border-line bg-background px-2.5 py-1.5 text-sm"
              />
            </div>
            <div className="mt-2">
              <ScopePicker
                scope={buyScope}
                onChange={setBuyScope}
                categories={categories}
                products={products}
              />
            </div>
          </div>

          <div className="mt-4">
            <h3 className="text-xs font-medium uppercase tracking-wide text-muted">Customer gets</h3>
            <div className="mt-2 flex items-center gap-2">
              <span className="text-sm text-muted">Quantity</span>
              <input
                type="number"
                min={1}
                value={getQuantity}
                onChange={(e) => setGetQuantity(parseInt(e.target.value, 10) || 1)}
                className="w-20 border border-line bg-background px-2.5 py-1.5 text-sm"
              />
            </div>
            <div className="mt-2">
              <ScopePicker
                scope={getScope}
                onChange={setGetScope}
                categories={categories}
                products={products}
              />
            </div>
            <div className="mt-3 flex gap-2">
              <select
                value={getValueType}
                onChange={(e) => setGetValueType(e.target.value as "percent" | "fixed")}
                className="border border-line bg-background px-2.5 py-1.5 text-sm"
              >
                <option value="percent">Percentage off</option>
                <option value="fixed">Fixed amount off</option>
              </select>
              <div className="relative">
                <input
                  type="number"
                  min={0}
                  step={getValueType === "percent" ? 1 : 0.01}
                  value={getValueType === "percent" ? getValue : getValue / 100}
                  onChange={(e) => {
                    const raw = parseFloat(e.target.value) || 0;
                    setGetValue(getValueType === "percent" ? raw : Math.round(raw * 100));
                  }}
                  className="w-32 border border-line bg-background px-2.5 py-1.5 pr-7 text-sm"
                />
                <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-muted">
                  {getValueType === "percent" ? "%" : "€"}
                </span>
              </div>
            </div>
          </div>
        </section>
      )}

      <section className="border border-line bg-surface p-4">
        <h2 className="text-xs font-medium uppercase tracking-wide text-muted">Eligibility</h2>
        <select
          value={eligibilityScope}
          onChange={(e) => setEligibilityScope(e.target.value as "all" | "segments")}
          className="mt-3 border border-line bg-background px-2.5 py-1.5 text-sm"
        >
          <option value="all">All customers</option>
          <option value="segments">Specific segments</option>
        </select>
        {eligibilityScope === "segments" && (
          <div className="mt-3 max-h-48 space-y-1.5 overflow-y-auto rounded-md border border-line bg-background p-3">
            {segments.length === 0 ? (
              <p className="text-sm text-muted">No segments yet.</p>
            ) : (
              segments.map((segment) => (
                <label key={segment.id} className="flex items-center gap-2 text-sm text-foreground">
                  <input
                    type="checkbox"
                    checked={segmentIds.has(segment.id)}
                    onChange={() => {
                      const next = new Set(segmentIds);
                      if (next.has(segment.id)) next.delete(segment.id);
                      else next.add(segment.id);
                      setSegmentIds(next);
                    }}
                  />
                  {segment.name}
                </label>
              ))
            )}
          </div>
        )}
      </section>

      <section className="border border-line bg-surface p-4">
        <h2 className="text-xs font-medium uppercase tracking-wide text-muted">
          Minimum purchase requirements
        </h2>
        <div className="mt-3 flex flex-col gap-2">
          <label className="flex items-center gap-2 text-sm text-foreground">
            <input
              type="radio"
              checked={minPurchaseType === "none"}
              onChange={() => setMinPurchaseType("none")}
            />
            No minimum requirements
          </label>
          <label className="flex items-center gap-2 text-sm text-foreground">
            <input
              type="radio"
              checked={minPurchaseType === "amount"}
              onChange={() => setMinPurchaseType("amount")}
            />
            Minimum purchase amount (€)
          </label>
          {minPurchaseType === "amount" && (
            <input
              type="number"
              min={0}
              step={0.01}
              value={minAmountEuros}
              onChange={(e) => setMinAmountEuros(parseFloat(e.target.value) || 0)}
              className="ml-6 w-32 border border-line bg-background px-2.5 py-1.5 text-sm"
            />
          )}
          <label className="flex items-center gap-2 text-sm text-foreground">
            <input
              type="radio"
              checked={minPurchaseType === "quantity"}
              onChange={() => setMinPurchaseType("quantity")}
            />
            Minimum quantity of items
          </label>
          {minPurchaseType === "quantity" && (
            <input
              type="number"
              min={1}
              value={minQuantity}
              onChange={(e) => setMinQuantity(parseInt(e.target.value, 10) || 1)}
              className="ml-6 w-32 border border-line bg-background px-2.5 py-1.5 text-sm"
            />
          )}
        </div>
      </section>

      <section className="border border-line bg-surface p-4">
        <h2 className="text-xs font-medium uppercase tracking-wide text-muted">
          Maximum discount uses
        </h2>
        <div className="mt-3 flex flex-col gap-2">
          <label className="flex items-center gap-2 text-sm text-foreground">
            <input
              type="checkbox"
              checked={totalLimitEnabled}
              onChange={(e) => setTotalLimitEnabled(e.target.checked)}
            />
            Limit number of times this discount can be used in total
          </label>
          {totalLimitEnabled && (
            <input
              type="number"
              min={1}
              value={totalLimit}
              onChange={(e) => setTotalLimit(parseInt(e.target.value, 10) || 1)}
              className="ml-6 w-32 border border-line bg-background px-2.5 py-1.5 text-sm"
            />
          )}
          <label className="flex items-center gap-2 text-sm text-foreground">
            <input
              type="checkbox"
              checked={onePerCustomer}
              onChange={(e) => setOnePerCustomer(e.target.checked)}
            />
            Limit to one use per customer
          </label>
        </div>
      </section>

      <section className="border border-line bg-surface p-4">
        <h2 className="text-xs font-medium uppercase tracking-wide text-muted">Combinations</h2>
        <p className="mt-2 text-sm text-muted">
          This discount won&apos;t combine with other product, order, or shipping
          discounts in the customer&apos;s cart.
        </p>
      </section>

      <section className="border border-line bg-surface p-4">
        <h2 className="text-xs font-medium uppercase tracking-wide text-muted">Active dates</h2>
        <label className="mt-3 flex items-center gap-2 text-sm text-foreground">
          <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} />
          Active
        </label>

        <div className="mt-3 grid grid-cols-2 gap-3">
          <label className="flex flex-col gap-1.5">
            <span className="text-xs text-muted">Start date</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="border border-line bg-background px-2.5 py-1.5 text-sm"
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-xs text-muted">Start time</span>
            <input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="border border-line bg-background px-2.5 py-1.5 text-sm"
            />
          </label>
        </div>

        <label className="mt-4 flex items-center gap-2 text-sm text-foreground">
          <input
            type="checkbox"
            checked={hasEndDate}
            onChange={(e) => setHasEndDate(e.target.checked)}
          />
          Set end date
        </label>

        {hasEndDate && (
          <div className="mt-2 grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1.5">
              <span className="text-xs text-muted">End date</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="border border-line bg-background px-2.5 py-1.5 text-sm"
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-xs text-muted">End time</span>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="border border-line bg-background px-2.5 py-1.5 text-sm"
              />
            </label>
          </div>
        )}
      </section>

      <input type="hidden" name="active" value={active ? "on" : ""} />
      <input type="hidden" name="starts_at" value={combineDateTime(startDate, startTime) ?? ""} />
      <input
        type="hidden"
        name="expires_at"
        value={hasEndDate ? combineDateTime(endDate, endTime) ?? "" : ""}
      />

      <div className="flex gap-3">
        <button
          type="submit"
          className="bg-accent px-4 py-2 text-xs font-medium uppercase tracking-wide text-background transition-opacity hover:opacity-90"
        >
          Save discount
        </button>
        <Link
          href="/admin/discounts"
          className="text-xs text-muted underline underline-offset-4 hover:text-foreground"
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}
