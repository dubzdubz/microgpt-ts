import type { Tokenizer } from "./data";
import { forward, getParams, type StateDict } from "./model";

export type AdamConfig = {
  learningRate: number;
  beta1: number;
  beta2: number;
  eps: number;
};

export type AdamState = {
  m: number[];
  v: number[];
};

export const initAdamState = (nParams: number): AdamState => {
  return {
    m: Array.from({ length: nParams }, () => 0),
    v: Array.from({ length: nParams }, () => 0),
  };
};

export function train(
  stateDict: StateDict,
  adamState: AdamState,
  docs: string[],
  tokenizer: Tokenizer,
  numSteps: number,
  config: AdamConfig,
) {
  const { learningRate, beta1, beta2, eps } = config;
  const params = getParams(stateDict);

  for (let step = 0; step < numSteps; step++) {
    const doc = docs[step % docs.length];
    const tokens = tokenizer.encode(doc);

    // Forward pass (builds computation graph)
    const loss = forward(stateDict, tokens);

    // Backward pass to compute gradients
    loss.backward();

    // Adam update
    const lrT = learningRate * (1 - step / numSteps);
    params.forEach((param, idx) => {
      adamState.m[idx] = beta1 * adamState.m[idx] + (1 - beta1) * param.grad;
      adamState.v[idx] =
        beta2 * adamState.v[idx] + (1 - beta2) * param.grad ** 2;
      const mHat = adamState.m[idx] / (1 - beta1 ** (step + 1));
      const vHat = adamState.v[idx] / (1 - beta2 ** (step + 1));
      param.data -= (lrT * mHat) / (vHat ** 0.5 + eps);
      param.grad = 0; // reset gradient
    });

    if (step < 5 || step % 200 === 0) {
      console.log(
        `step ${String(step + 1).padStart(4)} / ${String(numSteps).padStart(4)} | loss ${loss.data.toFixed(4)}`,
      );
    }
  }
}
