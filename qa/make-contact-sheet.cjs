const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('@playwright/test');

const outputRoot = path.resolve(process.cwd(), 'qa-output');
const screenshotRoot = path.join(outputRoot, 'screenshots');
const contactRoot = path.join(outputRoot, 'contact-sheets');

const states = [
  ['normal-start', '通常開始'],
  ['normal-speaking-preflight', 'Speaking確認'],
  ['dev-reading-first', 'Reading'],
  ['dev-writing-typed', 'Writing入力'],
  ['dev-listening-first', 'Listening'],
  ['dev-result', '結果'],
];

const devices = [
  {
    key: 'desktop-1440x900',
    label: 'PC 1440×900 / Chromium',
    cardWidth: 250,
    columns: 3,
  },
  {
    key: 'iphone-16-393x852',
    label: 'iPhone 16相当 393×852 @3x / WebKit',
    cardWidth: 180,
    columns: 3,
  },
];

function imageDataUrl(filePath) {
  const data = fs.readFileSync(filePath).toString('base64');
  return `data:image/jpeg;base64,${data}`;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

(async () => {
  fs.mkdirSync(contactRoot, { recursive: true });
  const browser = await chromium.launch({ headless: true });

  try {
    for (const device of devices) {
      const cards = [];
      for (const [state, label] of states) {
        const fileName = `${device.key}-${state}-ai-preview.jpg`;
        const filePath = path.join(screenshotRoot, fileName);
        if (!fs.existsSync(filePath)) continue;
        cards.push({
          state,
          label,
          src: imageDataUrl(filePath),
        });
      }

      if (cards.length === 0) continue;

      const page = await browser.newPage({ viewport: { width: 900, height: 1200 } });
      const html = `<!doctype html>
        <html lang="ja">
        <head>
          <meta charset="utf-8">
          <style>
            * { box-sizing: border-box; }
            html, body { margin: 0; background: #f4f5f7; color: #1f2933; font-family: Arial, sans-serif; }
            body { padding: 16px; width: max-content; }
            h1 { margin: 0 0 12px; font-size: 18px; }
            .grid {
              display: grid;
              grid-template-columns: repeat(${device.columns}, ${device.cardWidth}px);
              gap: 12px;
              align-items: start;
            }
            .card { background: #fff; border: 1px solid #d9dee5; border-radius: 8px; overflow: hidden; }
            .label { padding: 6px 8px; font-size: 11px; font-weight: 700; border-bottom: 1px solid #e5e7eb; }
            img { display: block; width: ${device.cardWidth}px; height: auto; }
          </style>
        </head>
        <body>
          <h1>${escapeHtml(device.label)}</h1>
          <div class="grid">
            ${cards.map((card) => `<div class="card"><div class="label">${escapeHtml(card.label)}</div><img src="${card.src}" alt="${escapeHtml(card.state)}"></div>`).join('')}
          </div>
        </body>
        </html>`;

      await page.setContent(html, { waitUntil: 'load' });
      await page.locator('img').last().waitFor({ state: 'visible' });
      await page.screenshot({
        path: path.join(contactRoot, `${device.key}-contact-sheet.jpg`),
        type: 'jpeg',
        quality: 32,
        fullPage: true,
        scale: 'css',
        animations: 'disabled',
      });
      await page.close();
    }
  } finally {
    await browser.close();
  }
})();
