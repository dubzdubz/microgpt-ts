import { Value } from "./value";

// sum of an array
export const sum = (arr: Value[]): Value =>
  arr.reduce((a, b) => a.add(b), new Value(0));

// mean of an array
export const mean = (arr: Value[]): Value => sum(arr).div(arr.length);

// Sample from a probability distribution using cumulative weights
// Assumes weights are normalized to sum to 1
export function sample(weights: number[]): number {
  const r = Math.random();
  let cum = 0;
  for (let i = 0; i < weights.length; i++) {
    cum += weights[i];
    if (r < cum) return i;
  }
  return weights.length - 1;
}

// Gaussian random number using Box-Muller transform
// https://en.wikipedia.org/wiki/Box%E2%80%93Muller_transform
export function randomGaussian(mean = 0, std = 1): number {
  let u1 = 0;
  while (u1 === 0) u1 = Math.random(); // avoid 0
  const u2 = Math.random();
  const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  return mean + std * z;
}

// Random nout x nin matrix with Gaussian-distributed values
export const gaussianMatrix = (
  nout: number,
  nin: number,
  std = 0.08,
): Value[][] =>
  Array.from({ length: nout }, () =>
    Array.from({ length: nin }, () => new Value(randomGaussian(0, std))),
  );

export const gaussianMatrixList = (
  nout: number,
  nin: number,
  nLayers: number,
  std = 0.08,
): Value[][][] =>
  Array.from({ length: nLayers }, () => gaussianMatrix(nout, nin, std));

// Fisher-Yates shuffle (in-place)
export function shuffle<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export const init2dList = <T>(count: number): T[][] =>
  Array.from({ length: count }, () => []);
