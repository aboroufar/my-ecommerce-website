"use client";

import { useState, useTransition } from "react";
import { createPackageProfileInline } from "@/lib/actions/packageProfiles";

interface CreatedPackage {
  id: string;
  name: string;
  lengthCm: number | null;
  widthCm: number | null;
  heightCm: number | null;
  emptyWeightGrams: number | null;
}

const PACKAGE_TYPES = [
  { value: "box", label: "Box" },
  { value: "envelope", label: "Envelope" },
  { value: "soft_package", label: "Soft package" },
] as const;

/**
 * Shopify's "Add package" modal from the order package page -- lets an
 * admin define a one-off parcel inline, or check "Save this package for
 * future use" to persist it as a reusable package_profiles row (the same
 * table the product form's package picker already reads from). Reports
 * the new package back to PackageWeightForm so it's selected immediately,
 * matching AddSupplierModal's onCreated callback pattern.
 */
export function AddPackageModal({ onCreated }: { onCreated: (pkg: CreatedPackage) => void }) {
  const [open, setOpen] = useState(false);
  const [packageType, setPackageType] = useState<(typeof PACKAGE_TYPES)[number]["value"]>("box");
  const [name, setName] = useState("");
  const [length, setLength] = useState("");
  const [width, setWidth] = useState("");
  const [height, setHeight] = useState("");
  const [emptyWeight, setEmptyWeight] = useState("");
  const [saveForFuture, setSaveForFuture] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function close() {
    setOpen(false);
    setPackageType("box");
    setName("");
    setLength("");
    setWidth("");
    setHeight("");
    setEmptyWeight("");
    setSaveForFuture(false);
    setError(null);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const formData = new FormData();
    formData.set("package_type", packageType);
    formData.set("name", name.trim() || packageType.replace("_", " "));
    formData.set("length_cm", length);
    formData.set("width_cm", width);
    formData.set("height_cm", height);
    formData.set("empty_weight_grams", emptyWeight);
    if (saveForFuture) formData.set("save_for_future_use", "on");

    startTransition(async () => {
      const result = await createPackageProfileInline(formData);
      if ("error" in result) {
        setError(result.error);
        return;
      }
      onCreated(result);
      close();
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="border border-line px-3 py-1.5 text-xs font-medium uppercase tracking-wide text-foreground transition-opacity hover:opacity-90"
      >
        Add package
      </button>

      {open && (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg border border-line bg-surface">
            <div className="flex items-center justify-between border-b border-line px-5 py-4">
              <h2 className="font-display text-lg text-foreground">Add package</h2>
              <button
                type="button"
                onClick={close}
                className="text-muted hover:text-foreground"
                aria-label="Close"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleSubmit} className="px-5 py-4">
              <span className="text-sm text-foreground">Package type</span>
              <div className="mt-2 grid grid-cols-3 gap-3">
                {PACKAGE_TYPES.map((type) => (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => setPackageType(type.value)}
                    className={`border px-3 py-3 text-sm ${
                      packageType === type.value
                        ? "border-foreground text-foreground"
                        : "border-line text-muted hover:text-foreground"
                    }`}
                  >
                    {type.label}
                  </button>
                ))}
              </div>

              <div className="mt-4 grid grid-cols-4 gap-3">
                <label className="flex flex-col gap-1.5">
                  <span className="text-xs text-muted">Length (cm)</span>
                  <input
                    type="number"
                    min={0.1}
                    step="0.1"
                    value={length}
                    onChange={(e) => setLength(e.target.value)}
                    disabled={isPending}
                    className="border border-line bg-background px-2.5 py-1.5 text-sm"
                  />
                </label>
                <label className="flex flex-col gap-1.5">
                  <span className="text-xs text-muted">Width (cm)</span>
                  <input
                    type="number"
                    min={0.1}
                    step="0.1"
                    value={width}
                    onChange={(e) => setWidth(e.target.value)}
                    disabled={isPending}
                    className="border border-line bg-background px-2.5 py-1.5 text-sm"
                  />
                </label>
                <label className="flex flex-col gap-1.5">
                  <span className="text-xs text-muted">Height (cm)</span>
                  <input
                    type="number"
                    min={0.1}
                    step="0.1"
                    value={height}
                    onChange={(e) => setHeight(e.target.value)}
                    disabled={isPending}
                    className="border border-line bg-background px-2.5 py-1.5 text-sm"
                  />
                </label>
                <label className="flex flex-col gap-1.5">
                  <span className="text-xs text-muted">Weight (empty, g)</span>
                  <input
                    type="number"
                    min={0}
                    step="1"
                    value={emptyWeight}
                    onChange={(e) => setEmptyWeight(e.target.value)}
                    disabled={isPending}
                    className="border border-line bg-background px-2.5 py-1.5 text-sm"
                  />
                </label>
              </div>

              <label className="mt-4 flex flex-col gap-1.5">
                <span className="text-sm text-foreground">Package name</span>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={isPending}
                  placeholder={PACKAGE_TYPES.find((t) => t.value === packageType)?.label}
                  className="border border-line bg-background px-3 py-2 text-sm"
                />
              </label>

              <label className="mt-4 flex items-center gap-2 text-sm text-foreground">
                <input
                  type="checkbox"
                  checked={saveForFuture}
                  onChange={(e) => setSaveForFuture(e.target.checked)}
                  disabled={isPending}
                />
                Save this package for future use
              </label>

              {error && <p className="mt-3 text-xs text-red-700">{error}</p>}

              <div className="mt-5 flex justify-end gap-3 border-t border-line pt-4">
                <button
                  type="button"
                  onClick={close}
                  className="text-sm text-muted underline underline-offset-4 hover:text-foreground"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="bg-accent px-4 py-2 text-xs font-medium uppercase tracking-wide text-background transition-opacity hover:opacity-90 disabled:opacity-50"
                >
                  {isPending ? "Adding…" : "Add package"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
