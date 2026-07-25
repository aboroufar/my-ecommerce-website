"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { addOrderComment } from "@/lib/actions/orderNotesAndTags";

export function OrderCommentForm({ orderId }: { orderId: string }) {
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = body.trim();
    if (!trimmed) return;
    setError(null);
    startTransition(async () => {
      const result = await addOrderComment(orderId, trimmed);
      if ("error" in result) {
        setError(result.error);
        return;
      }
      setBody("");
      router.refresh();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="border border-line bg-surface p-3">
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="Leave a comment…"
        rows={2}
        disabled={isPending}
        className="w-full resize-none bg-transparent text-sm text-foreground placeholder:text-muted focus:outline-none"
      />
      <div className="mt-2 flex items-center justify-between">
        <span className="text-xs text-muted">Only you and other staff can see comments.</span>
        <button
          type="submit"
          disabled={isPending || !body.trim()}
          className="bg-accent px-3 py-1.5 text-xs font-medium uppercase tracking-wide text-background transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {isPending ? "Posting…" : "Post"}
        </button>
      </div>
      {error && <p className="mt-2 text-xs text-red-700">{error}</p>}
    </form>
  );
}
