"use client";

import { motion } from "motion/react";
import { Badge } from "@/components/ui/badge";
import type { InferenceStep } from "../../../microgpt/model";
import { TokenProbChart } from "./token-prob-chart";

type ExploreViewProps = {
  steps: InferenceStep[];
  vocabLabels: string[];
  done: boolean;
  BOS: number;
  blockSize: number;
};

export function ExploreView({
  steps,
  vocabLabels,
  done,
  BOS,
  blockSize,
}: ExploreViewProps) {
  if (steps.length === 0) {
    return (
      <div className="flex items-center justify-center rounded-lg border border-dashed py-16">
        <p className="text-sm text-muted-foreground">
          Click Next Token to begin
        </p>
      </div>
    );
  }

  const lastStep = steps[steps.length - 1];
  const wordChars = steps
    .filter((s) => s.sampledId !== BOS)
    .map((s) => vocabLabels[s.sampledId]);

  return (
    <div className="flex flex-col gap-4">
      {/* Growing word display */}
      <div className="flex flex-wrap gap-2">
        {wordChars.map((char, i) => {
          const isLatest = !done && i === wordChars.length - 1;
          return (
            <motion.div
              // biome-ignore lint/suspicious/noArrayIndexKey: chars grow monotonically
              key={i}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: "spring", damping: 20, stiffness: 300 }}
              className={`flex h-10 w-10 items-center justify-center rounded-lg border font-mono text-base ${
                isLatest
                  ? "ring-2 ring-primary text-primary"
                  : ""
              }`}
            >
              {char}
            </motion.div>
          );
        })}
        {done && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring", damping: 20, stiffness: 300 }}
            className="flex items-center"
          >
            <Badge variant="outline">END</Badge>
          </motion.div>
        )}
      </div>

      {/* Step indicator */}
      <p className="text-sm text-muted-foreground">
        Position {lastStep.posId + 1} / {blockSize}
      </p>

      {/* Probability bar chart */}
      <TokenProbChart
        probs={lastStep.probs}
        sampledId={lastStep.sampledId}
        vocabLabels={vocabLabels}
      />
    </div>
  );
}
