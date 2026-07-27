"use client";

import { useState } from "react";
import { AddPackageModal } from "./AddPackageModal";

export interface PackageProfileOption {
  id: string;
  name: string;
  lengthCm: number | null;
  widthCm: number | null;
  heightCm: number | null;
  itemWeightGrams: number | null;
}

function optionLabel(profile: PackageProfileOption): string {
  const dims =
    profile.lengthCm && profile.widthCm && profile.heightCm
      ? ` — ${profile.lengthCm} × ${profile.widthCm} × ${profile.heightCm} cm`
      : "";
  const weight = profile.itemWeightGrams ? `, ${profile.itemWeightGrams} g` : "";
  return `${profile.name}${dims}${weight}`;
}

/**
 * Product form's Package picker -- replaces the old freeform Weight/
 * Dimensions text inputs with a select over package_profiles (the
 * reusable table also used for shipping boxes on the order package
 * page), plus an inline "Add package" so a new one can be created
 * without leaving this form. Reuses AddPackageModal as-is; a newly
 * created profile is merged into local state and auto-selected, same
 * pattern as PackageWeightForm's extraProfiles.
 */
export function PackageProfileField({
  name,
  profiles,
  defaultValue,
}: {
  name: string;
  profiles: PackageProfileOption[];
  defaultValue?: string | null;
}) {
  const [extraProfiles, setExtraProfiles] = useState<PackageProfileOption[]>([]);
  const [selectedId, setSelectedId] = useState(defaultValue ?? "");

  const allProfiles = [...profiles, ...extraProfiles];

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <select
          name={name}
          value={selectedId}
          onChange={(e) => setSelectedId(e.target.value)}
          className="flex-1 rounded-md border border-line bg-transparent px-3 py-2 text-sm"
        >
          <option value="">None</option>
          {allProfiles.map((profile) => (
            <option key={profile.id} value={profile.id}>
              {optionLabel(profile)}
            </option>
          ))}
        </select>
        <AddPackageModal
          onCreated={(pkg) => {
            setExtraProfiles((prev) => [
              ...prev,
              {
                id: pkg.id,
                name: pkg.name,
                lengthCm: pkg.lengthCm,
                widthCm: pkg.widthCm,
                heightCm: pkg.heightCm,
                itemWeightGrams: null,
              },
            ]);
            setSelectedId(pkg.id);
          }}
        />
      </div>
    </div>
  );
}
