"use client";

import { useState } from "react";
import type { CustomFieldSetting } from "@/lib/checkoutSettings";

const inputClass =
  "rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 outline-none focus:border-neutral-500";
const helpTextClass = "text-xs text-neutral-500";

let nextRowId = 0;

export function CustomFieldsEditor({ initialFields }: { initialFields: CustomFieldSetting[] }) {
  const [rows, setRows] = useState(() =>
    initialFields.map((field) => ({ id: nextRowId++, field }))
  );

  function addRow() {
    setRows((prev) => [
      ...prev,
      {
        id: nextRowId++,
        field: { key: "", label: "", type: "text" as const, required: false, dropdownOptions: [] },
      },
    ]);
  }

  function removeRow(id: number) {
    setRows((prev) => prev.filter((r) => r.id !== id));
  }

  function updateRow(id: number, patch: Partial<CustomFieldSetting>) {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, field: { ...r.field, ...patch } } : r)));
  }

  return (
    <div className="flex flex-col gap-4">
      {rows.map((row, i) => (
        <div key={row.id} className="flex flex-col gap-2 rounded-md border border-neutral-200 p-3">
          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1">
              <span className={helpTextClass}>Label (shown to shopper)</span>
              <input
                name={`custom_fields[${i}][label]`}
                value={row.field.label}
                onChange={(e) => updateRow(row.id, { label: e.target.value })}
                className={inputClass}
                placeholder="Gift message"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className={helpTextClass}>Key (internal, used to look up the answer)</span>
              <input
                name={`custom_fields[${i}][key]`}
                value={row.field.key}
                onChange={(e) => updateRow(row.id, { key: e.target.value })}
                className={inputClass}
                placeholder="gift_message"
              />
            </label>
          </div>
          <div className="flex items-center gap-4">
            <label className="flex flex-col gap-1">
              <span className={helpTextClass}>Type</span>
              <select
                name={`custom_fields[${i}][type]`}
                value={row.field.type}
                onChange={(e) => updateRow(row.id, { type: e.target.value as CustomFieldSetting["type"] })}
                className={inputClass}
              >
                <option value="text">Text</option>
                <option value="numeric">Numeric</option>
                <option value="dropdown">Dropdown</option>
              </select>
            </label>
            <label className="mt-4 flex items-center gap-2">
              <input
                type="checkbox"
                name={`custom_fields[${i}][required]`}
                checked={row.field.required}
                onChange={(e) => updateRow(row.id, { required: e.target.checked })}
                className="h-4 w-4 accent-neutral-900"
              />
              <span className="text-sm text-neutral-900">Required</span>
            </label>
            <button
              type="button"
              onClick={() => removeRow(row.id)}
              className="ml-auto mt-4 text-xs text-red-600 underline underline-offset-4 hover:text-red-700"
            >
              Remove
            </button>
          </div>
          {row.field.type === "dropdown" && (
            <label className="flex flex-col gap-1">
              <span className={helpTextClass}>Options (one per line)</span>
              <textarea
                name={`custom_fields[${i}][dropdownOptions]`}
                defaultValue={(row.field.dropdownOptions ?? []).join("\n")}
                rows={3}
                className={inputClass}
              />
            </label>
          )}
        </div>
      ))}

      {rows.length < 3 && (
        <button
          type="button"
          onClick={addRow}
          className="self-start rounded-md border border-neutral-300 px-3 py-1.5 text-sm text-neutral-700 hover:bg-neutral-50"
        >
          + Add field
        </button>
      )}
      {rows.length >= 3 && (
        <p className={helpTextClass}>Stripe Checkout supports up to 3 custom fields.</p>
      )}
    </div>
  );
}
