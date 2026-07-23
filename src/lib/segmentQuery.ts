import type { SegmentCondition } from "@/lib/segments";

export interface ParsedSegmentQuery {
  show: string[];
  conditions: SegmentCondition[];
  orderBy: { field: string; direction: "asc" | "desc" } | null;
}

export interface ParseError {
  line: number;
  message: string;
}

export type ParseResult =
  | { ok: true; query: ParsedSegmentQuery }
  | { ok: false; errors: ParseError[] };

const FIELD_ALIASES: Record<string, SegmentCondition["field"]> = {
  order_count: "order_count",
  email_subscribed: "email_subscribed",
  created_at: "created_at",
  total_spent: "total_spent_cents",
  total_spent_cents: "total_spent_cents",
  avg_order_value: "avg_order_value_cents",
  avg_order_value_cents: "avg_order_value_cents",
  last_order_date: "last_order_date",
  purchased_product: "purchased_product_id",
  purchased_product_id: "purchased_product_id",
  purchased_category: "purchased_category_id",
  purchased_category_id: "purchased_category_id",
  has_tag: "has_tag",
  tag: "has_tag",
};

const SET_FIELDS = new Set<SegmentCondition["field"]>([
  "purchased_product_id",
  "purchased_category_id",
  "has_tag",
]);

/**
 * One preferred short alias per WHERE-eligible field, for the editor's
 * autocomplete dropdown -- FIELD_ALIASES has multiple spellings per field
 * (e.g. total_spent/total_spent_cents both parse), but a suggestion list
 * should offer one canonical option, not every alias.
 */
export const WHERE_FIELD_NAMES = [
  "order_count",
  "email_subscribed",
  "created_at",
  "total_spent",
  "avg_order_value",
  "last_order_date",
  "purchased_product",
  "purchased_category",
  "has_tag",
] as const;

// "!=" and "<=" have no engine equivalent (engine only has gte/gt/lt/eq) --
// the parser rejects them explicitly with a clear error (see parseCondition)
// rather than mapping them to something misleading.
const OPERATOR_MAP: Record<string, SegmentCondition["operator"]> = {
  "=": "eq",
  ">": "gt",
  ">=": "gte",
  "<": "lt",
};

function coerceValue(raw: string, field: SegmentCondition["field"]): number | boolean | string {
  if (SET_FIELDS.has(field)) return raw;
  if (field === "email_subscribed") {
    if (raw === "true") return true;
    if (raw === "false") return false;
    throw new Error(`"${raw}" is not a valid value for email_subscribed -- use true or false`);
  }
  if (field === "created_at" || field === "last_order_date") {
    return raw;
  }
  const num = Number(raw);
  if (Number.isNaN(num)) {
    throw new Error(`"${raw}" is not a valid number for ${field}`);
  }
  return num;
}

const FIELD_LABELS: Record<SegmentCondition["field"], string> = {
  order_count: "order_count",
  email_subscribed: "email_subscribed",
  created_at: "created_at",
  total_spent_cents: "total_spent",
  avg_order_value_cents: "avg_order_value",
  last_order_date: "last_order_date",
  purchased_product_id: "purchased_product",
  purchased_category_id: "purchased_category",
  has_tag: "has_tag",
};

const OPERATOR_LABELS: Record<SegmentCondition["operator"], string> = {
  eq: "=",
  gt: ">",
  gte: ">=",
  lt: "<",
};

function formatValue(value: SegmentCondition["value"]): string {
  if (typeof value === "boolean") return String(value);
  if (typeof value === "number") return String(value);
  return `"${value}"`;
}

function stripQuotes(raw: string): string {
  const trimmed = raw.trim();
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1);
  }
  return trimmed;
}

function parseCondition(rawClause: string, lineNumber: number): SegmentCondition {
  const match = rawClause.trim().match(/^([a-zA-Z_]+)\s*(=|!=|>=|<=|>|<)\s*(.+)$/);
  if (!match) {
    throw Object.assign(
      new Error(`Line ${lineNumber}: could not parse condition "${rawClause.trim()}"`),
      { line: lineNumber }
    );
  }
  const [, rawField, rawOperator, rawValue] = match;
  const field = FIELD_ALIASES[rawField];
  if (!field) {
    throw Object.assign(new Error(`Line ${lineNumber}: unknown field "${rawField}"`), {
      line: lineNumber,
    });
  }
  if (rawOperator === "!=" || rawOperator === "<=") {
    throw Object.assign(
      new Error(`Line ${lineNumber}: operator "${rawOperator}" is not supported -- use =, >, >=, or <`),
      { line: lineNumber }
    );
  }
  const operator = OPERATOR_MAP[rawOperator];
  if (SET_FIELDS.has(field) && operator !== "eq") {
    throw Object.assign(
      new Error(`Line ${lineNumber}: "${rawField}" only supports = (has purchased this id)`),
      { line: lineNumber }
    );
  }
  const value = coerceValue(stripQuotes(rawValue), field);
  return { field, operator, value };
}

