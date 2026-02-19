import {
  DEFAULT_CONFIG,
  forward,
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
import { mean } from "./utils";

const CHUNK_SIZE = 10;
const EVAL_INTERVAL = 50;

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
  evalDocs?: string[],
): TrainHandle {
  const params = getParams(stateDict);
  let aborted = false;
  let smoothLoss: number | undefined;
  let smoothEvalLoss: number | undefined;

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

        if (
          evalDocs &&
          evalDocs.length > 0 &&
          ((step + 1) % EVAL_INTERVAL === 0 || step === 0)
        ) {
          const avgEvalLoss = mean(
            evalDocs.map((doc) =>
              forward(stateDict, tokenizer.encode(doc), modelConfig),
            ),
          ).data;
          smoothEvalLoss = emaSmooth(smoothEvalLoss, avgEvalLoss);
          info.evalLoss = avgEvalLoss;
          info.smoothEvalLoss = smoothEvalLoss;
        }

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
