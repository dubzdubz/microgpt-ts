import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import {
  buildTokenizer,
  getParams,
  inference,
  initStateDict,
} from "../microgpt/model";
import { DEFAULT_ADAM_CONFIG, emaSmooth, initAdamState, trainStep } from "../microgpt/train";
import { parseDocs } from "../microgpt/utils";

const DATASET_URL =
  "https://raw.githubusercontent.com/karpathy/makemore/refs/heads/master/names.txt";
const INPUT_PATH = "./tmp/input.txt";
const NUM_SAMPLES = 20;
const TRAIN_STEPS = 1000;

const adamConfig = DEFAULT_ADAM_CONFIG;

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
let smoothLoss: number | undefined;
for (let step = 0; step < TRAIN_STEPS; step++) {
  const tokens = tokenizer.encode(docs[step % docs.length]);
  const info = trainStep(stateDict, adamState, tokens, step, TRAIN_STEPS, adamConfig);
  smoothLoss = emaSmooth(smoothLoss, info.loss);
  if (step < 5 || step % 200 === 0) {
    console.log(
      `step ${String(step + 1).padStart(4)} / ${String(TRAIN_STEPS).padStart(4)} | loss ${smoothLoss.toFixed(4)}`,
    );
  }
}
console.log(`training time: ${((Date.now() - startTime) / 1000).toFixed(2)}s`);

console.log("\n--- inference (new, hallucinated names) ---");
for (let i = 0; i < NUM_SAMPLES; i++) {
  console.log(
    `sample ${String(i + 1).padStart(2)}: ${inference(stateDict, tokenizer)}`,
  );
}
