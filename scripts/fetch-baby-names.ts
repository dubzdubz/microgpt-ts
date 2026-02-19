import { mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { shuffle } from "../microgpt/utils";
import { toTsArrayFile } from "./utils";

const URL =
  "https://raw.githubusercontent.com/karpathy/makemore/988aa59/names.txt";
const OUTPUT_PATH = "./datasets/baby-names.ts";
const SAMPLE_SIZE = 500;

const res = await fetch(URL);
if (!res.ok) {
  throw new Error(`Download failed: ${res.status} ${res.statusText}`);
}

const text = await res.text();
const allNames = text
  .split("\n")
  .map((n) => n.trim().toLowerCase())
  .filter((n) => n.length > 0);

console.log(`Fetched ${allNames.length} names total`);

const sampled = shuffle(allNames.slice())
  .slice(0, SAMPLE_SIZE)
  .sort((a, b) => a.localeCompare(b));

mkdirSync(dirname(OUTPUT_PATH), { recursive: true });
writeFileSync(OUTPUT_PATH, toTsArrayFile("babyNames", sampled), "utf-8");

console.log(`Wrote ${sampled.length} names to ${OUTPUT_PATH}`);
