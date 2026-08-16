import { cp, mkdir, rm } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const outDir = join(root, "worker-dist");

const rootFiles = [
  "index.html",
  "exam.html",
  "bonus.html",
  "styles.css",
  "lp.css",
  "bonus.css",
  "legal.css",
  "app-config-grade2.js",
  "grade2-scoring.js",
  "app.js",
  "grade2-listening-persistent-audio.js",
  "exam-data.js",
  "grade2-set-01.js",
  "grade2-set-01-explanations.js",
  "grade2-skill-explanations.js",
  "grade2-vocab-sets.js",
  "grade2-speaking-sets.js",
  "grade2-listening-part2-sets.js",
  "grade2-listening-set01-audio-fixes.js",
  "grade2-premium-bonus.js",
  "privacy.html",
  "support.html",
  "terms.html",
  "tokusho.html",
  "manifest.webmanifest",
  "sw.js",
  "sw-set02-v2.js",
  "README.md"
];

const assetFiles = [
  "app-icon.svg",
  "grade2-speaking-examiner-photo.png",
  "grade2-speaking-picture-story-02-anime.png",
  "grade2-speaking-picture-story-02.png",
  "grade2-speaking-picture-story-sample-anime.png",
  "grade2-speaking-picture-story-set-02-anime.png",
  "grade2-speaking-picture-story-set-03-anime.png",
  "grade2-speaking-picture-story-set-04-anime.png",
  "grade2-speaking-picture-story-set-05-anime.png",
  "grade2-speaking-picture-story-sample-v2.png",
  "grade2-speaking-picture-story-set-01-v2.png",
  "grade2-speaking-picture-story-set-02-v2.png",
  "grade2-speaking-picture-story-set-03-v2.png",
  "grade2-speaking-picture-story-sample-v3.png",
  "grade2-speaking-picture-story-set-01-v3.png",
  "grade2-speaking-picture-story-set-02-v3.png",
  "grade2-speaking-picture-story-set-03-v3.png",
  "grade2-speaking-picture-story-set-04-v3.png",
  "grade2-speaking-picture-story-set-05-v3.png",
  "lp-exam-room.png",
  "lp-home-practice.png",
  "lp-juku-classroom.png",
  "lp-listening.png",
  "lp-parent-plan.png",
  "lp-product-rehearsal-illustration.png",
  "lp-reading.png",
  "lp-result.png",
  "lp-speaking.png",
  "lp-study-desk-sunlit.png",
  "lp-summer-rehearsal.png",
  "lp-teacher-check.png",
  "lp-voices-student-illustration.png",
  "yuta-profile.png"
];

const nestedFiles = [
  "output/pdf/eiken-grade2-final-check-writing-template.pdf",
  "tools/listening-player/index.html",
  "tools/listening-player/player.css",
  "tools/listening-player/player.js"
];

await rm(outDir, { recursive: true, force: true });
await mkdir(join(outDir, "assets"), { recursive: true });

for (const file of rootFiles) {
  await cp(join(root, file), join(outDir, file));
}

for (const file of assetFiles) {
  await cp(join(root, "assets", file), join(outDir, "assets", file));
}

for (const file of nestedFiles) {
  const destination = join(outDir, file);
  await mkdir(dirname(destination), { recursive: true });
  await cp(join(root, file), destination);
}
