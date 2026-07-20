"use client";

import { useMemo, useState } from "react";

interface OptionValueState {
  label: string;
}

interface OptionTypeState {
  name: string;
  values: OptionValueState[];
}

interface VariantState {
  valueIndexes: number[];
  price: string;
  stock_qty: string;
  sku: string;
  weight_text: string;
  dimensions_text: string;
}

export interface ProductOptionsDefaults {
  optionTypes: OptionTypeState[];
  variants: VariantState[];
}

/**
 * Cartesian product of each option type's value indexes, e.g. two types
 * with 2 and 3 values each produce 6 combinations: [0,0] [0,1] [0,2] [1,0]
 * [1,1] [1,2]. Drives the generated combination grid below.
 */
function combinations(valueCounts: number[]): number[][] {
  if (valueCounts.length === 0) return [];
  return valueCounts.reduce<number[][]>(
    (acc, count) =>
      acc.flatMap((combo) =>
        Array.from({ length: count }, (_, i) => [...combo, i])
      ),
    [[]]
  );
}

function comboKey(indexes: number[]): string {
  return indexes.join(",");
}

/**
 * Lets an admin define per-product option types (e.g. "Size", "Skin
 * type") with a repeatable list of values each, then price/stock every
 * resulting combination as its own variant. Holds all state locally and
 * serializes to a single hidden JSON field (name="options_json") that
 * submits atomically with the rest of the product form -- this doesn't
 * fire its own server actions per row (unlike HeroSlidesManager) because
 * options must save together with product create/update, not as an
 * independently-persisted list against an already-existing row.
 */
