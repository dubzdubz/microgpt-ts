// Bigram language model: state_dict[i][j] = how many times token j follows token i
import type { Tokenizer } from "./data";
import { gaussianMatrix, mean, sample, sum } from "./utils";

const MAX_OUTPUT_LENGTH = 16;
const N_EMBD = 16;
const TEMPERATURE = 0.5;
const EPS = 1e-5;

export type StateDict = {
  wte: number[][];
  mlp_fc1: number[][];
  mlp_fc2: number[][];
};

// Initialize a vocabSize x vocabSize state dictionary with empty counts
export function initStateDict(vocabSize: number): StateDict {
  return {
    wte: gaussianMatrix(vocabSize, N_EMBD),
    mlp_fc1: gaussianMatrix(4 * N_EMBD, N_EMBD),
    mlp_fc2: gaussianMatrix(vocabSize, 4 * N_EMBD),
  };
}

// Linear transformation: w * x
function linear(x: number[], w: number[][]): number[] {
  return w.map((wo) => sum(wo.map((wi, i) => wi * x[i])));
}

// Softmax function: exp(x) / sum(exp(x))
// Subtract the maximum value to avoid overflow
function softmax(logits: number[]): number[] {
  const maxVal = Math.max(...logits);
  const exps = logits.map((v) => Math.exp(v - maxVal));
  const total = sum(exps);
  return exps.map((e) => e / total);
}

const relu = (x: number[]): number[] => x.map((xi) => Math.max(0, xi));

// MLP model: token_id -> logits
function mlp(stateDict: StateDict, tokenId: number): number[] {
  let x = stateDict.wte[tokenId]; // embedding lookup
  x = linear(x, stateDict.mlp_fc1);
  x = relu(x);
  const logits = linear(x, stateDict.mlp_fc2);
  return logits;
}

// Forward pass: run the model on a token sequence, return the average loss
export function forward(stateDict: StateDict, tokens: number[]): number {
  const losses = tokens.slice(0, -1).map((tokenId, posId) => {
    const targetId = tokens[posId + 1];
    const logits = mlp(stateDict, tokenId);
    const probs = softmax(logits);
    return -Math.log(probs[targetId]);
  });
  return mean(losses);
}

// Numerical gradient: perturb each parameter by eps (in place), measure change in loss
// Simple but computationally inefficient
export function numericalGradient(
  stateDict: StateDict,
  tokens: number[],
): { loss: number; grad: number[] } {
  const loss = forward(stateDict, tokens);
  const grad: number[] = [];
  for (const mat of Object.values(stateDict)) {
    for (const row of mat) {
      for (let j = 0; j < row.length; j++) {
        const old = row[j];
        row[j] = old + EPS;
        const lossPlus = forward(stateDict, tokens);
        row[j] = old;
        grad.push((lossPlus - loss) / EPS);
      }
    }
  }
  return { loss, grad };
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
      // Apply temperature scaling to the logits
      const probs = softmax(logits.map((l) => l / TEMPERATURE));
      tokenId = sample(probs);
      if (tokenId === BOS) break;
      tokens.push(tokenId);
    }
    console.log(`sample ${String(i + 1).padStart(2)}: ${decode(tokens)}`);
  }
}
