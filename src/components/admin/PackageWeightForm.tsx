"use client";

import { useMemo, useState } from "react";
import { AddPackageModal } from "./AddPackageModal";

export interface PackageOrderItem {
  id: string;
  productName: string;
  variantLabel: string | null;
  quantity: number;
  itemWeightGrams: number | null;
}

export interface PackageProfileOption {
  id: string;
  name: string;
  lengthCm: number | null;
  widthCm: number | null;
  heightCm: number | null;
  emptyWeightGrams: number | null;
}

export interface PendingRate {
  rateId: string;
  provider: string;
  serviceLevel: string;
  amount: string;
  currency: string;
  estimatedDays: number | null;
}

/**
 * The interactive core of the /package page: per-item weight inputs,
 * a package-profile picker (auto-fills dimensions + contributes its
 * own tare weight to the total), a computed total-weight card, and
 * the actual fetch-rates form -- all in one client component since the
 * submitted weight_grams/length_cm/width_cm/height_cm depend on state
 * split across what would otherwise be separate cards (items +
 * package). Rendered only when there are no pending_rates yet; once
 * rates exist, the page renders the rate-picker/buy-label form instead
 * (see page.tsx), which doesn't need any of this component's state.
 */
export function PackageWeightForm({
  items,
  packageProfiles,
  fetchRatesAction,
}: {
  items: PackageOrderItem[];
  packageProfiles: PackageProfileOption[];
  fetchRatesAction: (formData: FormData) => void;
}) {
  const [selectedProfileId, setSelectedProfileId] = useState<string>("");
  const [manualDims, setManualDims] = useState({ length: "", width: "", height: "" });
  const [extraProfiles, setExtraProfiles] = useState<PackageProfileOption[]>([]);

  const profiles = [...packageProfiles, ...extraProfiles];
  const selectedProfile = profiles.find((p) => p.id === selectedProfileId) ?? null;

  const itemsWeightGrams = useMemo(
    () => items.reduce((sum, item) => sum + (item.itemWeightGrams ?? 0) * item.quantity, 0),
    [items]
  );
  const itemsMissingWeight = items.filter((item) => item.itemWeightGrams == null);
  const packageTareGrams = selectedProfile?.emptyWeightGrams ?? 0;
  const totalWeightGrams = itemsWeightGrams + packageTareGrams;

  const lengthCm = selectedProfile?.lengthCm ?? (manualDims.length ? Number(manualDims.length) : null);
  const widthCm = selectedProfile?.widthCm ?? (manualDims.width ? Number(manualDims.width) : null);
  const heightCm = selectedProfile?.heightCm ?? (manualDims.height ? Number(manualDims.height) : null);

  const canGetRates = totalWeightGrams > 0 && lengthCm && widthCm && heightCm;

  return (
    <div className="flex flex-col gap-6">
      <div className="border border-line p-5">
        <h3 className="text-xs font-medium uppercase tracking-wide text-muted">Item</h3>
        <table className="mt-3 w-full text-left text-sm">
          <thead className="border-b border-line text-xs uppercase tracking-wide text-muted">
            <tr>
              <th className="py-2 font-medium">Product</th>
              <th className="w-20 py-2 font-medium">Qty</th>
              <th className="w-36 py-2 font-medium">Weight (per unit)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {items.map((item) => (
              <tr key={item.id}>
                <td className="py-2 text-foreground">
                  {item.productName}
                  {item.variantLabel && <span className="text-muted"> — {item.variantLabel}</span>}
                </td>
                <td className="py-2 text-muted">{item.quantity}</td>
                <td className="py-2 text-muted">
                  {item.itemWeightGrams != null ? `${item.itemWeightGrams} g` : "No package assigned"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {itemsMissingWeight.length > 0 && (
          <p className="mt-3 border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
            {itemsMissingWeight.length === 1
              ? "1 item has no package assigned -- its weight is not included below."
              : `${itemsMissingWeight.length} items have no package assigned -- their weight is not included below.`}
          </p>
        )}
      </div>

      <div className="border border-line p-5">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-medium uppercase tracking-wide text-muted">Package</h3>
          <AddPackageModal
            onCreated={(pkg) => {
              setExtraProfiles((prev) => [...prev, pkg]);
              setSelectedProfileId(pkg.id);
            }}
          />
        </div>
        {profiles.length > 0 ? (
          <select
            value={selectedProfileId}
            onChange={(e) => setSelectedProfileId(e.target.value)}
            className="mt-3 w-full border border-line bg-background px-2.5 py-1.5 text-sm"
          >
            <option value="">Select a package…</option>
            {profiles.map((profile) => (
              <option key={profile.id} value={profile.id}>
                {profile.name}
                {profile.lengthCm && profile.widthCm && profile.heightCm
                  ? ` — ${profile.lengthCm} × ${profile.widthCm} × ${profile.heightCm} cm`
                  : ""}
              </option>
            ))}
          </select>
        ) : (
          <div className="mt-3 grid grid-cols-3 gap-3">
            <label className="flex flex-col gap-1.5">
              <span className="text-xs text-muted">Length (cm)</span>
              <input
                type="number"
                min={0.1}
                step="0.1"
                value={manualDims.length}
                onChange={(e) => setManualDims((prev) => ({ ...prev, length: e.target.value }))}
                className="border border-line bg-background px-2.5 py-1.5 text-sm"
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-xs text-muted">Width (cm)</span>
              <input
                type="number"
                min={0.1}
                step="0.1"
                value={manualDims.width}
                onChange={(e) => setManualDims((prev) => ({ ...prev, width: e.target.value }))}
                className="border border-line bg-background px-2.5 py-1.5 text-sm"
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-xs text-muted">Height (cm)</span>
              <input
                type="number"
                min={0.1}
                step="0.1"
                value={manualDims.height}
                onChange={(e) => setManualDims((prev) => ({ ...prev, height: e.target.value }))}
                className="border border-line bg-background px-2.5 py-1.5 text-sm"
              />
            </label>
          </div>
        )}
      </div>

      <div className="border border-line p-5">
        <h3 className="text-xs font-medium uppercase tracking-wide text-muted">Total weight</h3>
        <p className="mt-3 text-sm text-foreground">
          {totalWeightGrams > 0 ? `${totalWeightGrams} g` : "—"}
          {packageTareGrams > 0 && (
            <span className="text-muted"> (includes {packageTareGrams} g package weight)</span>
          )}
        </p>
      </div>

      <form action={fetchRatesAction}>
        <input type="hidden" name="weight_grams" value={totalWeightGrams} />
        <input type="hidden" name="length_cm" value={lengthCm ?? ""} />
        <input type="hidden" name="width_cm" value={widthCm ?? ""} />
        <input type="hidden" name="height_cm" value={heightCm ?? ""} />
        <button
          type="submit"
          disabled={!canGetRates}
          className="w-full bg-accent px-4 py-2 text-sm font-medium text-background transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          Get rates
        </button>
      </form>
    </div>
  );
}
