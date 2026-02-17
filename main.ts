import { buildTokenizer, loadDocuments } from './src/data';

console.log("microgpt-ts");

const docs = await loadDocuments();
const tokenizer = buildTokenizer(docs);

console.log(`vocab size: ${tokenizer.vocabSize}`);
console.log(`chars: ${tokenizer.chars.join('')}`);
