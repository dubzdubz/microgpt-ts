"use client";

import { useEffect, useRef } from "react";
import { SECTION_LABEL } from "./types";

export type LiveGenEntry = { step: number; words: string[] };

export function LiveGenStream({ entries }: { entries: LiveGenEntry[] }) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // biome-ignore lint/correctness/useExhaustiveDependencies: scroll on new entries
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [entries.length]);

  if (entries.length === 0) return null;

  return (
    <div className="flex flex-col gap-2">
      <p className={SECTION_LABEL}>Live samples</p>
      <div
        ref={scrollRef}
        className="h-44 overflow-y-auto rounded-lg border bg-muted/30 p-3"
      >
        {entries.map((entry) => (
          <div
            key={entry.step}
            className="flex gap-3 font-mono text-xs leading-relaxed"
          >
            <span className="shrink-0 text-muted-foreground/50 tabular-nums">
              {String(entry.step).padStart(5, "\u2007")}
            </span>
            <span className="text-muted-foreground">—</span>
            <span>{entry.words.join(" · ")}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
