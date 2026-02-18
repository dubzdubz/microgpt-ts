import { getParams, type ModelConfig, DEFAULT_CONFIG, type StateDict, type Tokenizer } from "./model";
import {
  type AdamConfig,
  type AdamState,
  type StepInfo,
  trainStep,
} from "./train";

const CHUNK_SIZE = 10;

export type TrainHandle = {
  promise: Promise<void>;
  abort: () => void;
};

export function trainAsync(
  stateDict: StateDict,
  adamState: AdamState,
  docs: string[],
  tokenizer: Tokenizer,
  numSteps: number,
  config: AdamConfig,
  modelConfig: ModelConfig = DEFAULT_CONFIG,
  onStep: (info: StepInfo) => void,
): TrainHandle {
  const params = getParams(stateDict);
  let aborted = false;
  let smoothLoss = 0;

  const abort = () => {
    aborted = true;
  };

  const promise = new Promise<void>((resolve) => {
    let step = 0;

    function runChunk() {
      const end = Math.min(step + CHUNK_SIZE, numSteps);
      while (step < end) {
        if (aborted) {
          resolve();
          return;
        }
        const doc = docs[step % docs.length];
        const tokens = tokenizer.encode(doc);
        const info = trainStep(
          params,
          stateDict,
          adamState,
          tokens,
          step,
          numSteps,
          config,
          modelConfig,
        );
        smoothLoss =
          step === 0 ? info.loss : 0.99 * smoothLoss + 0.01 * info.loss;
        info.smoothLoss = smoothLoss;
        onStep(info);
        step++;
      }
      if (step >= numSteps) {
        resolve();
        return;
      }
      setTimeout(runChunk, 0);
    }

    setTimeout(runChunk, 0);
  });

  return { promise, abort };
}
