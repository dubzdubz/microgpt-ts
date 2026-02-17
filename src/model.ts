// Single-layer MLP, trained with autograd
import type { Tokenizer } from "./data";
import { gaussianMatrix, mean, sample, sum } from "./utils";
import type { Value } from "./value";

const MAX_OUTPUT_LENGTH = 16;
const N_EMBD = 16;
const TEMPERATURE = 0.5;

export type StateDict = {
  wte: Value[][];
  mlp_fc1: Value[][];
  mlp_fc2: Value[][];
};

export function initStateDict(vocabSize: number): StateDict {
  return {
    wte: gaussianMatrix(vocabSize, N_EMBD),
    mlp_fc1: gaussianMatrix(4 * N_EMBD, N_EMBD),
    mlp_fc2: gaussianMatrix(vocabSize, 4 * N_EMBD),
  };
}

// Flatten state dict into a flat list of Value params
export function getParams(stateDict: StateDict): Value[] {
  return Object.values(stateDict).flatMap((mat) => mat.flat());
}

// Linear transformation: w * x
function linear(x: Value[], w: Value[][]): Value[] {
  return w.map((wo) => sum(wo.map((wi, i) => wi.mul(x[i]))));
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

// MLP model: token_id -> logits
function mlp(stateDict: StateDict, tokenId: number): Value[] {
  let x = stateDict.wte[tokenId];
  x = linear(x, stateDict.mlp_fc1);
  x = x.map((xi) => xi.relu());
  const logits = linear(x, stateDict.mlp_fc2);
  return logits;
}

// Forward pass: run the model on a token sequence, return the average loss
export function forward(stateDict: StateDict, tokens: number[]): Value {
  const losses = tokens.slice(0, -1).map((tokenId, posId) => {
    const targetId = tokens[posId + 1];
    const logits = mlp(stateDict, tokenId);
    const probs = softmax(logits);
    return lossFn(probs[targetId]);
  });
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
    for (let j = 0; j < MAX_OUTPUT_LENGTH; j++) {
      const logits = mlp(stateDict, tokenId);
      const probs = softmax(logits.map((l) => l.div(TEMPERATURE)));
      tokenId = sample(probs.map((p) => p.data));
      if (tokenId === BOS) break;
      tokens.push(tokenId);
    }
    console.log(`sample ${String(i + 1).padStart(2)}: ${decode(tokens)}`);
  }
}
