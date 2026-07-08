"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function ResetPasswordForm() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "done">("idle");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      setStatus("idle");
      setError(error.message);
      return;
    }
    setStatus("done");
    setTimeout(() => {
      router.push("/account");
      router.refresh();
    }, 1500);
  }

  if (status === "done") {
    return (
      <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center px-6 py-20">
        <p className="text-sm text-foreground">
          Password updated. Taking you to your account…
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center px-6 py-20">
      <h1 className="font-display text-2xl font-bold text-foreground">
        Set a new password
      </h1>

      <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-5">
        <label className="flex flex-col gap-2">
          <span className="text-xs font-medium uppercase tracking-wide text-foreground">
            New password*
          </span>
          <input
            type="password"
            required
            minLength={6}
            placeholder="At least 6 characters"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="border border-line bg-transparent px-4 py-3 text-sm text-foreground placeholder:text-muted focus:border-foreground focus:outline-none"
          />
        </label>

        {error && <p className="text-sm text-red-700">{error}</p>}

        <button
          type="submit"
          disabled={status === "loading"}
          className="bg-foreground px-6 py-3.5 text-sm font-medium uppercase tracking-wide text-background transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {status === "loading" ? "Saving…" : "Save new password"}
        </button>
      </form>
    </main>
  );
}
