"use client";

import { useRouter } from "next/navigation";

interface SegmentOption {
  id: string;
  name: string;
}

export function ClientSegmentFilter({
  segments,
  activeSegmentId,
}: {
  segments: SegmentOption[];
  activeSegmentId?: string;
}) {
  const router = useRouter();

  return (
    <select
      value={activeSegmentId ?? ""}
      onChange={(e) => {
        const id = e.target.value;
        router.push(id ? `/admin/clients?segment=${id}` : "/admin/clients");
      }}
      className="border border-line bg-background px-3 py-1.5 text-sm"
    >
      <option value="">All clients</option>
      {segments.map((segment) => (
        <option key={segment.id} value={segment.id}>
          {segment.name}
        </option>
      ))}
    </select>
  );
}
