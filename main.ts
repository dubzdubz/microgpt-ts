import { buildTokenizer, loadDocuments } from "./src/data";
import { getParams, inference, initStateDict } from "./src/model";
import { train } from "./src/train";

console.log("microgpt-ts");

const TRAIN_STEPS = 1000;
const NUM_SAMPLES = 20;
const LEARNING_RATE = 0.1;

const docs = await loadDocuments();
const tokenizer = buildTokenizer(docs);

console.log(`vocab size: ${tokenizer.vocabSize}`);
console.log(`chars: ${tokenizer.chars.join("")}`);

const stateDict = initStateDict(tokenizer.vocabSize);
const params = getParams(stateDict);
console.log(`num params: ${params.length}`);

train(stateDict, docs, tokenizer, TRAIN_STEPS, LEARNING_RATE);
inference(stateDict, tokenizer, NUM_SAMPLES);
