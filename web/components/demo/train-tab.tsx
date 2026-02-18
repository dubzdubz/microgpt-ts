import type { LiveGenEntry } from "./live-gen-stream";
import { LiveGenStream } from "./live-gen-stream";
import type { LossPoint } from "./loss-chart";
import { LossChart } from "./loss-chart";
import type { TrainingConfig } from "./train-sidebar";
import { TrainStatus } from "./train-status";

type Status = "idle" | "training" | "trained";

export function TrainTab({
  status,
  step,
  loss,
  elapsed,
  trainingConfig,
  lossHistory,
  liveGenEntries,
}: {
  status: Status;
  step: number;
  loss: number;
  elapsed: number;
  trainingConfig: TrainingConfig;
  lossHistory: LossPoint[];
  liveGenEntries: LiveGenEntry[];
}) {
  const isTraining = status === "training";

  if (status === "idle") {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
        <p className="text-muted-foreground">
          Configure hyperparameters, then start training.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <TrainStatus
        step={step}
        numSteps={trainingConfig.numSteps}
        loss={loss}
        elapsed={elapsed}
        isTraining={isTraining}
      />

      {lossHistory.length > 1 && (
        <div className="flex flex-col gap-2">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Training Loss
          </p>
          <LossChart data={lossHistory} numSteps={trainingConfig.numSteps} />
        </div>
      )}

      <LiveGenStream entries={liveGenEntries} />
    </div>
  );
}
