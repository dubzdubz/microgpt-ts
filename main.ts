import { buildTokenizer, loadDocuments } from "./src/data";
import { getParams, inference, initStateDict } from "./src/model";
import { initAdamState, train } from "./src/train";

const NUM_SAMPLES = 20;
const TRAIN_STEPS = 1000;

// Adam optimizer config
const ADAM_CONFIG = {
  learningRate: 0.01,
  beta1: 0.85,
  beta2: 0.99,
  eps: 1e-8,
};

const docs = await loadDocuments();
const tokenizer = buildTokenizer(docs);

console.log(`vocab size: ${tokenizer.vocabSize}`);
console.log(`chars: ${tokenizer.chars.join("")}`);

const stateDict = initStateDict(tokenizer.vocabSize);
const params = getParams(stateDict);
const adamState = initAdamState(params.length);
console.log(`num params: ${params.length}`);

train(stateDict, adamState, docs, tokenizer, TRAIN_STEPS, ADAM_CONFIG);
inference(stateDict, tokenizer, NUM_SAMPLES);
