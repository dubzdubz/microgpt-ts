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

const N_EMBD = 16;
const N_HEAD = 4;
const N_LAYER = 1;
const BLOCK_SIZE = 16;
const HEAD_DIM = N_EMBD / N_HEAD;
const TEMPERATURE = 0.5;

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

export function initStateDict(vocabSize: number): StateDict {
  return {
    wte: gaussianMatrix(vocabSize, N_EMBD),
    wpe: gaussianMatrix(BLOCK_SIZE, N_EMBD),
    attn_wq: gaussianMatrixList(N_EMBD, N_EMBD, N_LAYER),
    attn_wk: gaussianMatrixList(N_EMBD, N_EMBD, N_LAYER),
    attn_wv: gaussianMatrixList(N_EMBD, N_EMBD, N_LAYER),
    attn_wo: gaussianMatrixList(N_EMBD, N_EMBD, N_LAYER),
    mlp_fc1: gaussianMatrixList(4 * N_EMBD, N_EMBD, N_LAYER),
    mlp_fc2: gaussianMatrixList(N_EMBD, 4 * N_EMBD, N_LAYER),
    lm_head: gaussianMatrix(vocabSize, N_EMBD),
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
): Value[] {
  const tokEmb = stateDict.wte[tokenId];
  const posEmb = stateDict.wpe[posId];
  let x = vectorAdd(tokEmb, posEmb);
  x = rmsnorm(x);

  for (let layer = 0; layer < N_LAYER; layer++) {
    // 1: Multi-head attention block
    let xResidual = [...x];
    x = rmsnorm(x);
    const q = linear(x, stateDict.attn_wq[layer]);
    const k = linear(x, stateDict.attn_wk[layer]);
    const v = linear(x, stateDict.attn_wv[layer]);
    keys[layer].push(k);
    values[layer].push(v);

    const xAttn = [];
    for (let h = 0; h < N_HEAD; h++) {
      const hStart = h * HEAD_DIM;
      const qH = q.slice(hStart, hStart + HEAD_DIM);
      const kH = keys[layer].map((key) => key.slice(hStart, hStart + HEAD_DIM));
      const vH = values[layer].map((value) =>
        value.slice(hStart, hStart + HEAD_DIM),
      );
      const attnLogits = kH.map((k) => dotProduct(qH, k).div(HEAD_DIM ** 0.5));
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
export function forward(stateDict: StateDict, tokens: number[]): Value {
  const n = Math.min(BLOCK_SIZE, tokens.length - 1);
  const keys: Value[][][] = init2dList(N_LAYER);
  const values: Value[][][] = init2dList(N_LAYER);
  const losses: Value[] = [];
  for (let posId = 0; posId < n; posId++) {
    const tokenId = tokens[posId];
    const targetId = tokens[posId + 1];
    const logits = gpt(stateDict, tokenId, posId, keys, values);
    const probs = softmax(logits);
    losses.push(lossFn(probs[targetId]));
  }
  return mean(losses);
}

// Generate new samples by sampling from the model
export function inference(
  stateDict: StateDict,
  tokenizer: Tokenizer,
  nSamples: number,
) {
  console.log("\n--- inference (new, hallucinated names) ---");
  const { BOS, decode } = tokenizer;
  for (let i = 0; i < nSamples; i++) {
    let tokenId = BOS;
    const tokens: number[] = [];
    const keys: Value[][][] = init2dList(N_LAYER);
    const values: Value[][][] = init2dList(N_LAYER);
    for (let posId = 0; posId < BLOCK_SIZE; posId++) {
      const logits = gpt(stateDict, tokenId, posId, keys, values);
      const probs = softmax(logits.map((l) => l.div(TEMPERATURE)));
      tokenId = sample(probs.map((p) => p.data));
      if (tokenId === BOS) break;
      tokens.push(tokenId);
    }
    console.log(`sample ${String(i + 1).padStart(2)}: ${decode(tokens)}`);
  }
}
