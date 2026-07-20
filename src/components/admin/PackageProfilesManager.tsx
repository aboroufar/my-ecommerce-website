"use client";

import { useState } from "react";
import {
  createPackageProfile,
  updatePackageProfile,
  deletePackageProfile,
} from "@/lib/actions/packageProfiles";

interface PackageProfile {
  id: string;
  name: string;
  package_type: string;
  length_cm: number | null;
  width_cm: number | null;
  height_cm: number | null;
  empty_weight_grams: number | null;
}

const PACKAGE_TYPE_LABELS: Record<string, string> = {
  box: "Box",
  envelope: "Envelope",
  soft_package: "Soft package",
};

function formatDims(profile: PackageProfile): string {
  const { length_cm, width_cm, height_cm, empty_weight_grams } = profile;
  const dims =
    length_cm && width_cm && height_cm
      ? `${length_cm} × ${width_cm} × ${height_cm} cm`
      : null;
  const weight = empty_weight_grams ? `${empty_weight_grams} g empty` : null;
  return [dims, weight].filter(Boolean).join(", ") || "No dimensions set";
}

export function PackageProfilesManager({ profiles }: { profiles: PackageProfile[] }) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);

  return (
    <div className="max-w-lg space-y-4">
      {profiles.length === 0 && !adding && (
        <p className="text-sm text-muted">No package profiles yet.</p>
      )}

      {profiles.map((profile) =>
        editingId === profile.id ? (
          <PackageProfileForm
            key={profile.id}
            profile={profile}
            action={updatePackageProfile.bind(null, profile.id)}
            onCancel={() => setEditingId(null)}
          />
        ) : (
          <div key={profile.id} className="flex items-center gap-3 border border-line p-3">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="shrink-0 rounded bg-surface px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted">
                  {PACKAGE_TYPE_LABELS[profile.package_type] ?? profile.package_type}
                </span>
                <p className="truncate text-sm font-medium text-foreground">{profile.name}</p>
              </div>
              <p className="truncate text-xs text-muted">{formatDims(profile)}</p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <button
                type="button"
                onClick={() => setEditingId(profile.id)}
                className="px-2 py-1 text-xs text-foreground underline underline-offset-4"
              >
                Edit
              </button>
              <form action={deletePackageProfile.bind(null, profile.id)}>
                <button
                  type="submit"
                  className="px-2 py-1 text-xs text-red-700 underline underline-offset-4 hover:text-red-800"
                >
                  Delete
                </button>
              </form>
            </div>
          </div>
        )
      )}

      {adding ? (
        <PackageProfileForm action={createPackageProfile} onCancel={() => setAdding(false)} />
      ) : (
        <button
          type="button"
          onClick={() => setAdding(true)}
          className="border border-dashed border-line px-4 py-2 text-xs font-medium uppercase tracking-wide text-muted transition-colors hover:border-foreground hover:text-foreground"
        >
          + Add package
        </button>
      )}
    </div>
  );
}

function PackageProfileForm({
  profile,
  action,
  onCancel,
}: {
  profile?: PackageProfile;
  action: (formData: FormData) => void;
  onCancel: () => void;
}) {
  return (
    <form action={action} className="space-y-3 border border-line bg-surface p-4">
      <label className="flex flex-col gap-1.5">
        <span className="text-xs text-muted">Package name</span>
        <input
          name="name"
          defaultValue={profile?.name}
          required
          placeholder="Small box"
          className="border border-line bg-background px-3 py-2 text-sm"
        />
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="text-xs text-muted">Package type</span>
        <select
          name="package_type"
          defaultValue={profile?.package_type ?? "box"}
          className="border border-line bg-background px-3 py-2 text-sm"
        >
          <option value="box">Box</option>
          <option value="envelope">Envelope</option>
          <option value="soft_package">Soft package</option>
        </select>
      </label>

      <div className="grid grid-cols-3 gap-3">
        <label className="flex flex-col gap-1.5">
          <span className="text-xs text-muted">Length (cm)</span>
          <input
            name="length_cm"
            type="number"
            step="0.1"
            min="0"
            defaultValue={profile?.length_cm ?? ""}
            className="border border-line bg-background px-3 py-2 text-sm"
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-xs text-muted">Width (cm)</span>
          <input
            name="width_cm"
            type="number"
            step="0.1"
            min="0"
            defaultValue={profile?.width_cm ?? ""}
            className="border border-line bg-background px-3 py-2 text-sm"
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-xs text-muted">Height (cm)</span>
          <input
            name="height_cm"
            type="number"
            step="0.1"
            min="0"
            defaultValue={profile?.height_cm ?? ""}
            className="border border-line bg-background px-3 py-2 text-sm"
          />
        </label>
      </div>

      <label className="flex flex-col gap-1.5">
        <span className="text-xs text-muted">Empty weight (g)</span>
        <input
          name="empty_weight_grams"
          type="number"
          step="1"
          min="0"
          defaultValue={profile?.empty_weight_grams ?? ""}
          placeholder="Weight of the packaging itself, before the product"
          className="border border-line bg-background px-3 py-2 text-sm"
        />
      </label>

      <div className="flex gap-2 pt-1">
        <button
          type="submit"
          className="bg-accent px-4 py-2 text-xs font-medium uppercase tracking-wide text-background transition-opacity hover:opacity-90"
        >
          {profile ? "Save" : "Add package"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-xs font-medium uppercase tracking-wide text-muted hover:text-foreground"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
