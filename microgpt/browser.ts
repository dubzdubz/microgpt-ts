import { snapshotWeights } from "./eval-serialize";
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

export type EvalInfo = {
  evalStep: number;
  evalLoss: number;
  smoothEvalLoss: number;
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
  onEval?: (info: EvalInfo) => void,
  evalWorkerUrl?: URL,
): TrainHandle {
  const params = getParams(stateDict);
  const evalInterval = Math.max(1, Math.round(numSteps * 0.05));
  let aborted = false;
  let smoothLoss: number | undefined;
  let smoothEvalLoss: number | undefined;

  const encodedEvalDocs = evalDocs?.map((doc) => tokenizer.encode(doc));
  let worker: Worker | null = null;
  let evalId = 0;
  let latestEvalId = -1;
  let inflight = 0;
  let onDrain: (() => void) | null = null;
  const evalStepMap: Record<number, number> = {};

  if (encodedEvalDocs && encodedEvalDocs.length > 0 && onEval) {
    worker = new Worker(
      evalWorkerUrl ??
        new URL("../web/workers/eval-worker.ts", import.meta.url),
    );
    worker.onmessage = (e: MessageEvent<{ id: number; avgLoss: number }>) => {
      inflight--;
      if (e.data.id <= latestEvalId) {
        if (inflight === 0 && onDrain) onDrain();
        return;
      }
      latestEvalId = e.data.id;
      smoothEvalLoss = emaSmooth(smoothEvalLoss, e.data.avgLoss);
      onEval({
        evalStep: evalStepMap[e.data.id],
        evalLoss: e.data.avgLoss,
        smoothEvalLoss,
      });
      delete evalStepMap[e.data.id];
      if (inflight === 0 && onDrain) onDrain();
    };
  }

  const abort = () => {
    aborted = true;
    worker?.terminate();
    worker = null;
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
          (step + 1) % evalInterval === 0 ||
          step === 0 ||
          step === numSteps - 1
        ) {
          if (worker && encodedEvalDocs) {
            inflight++;
            evalStepMap[++evalId] = step;
            worker.postMessage({
              id: evalId,
              weights: snapshotWeights(stateDict),
              encodedDocs: encodedEvalDocs,
              config: modelConfig,
            });
          }
        }

        onStep(info);
        step++;
      }
      if (step >= numSteps) {
        if (inflight > 0) {
          onDrain = () => {
            worker?.terminate();
            worker = null;
            resolve();
          };
        } else {
          worker?.terminate();
          worker = null;
          resolve();
        }
        return;
      }
      setTimeout(runChunk, 0);
    }

    setTimeout(runChunk, 0);
  });

  return { promise, abort };
}
