import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import vm from "node:vm";

const source = await readFile(new URL("../grade2-listening-part2-sets.js", import.meta.url), "utf8");
const setKeys = ["sample", "set-01", "set-02", "set-03", "set-04", "set-05"];
const window = {
  scbtGrade2VocabSets: setKeys.map((key) => ({ key, availableModules: [] })),
  scbtGrade2Set01: {},
};
vm.runInNewContext(source, { window }, { filename: "grade2-listening-part2-sets.js" });

const sets = [
  { key: "sample", listeningQuestions: window.scbtGrade2Set01.listeningQuestions },
  ...window.scbtGrade2VocabSets.filter((set) => set.key !== "sample"),
];
const items = sets.flatMap((set) =>
  (set.listeningQuestions || []).map((question) => {
    const part = question.part === "Part 1" ? "part1" : "part2";
    const number = String(question.id).padStart(2, "0");
    return {
      id: `${set.key}/${part}/No${number}`,
      setKey: set.key,
      questionId: question.id,
      part,
      sourceUrl: question.sourceAudioFile || question.audioFile,
      targetUrl: question.audioFile,
      outputRelativePath: `${set.key}/listening/${part}/No${number}.wav`,
    };
  }),
);

if (items.length !== 180 || items.some((item) => !item.sourceUrl)) {
  throw new Error(`Expected 180 complete listening sources, got ${items.length}.`);
}
const output = process.argv[2] || "work/grade2-listening-source-manifest.json";
await mkdir(dirname(output), { recursive: true });
await writeFile(output, `${JSON.stringify({ schema: "grade2-listening-source-v1", count: items.length, items }, null, 2)}\n`);
console.log(`Wrote ${items.length} items to ${output}`);
