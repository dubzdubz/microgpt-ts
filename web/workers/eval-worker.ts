import {
  type NumericStateDict,
  restoreStateDict,
} from "../../microgpt/eval-serialize";
import { forward, type ModelConfig } from "../../microgpt/model";

type EvalMsg = {
  id: number;
  weights: NumericStateDict;
  encodedDocs: number[][];
  config: ModelConfig;
};

addEventListener("message", (e: MessageEvent<EvalMsg>) => {
  const { id, weights, encodedDocs, config } = e.data;
  const sd = restoreStateDict(weights);
  let total = 0;
  for (const tokens of encodedDocs) total += forward(sd, tokens, config).data;
  postMessage({ id, avgLoss: total / encodedDocs.length });
});
