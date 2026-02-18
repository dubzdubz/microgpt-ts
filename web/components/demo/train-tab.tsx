import { Button } from "@/components/ui/button";
import type { LiveGenEntry } from "./live-gen-stream";
import { LiveGenStream } from "./live-gen-stream";
import type { LossPoint } from "./loss-chart";
import { LossChart } from "./loss-chart";
import type { TrainingConfig } from "./train-sidebar";

type Status = "idle" | "training" | "trained";

export function TrainTab({
  status,
  step,
  loss,
  elapsed,
  trainingConfig,
  lossHistory,
  liveGenEntries,
  onTrain,
  onStop,
  onSwitchToGenerate,
}: {
  status: Status;
  step: number;
  loss: number;
  elapsed: number;
  trainingConfig: TrainingConfig;
  lossHistory: LossPoint[];
  liveGenEntries: LiveGenEntry[];
  onTrain: () => void;
  onStop: () => void;
  onSwitchToGenerate: () => void;
}) {
  const isTraining = status === "training";
  const isTrained = status === "trained";

  if (status === "idle") {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
        <p className="text-muted-foreground">
          Configure hyperparameters, then start training.
        </p>
        <Button onClick={onTrain}>Train</Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center gap-3">
        <Button onClick={onTrain} disabled={isTraining}>
          {isTrained ? "Re-train" : "Train"}
        </Button>
        {isTraining && (
          <Button variant="outline" onClick={onStop}>
            Stop
          </Button>
        )}
        <p className="font-mono text-sm text-muted-foreground">
          step {step} / {trainingConfig.numSteps} | loss: {loss.toFixed(4)} |{" "}
          {(elapsed / 1000).toFixed(1)}s
        </p>
      </div>

      {lossHistory.length > 1 && (
        <LossChart
          data={lossHistory}
          numSteps={trainingConfig.numSteps}
          currentLoss={loss}
        />
      )}

      <LiveGenStream entries={liveGenEntries} />

      {isTrained && (
        <button
          type="button"
          onClick={onSwitchToGenerate}
          className="self-start text-sm text-primary hover:underline"
        >
          Model ready — switch to Generate &rarr;
        </button>
      )}
    </div>
  );
}
