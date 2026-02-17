import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import shuffle from 'lodash/shuffle';

const DATASET_URL = 'https://raw.githubusercontent.com/karpathy/makemore/refs/heads/master/names.txt';
const INPUT_PATH = './tmp/input.txt';

export type Tokenizer = {
  vocabSize: number;
  BOS: number;
  encode: (doc: string) => number[];
  decode: (tokens: number[]) => string;
  chars: string[];
}

export function buildTokenizer(docs: string[]): Tokenizer {
  const chars = [...new Set(docs.join(''))].sort();
  const BOS = chars.length;
  const vocabSize = chars.length + 1;

  const encode = (doc: string): number[] => {
    return [BOS, ...[...doc].map((ch) => chars.indexOf(ch)), BOS];
  };

  const decode = (tokens: number[]): string => {
    return tokens
      .map((t) => t !== BOS ? chars[t] : '' )
      .join('');
  };

  return { vocabSize, BOS, encode, decode, chars };
}

export async function loadDocuments(): Promise<string[]> {
  if (!existsSync(INPUT_PATH)) {
    const response = await fetch(DATASET_URL);
    const text = await response.text();
    mkdirSync(dirname(INPUT_PATH), { recursive: true });
    writeFileSync(INPUT_PATH, text);
  }

  const text = readFileSync(INPUT_PATH, 'utf-8');
  const docs = text
    .trim()
    .split('\n')
    .map((l: string) => l.trim())
    .filter((l: string) => l.length > 0);

  const shuffled = shuffle(docs);

  console.log(`num docs: ${shuffled.length}`);
  return shuffled;
}
