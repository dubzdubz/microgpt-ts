// Single-layer MLP, trained with autograd
import type { Tokenizer } from "./data";
import { gaussianMatrix, mean, sample, sum } from "./utils";
import type { Value } from "./value";

const N_EMBD = 16;
const BLOCK_SIZE = 16;
const TEMPERATURE = 0.5;

export type StateDict = {
  wte: Value[][];
  wpe: Value[][];
  attn_wq: Value[][];
  attn_wk: Value[][];
  attn_wv: Value[][];
  attn_wo: Value[][];
  mlp_fc1: Value[][];
  mlp_fc2: Value[][];
  lm_head: Value[][];
};

export function initStateDict(vocabSize: number): StateDict {
  return {
    wte: gaussianMatrix(vocabSize, N_EMBD),
    wpe: gaussianMatrix(BLOCK_SIZE, N_EMBD),
    attn_wq: gaussianMatrix(N_EMBD, N_EMBD),
    attn_wk: gaussianMatrix(N_EMBD, N_EMBD),
    attn_wv: gaussianMatrix(N_EMBD, N_EMBD),
    attn_wo: gaussianMatrix(N_EMBD, N_EMBD),
    mlp_fc1: gaussianMatrix(4 * N_EMBD, N_EMBD),
    mlp_fc2: gaussianMatrix(N_EMBD, 4 * N_EMBD),
    lm_head: gaussianMatrix(vocabSize, N_EMBD),
  };
}

// Flatten state dict into a flat list of Value params
export function getParams(stateDict: StateDict): Value[] {
  return Object.values(stateDict).flatMap((mat) => mat.flat());
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
  keys: Value[][],
  values: Value[][],
): Value[] {
  const tokEmb = stateDict.wte[tokenId];
  const posEmb = stateDict.wpe[posId];
  let x = vectorAdd(tokEmb, posEmb);
  x = rmsnorm(x);

  // 1: Single-head attention block
  const xResidual = [...x];
  x = rmsnorm(x);
  const q = linear(x, stateDict.attn_wq);
  const k = linear(x, stateDict.attn_wk);
  const v = linear(x, stateDict.attn_wv);
  keys.push(k);
  values.push(v);
  const attnLogits = keys.map((key) => dotProduct(q, key).div(N_EMBD ** 0.5));
  const attnWeights = softmax(attnLogits);
  const xAttn = transpose(values).map((value) =>
    dotProduct(attnWeights, value),
  );
  x = linear(xAttn, stateDict.attn_wo);
  x = vectorAdd(x, xResidual);

  // 2: MLP block
  const xResidual2 = [...x];
  x = rmsnorm(x);
  x = linear(x, stateDict.mlp_fc1);
  x = x.map((xi) => xi.relu());
  x = linear(x, stateDict.mlp_fc2);
  x = vectorAdd(x, xResidual2);
  const logits = linear(x, stateDict.lm_head);
  return logits;
}

// Forward pass: run the model on a token sequence, return the average loss
export function forward(stateDict: StateDict, tokens: number[]): Value {
  const n = Math.min(BLOCK_SIZE, tokens.length - 1);
  const keys: Value[][] = [];
  const values: Value[][] = [];
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
    const keys: Value[][] = [];
    const values: Value[][] = [];
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
