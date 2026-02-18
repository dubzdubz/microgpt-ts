import {
  DEFAULT_CONFIG,
  getParams,
  type ModelConfig,
  type StateDict,
  type Tokenizer,
} from "./model";
import {
  type AdamConfig,
  type AdamState,
  emaSmooth,
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
  let smoothLoss: number | undefined;

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
        smoothLoss = emaSmooth(smoothLoss, info.loss);
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
