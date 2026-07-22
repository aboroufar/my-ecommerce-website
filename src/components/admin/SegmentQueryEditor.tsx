"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  parseSegmentQuery,
  type ParseError,
} from "@/lib/segmentQuery";
import {
  getMatchingClients,
  type ClientFacts,
  type Segment,
} from "@/lib/segments";

const KEYWORD_PATTERN = /^(FROM|SHOW|WHERE|AND|ORDER BY)\b/i;
const OPERATOR_PATTERN = /(>=|<=|!=|=|>|<)/g;

/** Colors line-prefix keywords and operators; everything else is left as
 * plain text. Not a real lexer -- the DSL is 5 fixed line shapes, so a
 * per-line regex pass is enough. */
function highlightLine(line: string): { __html: string } {
  const escaped = line
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  const keywordMatch = escaped.match(KEYWORD_PATTERN);
  let html = escaped;
  if (keywordMatch) {
    html =
      `<span class="text-accent font-semibold">${keywordMatch[0]}</span>` +
      escaped.slice(keywordMatch[0].length);
  }
  html = html.replace(
    OPERATOR_PATTERN,
    (match) => `<span class="text-muted">${match}</span>`
  );
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

  const parseResult = useMemo(() => parseSegmentQuery(queryText), [queryText]);

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
        <div className="relative mt-1.5 flex border border-line bg-surface font-mono text-sm">
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
              value={queryText}
              onChange={(e) => setQueryText(e.target.value)}
              spellCheck={false}
              rows={Math.max(lines.length, 5)}
              className="relative block w-full resize-y whitespace-pre-wrap break-words bg-transparent px-3 py-3 text-transparent caret-foreground outline-none"
            />
          </div>
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
        <p className="text-xs font-medium uppercase tracking-wide text-muted">
          {parseResult.ok
            ? `${matching.length} matching client${matching.length === 1 ? "" : "s"} · ${percentOfClients}% of client base`
            : "Fix errors to run"}
        </p>

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
