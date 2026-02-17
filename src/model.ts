// Bigram language model: state_dict[i][j] = how many times token j follows token i
import type { Tokenizer } from './data';
import { sample, sum } from './utils';

const MAX_OUTPUT_LENGTH = 16;
export type StateDict = number[][];

// Initialize a vocabSize x vocabSize state dictionary with empty counts
export function initStateDict(vocabSize: number): StateDict {
  return Array.from({ length: vocabSize }, () => new Array(vocabSize).fill(0));
}

// Given a token_id, return the probability distribution over the next token
// Uses add-one (Laplace) smoothing
export function bigram(stateDict: StateDict, tokenId: number): number[] {
  const row = stateDict[tokenId];
  // Add-one smoothing: add 1 to each count and divide by total + vocabSize
  const total = sum(row) + row.length;
  return row.map((c) => (c + 1) / total);
}

// Generate new samples by sampling from the model
export function inference(stateDict: StateDict, tokenizer: Tokenizer, nSamples: number) {
  console.log("\n--- inference (new, hallucinated names) ---");
  const { BOS, decode } = tokenizer;
  for (let i = 0; i < nSamples; i++) {
    let tokenId = BOS;
    const tokens: number[] = [];
    for (let j = 0; j < MAX_OUTPUT_LENGTH; j++) {
      tokenId = sample(bigram(stateDict, tokenId));
      if (tokenId === BOS) break;
      tokens.push(tokenId);
    }
    console.log(`sample ${String(i + 1).padStart(2)}: ${decode(tokens)}`);
  }
}
