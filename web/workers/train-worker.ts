import { snapshotWeights, type TrainWorkerIn, type TrainWorkerOut } from "../../microgpt/browser";
import {
  buildTokenizer,
  getParams,
  type InferenceStep,
  inference,
  inferenceStepwise,
  initStateDict,
  type ModelConfig,
  type StateDict,
  type Tokenizer,
} from "../../microgpt/model";
import {
  type AdamState,
  DEFAULT_ADAM_CONFIG,
  initAdamState,
  trainStep,
} from "../../microgpt/train";
import { emaSmooth, parseDocs, splitDocs } from "../../microgpt/utils";

const CHUNK_SIZE = 10;
const LIVE_GEN_INTERVAL = 100;
const LIVE_GEN_SAMPLES = 5;
const STEP_BATCH_SIZE = 10;

let stateDict: StateDict | null = null;
let adamState: AdamState | null = null;
let tokenizer: Tokenizer | null = null;
let modelConfig: ModelConfig | null = null;
let aborted = false;
let explorer: Generator<InferenceStep> | null = null;

function post(msg: TrainWorkerOut) {
  postMessage(msg);
}

function runTraining(
  sd: StateDict,
  as: AdamState,
  tok: Tokenizer,
  mc: ModelConfig,
  trainDocs: string[],
  evalDocs: string[],
  numSteps: number,
  learningRate: number,
  temperature: number,
) {
  const adamCfg = { ...DEFAULT_ADAM_CONFIG, learningRate };
  const evalInterval = Math.max(1, Math.round(numSteps * 0.05));
  const encodedEvalDocs = evalDocs.map((d) => tok.encode(d));
  let smoothLoss: number | undefined;
  let evalId = 0;
  let step = 0;
  const stepBatch: { step: number; smoothLoss: number }[] = [];

  function runChunk() {
    const end = Math.min(step + CHUNK_SIZE, numSteps);
    while (step < end) {
      if (aborted) return;
      const doc = trainDocs[step % trainDocs.length];
      const tokens = tok.encode(doc);
      const info = trainStep(sd, as, tokens, step, numSteps, adamCfg, mc);
      smoothLoss = emaSmooth(smoothLoss, info.loss);
      const s = step + 1;

      stepBatch.push({ step: s, smoothLoss: smoothLoss });
      if (s % STEP_BATCH_SIZE === 0 || s === numSteps) {
        post({ type: "steps", batch: [...stepBatch] });
        stepBatch.length = 0;
      }

      if (s % LIVE_GEN_INTERVAL === 0) {
        const words = Array.from({ length: LIVE_GEN_SAMPLES }, () =>
          inference(sd, tok, temperature, mc),
        );
        post({ type: "live-gen", step: s, words });
      }

      if ((s % evalInterval === 0 || s === 1 || s === numSteps) && encodedEvalDocs.length > 0) {
        // Flush any buffered steps so the eval point already exists in lossBuffer on the main thread
        // when the eval result arrives back (otherwise target.evalLoss is silently dropped).
        if (stepBatch.length > 0) {
          post({ type: "steps", batch: [...stepBatch] });
          stepBatch.length = 0;
        }
        post({
          type: "eval-snapshot",
          id: ++evalId,
          weights: snapshotWeights(sd),
          encodedEvalDocs,
          modelConfig: mc,
          step: s,
        });
      }

      step++;
    }

    if (step >= numSteps) {
      post({ type: "done", weights: snapshotWeights(sd) });
      return;
    }
    setTimeout(runChunk, 0);
  }

  setTimeout(runChunk, 0);
}

addEventListener("message", (e: MessageEvent<TrainWorkerIn>) => {
  const msg = e.data;

  switch (msg.type) {
    case "init": {
      aborted = false;
      explorer = null;
      const allDocs = parseDocs(msg.datasetText);
      const { train: trainDocs, eval: evalDocs } = splitDocs(allDocs);
      tokenizer = buildTokenizer(allDocs);
      modelConfig = msg.modelConfig;
      stateDict = initStateDict(tokenizer.vocabSize, modelConfig);
      adamState = initAdamState(getParams(stateDict).length);

      post({
        type: "ready",
        tokenizer: {
          chars: tokenizer.chars,
          BOS: tokenizer.BOS,
          vocabSize: tokenizer.vocabSize,
          blockSize: modelConfig.blockSize,
        },
      });

      runTraining(
        stateDict,
        adamState,
        tokenizer,
        modelConfig,
        trainDocs,
        evalDocs,
        msg.numSteps,
        msg.learningRate,
        msg.temperature,
      );
      break;
    }

    case "abort":
      aborted = true;
      break;

    case "generate": {
      if (!stateDict || !tokenizer || !modelConfig) break;
      const sd = stateDict,
        tok = tokenizer,
        mc = modelConfig;
      const { temperature, prefixTokens, numSamples } = msg;
      let i = 0;
      const tick = () => {
        if (i >= numSamples) {
          post({ type: "gen-done" });
          return;
        }
        const word = inference(sd, tok, temperature, mc, prefixTokens);
        post({ type: "gen-word", word });
        i++;
        setTimeout(tick, 0);
      };
      setTimeout(tick, 0);
      break;
    }

    case "explore-start": {
      if (!stateDict || !tokenizer || !modelConfig) break;
      explorer = inferenceStepwise(
        stateDict,
        tokenizer,
        msg.temperature,
        modelConfig,
        msg.prefixTokens,
      );
      const result = explorer.next();
      if (!result.done) {
        post({ type: "explore-step", step: result.value });
        if (result.value.tokenId === tokenizer.BOS) explorer = null;
      }
      break;
    }

    case "explore-next": {
      if (!explorer || !tokenizer) break;
      const result = explorer.next();
      if (!result.done) {
        post({ type: "explore-step", step: result.value });
        if (result.value.tokenId === tokenizer.BOS) explorer = null;
      }
      break;
    }

    case "explore-reset":
      explorer = null;
      break;
  }
});
