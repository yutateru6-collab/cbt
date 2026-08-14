import { createRequire } from "node:module";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const require = createRequire(import.meta.url);
const { chromium } = require("playwright");
const base = process.argv[2] || "http://127.0.0.1:8765/exam.html";
const output = path.resolve("work/ui-verification");
await mkdir(output, { recursive: true });

function silentWav() {
  const rate = 24000;
  const frames = 2400;
  const buffer = Buffer.alloc(44 + frames * 2);
  buffer.write("RIFF", 0);
  buffer.writeUInt32LE(buffer.length - 8, 4);
  buffer.write("WAVEfmt ", 8);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(1, 22);
  buffer.writeUInt32LE(rate, 24);
  buffer.writeUInt32LE(rate * 2, 28);
  buffer.writeUInt16LE(2, 32);
  buffer.writeUInt16LE(16, 34);
  buffer.write("data", 36);
  buffer.writeUInt32LE(frames * 2, 40);
  return buffer;
}

const browser = await chromium.launch({ headless: true });
const results = [];
const errors = [];
try {
  for (const viewport of [
    { width: 1280, height: 720 },
    { width: 922, height: 698 },
    { width: 622, height: 554 },
  ]) {
    const context = await browser.newContext({ viewport, acceptDownloads: true });
    await context.grantPermissions(["clipboard-read", "clipboard-write"], { origin: new URL(base).origin });
    await context.route(/\.wav(?:\?|$)/, (route) => route.fulfill({ status: 200, contentType: "audio/wav", body: silentWav() }));
    const page = await context.newPage();
    page.on("pageerror", (error) => errors.push(`${viewport.width}x${viewport.height}: ${error.message}`));
    page.on("console", (message) => {
      if (message.type() === "error") errors.push(`${viewport.width}x${viewport.height}: ${message.text()}`);
    });

    for (const target of [
      { name: "warmup", step: 8, expected: "Warm-up 1" },
      { name: "no2", step: 15, expected: "Let's fill this large bottle with shampoo." },
      { name: "review", step: 20, expected: "採点用5音声をまとめてダウンロード" },
    ]) {
      await page.goto(`${base}?dev=1&module=speaking&start=1&set=set-01&speakingStep=${target.step}`, { waitUntil: "networkidle" });
      await page.getByText(target.expected, { exact: false }).filter({ visible: true }).first().waitFor({ state: "visible" });
      if (target.name === "no2") {
        const image = page.locator(".grade2-picture-story-image img");
        const loaded = await image.evaluate((node) => node.complete && node.naturalWidth > 0);
        if (!loaded) throw new Error(`No.2 image failed at ${viewport.width}x${viewport.height}`);
      }
      const scroll = await page.evaluate(() => {
        window.scrollTo(0, document.documentElement.scrollHeight);
        return {
          top: window.scrollY,
          height: document.documentElement.scrollHeight,
          viewport: window.innerHeight,
          reachedBottom: window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 2,
        };
      });
      if (!scroll.reachedBottom) throw new Error(`${target.name} cannot reach bottom at ${viewport.width}x${viewport.height}`);
      await page.screenshot({ path: path.join(output, `${target.name}-${viewport.width}x${viewport.height}.png`), fullPage: true });
      results.push({ viewport, target: target.name, scroll });
    }

    await page.evaluate(() => {
      localStorage.setItem("cbt-grade2-set-01-state", JSON.stringify({ module: "listening", started: true, listeningIndex: 0 }));
    });
    await page.goto(`${base}?module=listening&start=1&set=set-01`, { waitUntil: "networkidle" });
    const staticRows = await page.locator(".listen-jump-static").count();
    const jumpButtons = await page.locator('[data-action="listen-goto"]').count();
    if (staticRows !== 30 || jumpButtons !== 0) {
      const bodyText = (await page.locator("body").innerText()).slice(0, 300).replace(/\s+/g, " ");
      throw new Error(`Exam listening list mismatch at ${viewport.width}x${viewport.height}: static=${staticRows}, buttons=${jumpButtons}, url=${page.url()}, body=${bodyText}`);
    }
    await page.screenshot({ path: path.join(output, `listening-${viewport.width}x${viewport.height}.png`), fullPage: true });
    results.push({ viewport, target: "listening", staticRows, jumpButtons });

    if (viewport.width === 1280) {
      await page.evaluate(() => {
        const stateKey = "cbt-grade2-set-01-state";
        const state = JSON.parse(localStorage.getItem(stateKey) || "{}");
        const stepIndexes = [12, 13, 15, 17, 18];
        state.module = "speaking";
        state.started = true;
        state.speakingStep = 20;
        state.speakingRecordings = Object.fromEntries(stepIndexes.map((index) => [index, { type: "audio/webm", size: 4 }]));
        localStorage.setItem(stateKey, JSON.stringify(state));
        return new Promise((resolve, reject) => {
          const request = indexedDB.open("scbt-speaking-recordings", 1);
          request.onupgradeneeded = () => request.result.createObjectStore("recordings", { keyPath: "key" });
          request.onerror = () => reject(request.error);
          request.onsuccess = () => {
            const db = request.result;
            const transaction = db.transaction("recordings", "readwrite");
            const store = transaction.objectStore("recordings");
            for (const index of stepIndexes) {
              store.put({ key: `grade2:set-01:${index}`, grade: "grade2", setKey: "set-01", stepIndex: index, type: "audio/webm", size: 4, blob: new Blob(["test"], { type: "audio/webm" }) });
            }
            transaction.oncomplete = () => { db.close(); resolve(); };
            transaction.onerror = () => reject(transaction.error);
          };
        });
      });
      await page.goto(`${base}?dev=1&module=speaking&start=1&set=set-01&speakingStep=20`, { waitUntil: "networkidle" });
      const downloads = [];
      page.on("download", (download) => downloads.push(download.suggestedFilename()));
      await page.getByRole("button", { name: "採点用5音声をまとめてダウンロード" }).click();
      await page.waitForTimeout(1400);
      const expectedFiles = ["read-aloud", "no-1", "no-2", "no-3", "no-4"].map((id) => `grade2-set-01-speaking-${id}.webm`);
      if (JSON.stringify(downloads.sort()) !== JSON.stringify(expectedFiles.sort())) {
        throw new Error(`Batch download mismatch: ${JSON.stringify(downloads)}`);
      }
      await page.getByRole("button", { name: "ChatGPT採点用プロンプトをコピー" }).click();
      const copied = await page.evaluate(() => navigator.clipboard.readText());
      if (!copied.includes("各0〜5点、合計20点") || !copied.includes("聞き取れない箇所を推測して補わない")) {
        throw new Error("Speaking grading prompt copy is incomplete");
      }
      results.push({ viewport, target: "speaking-downloads", files: downloads, promptCopied: true });
    }
    await context.close();
  }
  if (errors.length) throw new Error(`Browser errors:\n${errors.join("\n")}`);
  await writeFile(path.join(output, "report.json"), `${JSON.stringify({ ok: true, results }, null, 2)}\n`);
  console.log(`Verified ${results.length} responsive states. Report: ${path.join(output, "report.json")}`);
} finally {
  await browser.close();
}
