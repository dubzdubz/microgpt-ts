import type { Tokenizer } from './data';
import { type StateDict, bigram } from './model';
import { mean } from './utils';

export function train(stateDict: StateDict, docs: string[], tokenizer: Tokenizer, numSteps: number) {
  for (let step = 0; step < numSteps; step++) {
    const doc = docs[step % docs.length];
    const tokens = tokenizer.encode(doc);

    // Compute losses for each token
    const losses = tokens.slice(0, -1).map((tokenId, posId) => {
      const targetId = tokens[posId + 1];
      const probs = bigram(stateDict, tokenId);
      return -Math.log(probs[targetId]);
    });
    const loss = mean(losses);

    // Update stateDict with the bigram counts from this document
    tokens.slice(0, -1).forEach((tokenId, posId) => {
      const targetId = tokens[posId + 1];
      stateDict[tokenId][targetId] += 1;
    });

    console.log(`step ${String(step + 1).padStart(4)} / ${String(numSteps).padStart(4)} | loss ${loss.toFixed(4)}`);
  }
}
