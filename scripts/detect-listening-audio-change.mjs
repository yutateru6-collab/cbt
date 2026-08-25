import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const AUDIO_EXTENSIONS = /\.(?:wav|mp3|m4a|aac|ogg|flac)$/i;
const AUDIO_PREFIXES = Object.freeze([
  "audio-generation/",
  "assets/audio/",
  "audio/",
]);
const AUDIO_PIPELINE_FILES = new Set([
  "listening-audio-fix.js",
  "grade2-listening-three-set-audio-fix.js",
  "grade2-listening-set01-duplicate-v2-fix.js",
  "grade2-listening-set01-no05-duplicate-fix.js",
  "grade2-listening-set01-audio-fixes.js",
  "scripts/build-grade2-three-set-corrected-audio.mjs",
  "scripts/build-set01-duplicate-question-v2-audio.mjs",
  "scripts/verify-cloudflare-listening-audio.mjs",
  "scripts/inspect-grade2-three-set-pauses.mjs",
  "scripts/inspect-set01-intro-gaps.mjs",
]);

export function normalizeChangedPath(value) {
  return String(value || "")
    .trim()
    .replaceAll("\\", "/")
    .replace(/^\.\//, "");
}

export function isListeningAudioAffectingPath(value) {
  const file = normalizeChangedPath(value);
  if (!file) return false;
  if (AUDIO_PIPELINE_FILES.has(file)) return true;
  if (AUDIO_PREFIXES.some((prefix) => file.startsWith(prefix))) return true;
  return AUDIO_EXTENSIONS.test(file);
}

export function detectListeningAudioChanges(files, { forceReason = "" } = {}) {
  const normalized = [...new Set((files || []).map(normalizeChangedPath).filter(Boolean))];
  if (forceReason) {
    return { required: true, reason: forceReason, matched: [], files: normalized };
  }
  const matched = normalized.filter(isListeningAudioAffectingPath);
  return {
    required: matched.length > 0,
    reason: matched.length > 0 ? "matched-audio-inputs" : "no-audio-input-changes",
    matched,
    files: normalized,
  };
}

function parseArg(name) {
  const prefix = `--${name}=`;
  const arg = process.argv.find((item) => item.startsWith(prefix));
  return arg ? arg.slice(prefix.length) : "";
}

function writeGithubOutputs(result) {
  if (!process.env.GITHUB_OUTPUT) return;
  fs.appendFileSync(
    process.env.GITHUB_OUTPUT,
    [
      `required=${result.required ? "true" : "false"}`,
      `reason=${result.reason}`,
      `matched_count=${result.matched.length}`,
      "",
    ].join("\n"),
    "utf8",
  );
}

function main() {
  const forceReason = parseArg("force");
  const filesPath = parseArg("files");
  let files = [];
  if (filesPath) {
    files = fs.readFileSync(filesPath, "utf8").split(/\r?\n/);
  } else if (!forceReason) {
    throw new Error(
      "Usage: node scripts/detect-listening-audio-change.mjs --files=<changed-files.txt> | --force=<reason>",
    );
  }

  const result = detectListeningAudioChanges(files, { forceReason });
  console.log(`Listening audio sync required: ${result.required}`);
  console.log(`Reason: ${result.reason}`);
  if (result.matched.length) {
    console.log("Matched audio inputs:");
    for (const file of result.matched) console.log(`- ${file}`);
  } else if (result.files.length) {
    console.log(`Changed files checked: ${result.files.length}`);
  }
  writeGithubOutputs(result);
}

const currentFile = fileURLToPath(import.meta.url);
if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(currentFile)) {
  main();
}
