import type { Tokenizer } from './data';
import { type StateDict, bigram } from './model';

export function train(stateDict: StateDict, docs: string[], tokenizer: Tokenizer, numSteps = 1000) {
  for (let step = 0; step < numSteps; step++) {
    const doc = docs[step % docs.length];
    const tokens = tokenizer.encode(doc);
    
    // Compute losses for each token
    const losses = tokens.slice(0, -1).map((tokenId, posId) => {
      const targetId = tokens[posId + 1];
      const probs = bigram(stateDict, tokenId);
      return -Math.log(probs[targetId]);
    });
    const loss = losses.reduce((a, b) => a + b, 0) / losses.length;

    // Update stateDict with the bigram counts from this document
    tokens.slice(0, -1).forEach((tokenId, posId) => {
      const targetId = tokens[posId + 1];
      stateDict[tokenId][targetId] += 1;
    });

    console.log(`step ${String(step + 1).padStart(4)} / ${String(numSteps).padStart(4)} | loss ${loss.toFixed(4)}`);
  }
}
