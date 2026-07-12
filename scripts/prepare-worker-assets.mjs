import { cp, mkdir, rm } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const outDir = join(root, "worker-dist");

const rootFiles = [
  "index.html",
  "exam.html",
  "styles.css",
  "lp.css",
  "app.js",
  "exam-data.js",
  "grade2-set-01.js",
  "grade2-vocab-sets.js",
  "grade2-listening-part2-sets.js",
  "pre1-listening-sets.js",
  "manifest.webmanifest",
  "sw.js",
  "README.md"
];

const assetFiles = [
  "app-icon.svg",
  "lp-exam-room.png",
  "lp-home-practice.png",
  "lp-juku-classroom.png",
  "lp-listening.png",
  "lp-reading.png",
  "lp-result.png",
  "lp-speaking.png",
  "lp-teacher-check.png",
  "yuta-profile.png"
];

await rm(outDir, { recursive: true, force: true });
await mkdir(join(outDir, "assets"), { recursive: true });

for (const file of rootFiles) {
  await cp(join(root, file), join(outDir, file));
}

for (const file of assetFiles) {
  await cp(join(root, "assets", file), join(outDir, "assets", file));
}
