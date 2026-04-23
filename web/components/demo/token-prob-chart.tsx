"use client";

import { motion } from "motion/react";

type TokenProbChartProps = {
  probs: number[];
  tokenId: number;
  vocabLabels: string[];
};

export function TokenProbChart({ probs, tokenId, vocabLabels }: TokenProbChartProps) {
  const maxProb = Math.max(...probs);

  const sorted = probs.map((p, i) => ({ p, i })).sort((a, b) => b.p - a.p);
  const top5 = new Set(sorted.slice(0, 5).map((x) => x.i));

  return (
    <div className="flex flex-col gap-1">
      <div className="flex flex-col gap-1 min-w-0">
        <div className="flex h-48 items-end gap-px">
          {probs.map((prob, i) => {
            const isSampled = i === tokenId;
            const heightPct = maxProb > 0 ? (prob / maxProb) * 100 : 0;
            const showLabel = top5.has(i) && prob > 0.05;
            return (
              <div
                // biome-ignore lint/suspicious/noArrayIndexKey: vocab order is fixed
                key={i}
                className="relative flex-1 min-w-0 flex flex-col items-center justify-end h-full"
              >
                {showLabel && (
                  <span className="text-[9px] font-medium mb-0.5 tabular-nums text-chart-1">
                    {`${Math.round(prob * 100)}%`}
                  </span>
                )}
                <motion.div
                  className="w-full rounded-t-sm bg-chart-1"
                  style={{
                    opacity: isSampled ? 1 : 0.3,
                  }}
                  animate={{ height: `${heightPct}%` }}
                  initial={{ height: "0%" }}
                  transition={{ type: "spring", damping: 20, stiffness: 300 }}
                  title={prob.toFixed(4)}
                />
              </div>
            );
          })}
        </div>
        <div className="flex gap-px">
          {vocabLabels.map((label, i) => {
            const isSampled = i === tokenId;
            return (
              <span
                // biome-ignore lint/suspicious/noArrayIndexKey: vocab order is fixed
                key={i}
                className={`flex-1 min-w-0 text-center text-[10px] leading-none truncate ${
                  isSampled ? "font-bold text-chart-1" : "text-muted-foreground"
                }`}
              >
                {label}
              </span>
            );
          })}
        </div>
        <p className="text-[9px] text-muted-foreground text-center mt-0.5">Character</p>
      </div>
    </div>
  );
}
