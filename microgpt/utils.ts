import { Value } from "./value";

const EMA_ALPHA = 0.1;

// Math helpers ------------------------------------------------------------

export const sum = (arr: Value[]): Value =>
  arr.reduce((a, b) => a.add(b), new Value(0));

export const mean = (arr: Value[]): Value => sum(arr).div(arr.length);

export const linear = (x: Value[], w: Value[][]): Value[] =>
  w.map((wo) => sum(wo.map((wi, i) => wi.mul(x[i]))));

export const dotProduct = (a: Value[], b: Value[]): Value =>
  sum(a.map((ai, i) => ai.mul(b[i])));

export const vectorAdd = (a: Value[], b: Value[]): Value[] =>
  a.map((ai, i) => ai.add(b[i]));

export const transpose = (matrix: Value[][]): Value[][] =>
  matrix[0].map((_, i) => matrix.map((row) => row[i]));

export const emaSmooth = (prev: number | undefined, value: number): number =>
  prev === undefined ? value : (1 - EMA_ALPHA) * prev + EMA_ALPHA * value;

// Random number helpers ------------------------------------------------------------

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

// Box-Muller transform
export function randomGaussian(mean = 0, std = 1): number {
  let u1 = 0;
  while (u1 === 0) u1 = Math.random();
  const u2 = Math.random();
  const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  return mean + std * z;
}

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

// Data helpers ------------------------------------------------------------

export function parseDocs(text: string): string[] {
  const docs = text
    .trim()
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
  return shuffle(docs);
}

export function splitDocs(
  docs: string[],
  evalFraction = 0.1,
): { train: string[]; eval: string[] } {
  const nEval = Math.max(1, Math.round(docs.length * evalFraction));
  const shuffled = shuffle(docs);
  return {
    train: shuffled.slice(nEval),
    eval: shuffled.slice(0, nEval),
  };
}

// Other helpers ------------------------------------------------------------

export const init2dList = <T>(count: number): T[][] =>
  Array.from({ length: count }, () => []);
