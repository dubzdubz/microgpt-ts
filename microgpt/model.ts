import {
  gaussianMatrix,
  gaussianMatrixList,
  init2dList,
  mean,
  sample,
  sum,
} from "./utils";
import type { Value } from "./value";

export type Tokenizer = {
  vocabSize: number;
  BOS: number;
  encode: (doc: string) => number[];
  decode: (tokens: number[]) => string;
  chars: string[];
};

export function buildTokenizer(docs: string[]): Tokenizer {
  const chars = [...new Set(docs.join(""))].sort();
  const BOS = chars.length;
  const vocabSize = chars.length + 1;

  const encode = (doc: string): number[] => {
    return [BOS, ...[...doc].map((ch) => chars.indexOf(ch)), BOS];
  };

  const decode = (tokens: number[]): string => {
    return tokens.map((t) => (t !== BOS ? chars[t] : "")).join("");
  };

  return { vocabSize, BOS, encode, decode, chars };
}

export type ModelConfig = {
  nEmbd: number;
  nHead: number;
  nLayer: number;
  blockSize: number;
};

export const DEFAULT_CONFIG: ModelConfig = {
  nEmbd: 16,
  nHead: 4,
  nLayer: 1,
  blockSize: 16,
};

export type StateDict = {
  wte: Value[][];
  wpe: Value[][];
  attn_wq: Value[][][];
  attn_wk: Value[][][];
  attn_wv: Value[][][];
  attn_wo: Value[][][];
  mlp_fc1: Value[][][];
  mlp_fc2: Value[][][];
  lm_head: Value[][];
};

export function initStateDict(
  vocabSize: number,
  config: ModelConfig = DEFAULT_CONFIG,
): StateDict {
  const { nEmbd, nLayer, blockSize } = config;
  return {
    wte: gaussianMatrix(vocabSize, nEmbd),
    wpe: gaussianMatrix(blockSize, nEmbd),
    attn_wq: gaussianMatrixList(nEmbd, nEmbd, nLayer),
    attn_wk: gaussianMatrixList(nEmbd, nEmbd, nLayer),
    attn_wv: gaussianMatrixList(nEmbd, nEmbd, nLayer),
    attn_wo: gaussianMatrixList(nEmbd, nEmbd, nLayer),
    mlp_fc1: gaussianMatrixList(4 * nEmbd, nEmbd, nLayer),
    mlp_fc2: gaussianMatrixList(nEmbd, 4 * nEmbd, nLayer),
    lm_head: gaussianMatrix(vocabSize, nEmbd),
  };
}

// Flatten state dict into a flat list of Value params
export function getParams(stateDict: StateDict): Value[] {
  return Object.values(stateDict).flat(3);
}

// Linear transformation: W * x
function linear(x: Value[], w: Value[][]): Value[] {
  return w.map((wo) => sum(wo.map((wi, i) => wi.mul(x[i]))));
}

function dotProduct(a: Value[], b: Value[]): Value {
  return sum(a.map((ai, i) => ai.mul(b[i])));
}

function vectorAdd(a: Value[], b: Value[]): Value[] {
  return a.map((ai, i) => ai.add(b[i]));
}

function transpose(matrix: Value[][]): Value[][] {
  return matrix[0].map((_, i) => matrix.map((row) => row[i]));
}

// Softmax function: exp(x) / sum(exp(x))
// Subtract the maximum value to avoid overflow
function softmax(logits: Value[]): Value[] {
  const maxVal = Math.max(...logits.map((v) => v.data));
  const exps = logits.map((v) => v.sub(maxVal).exp());
  const total = sum(exps);
  return exps.map((e) => e.div(total));
}

// Loss function: -log(prob)
const lossFn = (prob: Value): Value => prob.log().neg();

// RMSNorm normalization: (x^2 + 1e-5)^-0.5
export function rmsnorm(x: Value[]): Value[] {
  const ms = mean(x.map((xi) => xi.pow(2)));
  const scale = ms.add(1e-5).pow(-0.5);
  return x.map((xi) => xi.mul(scale));
}

