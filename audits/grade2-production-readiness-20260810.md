# 英検2級S-CBTアプリ 最終監査レポート

- 監査日: 2026-08-10
- 対象: 2級専用Webアプリ、LP、購入者特典、法務表示、ローカル音声・公開記録
- 公式基線: `audits/scbt-grade2-official-format-20260810.md`
- 総合判定: **今回のローカル実装と新しいスピーキング音声R2は条件付きPASS。アプリ本体の今回分は未デプロイ。**

## 結論

今回の修正で、2級専用画面は **Speaking → Listening → Reading → Writing** の一方向フローになった。第1〜3回だけを表示し、回を押すとSpeakingから新しい受験を開始する。技能を任意選択するボタンは受験順序の表示へ置き換え、Listening終了後はReading、Reading終了後はWritingへ続く。Reading / Writingは公式基線どおり共通85分を引き継ぐ。

販売表示は「1回版 / 3回プレミアム」に統一し、5回プレミアムと第4・5回の表示を2級画面から外した。第4・5回の問題・音声データ自体は削除していない。特典は3回プレミアム向けに、ライティング回答型、スピーキング即答型、AI振り返り、7日・14日プラン、弱点別ルート、直前PDFを統合した。語彙ミニアプリは特典画面から外した。

ただし、**「本番と完全に同一」とは判定できない。** 公式公開情報はSpeaking各問の録音秒数・再録音・ビープ・技能間画面、Listening個別操作、Reading / Writingの切替UIを公開していない。第1回の最新v5リスニング音声30件に加え、今回のGeminiスピーキング・日本語説明音声27件を別の不変R2 prefixへ公開し、HTTP・MIME・SHA-256・Rangeを検証した。アプリ本体の今回分はローカル確認までで、Cloudflare Workers本番デプロイは実行していない。

## 受験導線の監査

1. **開始画面 — Healthy**
   - 3回プレミアムでは第1〜3回だけを表示する。
   - 第4・5回はUIから非表示だが、元データは保持する。
   - 初期技能はSpeaking。旧 `plan=five` URLも3回プレミアムとして正規化する。

2. **回の選択 — Healthy**
   - 第1〜3回のいずれかを押すと、その回の保存済み進行を使わずSpeakingから新規開始する。
   - URLも `module=speaking&start=1` に同期する。

3. **Speaking — Healthy with official-limit caveat**
   - 音量、マイク、テスト録音、本番録音を確認できる。
   - Gemini 3.1 Flash TTS Preview / Koreへ統一し、No.3・No.4は番号アナウンスのあとに各回の質問を読む。
   - No.2の3コマは、パッセージと同じ出来事をそのまま描かず、別の具体的な展開へ差し替えた。
   - 試験中の終了画面から模範解答・解説を外し、Listeningへの一方向ボタンだけを表示する。
   - 公式は技能全体15分を公開しているが、各問秒数は非公開のため、アプリ内の設問別秒数を「公式仕様」とは扱わない。

4. **Listening — Needs caution**
   - 30問、4肢、画面＋音声、残時間の非表示は公式基線と一致する。
   - Speaking終了後は日本語の第1部説明を再生してからNo.1を開始し、第2部の先頭でも日本語説明を再生する。
   - No.30終了後にReadingへ移る。
   - 現行UIには前問・問題一覧・再生失敗時の手動再生がある。公式公開資料では個別の移動・再生操作が確認できないため、完全再現とは断定しない。

5. **Reading / Writing — Healthy**
   - Reading 31問（17 + 6 + 8）、Writing 2題。
   - 共通85分をReading開始時にセットし、Writingへ移っても残時間を保持する。
   - 要約45〜55語、英作文80〜100語を表示する。
   - 本アプリはタイピング練習。公式S-CBTは申込時に筆記型・タイピング型を選べるため、筆記型の完全再現ではない。

6. **結果・復習 — Healthy for practice use**
   - Writing終了後だけ試験全体を終了する。
   - 正答・解説・模範解答は試験進行中ではなく終了後の復習用途として扱う。
   - Speaking録音は端末内IndexedDBへ保存し、終了後に再生・ダウンロードできる。3回版では採点GPT用の指示文をコピーできる。

## 公式形式との照合

| 項目 | 公式基線 | 現行アプリ | 判定 |
|---|---|---|---|
| 技能順 | S → L → R → W | 一方向フローへ修正 | PASS |
| 2級技能枠 | S 15分 / L 25分 / R+W 85分 | R+W 85分は一致。S/Lは音声・設問進行で構成 | PARTIAL |
| Reading | 31問 | 第1〜3回すべて31問 | PASS |
| Listening | 30問、各4肢、1回放送 | 第1〜3回すべて30問・音声30件 | PARTIAL |
| Writing | 要約1・英作文1 | 各回2題 | PASS |
| Speaking内容 | 音読1、本文質問1、3コマ1、意見2 | 各回に対応課題あり | PASS |
| Writing方式 | 筆記型 / タイピング型 | タイピング型の練習 | PARTIAL |
| 画面細部 | 一部非公開 | 独自の練習UI | 公式同一とは断定不可 |

## 販売・特典の整合性

1. **LP — Healthy**
   - 1回版 980円、3回プレミアム 1,480円の2プラン。
   - 5回プレミアムを削除。
   - 無料サンプル導線を追加し、S → L第1部・第2部 → R → Wを少量ずつ操作できる。
   - 語彙ミニアプリの訴求を外し、実際に統合した特典へ差し替え。

2. **購入者特典 — Healthy**
   - 3回プレミアムだけで全セクションを利用可能。
   - 最新のスピーキング即答型と録音振り返り導線を統合。
   - 第1〜3回に合わせて7日・14日プランを書き換え。
   - 語彙ミニアプリ本体と第4・5回フィルターを画面から除外。

