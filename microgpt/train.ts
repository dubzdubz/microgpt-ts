import {
  DEFAULT_CONFIG,
  forward,
  getParams,
  type ModelConfig,
  type StateDict,
} from "./model";

const EMA_ALPHA = 0.1;

export type AdamConfig = {
  learningRate: number;
  beta1: number;
  beta2: number;
  eps: number;
};

export const DEFAULT_ADAM_CONFIG: AdamConfig = {
  learningRate: 0.01,
  beta1: 0.85,
  beta2: 0.99,
  eps: 1e-8,
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

export function emaSmooth(prev: number | undefined, value: number): number {
  return prev === undefined
    ? value
    : (1 - EMA_ALPHA) * prev + EMA_ALPHA * value;
}

export const initAdamState = (nParams: number): AdamState => ({
  m: new Array(nParams).fill(0),
  v: new Array(nParams).fill(0),
});

export function trainStep(
  stateDict: StateDict,
  adamState: AdamState,
  tokens: number[],
  step: number,
  numSteps: number,
  adamConfig: AdamConfig,
  modelConfig: ModelConfig = DEFAULT_CONFIG,
): StepInfo {
  const params = getParams(stateDict);
  const { learningRate, beta1, beta2, eps } = adamConfig;

  // Forward pass (builds computation graph)
  const loss = forward(stateDict, tokens, modelConfig);

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
