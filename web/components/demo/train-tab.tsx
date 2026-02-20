import type { LiveGenEntry } from "./live-gen-stream";
import { LiveGenStream } from "./live-gen-stream";
import type { LossPoint } from "./loss-chart";
import { LossChart } from "./loss-chart";
import type { TrainingConfig } from "./train-sidebar";
import { TrainStatus } from "./train-status";
import { SECTION_LABEL, type Status } from "./types";

export function TrainTab({
  status,
  step,
  loss,
  evalLoss,
  elapsed,
  trainingConfig,
  lossHistory,
  liveGenEntries,
}: {
  status: Status;
  step: number;
  loss: number;
  evalLoss?: number;
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
    <div className="flex flex-col gap-5 flex-1 min-h-0">
      <TrainStatus
        step={step}
        numSteps={trainingConfig.numSteps}
        loss={loss}
        evalLoss={evalLoss}
        elapsed={elapsed}
      />

      <div className="flex flex-col gap-2 flex-[3] min-h-0">
        <p className={SECTION_LABEL}>Loss</p>
        {lossHistory.length > 1 ? (
          <LossChart
            className="flex-1 min-h-0"
            data={lossHistory}
            numSteps={trainingConfig.numSteps}
            isTraining={isTraining}
          />
        ) : (
          <div className="flex-1 min-h-0 rounded-lg border bg-muted/30" />
        )}
      </div>

      <LiveGenStream className="flex-[2] min-h-0" entries={liveGenEntries} />
    </div>
  );
}
