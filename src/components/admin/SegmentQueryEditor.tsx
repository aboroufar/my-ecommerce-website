"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  parseWhereClause,
  renderScaffold,
  WHERE_FIELD_NAMES,
  type ParseError,
} from "@/lib/segmentQuery";
import {
  getMatchingClients,
  type ClientFacts,
  type Segment,
} from "@/lib/segments";

const KEYWORD_PATTERN = /^(WHERE|AND|ORDER BY)\b/i;
const OPERATOR_PATTERN = /(>=|<=|!=|=|>|<)/g;

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/** Colors line-prefix keywords and operators; everything else is left as
 * plain text. Not a real lexer -- the DSL is 5 fixed line shapes, so a
 * per-line regex pass is enough. Both the keyword split and the operator
 * split happen on raw (unescaped) text, then each resulting piece is
 * escaped individually before being wrapped in a span -- escaping first
 * and matching second would corrupt multi-char operators like ">=" (the
 * ">" becomes "&gt;" before the regex sees it) and would let the operator
 * regex match the "<"/">" inside an already-inserted <span> tag. */
function highlightLine(line: string): { __html: string } {
  const keywordMatch = line.match(KEYWORD_PATTERN);
  const keyword = keywordMatch?.[0] ?? "";
  const rest = line.slice(keyword.length);

  const restParts: string[] = [];
  let lastIndex = 0;
  for (const match of rest.matchAll(OPERATOR_PATTERN)) {
    const index = match.index ?? 0;
    restParts.push(escapeHtml(rest.slice(lastIndex, index)));
    restParts.push(`<span class="text-muted">${escapeHtml(match[0])}</span>`);
    lastIndex = index + match[0].length;
  }
  restParts.push(escapeHtml(rest.slice(lastIndex)));
  const restHtml = restParts.join("");

  const html = keyword
    ? `<span class="text-accent font-semibold">${escapeHtml(keyword)}</span>${restHtml}`
    : restHtml;

  return { __html: html || "​" };
}

const SHOW_FIELD_LABELS: Record<string, string> = {
  email: "Email",
  order_count: "Orders",
  email_subscribed: "Subscribed",
  created_at: "Joined",
  total_spent: "Total spent",
  avg_order_value: "Avg. order value",
  last_order_date: "Last order",
  has_tag: "Tag",
};

function formatShowValue(client: ClientFacts, field: string): string {
  switch (field) {
    case "email":
      return client.email;
    case "order_count":
      return String(client.order_count);
    case "email_subscribed":
      return client.email_subscribed ? "Yes" : "No";
    case "created_at":
      return new Date(client.created_at).toLocaleDateString();
    case "total_spent":
      return `€${(client.total_spent_cents / 100).toFixed(2)}`;
    case "avg_order_value":
      return `€${(client.avg_order_value_cents / 100).toFixed(2)}`;
    case "last_order_date":
      return client.last_order_date ? new Date(client.last_order_date).toLocaleDateString() : "—";
    default:
      return "—";
  }
}

/**
 * Detects whether the caret sits inside a field-name position -- right
 * after WHERE/AND/ORDER BY on the current line, before any operator has
 * been typed -- and if so, returns the partial word typed so far so it
 * can be matched against WHERE_FIELD_NAMES. Returns null everywhere else
 * (e.g. once an operator or value follows), so the dropdown only appears
 * exactly where a field name is expected, matching Shopify's own
 * field-position-only autocomplete.
 */
function fieldNameContext(
  text: string,
  caret: number
): { lineStart: number; wordStart: number; partial: string } | null {
  const lineStart = text.lastIndexOf("\n", caret - 1) + 1;
  const lineEnd = text.indexOf("\n", caret);
  const line = text.slice(lineStart, lineEnd === -1 ? text.length : lineEnd);
  const caretInLine = caret - lineStart;

  const match = line.match(/^\s*(WHERE|AND|ORDER\s+BY)\s+/i);
  if (!match) return null;
  const afterKeywordIndex = match[0].length;
  if (caretInLine < afterKeywordIndex) return null;

  const between = line.slice(afterKeywordIndex, caretInLine);
  // Once whitespace or an operator character appears after the keyword,
  // the admin has moved past the field name -- no more suggestions.
  if (/[\s=><!]/.test(between)) return null;

  return { lineStart, wordStart: lineStart + afterKeywordIndex, partial: between };
}

