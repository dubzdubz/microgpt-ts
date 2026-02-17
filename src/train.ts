import type { Tokenizer } from "./data";
import { analyticGradient, getParamRefs, type StateDict } from "./model";

export function train(
  stateDict: StateDict,
  docs: string[],
  tokenizer: Tokenizer,
  numSteps: number,
  learningRate: number,
) {
  const paramRefs = getParamRefs(stateDict);
  for (let step = 0; step < numSteps; step++) {
    const doc = docs[step % docs.length];
    const tokens = tokenizer.encode(doc);

    const { loss, grad } = analyticGradient(stateDict, tokens);

    // SGD update
    const lrT = learningRate * (1 - step / numSteps); // linear learning rate decay
    paramRefs.forEach(([row, j], i) => {
      row[j] -= lrT * grad[i];
    });

    if (step < 5 || step % 50 === 0) {
      console.log(
        `step ${String(step + 1).padStart(4)} / ${String(numSteps).padStart(4)} | loss ${loss.toFixed(4)}`,
      );
    }
  }
}
