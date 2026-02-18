import { forward, getParams, type StateDict, type Tokenizer } from "./model";
import type { Value } from "./value";

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

export type StepInfo = {
  step: number;
  numSteps: number;
  loss: number;
  smoothLoss: number;
  lr: number;
};

export const initAdamState = (nParams: number): AdamState => {
  return {
    m: Array.from({ length: nParams }, () => 0),
    v: Array.from({ length: nParams }, () => 0),
  };
};

// Single training step. Returns step info for observability.
export function trainStep(
  params: Value[],
  stateDict: StateDict,
  adamState: AdamState,
  tokens: number[],
  step: number,
  numSteps: number,
  config: AdamConfig,
): StepInfo {
  const { learningRate, beta1, beta2, eps } = config;

  // Forward pass (builds computation graph)
  const loss = forward(stateDict, tokens);

  // Backward pass to compute gradients
  loss.backward();

  // Adam update with linear LR decay
  const lr = learningRate * (1 - step / numSteps);
  params.forEach((param, idx) => {
    adamState.m[idx] = beta1 * adamState.m[idx] + (1 - beta1) * param.grad;
    adamState.v[idx] = beta2 * adamState.v[idx] + (1 - beta2) * param.grad ** 2;
    const mHat = adamState.m[idx] / (1 - beta1 ** (step + 1));
    const vHat = adamState.v[idx] / (1 - beta2 ** (step + 1));
    param.data -= (lr * mHat) / (vHat ** 0.5 + eps);
    param.grad = 0;
  });

  return { step, numSteps, loss: loss.data, smoothLoss: 0, lr };
}

export function train(
  stateDict: StateDict,
  adamState: AdamState,
  docs: string[],
  tokenizer: Tokenizer,
  numSteps: number,
  config: AdamConfig,
  onStep?: (info: StepInfo) => void,
) {
  const params = getParams(stateDict);
  let smoothLoss = 0;

  for (let step = 0; step < numSteps; step++) {
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
    );

    // Exponential moving average for loss
    smoothLoss = step === 0 ? info.loss : 0.99 * smoothLoss + 0.01 * info.loss;
    info.smoothLoss = smoothLoss;

    if (onStep) onStep(info);
  }
}
