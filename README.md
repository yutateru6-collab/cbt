# SCBT

英検® S-CBTの受験前に、本番形式の流れを確認するための非公式リハーサルLPと体験アプリです。

- `/` : ランディングページ
- `/exam.html` : 2級専用の体験アプリ
- `/exam-dev.html` : 準2級・2級・準1級を切り替えるローカル開発用画面（公開成果物には含めない）

公開用の2級版は、級選択・外部問題取込を表示せず、保存領域とPWAキャッシュも2級専用に分離しています。

このアプリは日本英語検定協会の公式・承認サービスではありません。英検®は、公益財団法人 日本英語検定協会の登録商標です。

## Audio storage

Production listening and speaking audio is stored in the Cloudflare R2 bucket
`mimilisten-audio`. The application uses the immutable release prefix
`scbt/grade2/releases/20260724-simba32`.

The local audio files are intentionally excluded from Git. Their R2 keys,
public URLs, sizes, and hashes are recorded in
`audio-generation/cloudflare-r2-production-audio-manifest.json`. Regenerate
that manifest after replacing production audio with:

```powershell
node scripts/generate-r2-audio-manifest.mjs
```
