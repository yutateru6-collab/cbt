import { access, cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const outDir = join(root, "worker-dist");

const rootFiles = [
  "index.html",
  "exam.html",
  "bonus.html",
  "styles.css",
  "grade2-normal-user-fixes.css",
  "lp.css",
  "bonus.css",
  "legal.css",
  "app-config-grade2.js",
  "grade2-scoring.js",
  "app.js",
  "grade2-ai-grading-flow.js",
  "grade2-ai-grading-flow.css",
  "grade2-result-tabs.js",
  "grade2-result-tabs.css",
  "grade2-review-retry.js",
  "grade2-review-resume.js",
  "grade2-review-retry.css",
  "grade2-progress-review.js",
  "grade2-progress-review.css",
  "grade2-developer-score-shortcut.js",
  "grade2-developer-score-shortcut.css",
  "grade2-listening-persistent-audio.js",
  "exam-data.js",
  "grade2-set-01.js",
  "grade2-vocab-sets.js",
  "grade2-speaking-sets.js",
  "grade2-listening-part2-sets.js",
  "grade2-listening-set01-audio-fixes.js",
  "grade2-legacy-explanation-cleanup.js",
  "grade2-set-01-explanations.js",
  "grade2-skill-explanations.js",
  "grade2-explanation-sync.js",
  "grade2-canonical-explanations.js",
  "grade2-explanation-provenance-dev.js",
  "grade2-premium-bonus.js",
  "privacy.html",
  "support.html",
  "terms.html",
  "tokusho.html",
  "manifest.webmanifest",
  "sw.js",
  "sw-set02-v2.js"
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
  "lp-skill-icons-sheet.png",
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

const PUBLIC_LP_REPLACEMENTS = Object.freeze([
  Object.freeze({
    from: '<a class="button secondary" href="./exam.html?plan=single">1回版の内容を見る</a>',
    to: '<span class="disabled-button" aria-disabled="true">販売準備中</span>',
    label: "single paid CTA",
  }),
  Object.freeze({
    from: '<a class="button primary" href="./exam.html?plan=three">3回プレミアムの内容を見る</a>',
    to: '<span class="disabled-button" aria-disabled="true">販売準備中</span>',
    label: "three-pack paid CTA",
  }),
  Object.freeze({
    from: '              <a class="developer-entry-link" href="./exam.html?plan=three&set=set-01&dev=1&module=speaking&speakingStep=0&start=1&fresh=1">開発者用確認</a>\n',
    to: "",
    label: "public developer entry",
  }),
]);

async function validateLandingPageAssetContract() {
  const referencedAssets = new Set();
  for (const sourceFile of ["index.html", "lp.css"]) {
    const source = await readFile(join(root, sourceFile), "utf8");
    for (const match of source.matchAll(/\.\/assets\/([^\s\"')?#]+)/g)) {
      referencedAssets.add(match[1]);
    }
  }

  const bundledAssets = new Set(assetFiles);
  const missingFromBundle = [];
  const missingFromSource = [];

  for (const asset of [...referencedAssets].sort()) {
    try {
      await access(join(root, "assets", asset));
    } catch {
      missingFromSource.push(asset);
    }
    if (!bundledAssets.has(asset)) missingFromBundle.push(asset);
  }

  if (missingFromSource.length || missingFromBundle.length) {
    const details = [
      missingFromSource.length ? `missing source assets: ${missingFromSource.join(", ")}` : "",
      missingFromBundle.length ? `not copied to worker-dist: ${missingFromBundle.join(", ")}` : "",
    ].filter(Boolean).join("; ");
    throw new Error(`Landing page asset contract failed: ${details}`);
  }
}

async function preparePublicLandingPage() {
  const landingPath = join(outDir, "index.html");
  let html = await readFile(landingPath, "utf8");

  for (const replacement of PUBLIC_LP_REPLACEMENTS) {
    const occurrences = html.split(replacement.from).length - 1;
    if (occurrences !== 1) {
      throw new Error(`Public landing page transform expected exactly one ${replacement.label}; found ${occurrences}.`);
    }
    html = html.replace(replacement.from, replacement.to);
  }

  if (/exam\.html\?plan=(?:single|three)/.test(html)) {
    throw new Error("Public landing page still exposes a paid exam URL after transformation.");
  }
  if (/developer-entry-link/.test(html)) {
    throw new Error("Public landing page still exposes a developer entry link after transformation.");
  }

  await writeFile(landingPath, html, "utf8");
}

await validateLandingPageAssetContract();
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

await preparePublicLandingPage();

const buildInfo = {
  commit: process.env.CBT_BUILD_SHA || "local",
  ref: process.env.CBT_BUILD_REF || "local",
  environment: process.env.CBT_DEPLOY_ENV || "local",
};
await writeFile(join(outDir, "build-info.json"), `${JSON.stringify(buildInfo, null, 2)}\n`, "utf8");
