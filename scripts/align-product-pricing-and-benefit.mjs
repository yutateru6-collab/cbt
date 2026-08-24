import { readFile, writeFile } from 'node:fs/promises';

function replaceExact(source, from, to, label) {
  const count = source.split(from).length - 1;
  if (count !== 1) throw new Error(`${label}: expected exactly 1 match, found ${count}`);
  return source.replace(from, to);
}

function replaceRegex(source, pattern, replacement, label) {
  const matches = source.match(pattern);
  if (!matches) throw new Error(`${label}: pattern not found`);
  return source.replace(pattern, replacement);
}

let index = await readFile('index.html', 'utf8');

index = replaceExact(
  index,
  '<p class="price"><span>980</span>円<small>（税込）</small></p>',
  '<p class="price"><span>480</span>円<small>（税込）</small></p>',
  'single price',
);

index = replaceExact(
  index,
  '<p class="price-anchor">1回版に500円追加で、模試2回分と復習教材まで</p>',
  '<p class="price-anchor">1回版との差額1,000円で、追加2回＋詳しい解説＋AI採点＋直前チェックPDF</p>',
  'premium price anchor',
);

index = replaceExact(
  index,
  `                <li>PC模試 第1〜3回</li>\n                <li>全問の解説・リスニング台本・ライティング模範解答</li>\n                <li>ライティング回答型・スピーキング即答型・AI振り返り</li>\n                <li>録音ダウンロード・採点GPT連携（公開後）</li>\n                <li>7日・14日プラン・弱点別復習ルート・8ページ直前チェックPDF</li>`,
  `                <li>PC模試 第1〜3回</li>\n                <li>Reading・Listening 全問の詳しい解説・Listening台本</li>\n                <li>Writing模範解答</li>\n                <li>Writing・Speaking AI採点（普段使っているAIで採点）</li>\n                <li>購入者限定特典：8ページ直前チェックPDF</li>`,
  'premium feature list',
);

index = replaceExact(
  index,
  '<span><strong>解いた後まで</strong>解説・台本・模範解答</span>',
  '<span><strong>3回版で復習</strong>解説・台本・模範解答</span>',
  'creator proof premium copy',
);

if (index.includes('1回版に500円追加') || index.includes('<span>980</span>円')) {
  throw new Error('index.html still contains legacy pricing copy');
}
if (index.includes('7日・14日プラン・弱点別復習ルート')) {
  throw new Error('index.html still advertises removed bonus items');
}

await writeFile('index.html', index);

let bonus = await readFile('bonus.html', 'utf8');

bonus = replaceExact(
  bonus,
  'content="英検2級 S-CBT直前リハーサル 3回プレミアム購入者向けの直前チェックPDF、7日・14日仕上げプラン、弱点別復習ルートです。"',
  'content="英検2級 S-CBT直前リハーサル 3回プレミアム購入者限定の8ページ直前チェックPDFです。4技能の本番直前ポイントを短時間で確認できます。"',
  'bonus meta description',
);

const bonusHero = `        <section class="bonus-hero" aria-labelledby="bonus-title">\n          <div class="bonus-hero-copy">\n            <span class="eyebrow">英検2級｜3回プレミアム購入者限定</span>\n            <p class="hero-kicker">PURCHASER BONUS</p>\n            <h1 id="bonus-title">本番直前は、<br />この8ページだけ確認。</h1>\n            <p>\n              3回プレミアムの購入者限定特典は、8ページ直前チェックPDFです。\n              Reading・Listening・Writing・Speakingの4技能について、本番前に見直したいポイントを1冊にまとめています。\n            </p>\n            <div class="hero-actions">\n              <a class="bonus-button primary" href="./exam.html?plan=three" data-exam-link>3回プレミアムを始める</a>\n              <a class="bonus-button secondary" href="#pdf">特典PDFを見る</a>\n            </div>\n          </div>\n          <div class="hero-benefit-grid" style="grid-template-columns:minmax(0,1fr)" aria-label="購入者限定特典">\n            <article><span>01</span><strong>8ページ直前チェックPDF</strong><small>4技能の試験前・最終確認</small></article>\n          </div>\n        </section>\n\n        <nav class="bonus-nav" aria-label="購入者特典内の目次">\n          <a href="#pdf">8ページ直前チェックPDF</a>\n        </nav>\n`;

bonus = replaceRegex(
  bonus,
  /        <section class="bonus-hero"[\s\S]*?<\/section>\s*\n\s*<nav class="bonus-nav"[\s\S]*?<\/nav>\s*\n/,
  bonusHero,
  'bonus hero and nav',
);

bonus = replaceRegex(
  bonus,
  /        <section class="benefit-overview"[\s\S]*?<\/section>\s*\n/,
  '',
  'remove benefit overview',
);

bonus = replaceExact(
  bonus,
  '<span>BENEFIT 01</span>',
  '<span>PURCHASER BONUS</span>',
  'pdf section label',
);

bonus = replaceExact(
  bonus,
  '<p>ライティング・スピーキングの型と、4技能で本番直前に確認したい動作を8ページに絞った資料です。前日〜当日の最終確認に使ってください。</p>',
  '<p>Reading・Listening・Writing・Speakingの4技能について、本番直前に確認したいポイントを8ページに絞った資料です。前日〜当日の最終確認に使ってください。</p>',
  'pdf section description',
);

bonus = replaceRegex(
  bonus,
  /        <section class="plan-grid"[\s\S]*?<\/section>\s*\n/,
  '',
  'remove 7 and 14 day plans',
);

bonus = replaceRegex(
  bonus,
  /        <section class="bonus-section route-section"[\s\S]*?<\/section>\s*\n/,
  '',
  'remove weakness route',
);

for (const legacy of ['7日仕上げ', '14日仕上げ', '弱点別復習ルート', 'BENEFIT 02', 'BENEFIT 03', 'BENEFIT 04']) {
  if (bonus.includes(legacy)) throw new Error(`bonus.html still contains removed bonus copy: ${legacy}`);
}
if (!bonus.includes('8ページ直前チェックPDF')) throw new Error('bonus PDF benefit is missing');

await writeFile('bonus.html', bonus);

console.log('Product pricing and purchaser bonus copy aligned successfully.');
