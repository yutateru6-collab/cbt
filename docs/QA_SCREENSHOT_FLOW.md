# CBT GitHub Actions Browser QA

この文書は `yutateru6-collab/cbt` の自動ブラウザQA方式を定義します。

## 目的

GitHubへ変更をpushしたあと、GitHub Actions内で対象commitから `worker-dist` を生成し、実際のCBT画面をPlaywrightで操作します。

通常のQAでは、スクリーンショットを大量保存しません。機械検査と実操作を優先し、**成功時はスクリーンショットを保存せず、失敗時だけPlaywrightの証拠スクリーンショット／traceを残す**方針です。

また、Cloudflare本番デプロイ成功後には、別の軽量production smoke workflowが本番URLを実際に開き、主要画面とListening音源を確認します。

## 自動実行

### `.github/workflows/cbt-qa.yml`

- `main` へのpush
- `agent/**` へのpush
- 手動実行

対象commitをcheckoutし、`worker-dist` をローカルHTTP配信してPlaywright QAを実行します。

### `.github/workflows/cbt-production-smoke.yml`

`Deploy CBT production` が成功したあとだけ実行します。

- 本番 `build-info.json` のcommit一致
- 本番開始画面
- 実際の開始ボタン
- Speaking受験前画面
- Reading画面
- Readingの「ここまで答え合わせ」導線
- Listening画面
- Listeningの「ここまで答え合わせ」導線
- 実R2 Listening音声のHTTP取得
- Console Error / Page Error
- HTTP 4xx / 5xx
- 横overflow

を軽量確認します。

production smokeではスクリーンショットを保存しません。

## 通常Browser QAの端末

`qa/device-matrix.cjs` で次を確認します。

- Desktop Chromium 1440×900
- Laptop Chromium 1366×768
- iPad WebKit 820×1180
- iPad landscape WebKit 1180×820
- iPad境界 WebKit 768×1024
- Android tablet Chromium 800×1280
- iPhone 16相当 WebKit 393×852 / deviceScaleFactor 3

これらは実機ではなくPlaywrightエミュレーションです。

## 通常QAの主要テスト

`qa/playwright.config.cjs` は次を通常実行します。

- `cbt-light.e2e.spec.cjs`
- `lp-light.e2e.spec.cjs`
- `review-retry.e2e.spec.cjs`
- `progress-review.e2e.spec.cjs`

旧 `cbt.e2e.spec.cjs` / `lp.e2e.spec.cjs` はフル画像確認用の参考実装として残していますが、通常の自動QAでは実行しません。

### CBT lightweight flow

1. 通常の有料CBT開始画面を開く
2. 実際の「開始」を押す
3. Speaking受験前画面を確認
4. 開発者ナビゲーションで深い画面へ移動
5. Readingを確認
6. Writingへ実際に英文を入力
7. Listeningを確認
8. 結果画面を確認

深い画面へ素早く到達する部分だけ既存developer toolbarを使います。Readingのページ送りや途中答え合わせは別テストで実ユーザー操作を確認します。

### Progress review flow

`qa/progress-review.e2e.spec.cjs` は以下を確認します。

- Reading中に「ここまで答え合わせ」が表示される
- 回答済み／通過済み範囲だけ表示される
- 未来の問題を表示しない
- 答え合わせを開閉しても `appState.answers` を変更しない
- 閉じた後に同じ受験位置へ戻る
- Readingを実際の「次の問題へ」で最後まで進める
- Reading終了休憩で「この技能を答え合わせ」が表示される
- 技能確認後も休憩画面へ戻る
- その後Writingへ正常に進める

## HTTPエラー

通常QAはConsole Error / Page Errorだけでなく、`page.on('response')` でHTTPレスポンスも監視します。

`status >= 400` のレスポンスが出た場合はQA失敗です。

これにより、JavaScript・CSS・画像等が404/500でもブラウザ自体は開いてしまうケースを検出します。

Listening画面遷移時の意図的なrequest cancellation等は `requestfailed` として診断記録しますが、それだけでは失敗扱いにしません。

## スクリーンショット方針

### 通常成功時

スクリーンショットを保存しません。

これにより、

- GitHub容量
- qa-latest容量
- 画像生成時間
- AIが毎回大量画像を確認する負荷

を抑えます。

### 失敗時

Playwright設定は `screenshot: only-on-failure` / `trace: retain-on-failure` です。

失敗時のみ `qa-output/screenshots/` に証拠を残します。CBT lightweight flowでは追加で `*-failure-evidence.jpg` の保存も試みます。

### UIを大きく変更した場合

旧フルスクリーンショットQAを手動で対象指定して利用できます。通常pushでは回しません。

「Actionsが成功した」ことと「人間またはAIが見た目を目視確認した」ことは別扱いです。視覚レビューが必要な変更では、必要な画面だけ個別に撮影・確認します。

## 機械検査

主要状態で次をreportへ保存します。

- current URL
- page title
- viewport width / height
- deviceScaleFactor
- document scrollWidth / scrollHeight
- document clientWidth / clientHeight
- horizontalOverflow
- 画面外にはみ出す可視要素候補
- console error
- page error
- HTTP 4xx / 5xx
- request failure（診断）
- 実行した操作
- test passed / failed

`document.documentElement.scrollWidth > clientWidth + 1` は横overflowとして失敗扱いです。

## qa-latest

通常QA終了時に、最新結果だけ `qa-latest` ブランチへ保存します。

主な内容：

- `README.md`
- `latest.json`
- `report.json`
- `deployment.json`
- `build-info.json`
- `local-server.log`
- `report-parts/*.json`
- `screenshots/`（失敗時だけ実質的に生成）

`qa-latest` はorphan commit + force pushで置き換えます。mainにはforce pushしません。

## Service Worker

通常のローカルBrowser QAでは `serviceWorkers: block` とし、古いキャッシュによるテスト不安定化を避けます。

一方、production smokeでは `serviceWorkers: allow` とし、本番で配信されたService Workerを含む経路を確認します。

## Listening

通常のローカルQAでは `/audio-r2/*` を3秒の無音WAVでstubし、画面遷移・UI・エラー検査を高速化します。

本物のListening音源はproduction smokeで実R2 URLをHTTP取得し、

- 200または206
- Content-Typeがaudio/*
- WAVヘッダーより十分大きい実データ

を確認します。

音声内容そのもの、音量の聴感、実機スピーカー品質は自動QAでは保証しません。

## 現在の制約

- iPhone / iPadは実機ではありません。
- production smokeのモバイル側は軽量化のためChromium 393×852エミュレーションです。Safari固有差分は通常QAのWebKit側で確認します。
- Speakingの本物のマイク音質はGitHub-hosted runnerでは確認しません。
- Writing / Speakingの外部AI採点品質そのものはブラウザQAの対象外です。
- 視覚品質はスクリーンショットを実際に開いた場合だけ「目視確認済み」と扱います。
