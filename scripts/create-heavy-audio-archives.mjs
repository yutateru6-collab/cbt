import { createHash } from "node:crypto";
import { spawn } from "node:child_process";
import { createReadStream } from "node:fs";
import {
  mkdir,
  readdir,
  stat,
  writeFile,
} from "node:fs/promises";
import path from "node:path";

const projectRoot = process.cwd();
const outputArgumentIndex = process.argv.indexOf("--output");
if (outputArgumentIndex === -1 || !process.argv[outputArgumentIndex + 1]) {
  throw new Error("Usage: node scripts/create-heavy-audio-archives.mjs --output <directory>");
}

const outputDirectory = path.resolve(process.argv[outputArgumentIndex + 1]);
const manifestPath = path.join(
  projectRoot,
  "audio-generation",
  "cloudflare-r2-heavy-audio-archive-manifest.json",
);
const bucket = "cbt-project-archive";
const objectPrefix = "snapshots/20260724/scbt-heavy-audio";
const maximumSourceBytesPerPart = 240 * 1024 * 1024;
const maximumWranglerObjectBytes = 315 * 1024 * 1024;

async function collectFiles(directory, allowedExtensions = null) {
  const absoluteDirectory = path.join(projectRoot, directory);
  const entries = await readdir(absoluteDirectory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const relativePath = path.posix.join(directory.replaceAll("\\", "/"), entry.name);
    if (entry.isDirectory()) {
      files.push(...(await collectFiles(relativePath, allowedExtensions)));
      continue;
    }
    if (!entry.isFile()) continue;

    const extension = path.extname(entry.name).toLowerCase();
    if (allowedExtensions && !allowedExtensions.has(extension)) continue;
    if (relativePath.includes("\n") || relativePath.includes("\r")) {
      throw new Error(`Archive list cannot represent this path: ${relativePath}`);
    }

    const fileStat = await stat(path.join(projectRoot, relativePath));
    files.push({ path: relativePath, bytes: fileStat.size });
  }

  return files;
}

function createChunks(files) {
  const chunks = [];
  let current = [];
  let currentBytes = 0;

  for (const file of files) {
    if (current.length && currentBytes + file.bytes > maximumSourceBytesPerPart) {
      chunks.push({ files: current, sourceBytes: currentBytes });
      current = [];
      currentBytes = 0;
    }
    current.push(file);
    currentBytes += file.bytes;
  }

  if (current.length) {
    chunks.push({ files: current, sourceBytes: currentBytes });
  }
  return chunks;
}

function run(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: projectRoot,
      stdio: "inherit",
      windowsHide: true,
    });
    child.on("error", reject);
    child.on("exit", (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`${command} exited with code ${code}`));
      }
    });
  });
}

function sha256File(filePath) {
  return new Promise((resolve, reject) => {
    const hash = createHash("sha256");
    const stream = createReadStream(filePath);
    stream.on("error", reject);
    stream.on("data", (chunk) => hash.update(chunk));
    stream.on("end", () => resolve(hash.digest("hex")));
  });
}

const files = [
  ...(await collectFiles("assets/audio")),
  ...(await collectFiles("audio-generation", new Set([".wav", ".mp3"]))),
].sort((left, right) => left.path.localeCompare(right.path, "en"));
const chunks = createChunks(files);
const totalSourceBytes = files.reduce((total, file) => total + file.bytes, 0);

await mkdir(outputDirectory, { recursive: true });
const parts = [];

for (const [index, chunk] of chunks.entries()) {
  const partNumber = String(index + 1).padStart(2, "0");
  const fileName = `scbt-heavy-audio-20260724-part-${partNumber}-of-${String(chunks.length).padStart(2, "0")}.tar.gz`;
  const archivePath = path.join(outputDirectory, fileName);
  const listPath = path.join(outputDirectory, `${fileName}.files.txt`);

  await writeFile(listPath, `${chunk.files.map((file) => file.path).join("\n")}\n`, "utf8");
  console.log(`Creating ${fileName}: ${chunk.files.length} files`);
  await run("tar.exe", ["-czf", archivePath, "-T", listPath]);

  const archiveStat = await stat(archivePath);
  if (archiveStat.size > maximumWranglerObjectBytes) {
    throw new Error(`${fileName} exceeds the Wrangler upload limit: ${archiveStat.size} bytes`);
  }

  parts.push({
    fileName,
    bucket,
    key: `${objectPrefix}/${fileName}`,
    bytes: archiveStat.size,
    sha256: await sha256File(archivePath),
    sourceBytes: chunk.sourceBytes,
    fileCount: chunk.files.length,
    files: chunk.files,
  });
}

const manifest = {
  generatedAt: new Date().toISOString(),
  snapshot: "20260724",
  bucket,
  objectPrefix,
  archiveFormat: "tar.gz",
  sourceFileCount: files.length,
  totalSourceBytes,
  maximumSourceBytesPerPart,
  partCount: parts.length,
  totalArchiveBytes: parts.reduce((total, part) => total + part.bytes, 0),
  parts,
};

await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
console.log(`Wrote ${parts.length} archives and manifest for ${files.length} source files.`);
