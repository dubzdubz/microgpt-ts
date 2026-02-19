"use client";

import { motion } from "motion/react";

type TokenProbChartProps = {
  probs: number[];
  sampledId: number;
  vocabLabels: string[];
};

export function TokenProbChart({
  probs,
  sampledId,
  vocabLabels,
}: TokenProbChartProps) {
  const maxProb = Math.max(...probs);

  return (
    <div className="flex flex-col gap-1">
      <div className="flex h-48 items-end gap-px">
        {probs.map((prob, i) => {
          const isSampled = i === sampledId;
          const heightPct = maxProb > 0 ? (prob / maxProb) * 100 : 0;
          return (
            <motion.div
              // biome-ignore lint/suspicious/noArrayIndexKey: vocab order is fixed
              key={i}
              className="flex-1 min-w-0 rounded-t-sm"
              style={{
                backgroundColor: "var(--chart-1)",
                opacity: isSampled ? 1 : 0.4,
              }}
              animate={{ height: `${heightPct}%` }}
              initial={{ height: "0%" }}
              transition={{ type: "spring", damping: 20, stiffness: 300 }}
              title={prob.toFixed(4)}
            />
          );
        })}
      </div>
      <div className="flex gap-px">
        {vocabLabels.map((label, i) => {
          const isSampled = i === sampledId;
          return (
            <span
              // biome-ignore lint/suspicious/noArrayIndexKey: vocab order is fixed
              key={i}
              className={`flex-1 min-w-0 text-center text-[8px] leading-none truncate ${
                isSampled
                  ? "font-bold text-[var(--chart-1)]"
                  : "text-muted-foreground"
              }`}
            >
              {label}
            </span>
          );
        })}
      </div>
    </div>
  );
}
