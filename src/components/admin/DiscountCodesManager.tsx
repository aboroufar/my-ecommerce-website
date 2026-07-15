"use client";

import { useState } from "react";
import {
  createDiscountCode,
  updateDiscountCode,
  deleteDiscountCode,
  toggleDiscountCode,
} from "@/lib/actions/discounts";

interface DiscountCode {
  id: string;
  code: string;
  type: string;
  value: number;
  active: boolean;
  expires_at: string | null;
}

function formatValue(code: DiscountCode) {
  return code.type === "percent" ? `${code.value}%` : `€${(code.value / 100).toFixed(2)}`;
}

export function DiscountCodesManager({ codes }: { codes: DiscountCode[] }) {
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  return (
    <div className="max-w-2xl">
      {codes.length > 0 && (
        <table className="w-full text-left text-sm">
          <thead className="border-b border-line text-xs uppercase tracking-wide text-muted">
            <tr>
              <th className="py-2 font-medium">Code</th>
              <th className="py-2 font-medium">Value</th>
              <th className="py-2 font-medium">Expires</th>
              <th className="py-2 font-medium">Status</th>
              <th className="py-2" />
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {codes.map((code) =>
              editingId === code.id ? (
                <tr key={code.id}>
                  <td colSpan={5} className="py-3">
                    <DiscountCodeForm
                      code={code}
                      action={updateDiscountCode.bind(null, code.id)}
                      onDone={() => setEditingId(null)}
                    />
                  </td>
                </tr>
              ) : (
                <tr key={code.id}>
                  <td className="py-3">
                    <button
                      type="button"
                      onClick={() => setEditingId(code.id)}
                      className="font-medium text-foreground hover:underline"
                    >
                      {code.code}
                    </button>
                  </td>
                  <td className="py-3 text-foreground">{formatValue(code)}</td>
                  <td className="py-3 text-muted">
                    {code.expires_at
                      ? new Date(code.expires_at).toLocaleDateString()
                      : "Never"}
                  </td>
                  <td className="py-3">
                    <form action={toggleDiscountCode.bind(null, code.id, code.active)}>
                      <button
                        type="submit"
                        className={
                          code.active
                            ? "bg-accent px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-background"
                            : "border border-line px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted"
                        }
                      >
                        {code.active ? "Active" : "Inactive"}
                      </button>
                    </form>
                  </td>
                  <td className="py-3 text-right">
                    <form action={deleteDiscountCode.bind(null, code.id)}>
                      <button
                        type="submit"
                        className="text-xs text-red-700 underline underline-offset-4 hover:text-red-800"
                      >
                        Remove
                      </button>
                    </form>
                  </td>
                </tr>
              )
            )}
          </tbody>
        </table>
      )}

      {adding ? (
        <div className="mt-6">
          <DiscountCodeForm action={createDiscountCode} onDone={() => setAdding(false)} />
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setAdding(true)}
          className="mt-6 border border-dashed border-line px-4 py-2 text-xs font-medium uppercase tracking-wide text-muted transition-colors hover:border-foreground hover:text-foreground"
        >
          + Add discount code
        </button>
      )}
    </div>
  );
}

function DiscountCodeForm({
  code,
  action,
  onDone,
}: {
  code?: DiscountCode;
  action: (formData: FormData) => void;
  onDone: () => void;
}) {
  return (
    <form action={action} className="flex flex-col gap-2 border border-line bg-surface p-3">
      <input
        name="code"
        defaultValue={code?.code}
        required
        placeholder="Code (e.g. SAVE10)"
        autoFocus
        className="border border-line bg-background px-2 py-1.5 text-sm uppercase"
      />
      <div className="grid grid-cols-2 gap-2">
        <select
          name="type"
          defaultValue={code?.type ?? "percent"}
          className="border border-line bg-background px-2 py-1.5 text-sm"
        >
          <option value="percent">Percent off</option>
          <option value="fixed">Fixed amount off (cents)</option>
        </select>
        <input
          name="value"
          type="number"
          min={1}
          defaultValue={code?.value}
          required
          placeholder="Value"
          className="border border-line bg-background px-2 py-1.5 text-sm"
        />
      </div>
      <label className="flex flex-col gap-1">
        <span className="text-xs text-muted">Expires (optional)</span>
        <input
          name="expires_at"
          type="date"
          defaultValue={code?.expires_at?.slice(0, 10)}
          className="border border-line bg-background px-2 py-1.5 text-sm"
        />
      </label>
      <label className="flex items-center gap-2 text-sm text-foreground">
        <input type="checkbox" name="active" defaultChecked={code?.active ?? true} />
        Active
      </label>
      <div className="mt-1 flex gap-2">
        <button
          type="submit"
          className="bg-accent px-3 py-1.5 text-xs font-medium uppercase tracking-wide text-background"
        >
          Save
        </button>
        <button
          type="button"
          onClick={onDone}
          className="text-xs font-medium uppercase tracking-wide text-muted hover:text-foreground"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
