// Browser-only utilities: serialization helpers for Web Worker communication
import type { InferenceStep, ModelConfig, StateDict } from "./model";
import { Value } from "./value";

// Serialization helpers ------------------------------------------------------------
type Num<T> = T extends Value ? number : T extends (infer U)[] ? Num<U>[] : T;
export type NumericStateDict = { [K in keyof StateDict]: Num<StateDict[K]> };

function mapLeaves(x: unknown, fn: (leaf: unknown) => unknown): unknown {
  return Array.isArray(x) ? x.map((el) => mapLeaves(el, fn)) : fn(x);
}

export function snapshotWeights(sd: StateDict): NumericStateDict {
  const out: Record<string, unknown> = {};
  for (const k of Object.keys(sd))
    out[k] = mapLeaves(sd[k as keyof StateDict], (v) => (v as Value).data);
  return out as NumericStateDict;
}

export function restoreStateDict(snap: NumericStateDict): StateDict {
  const out: Record<string, unknown> = {};
  for (const k of Object.keys(snap))
    out[k] = mapLeaves(
      snap[k as keyof NumericStateDict],
      (n) => new Value(n as number),
    );
  return out as StateDict;
}

// Main --> Training Worker
export type TrainWorkerIn =
  | {
      type: "init";
      datasetText: string;
      modelConfig: ModelConfig;
      numSteps: number;
      learningRate: number;
      temperature: number;
    }
  | { type: "abort" }
  | {
      type: "generate";
      temperature: number;
      prefixTokens: number[];
      numSamples: number;
    }
  | {
      type: "explore-start";
      temperature: number;
      prefixTokens: number[];
    }
  | { type: "explore-next" }
  | { type: "explore-reset" };

// Training Worker --> Main
export type TrainWorkerOut =
  | {
      type: "ready";
      tokenizer: {
        chars: string[];
        BOS: number;
        vocabSize: number;
        blockSize: number;
      };
    }
  | { type: "steps"; batch: { step: number; smoothLoss: number }[] }
  | { type: "live-gen"; step: number; words: string[] }
  | {
      type: "eval-snapshot";
      id: number;
      weights: NumericStateDict;
      encodedEvalDocs: number[][];
      modelConfig: ModelConfig;
      step: number;
    }
  | { type: "done"; weights: NumericStateDict }
  | { type: "gen-word"; word: string }
  | { type: "gen-done" }
  | { type: "explore-step"; step: InferenceStep };