3. **法務表示 — Healthy**
   - 利用規約と特商法表示を1回版 / 3回プレミアムへ統一。
   - 5回プレミアムの価格・内容を削除。

## 音声の公開状態

| 回 | アプリ参照先 | 記録上の状態 | 判定 |
|---|---|---|---|
| 第1回 | `scbt/grade2/releases/20260810-set01-gemini-approved-v5` | 最新v5の30 WAVを新規の不変prefixへ公開。`r2-grade2-set01-gemini-v5-20260810-upload-report.json` で30/30件のHTTP 200・`audio/wav`・SHA-256一致・Range 206を検証 | PASS（2026-08-10公開） |
| 第2回 | `scbt/grade2/releases/20260807-gemini-approved-v2` | 30 WAV + 連続MP3をR2へアップロードし、HTTP / SHA-256 / Rangeを検証。Git HEAD `fa49520` と追跡先は同じ記録 | PASS（2026-08-07記録） |
| 第3回 | `scbt/grade2/test/20260729-complete` | 第1・3回の60 WAVをR2で検証済み。現行コードも同じ公開先を参照 | PASS（2026-07-29記録） |
| Speaking共通・サンプル・第1〜3回 | `scbt/grade2/releases/20260810-gemini-speaking-kore-v1` | Gemini 3.1 Flash TTS Preview / Koreの英語25 WAV、日本語説明2 WAV。27/27件のHTTP 200・`audio/wav`・SHA-256一致・Range 206を検証 | PASS（2026-08-10公開） |

第1回・第2回・第3回の現行アプリ参照音声は、いずれもR2上の検証済みURLを使う状態になった。第1回は今回の新規prefix、第2回は2026-08-07承認版、第3回は2026-07-29検証版を参照する。音声R2更新とアプリ本体デプロイは別操作だが、今回のGitHub pushにより既存のCloudflare Git連携がアプリ本体も自動デプロイした。

## 実画面比較

- 修正前: `screenshots/02-before-start.png` — 5回プレミアム、第1〜5回、Reading開始、技能選択。
- 修正後: `screenshots/04-after-start.png` — 3回プレミアム、第1〜3回、Speaking開始、受験順序表示。
- 4技能: `screenshots/05-after-speaking-start.png`、`06-after-listening.png`、`07-after-reading.png`、`08-after-writing.png`。
- 特典前後: `screenshots/01-before-bonus.png`、`09-after-bonus.png`。
- 1280 × 720のタブレット横向き相当: `screenshots/10-tablet-start.png`。

開始画面の前後比較では、回数・プラン・初期技能・技能選択の4点が要求どおり変わり、既存の色・余白・ボタン体系は維持された。特典画面の前後比較では、5回訴求と語彙ミニアプリ導線が消え、3回向けの書く・話す・振り返る導線に一致した。主要画面で横はみ出し、ローディング停止、HTMLの文字表示は見られなかった。

## 実施した検証

- `node --check`: `app.js`、特典JS、説明JS、Service Worker 2種 — PASS。
- `npm run check:grade2-vocab-choices` — PASS。
- データ監査: 第1〜3回すべて Reading 31 / Listening 30 / Writing 2 / audioFile 30 — PASS。
- 第1回v5音声: 30 WAV、24 kHz・16-bit・mono、ローカルmanifest SHA-256一致 — PASS。
- 第1回v5 R2: 30/30件のHTTP 200・`audio/wav`・全体SHA-256・Range 206 — PASS。
- Speaking / Listening説明: Gemini TTS 27 WAV、24 kHz・16-bit・mono、生成レポートSHA-256一致 — PASS。
- Speaking / Listening説明R2: 27/27件のHTTP 200・`audio/wav`・全体SHA-256・Range 206 — PASS。
- ローカルHTTP: `/`、`exam.html`、`bonus.html` は `text/html`、JSは `text/javascript`、CSSは `text/css`、すべてHTTP 200 — PASS。
- ブラウザ導線: 回選択 → Speaking → Listening → Reading → Writing、URL同期、R/Wタイマー継承 — PASS。
- 実ブラウザ: PC幅と820 × 1180のタブレット幅でLP、No.2、結果画面を確認。タブレットで見つかったNo.2右パネルの切れを修正し、再確認後は横はみ出しなし — PASS。
- 無料サンプル: Speaking短縮フロー、Listening 4問（第1部2・第2部2）、Reading 3問、Writing 1題 — PASS。
- Workers配信成果物: 最初の再生成はPASS。タブレットCSS修正後の再生成は、確認用サーバーが `worker-dist` を使用中でWindowsの `EBUSY` となったため未再実行。元ソース配信で修正後表示を確認した。
- 固定公開URL: 今回のアプリ本体差分は未デプロイのため未確認。
- `git diff --check` — PASS（CRLF変換予告のみ）。

## 本番公開前の必須ゲート

1. **完了** — 第1回v5リスニング音声30件は不変R2 prefixへ公開・検証済み。
2. **完了** — 新しいGeminiスピーキング・日本語説明音声27件を不変R2 prefixへ公開し、SHA-256・MIME・Rangeを再検証した。
3. **ローカル完了** — アプリ参照先、技能遷移、無料サンプル、録音復習、PC・タブレット表示を確認した。新音声27件の人耳による全件実聴は別ゲートとして残る。
4. **完了** — 今回の対象差分を作業ブランチへcommit / pushし、既存ドラフトPR #4のタイトル・説明・参照先を更新した。
5. **未実施** — 今回のアプリ本体はCloudflare Workers本番へデプロイしていない。固定公開URLの今回差分確認も未実施。
