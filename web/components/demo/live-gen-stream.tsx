"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { SECTION_LABEL } from "./types";

export type LiveGenEntry = { step: number; words: string[] };

export function LiveGenStream({
  entries,
  className,
}: {
  entries: LiveGenEntry[];
  className?: string;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // biome-ignore lint/correctness/useExhaustiveDependencies: scroll on new entries
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [entries.length]);

  return (
    <div className={cn("flex flex-col gap-2 min-h-0", className)}>
      <p className={SECTION_LABEL}>Live samples</p>
      <div
        ref={scrollRef}
        className="flex-1 min-h-0 overflow-y-auto rounded-lg border bg-muted/30 p-3"
      >
        {entries.length === 0 && (
          <p className="text-xs text-muted-foreground/50 font-mono">Waiting for samples…</p>
        )}
        {entries.map((entry) => (
          <div
            key={entry.step}
            className="flex gap-3 font-mono text-xs leading-relaxed"
          >
            <span className="shrink-0 text-muted-foreground/50 tabular-nums">
              Step {entry.step}
            </span>
            <span className="text-muted-foreground">—</span>
            <span>{entry.words.join(" · ")}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
