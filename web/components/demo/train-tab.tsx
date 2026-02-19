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
    <div className="flex flex-col gap-5">
      <TrainStatus
        step={step}
        numSteps={trainingConfig.numSteps}
        loss={loss}
        evalLoss={evalLoss}
        elapsed={elapsed}
      />

      {lossHistory.length > 1 && (
        <div className="flex flex-col gap-2">
          <p className={SECTION_LABEL}>Loss</p>
          <LossChart
            data={lossHistory}
            numSteps={trainingConfig.numSteps}
            isTraining={isTraining}
          />
        </div>
      )}

      <LiveGenStream entries={liveGenEntries} />
    </div>
  );
}
