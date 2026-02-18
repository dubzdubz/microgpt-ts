import { motion } from "motion/react";
import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";

type Status = "idle" | "training" | "trained";

export function GenerateTab({
  status,
  output,
  isGenerating,
  onSwitchToTrain,
}: {
  status: Status;
  output: string[];
  isGenerating: boolean;
  onSwitchToTrain: () => void;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // biome-ignore lint/correctness/useExhaustiveDependencies: scroll on new entries
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [output.length]);

  if (status !== "trained") {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
        <p className="text-muted-foreground">
          Train the model first to generate new words.
        </p>
        <Button variant="outline" onClick={onSwitchToTrain}>
          Go to Train
        </Button>
      </div>
    );
  }

  if (output.length === 0 && !isGenerating) {
    return (
      <div className="flex items-center justify-center rounded-lg border border-dashed py-16">
        <p className="text-sm text-muted-foreground">
          Click Generate to create new words
        </p>
      </div>
    );
  }

  return (
    <div
      ref={scrollRef}
      className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto rounded-lg border bg-muted/30 p-5"
    >
      {output.map((name, i) => (
        <motion.div
          key={`${i}-${name}`}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="font-mono text-base leading-relaxed"
        >
          {name}
        </motion.div>
      ))}
      {isGenerating && (
        <span className="inline-block h-4 w-1.5 animate-pulse rounded-sm bg-foreground/40" />
      )}
    </div>
  );
}