export function ProductOptionsManager({
  defaults,
}: {
  defaults?: ProductOptionsDefaults;
}) {
  const [optionTypes, setOptionTypes] = useState<OptionTypeState[]>(
    defaults?.optionTypes ?? []
  );
  // variantPrices/Stock/Sku keyed by comboKey(valueIndexes) so edits
  // survive reordering/adding value lists without losing entered data.
  const initialVariantMap = useMemo(() => {
    const map = new Map<
      string,
      { price: string; stock_qty: string; sku: string; weight_text: string; dimensions_text: string }
    >();
    for (const v of defaults?.variants ?? []) {
      map.set(comboKey(v.valueIndexes), {
        price: v.price,
        stock_qty: v.stock_qty,
        sku: v.sku,
        weight_text: v.weight_text,
        dimensions_text: v.dimensions_text,
      });
    }
    return map;
  }, [defaults]);
  const [variantData, setVariantData] = useState(initialVariantMap);

  const valueCounts = optionTypes.map((t) => t.values.length);
  const hasCompleteTypes = optionTypes.length > 0 && optionTypes.every((t) => t.values.length > 0);
  const combos = hasCompleteTypes ? combinations(valueCounts) : [];

  function addOptionType() {
    setOptionTypes((prev) => [...prev, { name: "", values: [] }]);
  }

  function removeOptionType(typeIndex: number) {
    setOptionTypes((prev) => prev.filter((_, i) => i !== typeIndex));
  }

  function updateTypeName(typeIndex: number, name: string) {
    setOptionTypes((prev) =>
      prev.map((t, i) => (i === typeIndex ? { ...t, name } : t))
    );
  }

  function addValue(typeIndex: number) {
    setOptionTypes((prev) =>
      prev.map((t, i) =>
        i === typeIndex ? { ...t, values: [...t.values, { label: "" }] } : t
      )
    );
  }

  function updateValueLabel(typeIndex: number, valueIndex: number, label: string) {
    setOptionTypes((prev) =>
      prev.map((t, i) =>
        i === typeIndex
          ? {
              ...t,
              values: t.values.map((v, j) => (j === valueIndex ? { label } : v)),
            }
          : t
      )
    );
  }

  function removeValue(typeIndex: number, valueIndex: number) {
    setOptionTypes((prev) =>
      prev.map((t, i) =>
        i === typeIndex
          ? { ...t, values: t.values.filter((_, j) => j !== valueIndex) }
          : t
      )
    );
  }

  function updateVariantField(
    indexes: number[],
    field: "price" | "stock_qty" | "sku" | "weight_text" | "dimensions_text",
    value: string
  ) {
    const key = comboKey(indexes);
    setVariantData((prev) => {
      const next = new Map(prev);
      const existing = next.get(key) ?? {
        price: "",
        stock_qty: "0",
        sku: "",
        weight_text: "",
        dimensions_text: "",
      };
      next.set(key, { ...existing, [field]: value });
      return next;
    });
  }

  const payload = {
    optionTypes: optionTypes
      .filter((t) => t.name.trim() && t.values.some((v) => v.label.trim()))
      .map((t) => ({
        name: t.name.trim(),
        values: t.values.filter((v) => v.label.trim()),
      })),
    variants: combos.map((indexes) => {
      const data = variantData.get(comboKey(indexes)) ?? {
        price: "0",
        stock_qty: "0",
        sku: "",
        weight_text: "",
        dimensions_text: "",
      };
      return {
        valueIndexes: indexes,
        price: data.price || "0",
        stock_qty: data.stock_qty || "0",
        sku: data.sku,
        weight_text: data.weight_text,
        dimensions_text: data.dimensions_text,
      };
    }),
  };

  return (
    <div className="space-y-4">
      <input type="hidden" name="options_json" value={JSON.stringify(payload)} />

      {optionTypes.length === 0 && (
        <p className="text-sm text-muted">
          No options yet -- this product has a single fixed price. Add an
          option type (e.g. &quot;Size&quot;) to sell it in multiple
          variants.
        </p>
      )}

      <div className="space-y-3">
        {optionTypes.map((type, typeIndex) => (
          <div key={typeIndex} className="border border-line bg-surface p-3">
            <div className="flex items-center gap-2">
              <input
                value={type.name}
                onChange={(e) => updateTypeName(typeIndex, e.target.value)}
                placeholder="Option name, e.g. Size"
                className="flex-1 border border-line bg-background px-2.5 py-1.5 text-sm"
              />
              <button
                type="button"
                onClick={() => removeOptionType(typeIndex)}
                className="shrink-0 text-xs text-red-700 underline underline-offset-4 hover:text-red-800"
              >
                Remove
              </button>
            </div>

            <div className="mt-2 flex flex-wrap gap-2">
              {type.values.map((value, valueIndex) => (
                <div key={valueIndex} className="flex items-center gap-1">
                  <input
                    value={value.label}
                    onChange={(e) =>
                      updateValueLabel(typeIndex, valueIndex, e.target.value)
                    }
                    placeholder="Value, e.g. Small"
                    className="w-32 border border-line bg-background px-2 py-1 text-xs"
                  />
                  <button
                    type="button"
                    onClick={() => removeValue(typeIndex, valueIndex)}
                    aria-label={`Remove ${value.label || "value"}`}
                    className="text-xs text-muted hover:text-red-700"
                  >
                    ×
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => addValue(typeIndex)}
                className="text-xs font-medium uppercase tracking-wide text-muted transition-colors hover:text-foreground"
              >
                + Add value
              </button>
            </div>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={addOptionType}
        className="border border-dashed border-line px-4 py-2 text-xs font-medium uppercase tracking-wide text-muted transition-colors hover:border-foreground hover:text-foreground"
      >
        + Add option type
      </button>

      {combos.length > 0 && (
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted">
            Variants -- price, stock, weight and dimensions per combination
          </p>
          <table className="mt-2 w-full text-left text-sm">
            <thead className="border-b border-line text-xs uppercase tracking-wide text-muted">
              <tr>
                {optionTypes.map((t, i) => (
                  <th key={i} className="py-1.5 pr-3 font-medium">
                    {t.name || `Option ${i + 1}`}
                  </th>
                ))}
                <th className="py-1.5 pr-3 font-medium">Price (EUR)</th>
                <th className="py-1.5 pr-3 font-medium">Stock</th>
                <th className="py-1.5 pr-3 font-medium">SKU</th>
                <th className="py-1.5 pr-3 font-medium">Weight</th>
                <th className="py-1.5 font-medium">Dimensions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {combos.map((indexes) => {
                const key = comboKey(indexes);
                const data = variantData.get(key) ?? {
                  price: "",
                  stock_qty: "0",
                  sku: "",
                  weight_text: "",
                  dimensions_text: "",
                };
                return (
                  <tr key={key}>
                    {indexes.map((valueIndex, typeIndex) => (
                      <td key={typeIndex} className="py-1.5 pr-3 text-foreground">
                        {optionTypes[typeIndex]?.values[valueIndex]?.label || "—"}
                      </td>
                    ))}
                    <td className="py-1.5 pr-3">
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={data.price}
                        onChange={(e) =>
                          updateVariantField(indexes, "price", e.target.value)
                        }
                        placeholder="0.00"
                        className="w-24 border border-line bg-background px-2 py-1 text-xs"
                      />
                    </td>
                    <td className="py-1.5 pr-3">
                      <input
                        type="number"
                        step="1"
                        min="0"
                        value={data.stock_qty}
                        onChange={(e) =>
                          updateVariantField(indexes, "stock_qty", e.target.value)
                        }
                        className="w-20 border border-line bg-background px-2 py-1 text-xs"
                      />
                    </td>
                    <td className="py-1.5 pr-3">
                      <input
                        value={data.sku}
                        onChange={(e) =>
                          updateVariantField(indexes, "sku", e.target.value)
                        }
                        placeholder="Optional"
                        className="w-28 border border-line bg-background px-2 py-1 text-xs"
                      />
                    </td>
                    <td className="py-1.5 pr-3">
                      <input
                        value={data.weight_text}
                        onChange={(e) =>
                          updateVariantField(indexes, "weight_text", e.target.value)
                        }
                        placeholder="0.5 kg"
                        className="w-24 border border-line bg-background px-2 py-1 text-xs"
                      />
                    </td>
                    <td className="py-1.5">
                      <input
                        value={data.dimensions_text}
                        onChange={(e) =>
                          updateVariantField(indexes, "dimensions_text", e.target.value)
                        }
                        placeholder="1 × 2 × 3 cm"
                        className="w-28 border border-line bg-background px-2 py-1 text-xs"
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
