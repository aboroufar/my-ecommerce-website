"use client";

import { useState } from "react";
import { AddSupplierModal } from "./AddSupplierModal";

export interface SupplierOption {
  id: string;
  company: string;
}

export function SupplierPicker({
  suppliers,
  defaultSupplierId,
}: {
  suppliers: SupplierOption[];
  defaultSupplierId?: string | null;
}) {
  const [options, setOptions] = useState(suppliers);
  const [selectedId, setSelectedId] = useState(defaultSupplierId ?? "");

  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-sm text-foreground">Supplier</span>
      <select
        name="supplier_id"
        value={selectedId}
        onChange={(e) => setSelectedId(e.target.value)}
        className="border border-line bg-background px-3 py-2 text-sm"
      >
        <option value="">Select supplier</option>
        {options.map((s) => (
          <option key={s.id} value={s.id}>
            {s.company}
          </option>
        ))}
      </select>
      <AddSupplierModal
        onCreated={(supplier) => {
          setOptions((prev) => [...prev, supplier].sort((a, b) => a.company.localeCompare(b.company)));
          setSelectedId(supplier.id);
        }}
      />
    </div>
  );
}
