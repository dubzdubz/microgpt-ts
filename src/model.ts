// Bigram language model: state_dict[i][j] = how many times token j follows token i
import type { Tokenizer } from "./data";
import { gaussianMatrix, mean, sample, sum } from "./utils";

const MAX_OUTPUT_LENGTH = 16;
const N_EMBD = 16;
const TEMPERATURE = 0.5;
const EPS = 1e-5;
const MATRICES = ["wte", "mlp_fc1", "mlp_fc2"];

export type StateDict = {
  wte: number[][];
  mlp_fc1: number[][];
  mlp_fc2: number[][];
};

type ParamRef = [number[], number]; // [row_ref, col_index]

// Initialize a vocabSize x vocabSize state dictionary with empty counts
export function initStateDict(vocabSize: number): StateDict {
  return {
    wte: gaussianMatrix(vocabSize, N_EMBD),
    mlp_fc1: gaussianMatrix(4 * N_EMBD, N_EMBD),
    mlp_fc2: gaussianMatrix(vocabSize, 4 * N_EMBD),
  };
}

// Flatten the state dictionary into a list of parameter references
export function getParamRefs(stateDict: StateDict): ParamRef[] {
  return (MATRICES as (keyof StateDict)[]).flatMap((mat) =>
    stateDict[mat].flatMap((row) => row.map((_, j) => [row, j] as ParamRef)),
  );
}

// Flatten the state dictionary into a list of parameter values
function getParamValues(stateDict: StateDict): number[] {
  return (MATRICES as (keyof StateDict)[]).flatMap((mat) =>
    stateDict[mat].flatMap((row) => row.map((val) => val)),
  );
}

// Linear transformation: w * x
function linear(x: number[], w: number[][]): number[] {
  return w.map((wo) => sum(wo.map((wi, i) => wi * x[i])));
}

// Transpose a matrix
function transpose(m: number[][]): number[][] {
  return m[0].map((_, j) => m.map((row) => row[j]));
}

function crossProduct(a: number[], b: number[]): number[][] {
  return a.map((ai) => b.map((bi) => ai * bi));
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
  paramRefs: ParamRef[],
  tokens: number[],
): { loss: number; grad: number[] } {
  const loss = forward(stateDict, tokens);
  const grad: number[] = paramRefs.map(([row, j]) => {
    const old = row[j];
    row[j] = old + EPS;
    const lossPlus = forward(stateDict, tokens);
    row[j] = old;
    return (lossPlus - loss) / EPS;
  });
  return { loss, grad };
}

// Analytic gradient: derive the gradient analytically using the chain rule
export function analyticGradient(
  stateDict: StateDict,
  tokens: number[],
): { loss: number; grad: number[] } {
  const data = tokens.slice(0, -1).map((tokenId, posId) => {
    const targetId = tokens[posId + 1];

    // forward pass
    const x = stateDict.wte[tokenId];
    const hPre = linear(x, stateDict.mlp_fc1);
    const h = relu(hPre);
    const logits = linear(h, stateDict.mlp_fc2);
    const probs = softmax(logits);
    const loss = -Math.log(probs[targetId]);

    // backward pass: chain rule, layer by layer
    // 1: d(loss)/d(logits) = probs - one_hot(target)
    const dLogits = probs.map((p, i) => p - (i === targetId ? 1 : 0));
    // 2: d(loss)/d(mlp_fc2) = dLogits @ h.T
    const gradMlpFc2 = crossProduct(dLogits, h);
    // 3: d(loss)/d(h) = mlp_fc2.T @ dLogits
    const dh = linear(dLogits, transpose(stateDict.mlp_fc2));
    // 4: d(loss)/d(h_pre) = dh * drelu(h_pre)
    const dhPre = dh.map((dhj, j) => dhj * (hPre[j] > 0 ? 1 : 0));
    // 5: d(loss)/d(mlp_fc1) = dhPre @ x.T
    const gradMlpFc1 = crossProduct(dhPre, x);
    // 6: d(loss)/d(x)
    const dx = linear(dhPre, transpose(stateDict.mlp_fc1));
    // 7: d(loss)/d(wte[token_id]) = dx
    const gradWte = stateDict.wte.map((row, i) =>
      row.map((_, j) => (i === tokenId ? dx[j] : 0)),
    );

    const grad = getParamValues({
      wte: gradWte,
      mlp_fc1: gradMlpFc1,
      mlp_fc2: gradMlpFc2,
    });
    return { loss, grad };
  });

  // Compute the average loss and gradient
  const nParams = data[0].grad.length;
  const grad = Array.from({ length: nParams }, (_, i) =>
    mean(data.map((d) => d.grad[i])),
  );
  const loss = mean(data.map((d) => d.loss));

  return { loss, grad };
}

export function gradientCheck(
  stateDict: StateDict,
  paramRefs: ParamRef[],
  tokens: number[],
): { loss: number; grad: number[] } {
  const { loss: lossA, grad: gradA } = analyticGradient(stateDict, tokens);
  const { loss: lossNum, grad: gradNum } = numericalGradient(
    stateDict,
    paramRefs,
    tokens,
  );
  const gradDiff = Math.max(...gradA.map((g, i) => Math.abs(g - gradNum[i])));
  console.log(
    `gradient check | loss_a ${lossA.toFixed(6)} | loss_num ${lossNum.toFixed(6)} | grad_diff ${gradDiff.toFixed(8)}`,
  );
  return { loss: lossA, grad: gradA };
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
