"use client";

import { useState } from "react";

/**
 * "N people are currently viewing this item" -- purely decorative social
 * proof, NOT a real visitor count. There is no tracking behind this
 * number; it's a random value in a plausible range, generated once per
 * page load (stable for the duration of the visit, not a live-ticking
 * counter pretending to update in real time).
 */
export function ViewingCounter({ min = 12, max = 90 }: { min?: number; max?: number }) {
  const [count] = useState(() => Math.floor(Math.random() * (max - min + 1)) + min);

  return (
    <p className="mt-4 flex items-center gap-2 text-sm text-muted">
      <EyeIcon />
      {count} people are currently viewing this item
    </p>
  );
}

function EyeIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-4 w-4">
      <path
        d="M1.5 12S5 5 12 5s10.5 7 10.5 7-3.5 7-10.5 7S1.5 12 1.5 12Z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}
