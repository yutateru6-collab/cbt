const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('@playwright/test');

const outputRoot = path.resolve(process.cwd(), 'qa-normal-output');
const screenshotRoot = path.join(outputRoot, 'screenshots');
const contactRoot = path.join(outputRoot, 'contact-sheets');

const states = [
  ['set-01', 'start', '第1回 開始'],
  ['set-01', 'speaking-preflight', 'Speaking開始前'],
  ['set-01', 'speaking-microphone-check', 'マイク確認'],
  ['set-01', 'speaking-read-aloud', 'Read Aloud'],
  ['set-01', 'speaking-no-2', 'Speaking No.2'],
  ['set-01', 'speaking-no-4', 'Speaking No.4'],
  ['set-01', 'speaking-complete', 'Speaking完了'],
  ['set-01', 'listening-no-1', 'Listening No.1'],
  ['set-01', 'listening-no-16', 'Listening Part 2'],
  ['set-01', 'listening-no-30', 'Listening No.30'],
  ['set-01', 'reading-first', 'Reading開始'],
  ['set-01', 'reading-email', 'Readingメール'],
  ['set-01', 'reading-long-3b', 'Reading長文'],
  ['set-01', 'writing-1-filled', 'Writing要約'],
  ['set-01', 'writing-2-filled', 'Writing英作文'],
  ['set-01', 'result', '第1回 結果'],
  ['set-02', 'result', '第2回 結果'],
  ['set-03', 'result', '第3回 結果'],
];

const devices = [
  { key: 'desktop-1440x900', label: 'PC 1440×900 / Chromium', cardWidth: 240, bridgeWidth: 110, columns: 3 },
  { key: 'iphone-16-393x852', label: 'iPhone 16相当 393×852 @3x / WebKit', cardWidth: 180, bridgeWidth: 90, columns: 3 },
];

function imageDataUrl(filePath) {
  return `data:image/jpeg;base64,${fs.readFileSync(filePath).toString('base64')}`;
}

function escapeHtml(value) {
  return String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
}

function makeHtml(device, cards, options) {
  return `<!doctype html><html lang="ja"><head><meta charset="utf-8"><style>
    *{box-sizing:border-box}html,body{margin:0;background:#f4f5f7;color:#1f2933;font-family:Arial,sans-serif}
    body{padding:${options.padding}px;width:max-content}h1{margin:0 0 ${options.gap}px;font-size:${options.titleFont}px}
    .grid{display:grid;grid-template-columns:repeat(${device.columns},${options.cardWidth}px);gap:${options.gap}px;align-items:start}
    .card{background:#fff;border:1px solid #d9dee5;border-radius:5px;overflow:hidden}.label{padding:3px 4px;font-size:${options.labelFont}px;font-weight:700;border-bottom:1px solid #e5e7eb}
    img{display:block;width:${options.cardWidth}px;height:auto}
  </style></head><body>${options.showTitle ? `<h1>${escapeHtml(device.label)}</h1>` : ''}<div class="grid">${cards.map((card) => `<div class="card"><div class="label">${escapeHtml(card.label)}</div><img src="${card.src}" alt="${escapeHtml(card.label)}"></div>`).join('')}</div></body></html>`;
}

async function renderSheet(browser, device, cards, options) {
  const page = await browser.newPage({ viewport: { width: 1200, height: 1400 } });
  try {
    await page.setContent(makeHtml(device, cards, options), { waitUntil: 'load' });
    await page.locator('img').last().waitFor({ state: 'visible' });
    const bodyBox = await page.locator('body').boundingBox();
    if (!bodyBox) throw new Error(`Unable to measure ${device.key}`);
    await page.screenshot({
      path: path.join(contactRoot, `${device.key}-${options.suffix}.jpg`),
      type: 'jpeg',
      quality: options.quality,
      clip: { x: Math.max(0, bodyBox.x), y: Math.max(0, bodyBox.y), width: Math.ceil(bodyBox.width), height: Math.ceil(bodyBox.height) },
      scale: 'css',
      animations: 'disabled',
    });
  } finally {
    await page.close();
  }
}

(async () => {
  fs.mkdirSync(contactRoot, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  try {
    for (const device of devices) {
      const cards = [];
      for (const [setKey, state, label] of states) {
        const fileName = `${device.key}-${setKey}-${state}-ai-preview.jpg`;
        const filePath = path.join(screenshotRoot, fileName);
        if (!fs.existsSync(filePath)) continue;
        cards.push({ label, src: imageDataUrl(filePath) });
      }
      if (!cards.length) continue;
      await renderSheet(browser, device, cards, { suffix: 'contact-sheet', cardWidth: device.cardWidth, gap: 12, padding: 16, labelFont: 11, titleFont: 18, showTitle: true, quality: 40 });
      await renderSheet(browser, device, cards, { suffix: 'vision-bridge', cardWidth: device.bridgeWidth, gap: 3, padding: 3, labelFont: 6, titleFont: 0, showTitle: false, quality: 20 });
    }
  } finally {
    await browser.close();
  }
})();
