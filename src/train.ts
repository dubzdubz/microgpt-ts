import type { Tokenizer } from "./data";
import { forward, getParams, type StateDict } from "./model";

export function train(
  stateDict: StateDict,
  docs: string[],
  tokenizer: Tokenizer,
  numSteps: number,
  learningRate: number,
) {
  const params = getParams(stateDict);
  for (let step = 0; step < numSteps; step++) {
    const doc = docs[step % docs.length];
    const tokens = tokenizer.encode(doc);

    // Forward pass (builds computation graph)
    const loss = forward(stateDict, tokens);

    // Backward pass to compute gradients
    loss.backward();

    // SGD update
    const lrT = learningRate * (1 - step / numSteps);
    params.forEach((param) => {
      param.applyGradient(lrT);
    });

    if (step < 5 || step % 200 === 0) {
      console.log(
        `step ${String(step + 1).padStart(4)} / ${String(numSteps).padStart(4)} | loss ${loss.data.toFixed(4)}`,
      );
    }
  }
}
