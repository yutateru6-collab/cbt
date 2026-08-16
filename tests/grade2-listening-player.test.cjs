const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const html = fs.readFileSync(path.join(root, "tools", "listening-player", "index.html"), "utf8");
const player = fs.readFileSync(path.join(root, "tools", "listening-player", "player.js"), "utf8");
const worker = fs.readFileSync(path.join(root, "scripts", "prepare-worker-assets.mjs"), "utf8");

test("Listening Player stays isolated from the CBT runtime", () => {
  assert.match(html, /\.\.\/\.\.\/grade2-vocab-sets\.js/);
  assert.match(html, /\.\.\/\.\.\/grade2-listening-part2-sets\.js/);
  assert.doesNotMatch(html, /(?:^|["'])\.\.\/\.\.\/app\.js/);
  assert.ok(
    html.indexOf("../../grade2-vocab-sets.js") < html.indexOf("../../grade2-listening-part2-sets.js"),
    "vocab sets must load before listening sets",
  );
  assert.equal((html.match(/<audio\b/g) || []).length, 1, "the page must contain exactly one persistent audio element");
  assert.doesNotMatch(player, /new\s+Audio\s*\(/, "the player must reuse the single HTML audio element on iPhone");
});

test("Listening Player consumes the shared production question data instead of copying audio URLs", () => {
  assert.match(player, /window\.scbtGrade2VocabSets/);
  assert.match(player, /"set-01"/);
  assert.match(player, /"set-02"/);
  assert.match(player, /"set-03"/);
  assert.match(player, /question\.audioFile/);
  assert.doesNotMatch(player, /20260724-simba32/);
  assert.doesNotMatch(player, /assets\/audio\/grade2\/set-01\/listening/);
  assert.doesNotMatch(player, /pub-6e10f4d8b90b42c79b09bec4ee876a01\.r2\.dev/);
});

test("Worker build publishes the isolated Listening Player files", () => {
  assert.match(worker, /tools\/listening-player\/index\.html/);
  assert.match(worker, /tools\/listening-player\/player\.css/);
  assert.match(worker, /tools\/listening-player\/player\.js/);
  assert.doesNotMatch(worker, /assets\/audio\/grade2\/set-01\/listening\/part1\/No05\.wav/);
});