function gpt(
  stateDict: StateDict,
  tokenId: number,
  posId: number,
  keys: Value[][][],
  values: Value[][][],
  config: ModelConfig,
): Value[] {
  const { nEmbd, nHead, nLayer } = config;
  const headDim = nEmbd / nHead;

  const tokEmb = stateDict.wte[tokenId];
  const posEmb = stateDict.wpe[posId];
  let x = vectorAdd(tokEmb, posEmb);
  x = rmsnorm(x);

  for (let layer = 0; layer < nLayer; layer++) {
    // 1: Multi-head attention block
    let xResidual = [...x];
    x = rmsnorm(x);
    const q = linear(x, stateDict.attn_wq[layer]);
    const k = linear(x, stateDict.attn_wk[layer]);
    const v = linear(x, stateDict.attn_wv[layer]);
    keys[layer].push(k);
    values[layer].push(v);

    const xAttn = [];
    for (let h = 0; h < nHead; h++) {
      const hStart = h * headDim;
      const qH = q.slice(hStart, hStart + headDim);
      const kH = keys[layer].map((key) => key.slice(hStart, hStart + headDim));
      const vH = values[layer].map((value) =>
        value.slice(hStart, hStart + headDim),
      );
      const attnLogits = kH.map((k) => dotProduct(qH, k).div(headDim ** 0.5));
      const attnWeights = softmax(attnLogits);
      const headOut = transpose(vH).map((value) =>
        dotProduct(attnWeights, value),
      );
      xAttn.push(...headOut);
    }
    x = linear(xAttn, stateDict.attn_wo[layer]);
    x = vectorAdd(x, xResidual);

    // 2: MLP block
    xResidual = [...x];
    x = rmsnorm(x);
    x = linear(x, stateDict.mlp_fc1[layer]);
    x = x.map((xi) => xi.relu());
    x = linear(x, stateDict.mlp_fc2[layer]);
    x = vectorAdd(x, xResidual);
  }

  const logits = linear(x, stateDict.lm_head);
  return logits;
}

// Forward pass: run the model on a token sequence, return the average loss
export function forward(
  stateDict: StateDict,
  tokens: number[],
  config: ModelConfig = DEFAULT_CONFIG,
): Value {
  const n = Math.min(config.blockSize, tokens.length - 1);
  const keys: Value[][][] = init2dList(config.nLayer);
  const values: Value[][][] = init2dList(config.nLayer);
  const losses: Value[] = [];
  for (let posId = 0; posId < n; posId++) {
    const tokenId = tokens[posId];
    const targetId = tokens[posId + 1];
    const logits = gpt(stateDict, tokenId, posId, keys, values, config);
    const probs = softmax(logits);
    losses.push(lossFn(probs[targetId]));
  }
  return mean(losses);
}

// Generate a single sample string from the model
export function inference(
  stateDict: StateDict,
  tokenizer: Tokenizer,
  temperature = 0.5,
  config: ModelConfig = DEFAULT_CONFIG,
): string {
  const { BOS, decode } = tokenizer;
  let tokenId = BOS;
  const tokens: number[] = [];
  const keys: Value[][][] = init2dList(config.nLayer);
  const values: Value[][][] = init2dList(config.nLayer);
  for (let posId = 0; posId < config.blockSize; posId++) {
    const logits = gpt(stateDict, tokenId, posId, keys, values, config);
    if (temperature === 0) {
      tokenId = logits.reduce(
        (best, l, i, arr) => (l.data > arr[best].data ? i : best),
        0,
      );
    } else {
      const probs = softmax(logits.map((l) => l.div(temperature)));
      tokenId = sample(probs.map((p) => p.data));
    }
    if (tokenId === BOS) break;
    tokens.push(tokenId);
  }
  return decode(tokens);
}