export function SegmentQueryEditor({
  clients,
  initialName,
  initialQueryText,
  action,
}: {
  clients: ClientFacts[];
  initialName: string;
  initialQueryText: string;
  action: (formData: FormData) => void;
}) {
  const [name, setName] = useState(initialName);
  const [queryText, setQueryText] = useState(initialQueryText);
  const [suggestions, setSuggestions] = useState<{
    options: string[];
    wordStart: number;
    activeIndex: number;
  } | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  function updateSuggestions(text: string, caret: number) {
    const context = fieldNameContext(text, caret);
    if (!context) {
      setSuggestions(null);
      return;
    }
    const options = WHERE_FIELD_NAMES.filter((f) =>
      f.startsWith(context.partial.toLowerCase())
    );
    if (options.length === 0 || (options.length === 1 && options[0] === context.partial)) {
      setSuggestions(null);
      return;
    }
    setSuggestions({ options, wordStart: context.wordStart, activeIndex: 0 });
  }

  function applySuggestion(field: string) {
    if (!suggestions || !textareaRef.current) return;
    const caret = textareaRef.current.selectionStart;
    const next = queryText.slice(0, suggestions.wordStart) + field + queryText.slice(caret);
    setQueryText(next);
    setSuggestions(null);
    const cursorPos = suggestions.wordStart + field.length;
    requestAnimationFrame(() => {
      textareaRef.current?.setSelectionRange(cursorPos, cursorPos);
      textareaRef.current?.focus();
    });
  }

  const parseResult = useMemo(() => parseWhereClause(queryText), [queryText]);

  // Scaffold (FROM/SHOW/GROUP BY) is always derived from the current
  // conditions, shown read-only above the editable WHERE/ORDER BY text --
  // matching Shopify's fixed-template editor, where the admin only ever
  // edits WHERE. Falls back to just "email" when the query doesn't parse
  // yet (mid-edit), so the scaffold never goes blank while typing.
  const scaffold = renderScaffold(parseResult.ok ? parseResult.query.conditions : []);

  const matching = useMemo(() => {
    if (!parseResult.ok) return [];
    const segment: Segment = {
      id: "preview",
      name,
      condition_type: "conditions",
      conditions: parseResult.query.conditions,
      created_at: new Date().toISOString(),
    };
    const matched = getMatchingClients(clients, segment);

    const orderBy = parseResult.query.orderBy;
    if (!orderBy) return matched;
    const { field, direction } = orderBy;
    const sorted = [...matched].sort((a, b) => {
      const av = (a as unknown as Record<string, unknown>)[field];
      const bv = (b as unknown as Record<string, unknown>)[field];
      if (typeof av === "number" && typeof bv === "number") return av - bv;
      return String(av ?? "").localeCompare(String(bv ?? ""));
    });
    return direction === "desc" ? sorted.reverse() : sorted;
  }, [parseResult, clients, name]);

  const percentOfClients =
    clients.length === 0 ? 0 : Math.round((matching.length / clients.length) * 100);

  const showFields =
    parseResult.ok && parseResult.query.show.length > 0
      ? parseResult.query.show
      : ["email", "order_count"];

  const lines = queryText.split("\n");
  const errorsByLine = new Map<number, ParseError>();
  if (!parseResult.ok) {
    for (const err of parseResult.errors) errorsByLine.set(err.line, err);
  }

  return (
    <form action={action} className="flex flex-col gap-6">
      <input type="hidden" name="queryText" value={queryText} />

      <label className="flex flex-col gap-1.5">
        <span className="text-xs font-medium uppercase tracking-wide text-muted">Name</span>
        <input
          name="name"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. VIP clients"
          className="max-w-sm border border-line bg-background px-3 py-2 text-sm"
        />
      </label>

      <div>
        <span className="text-xs font-medium uppercase tracking-wide text-muted">Query</span>
        <div className="mt-1.5 border border-line bg-surface">
          {/* Fixed scaffold -- read-only, always derived from the WHERE
              conditions below, never typed by the admin (matches
              Shopify's segment editor). */}
          <div className="border-b border-line bg-background px-3 py-3 font-mono text-sm text-muted">
            <div>{scaffold.from}</div>
            <div>{scaffold.show}</div>
            <div>{scaffold.groupBy}</div>
          </div>

          <div className="flex items-baseline gap-3 border-b border-line px-3 py-2">
            {parseResult.ok ? (
              <>
                <span className="text-sm font-semibold text-foreground">
                  {matching.length} client{matching.length === 1 ? "" : "s"}
                </span>
                <span className="text-xs text-muted">{percentOfClients}% of your client base</span>
              </>
            ) : (
              <span className="text-xs text-red-700">Fix errors to see matching clients</span>
            )}
          </div>

          <div className="relative flex font-mono text-sm">
            <div className="select-none border-r border-line bg-background px-2 py-3 text-right text-muted">
              {lines.map((_, i) => (
                <div key={i} className={errorsByLine.has(i + 1) ? "text-red-600" : undefined}>
                  {i + 1}
                </div>
              ))}
            </div>
            <div className="relative flex-1">
              <pre
                aria-hidden
                className="pointer-events-none absolute inset-0 whitespace-pre-wrap break-words px-3 py-3 text-foreground"
                dangerouslySetInnerHTML={{
                  __html: lines.map((l) => highlightLine(l).__html).join("\n"),
                }}
              />
              <textarea
                ref={textareaRef}
                value={queryText}
                onChange={(e) => {
                  setQueryText(e.target.value);
                  updateSuggestions(e.target.value, e.target.selectionStart);
                }}
                onClick={(e) => updateSuggestions(queryText, e.currentTarget.selectionStart)}
                onKeyUp={(e) => {
                  if (!["ArrowUp", "ArrowDown", "Enter", "Tab", "Escape"].includes(e.key)) {
                    updateSuggestions(queryText, e.currentTarget.selectionStart);
                  }
                }}
                onKeyDown={(e) => {
                  if (!suggestions) return;
                  if (e.key === "ArrowDown") {
                    e.preventDefault();
                    setSuggestions({
                      ...suggestions,
                      activeIndex: (suggestions.activeIndex + 1) % suggestions.options.length,
                    });
                  } else if (e.key === "ArrowUp") {
                    e.preventDefault();
                    setSuggestions({
                      ...suggestions,
                      activeIndex:
                        (suggestions.activeIndex - 1 + suggestions.options.length) %
                        suggestions.options.length,
                    });
                  } else if (e.key === "Enter" || e.key === "Tab") {
                    e.preventDefault();
                    applySuggestion(suggestions.options[suggestions.activeIndex]);
                  } else if (e.key === "Escape") {
                    setSuggestions(null);
                  }
                }}
                onBlur={() => {
                  // Delay so a click on a suggestion registers before the
                  // list disappears (blur fires before click otherwise).
                  setTimeout(() => setSuggestions(null), 150);
                }}
                spellCheck={false}
                rows={Math.max(lines.length, 5)}
                className="relative block w-full resize-y whitespace-pre-wrap break-words bg-transparent px-3 py-3 text-transparent caret-foreground outline-none"
              />
            </div>
          </div>

          {suggestions && (
            <ul className="border-t border-line bg-background font-mono text-sm">
              {suggestions.options.map((option, i) => (
                <li key={option}>
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => applySuggestion(option)}
                    className={`block w-full px-3 py-1.5 text-left ${
                      i === suggestions.activeIndex
                        ? "bg-accent/10 text-foreground"
                        : "text-muted hover:bg-accent/5"
                    }`}
                  >
                    {option}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {!parseResult.ok && (
          <ul className="mt-2 space-y-1 text-xs text-red-700">
            {parseResult.errors.map((err, i) => (
              <li key={i}>
                Line {err.line}: {err.message}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="flex items-center gap-4">
        <button
          type="submit"
          className="bg-accent px-4 py-2 text-xs font-medium uppercase tracking-wide text-background transition-opacity hover:opacity-90"
        >
          Save segment
        </button>
        <Link
          href="/admin/segments"
          className="text-xs text-muted underline underline-offset-4 hover:text-foreground"
        >
          Cancel
        </Link>
      </div>

      <div>
        {parseResult.ok && matching.length > 0 && (
          <table className="mt-3 w-full text-left text-sm">
            <thead className="border-b border-line text-xs uppercase tracking-wide text-muted">
              <tr>
                {showFields.map((field) => (
                  <th key={field} className="py-2 pr-4 font-medium">
                    {SHOW_FIELD_LABELS[field] ?? field}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {matching.slice(0, 50).map((client) => (
                <tr key={client.id}>
                  {showFields.map((field) => (
                    <td key={field} className="py-2 pr-4 text-foreground">
                      {formatShowValue(client, field)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {parseResult.ok && matching.length > 50 && (
          <p className="mt-2 text-xs text-muted">Showing first 50 of {matching.length}.</p>
        )}
      </div>
    </form>
  );
}
