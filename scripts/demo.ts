import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import {
  buildTokenizer,
  DEFAULT_CONFIG,
  getParams,
  inference,
  initStateDict,
} from "../microgpt/model";
import { initAdamState, train } from "../microgpt/train";
import { parseDocs } from "../microgpt/utils";

const DATASET_URL =
  "https://raw.githubusercontent.com/karpathy/makemore/refs/heads/master/names.txt";
const INPUT_PATH = "./tmp/input.txt";
const NUM_SAMPLES = 20;
const TRAIN_STEPS = 1000;

// Adam optimizer config
const ADAM_CONFIG = {
  learningRate: 0.01,
  beta1: 0.85,
  beta2: 0.99,
  eps: 1e-8,
};

async function loadDocuments(): Promise<string[]> {
  if (!existsSync(INPUT_PATH)) {
    const response = await fetch(DATASET_URL);
    const text = await response.text();
    mkdirSync(dirname(INPUT_PATH), { recursive: true });
    writeFileSync(INPUT_PATH, text);
  }
  const text = readFileSync(INPUT_PATH, "utf-8");
  const docs = parseDocs(text);
  console.log(`num docs: ${docs.length}`);
  return docs;
}

const docs = await loadDocuments();
const tokenizer = buildTokenizer(docs);

console.log(`vocab size: ${tokenizer.vocabSize}`);
console.log(`chars: ${tokenizer.chars.join("")}`);

const stateDict = initStateDict(tokenizer.vocabSize);
const params = getParams(stateDict);
const adamState = initAdamState(params.length);
console.log(`num params: ${params.length}`);

const startTime = Date.now();
train(
  stateDict,
  adamState,
  docs,
  tokenizer,
  TRAIN_STEPS,
  ADAM_CONFIG,
  DEFAULT_CONFIG,
  (info) => {
    if (info.step < 5 || info.step % 200 === 0) {
      console.log(
        `step ${String(info.step + 1).padStart(4)} / ${String(info.numSteps).padStart(4)} | loss ${info.smoothLoss.toFixed(4)}`,
      );
    }
  },
);
console.log(`training time: ${((Date.now() - startTime) / 1000).toFixed(2)}s`);

console.log("\n--- inference (new, hallucinated names) ---");
for (let i = 0; i < NUM_SAMPLES; i++) {
  console.log(
    `sample ${String(i + 1).padStart(2)}: ${inference(stateDict, tokenizer)}`,
  );
}
