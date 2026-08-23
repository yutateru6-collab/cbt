# CBT GitHub Actions Browser QA

この文書は `YutaTeru/cbt` の自動ブラウザQA方式を定義します。

## 目的

GitHubへ変更をpushしたあと、GitHub Actions内でそのcommitから `worker-dist` を生成し、ローカルHTTPサーバーで実際のCBT画面を起動します。その画面をPlaywrightで操作し、PC・iPhone 16相当のスクリーンショットと機械検査結果を保存します。

これにより、Cloudflare stagingの重いR2音声アップロードを待たなくても「pushしたそのcommit」の画面を直接確認できます。Cloudflare本番・stagingへ正しいcommitが反映されたかどうかは、既存の `cbt-production.yml` / `cbt-staging.yml` が別途検証します。

コードを読めたこと、Actionsが成功したこと、画像ファイルが存在することだけを「UI確認済み」とは扱いません。スクリーンショットのUI評価は、画像を実際にAIまたは人が開いて目視した後に行います。

## 自動実行

`.github/workflows/cbt-qa.yml` は次で起動します。

- `main` へのpush
- `agent/**` へのpush
- GitHub Actionsからの手動実行

QA開始時にcommitへ `cbt-browser-qa` のpending statusを付け、Actions run URLを記録します。終了時にsuccess / failureへ更新します。これにより、AI側からcommit → QA run → Job / Step → `qa-latest` へ追跡できます。

## exact commitの起動方法

1. GitHub Actionsが対象commitをcheckout
2. `npm ci`
3. `scripts/prepare-worker-assets.mjs` で `worker-dist` を生成
4. `worker-dist/build-info.json` のcommit SHAを検証
5. `python3 -m http.server` で `127.0.0.1:4173` に起動
6. Playwrightがその画面へアクセス

QA用にアプリ本体の受験ロジックは変更しません。

## Cloudflareとの役割分担

### Browser QA

- 対象: GitHubのexact commit
- 実行場所: GitHub Actions内ローカルHTTPサーバー
- 目的: 実画面操作、レスポンシブ、スクリーンショット、Console/Page Error、横overflow

ローカルHTTPサーバーにはCloudflare Workerの `/audio-r2/*` 経路が存在しません。そのため **`QA_TARGET=github-actions-local` のときだけ** Playwrightが `/audio-r2/*` を3秒の無音WAVで応答します。これはListening画面・再生UI・画面遷移をブラウザQAできるようにするためのテスト専用stubです。本物の音声ファイル内容やR2ルーティングの正常性を証明するものではありません。

### 既存 production / staging Workflow

- 対象: Cloudflare Worker / R2
- 目的: build-infoのcommit一致、配信ファイルSHA一致、Workerデプロイ、R2音声、Cloudflare経路

この2つを分けることで、UI確認のたびにR2音声90本以上のアップロード完了を待つ必要がありません。

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
- request failure（診断情報）
- ローカルQAでstubした `/audio-r2/*` リクエスト
- 実行した操作
- テスト成功 / 失敗

`document.documentElement.scrollWidth > clientWidth + 1` の場合は横overflowとしてQA失敗にします。Console Error / Page Errorも失敗扱いです。

Request failureは記録しますが、Listeningから画面移動した際の意図的な音声キャンセル等があるため、それ単独では合否条件にしません。

## スクリーンショット

各主要状態で原則次を保存します。

1. `*-viewport.png`
   - `scale: device`
   - 細部確認用の高解像度元画像
2. `*-ai-preview.jpg`
   - `scale: css`
   - quality 55
   - AIの個別画面目視用
3. `*-detail-crop.jpg`
   - 必要な主要領域のみ
   - `scale: device`
   - quality 65
4. `*-full.png`
   - start / resultなど必要な状態のみ

さらに `qa/make-contact-sheet.cjs` がPC用・iPhone用それぞれの主要6画面を1枚にまとめた軽量JPEGを生成します。

- `contact-sheets/desktop-1440x900-contact-sheet.jpg`
- `contact-sheets/iphone-16-393x852-contact-sheet.jpg`

AIはまずcontact sheetで6画面をまとめて確認し、問題候補がある画面だけ個別preview → detail crop → 高解像度PNGの順で確認できます。

テスト途中で失敗した場合も `failure-evidence` スクリーンショットの保存を試みます。

## 最新QAの保存

GitHub Actions Artifactは容量上限の影響を受けるため、このリポジトリでは最新QAの一次保存先を **`qa-latest` 専用ブランチ** とします。

WorkflowはQA終了時に orphan commit を作り、次だけを `qa-latest` へforce pushします。

- `README.md`
- `latest.json`
- `report.json`
- `deployment.json`
- `build-info.json`
- `local-server.log`
- `report-parts/*.json`
- `contact-sheets/*.jpg`
- `screenshots/*`

Playwright HTML reportやtraceなど大量の一時ファイルは `qa-latest` へ保存しません。

`qa-latest` は毎回最新結果で置き換えます。**mainや通常の開発ブランチをforce pushすることはありません。**

## AI目視の手順

1. 対象commitの `cbt-browser-qa` statusからActions run IDを取得
2. runのJob / Stepを確認
3. `qa-latest/report.json` を確認
4. `qa-latest/contact-sheets/` のPC/iPhone画像を実画像として開く
5. 問題候補のある状態の `*-ai-preview.jpg` を開く
6. さらに必要なら `*-detail-crop.jpg` を開く
7. 1px級・細かい文字確認が必要な場合だけ高解像度PNGを開く
8. 文字切れ、重なり、見切れ、余白、固定UI被り、レスポンシブ崩れ等を評価

画像のbase64やファイル名だけを取得した状態では「目視済み」と報告しません。

## 現在の制約

- iPhone 16はWebKitエミュレーションであり実機ではありません。
- QAではService Workerをブロックし、古いキャッシュによる不安定化を避けます。デプロイ資産一致は既存deploy Workflow側で別途確認します。
- Speakingは受験前UIまでを確認します。本物のマイク音質はGitHub-hosted runnerでは確認しません。
- Browser QAはCloudflare Workerそのものではなく、同じcommitから生成した `worker-dist` をHTTP配信して確認します。Cloudflare固有の経路は既存deploy Workflowの担当です。
- `/audio-r2/*` の無音stubはローカルBrowser QAだけで使います。本物のListening音源内容・タイミング・R2配信は別検査です。
- スクリーンショットの視覚品質判定は、`qa-latest` の画像をAIまたは人が実画像として開いた後に行います。
