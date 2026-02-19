import { mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { toTsArrayFile } from "./utils";

type SparqlResponse = {
  results: {
    bindings: Array<{
      title?: { value: string };
    }>;
  };
};

function uniq(arr: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const s of arr) {
    if (seen.has(s)) continue;
    seen.add(s);
    out.push(s);
  }
  return out;
}

const OUTPUT_PATH = "./datasets/movie-titles.ts";
const LIMIT = 2000;
const MAX_LEN = 64;

const query = `
SELECT ?title WHERE {
  ?film wdt:P31 wd:Q11424 .
  ?film rdfs:label ?title .
  FILTER(LANG(?title) = "en")
}
LIMIT ${LIMIT}
`.trim();

const url =
  "https://query.wikidata.org/sparql?format=json&query=" +
  encodeURIComponent(query);

const res = await fetch(url, {
  headers: {
    // Wikidata asks for an identifying User-Agent.
    "User-Agent": "microgpt-ts",
    Accept: "application/sparql-results+json",
  },
});

if (!res.ok) {
  throw new Error(`Wikidata query failed: ${res.status} ${res.statusText}`);
}

const data = (await res.json()) as SparqlResponse;
const raw = data.results.bindings
  .map((b) => b.title?.value)
  .filter((v): v is string => typeof v === "string");

const cleaned = uniq(
  raw
    .map((t) => t.replace(/\s+/g, " ").trim())
    .filter((t) => t.length > 0)
    .filter((t) => !t.includes("\n"))
    .filter((t) => t.length <= MAX_LEN)
    .filter((t) => !t.toLowerCase().startsWith("list of ")),
).sort((a, b) => a.localeCompare(b));

mkdirSync(dirname(OUTPUT_PATH), { recursive: true });
writeFileSync(OUTPUT_PATH, toTsArrayFile("movieTitles", cleaned), "utf-8");

console.log(`Wrote ${cleaned.length} titles to ${OUTPUT_PATH}`);
