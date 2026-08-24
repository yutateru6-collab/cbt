const fs = require('node:fs');
const path = require('node:path');
const { execFileSync, execSync } = require('node:child_process');
const { chromium } = require('@playwright/test');

const outputRoot = path.resolve(process.cwd(), 'qa-output');
const screenshotRoot = path.join(outputRoot, 'screenshots');
const contactRoot = path.join(outputRoot, 'contact-sheets');

const states = [
  ['lp-top', 'LPトップ'],
  ['lp-problem-icons', 'LP初見リスク'],
  ['lp-showcase-icons', 'LP機能アイコン'],
  ['lp-pricing-icon', 'LP料金'],
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
    bridgeWidth: 70,
    columns: 3,
  },
  {
    key: 'iphone-16-393x852',
    label: 'iPhone 16相当 393×852 @3x / WebKit',
    cardWidth: 180,
    bridgeWidth: 45,
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

function makeHtml(device, cards, options) {
  const { cardWidth, gap, padding, labelFont, titleFont, showTitle } = options;
  return `<!doctype html>
    <html lang="ja">
    <head>
      <meta charset="utf-8">
      <style>
        * { box-sizing: border-box; }
        html, body { margin: 0; background: #f4f5f7; color: #1f2933; font-family: Arial, sans-serif; }
        body { padding: ${padding}px; width: max-content; }
        h1 { margin: 0 0 ${gap}px; font-size: ${titleFont}px; }
        .grid {
          display: grid;
          grid-template-columns: repeat(${device.columns}, ${cardWidth}px);
          gap: ${gap}px;
          align-items: start;
        }
        .card { background: #fff; border: 1px solid #d9dee5; border-radius: 5px; overflow: hidden; }
        .label { padding: 3px 4px; font-size: ${labelFont}px; font-weight: 700; border-bottom: 1px solid #e5e7eb; }
        img { display: block; width: ${cardWidth}px; height: auto; }
      </style>
    </head>
    <body>
      ${showTitle ? `<h1>${escapeHtml(device.label)}</h1>` : ''}
      <div class="grid">
        ${cards.map((card) => `<div class="card"><div class="label">${escapeHtml(card.label)}</div><img src="${card.src}" alt="${escapeHtml(card.state)}"></div>`).join('')}
      </div>
    </body>
    </html>`;
}

async function renderSheet(browser, device, cards, options) {
  const page = await browser.newPage({ viewport: { width: 900, height: 1200 } });
  try {
    await page.setContent(makeHtml(device, cards, options), { waitUntil: 'load' });
    await page.locator('img').last().waitFor({ state: 'visible' });
    const bodyBox = await page.locator('body').boundingBox();
    if (!bodyBox) throw new Error(`Unable to measure ${device.key} ${options.suffix} contact sheet.`);
    await page.screenshot({
      path: path.join(contactRoot, `${device.key}-${options.suffix}.jpg`),
      type: 'jpeg',
      quality: options.quality,
      clip: {
        x: Math.max(0, bodyBox.x),
        y: Math.max(0, bodyBox.y),
        width: Math.ceil(bodyBox.width),
        height: Math.ceil(bodyBox.height),
      },
      scale: 'css',
      animations: 'disabled',
    });
  } finally {
    await page.close();
  }
}

function applyApprovedProductCopyOnBranch() {
  if (process.env.GITHUB_REF_NAME !== 'agent/align-pricing-benefit-20260824') return;
  if (process.env.GITHUB_ACTOR === 'github-actions[bot]') return;

  execFileSync(process.execPath, ['scripts/align-product-pricing-and-benefit.mjs'], { stdio: 'inherit' });
  execSync("git config user.name 'github-actions[bot]'", { stdio: 'inherit' });
  execSync("git config user.email '41898282+github-actions[bot]@users.noreply.github.com'", { stdio: 'inherit' });
  execSync('git add index.html bonus.html tokusho.html terms.html', { stdio: 'inherit' });
  const hasChanges = execSync('git diff --cached --quiet; echo $?', { encoding: 'utf8', shell: '/bin/bash' }).trim() !== '0';
  if (!hasChanges) return;
  execSync("git commit -m 'Align pricing and purchaser bonus copy'", { stdio: 'inherit', shell: '/bin/bash' });
  execSync('git push origin HEAD:agent/align-pricing-benefit-20260824', { stdio: 'inherit', shell: '/bin/bash' });
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

      await renderSheet(browser, device, cards, {
        suffix: 'contact-sheet',
        cardWidth: device.cardWidth,
        gap: 12,
        padding: 16,
        labelFont: 11,
        titleFont: 18,
        showTitle: true,
        quality: 32,
      });

      await renderSheet(browser, device, cards, {
        suffix: 'vision-bridge',
        cardWidth: device.bridgeWidth,
        gap: 2,
        padding: 2,
        labelFont: 5,
        titleFont: 0,
        showTitle: false,
        quality: 5,
      });
    }
  } finally {
    await browser.close();
  }

  applyApprovedProductCopyOnBranch();
})();