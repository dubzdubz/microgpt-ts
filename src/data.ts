import { shuffle } from "./utils";

export const DATASET_URL =
  "https://raw.githubusercontent.com/karpathy/makemore/refs/heads/master/names.txt";

export type Tokenizer = {
  vocabSize: number;
  BOS: number;
  encode: (doc: string) => number[];
  decode: (tokens: number[]) => string;
  chars: string[];
};

export function buildTokenizer(docs: string[]): Tokenizer {
  const chars = [...new Set(docs.join(""))].sort();
  const BOS = chars.length;
  const vocabSize = chars.length + 1;

  const encode = (doc: string): number[] => {
    return [BOS, ...[...doc].map((ch) => chars.indexOf(ch)), BOS];
  };

  const decode = (tokens: number[]): string => {
    return tokens.map((t) => (t !== BOS ? chars[t] : "")).join("");
  };

  return { vocabSize, BOS, encode, decode, chars };
}

export function parseDocs(text: string): string[] {
  const docs = text
    .trim()
    .split("\n")
    .map((line: string) => line.trim())
    .filter((line: string) => line.length > 0);
  return shuffle(docs);
}
