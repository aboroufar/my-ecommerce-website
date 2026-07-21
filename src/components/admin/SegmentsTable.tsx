"use client";

import { useState } from "react";
import Link from "next/link";
import { deleteSegment } from "@/lib/actions/segments";

interface SegmentRow {
  id: string;
  name: string;
  created_at: string;
  matchCount: number;
  percentOfCustomers: number;
}

export function SegmentsTable({ segments }: { segments: SegmentRow[] }) {
  const [query, setQuery] = useState("");

  const filtered = segments.filter((s) =>
    s.name.toLowerCase().includes(query.trim().toLowerCase())
  );

  return (
    <div className="border border-line">
      <div className="border-b border-line p-3">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search segments"
          className="w-full border border-line bg-background px-3 py-1.5 text-sm"
        />
      </div>

      <table className="w-full text-left text-sm">
        <thead className="border-b border-line text-xs uppercase tracking-wide text-muted">
          <tr>
            <th className="py-2 pl-3 font-medium">Name</th>
            <th className="py-2 text-right font-medium">% of customers</th>
            <th className="py-2 pl-6 font-medium">Created</th>
            <th className="py-2" />
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {filtered.length === 0 ? (
            <tr>
              <td colSpan={4} className="py-6 text-center text-sm text-muted">
                No segments match &quot;{query}&quot;.
              </td>
            </tr>
          ) : (
            filtered.map((segment) => (
              <tr key={segment.id}>
                <td className="py-3 pl-3">
                  <Link
                    href={`/admin/segments/${segment.id}`}
                    className="font-medium text-foreground underline underline-offset-4"
                  >
                    {segment.name}
                  </Link>
                </td>
                <td className="py-3 text-right text-foreground">
                  {segment.percentOfCustomers}%
                </td>
                <td className="py-3 pl-6 text-muted">
                  Created on{" "}
                  {new Date(segment.created_at).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </td>
                <td className="py-3 pr-3 text-right">
                  <form action={deleteSegment.bind(null, segment.id)}>
                    <button
                      type="submit"
                      className="text-xs text-red-700 underline underline-offset-4 hover:text-red-800"
                    >
                      Delete
                    </button>
                  </form>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
