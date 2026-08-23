# CBT GitHub Actions Browser QA

この文書は `YutaTeru/cbt` の自動ブラウザQA方式を定義します。

## 目的

GitHubへ変更をpushしたあと、Cloudflareへ同じcommitがデプロイされたことを確認してから、Playwrightで実際のCBT画面を操作し、PC・iPhone 16相当のスクリーンショットと機械検査結果を保存します。

コードを読めたこと、Actionsが成功したこと、画像ファイルが存在することだけを「UI確認済み」とは扱いません。スクリーンショットのUI評価は、画像を実際にAIまたは人が開いて目視した後に行います。

## 自動実行

`.github/workflows/cbt-qa.yml` は次で起動します。

- `main` へのpush: production (`https://cbt.itisnowornever271.workers.dev`) を確認
- `agent/**` へのpush: staging (`https://cbt-staging.itisnowornever271.workers.dev`) を確認
- GitHub Actionsからの手動実行

QAは `/build-info.json` の `commit` が対象GitHub SHAと一致するまで待機します。このため、デプロイWorkflowとQA Workflowが同時に開始しても、古い画面を誤って検査しない設計です。

## ブラウザと画面サイズ

### PC

- Browser: Chromium
- CSS viewport: 1440 x 900
- deviceScaleFactor: 1

### iPhone 16相当

- Browser: WebKit
- CSS viewport: 393 x 852
- deviceScaleFactor: 3
- isMobile: true
- hasTouch: true
- 高解像度viewport PNG: 1179 x 2556px相当

これは実機ではなくPlaywrightエミュレーションです。

## 現在の操作フロー

1. 通常モードで `exam.html?plan=three` を開く
2. 本物の開始ボタンを押す
3. Speaking受験前チェック画面の表示を確認
4. 既存の `?dev=1` 開発者モードを開く
5. Reading最初の画面へ移動
6. Writingへ移動し、英文をキー入力する
7. Listening最初の画面へ移動
8. 採点・解説画面へ移動

深い画面への移動にはアプリに既に存在する開発者ツールを使用し、QA専用の本体ロジックは追加しません。

## 機械検査

各主要状態で次を保存します。

- current URL
- page title
- viewport width / height
- deviceScaleFactor
- document scrollWidth / scrollHeight
- document clientWidth / clientHeight
- horizontalOverflow
- 画面外にはみ出している可視要素候補
- console error
- page error
- request failure
- 実行した操作
- テスト成功 / 失敗

`document.documentElement.scrollWidth > clientWidth + 1` の場合は横overflowとしてQA失敗にします。

## スクリーンショット

各主要状態で原則次を保存します。

1. `*-viewport.png`
   - `scale: device`
   - 細部確認用の高解像度元画像
2. `*-ai-preview.jpg`
   - `scale: css`
   - quality 55
   - AIの全体目視用
3. `*-detail-crop.jpg`
   - 必要な主要領域のみ
   - `scale: device`
   - quality 65
4. `*-full.png`
   - start / resultなど必要な状態のみ

テスト途中で失敗した場合も `failure-evidence` スクリーンショットの保存を試みます。

## 出力

GitHub Actions Artifact `cbt-browser-qa-<run id>-<attempt>` に `qa-output/` を保存します。

主なファイル:

- `latest.json`
- `report.json`
- `deployment.json`
- `report-parts/*.json`
- `screenshots/*`
- `playwright-report/*`
- `test-results/*`（失敗時traceを含む場合あり）

Artifact保持期間は7日です。まずQA自体の安定性を確認するための方式で、容量を無制限に増やしません。安定運用後に必要なら、信頼済みWorkflowだけが `qa-latest` 専用ブランチを最新結果へ置換する方式へ移行できます。`main` はforce pushしません。

## AI目視の手順

1. 最新Actions runを特定
2. `report.json` を確認
3. まず `*-ai-preview.jpg` を画像として開く
4. 問題候補があれば `*-detail-crop.jpg` を開く
5. 必要な場合だけ高解像度PNGを開く
6. 文字切れ、重なり、見切れ、余白、固定UI被り、レスポンシブ崩れ等を評価

画像のbase64やファイル名だけを取得した状態では「目視済み」と報告しません。

## 現在の制約

- iPhone 16はWebKitエミュレーションであり実機ではありません。
- QAではService Workerをブロックし、古いキャッシュによる不安定化を避けます。デプロイ資産一致は既存deploy Workflow側で別途確認します。
- Speakingは受験前UIまでを確認します。本物のマイク音質はGitHub-hosted runnerでは確認しません。
- スクリーンショットの視覚品質判定は、Artifact生成後にAIまたは人が実画像を開いて行います。