/**
 * Parses only the admin-editable portion of the query -- WHERE/AND/ORDER BY
 * lines -- matching Shopify's own segment editor, where FROM/SHOW/GROUP BY
 * are fixed scaffolding shown for transparency but never typed by the
 * admin. `show` is always derived from the fields actually referenced in
 * WHERE (see deriveShowFields), not read from the text.
 */
export function parseWhereClause(text: string): ParseResult {
  const lines = text.split("\n");
  const errors: ParseError[] = [];
  const conditions: SegmentCondition[] = [];
  let orderBy: ParsedSegmentQuery["orderBy"] = null;
  let sawWhere = false;

  lines.forEach((rawLine, index) => {
    const lineNumber = index + 1;
    const line = rawLine.trim();
    if (!line) return;

    if (/^WHERE\s+/i.test(line)) {
      sawWhere = true;
      const clause = line.replace(/^WHERE\s+/i, "").trim();
      try {
        conditions.push(parseCondition(clause, lineNumber));
      } catch (err) {
        errors.push({ line: lineNumber, message: (err as Error).message });
      }
      return;
    }

    if (/^AND\s+/i.test(line)) {
      if (!sawWhere) {
        errors.push({ line: lineNumber, message: "AND must follow a WHERE line" });
        return;
      }
      const clause = line.replace(/^AND\s+/i, "").trim();
      try {
        conditions.push(parseCondition(clause, lineNumber));
      } catch (err) {
        errors.push({ line: lineNumber, message: (err as Error).message });
      }
      return;
    }

    if (/^ORDER\s+BY\s+/i.test(line)) {
      const rest = line.replace(/^ORDER\s+BY\s+/i, "").trim();
      const [rawField, rawDirection] = rest.split(/\s+/);
      if (!rawField) {
        errors.push({ line: lineNumber, message: "ORDER BY needs a field name" });
        return;
      }
      if (rawDirection && !/^(ASC|DESC)$/i.test(rawDirection)) {
        errors.push({
          line: lineNumber,
          message: `ORDER BY direction must be ASC or DESC, got "${rawDirection}"`,
        });
        return;
      }
      // ORDER BY can reference any client fact (email, name), not just the
      // condition-eligible fields WHERE supports -- so fields not in
      // FIELD_ALIASES pass through as-is rather than being rejected.
      const field = FIELD_ALIASES[rawField] ?? rawField;
      const direction = rawDirection?.toUpperCase() === "DESC" ? "desc" : "asc";
      orderBy = { field, direction };
      return;
    }

    errors.push({
      line: lineNumber,
      message: `Unrecognized line: "${line}" -- expected WHERE, AND, or ORDER BY`,
    });
  });

  if (errors.length > 0) return { ok: false, errors };
  return {
    ok: true,
    query: { show: deriveShowFields(conditions), conditions, orderBy },
  };
}

/**
 * SHOW is always the set of fields referenced in WHERE (deduplicated, in
 * first-seen order) plus "email" -- there's no separate admin choice of
 * which columns to preview, matching the fixed-template behavior.
 */
function deriveShowFields(conditions: SegmentCondition[]): string[] {
  const seen = new Set<string>(["email"]);
  const show = ["email"];
  for (const condition of conditions) {
    const label = FIELD_LABELS[condition.field];
    if (!seen.has(label)) {
      seen.add(label);
      show.push(label);
    }
  }
  return show;
}

/**
 * Renders the fixed, non-editable scaffold lines (FROM/SHOW/GROUP BY)
 * shown above the WHERE editor -- always derived from the current
 * conditions, never stored or typed separately.
 */
export function renderScaffold(conditions: SegmentCondition[]): {
  from: string;
  show: string;
  groupBy: string;
} {
  const fields = deriveShowFields(conditions).join(", ");
  return {
    from: "FROM clients",
    show: `SHOW ${fields}`,
    groupBy: `GROUP BY ${fields}`,
  };
}

/**
 * Serializes conditions back to WHERE/AND lines only -- the editable
 * portion of the query. Used to re-populate the editor from a segment's
 * saved conditions (e.g. Duplicate, or a segment with no persisted
 * query_text such as rows seeded directly via SQL).
 */
export function serializeWhereClause(conditions: SegmentCondition[]): string {
  if (conditions.length === 0) return "";
  return conditions
    .map((condition, index) => {
      const prefix = index === 0 ? "WHERE" : "  AND";
      return `${prefix} ${FIELD_LABELS[condition.field]} ${OPERATOR_LABELS[condition.operator]} ${formatValue(condition.value)}`;
    })
    .join("\n");
}
