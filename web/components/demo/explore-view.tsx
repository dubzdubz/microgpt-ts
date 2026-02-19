"use client";

import { motion } from "motion/react";
import type { InferenceStep } from "../../../microgpt/model";
import { TokenProbChart } from "./token-prob-chart";
import { SECTION_LABEL } from "./types";

type ExploreViewProps = {
  steps: InferenceStep[];
  vocabLabels: string[];
  done: boolean;
  BOS: number;
  prefixChars?: string[];
};

export function ExploreView({
  steps,
  vocabLabels,
  done,
  BOS,
  prefixChars = [],
}: ExploreViewProps) {
  if (steps.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed py-16">
        {prefixChars.length > 0 && (
          <div className="flex gap-2 mb-2">
            {prefixChars.map((char, i) => (
              <div
                // biome-ignore lint/suspicious/noArrayIndexKey: prefix is static
                key={i}
                className="flex h-10 w-10 items-center justify-center rounded-lg border border-dashed bg-muted/50 font-mono text-base text-muted-foreground"
              >
                {char}
              </div>
            ))}
          </div>
        )}
        <p className="text-sm text-muted-foreground">
          Click Next Token to begin
        </p>
      </div>
    );
  }

  const lastStep = steps[steps.length - 1];
  const wordChars = steps
    .filter((s) => s.tokenId !== BOS)
    .map((s) => vocabLabels[s.tokenId]);
  const totalChars = prefixChars.length + wordChars.length;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <p className={SECTION_LABEL}>Sample output</p>
        <div className="flex flex-wrap gap-2">
          {prefixChars.map((char, i) => (
            <div
              // biome-ignore lint/suspicious/noArrayIndexKey: prefix is static
              key={`pfx-${i}`}
              className="flex h-10 w-10 items-center justify-center rounded-lg border border-dashed bg-muted/50 font-mono text-base text-muted-foreground"
            >
              {char}
            </div>
          ))}
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
                  isLatest ? "ring-2 ring-primary text-primary" : ""
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
              <div className="flex h-10 w-10 items-center justify-center rounded-lg border font-mono text-base">
                .
              </div>
            </motion.div>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <p className={SECTION_LABEL}>
          Token probabilities{" "}
          <span className="font-normal">— position {totalChars}</span>
        </p>
        <TokenProbChart
          probs={lastStep.probs}
          tokenId={lastStep.tokenId}
          vocabLabels={vocabLabels}
        />
        <p className="text-xs text-muted-foreground">
          Each bar shows the probability the model assigns to each character.
          The highlighted bar was sampled.
        </p>
      </div>
    </div>
  );
}
