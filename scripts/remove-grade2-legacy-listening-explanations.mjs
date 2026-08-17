import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const target = resolve(process.cwd(), "grade2-listening-part2-sets.js");
const checkOnly = process.argv.includes("--check");
const source = await readFile(target, "utf8");
const explanationLine = /^\s*"explanation":\s*"(?:\\[\s\S]|[^"\\])*"\s*,?\s*\r?\n/gm;
const matches = source.match(explanationLine) || [];

if (![0, 180].includes(matches.length)) {
  throw new Error(
    `Refusing to modify grade2-listening-part2-sets.js: expected 180 legacy explanation fields or an already-clean file, found ${matches.length}.`,
  );
}

if (matches.length === 0) {
  console.log("Legacy Grade 2 Listening explanations are already absent from the raw source.");
  process.exit(0);
}

if (checkOnly) {
  throw new Error(`Found ${matches.length} legacy Grade 2 Listening explanation fields in raw source.`);
}

const cleaned = source.replace(explanationLine, "");
const remaining = cleaned.match(explanationLine) || [];
if (remaining.length !== 0) {
  throw new Error(`Legacy explanation removal was incomplete: ${remaining.length} fields remain.`);
}

await writeFile(target, cleaned, "utf8");
console.log(`Removed ${matches.length} legacy Grade 2 Listening explanation fields from raw source.`);
