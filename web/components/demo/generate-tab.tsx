import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Status = "idle" | "training" | "trained";

export function GenerateTab({
  status,
  output,
  onGenerate,
  onSwitchToTrain,
}: {
  status: Status;
  output: string[];
  onGenerate: () => void;
  onSwitchToTrain: () => void;
}) {
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

  return (
    <div className="flex flex-col gap-5">
      <Button onClick={onGenerate} className="w-fit">
        Generate
      </Button>

      {output.length > 0 && (
        <div className="grid grid-cols-2 gap-x-8 gap-y-1.5 rounded-lg border bg-muted/30 p-6 sm:grid-cols-3">
          {output.map((name, i) => (
            <span
              key={`${i}-${name}`}
              className={cn(
                "font-mono text-base",
                i === 0 && "text-foreground",
              )}
            >
              {name}
            </span>
          ))}
        </div>
      )}

      {output.length === 0 && (
        <div className="flex items-center justify-center rounded-lg border border-dashed py-16">
          <p className="text-sm text-muted-foreground">
            Click Generate to create new words
          </p>
        </div>
      )}
    </div>
  );
}
