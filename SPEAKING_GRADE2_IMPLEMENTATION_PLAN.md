# 英検S-CBT 2級 スピーキング実装計画

最終更新: 2026-07-17

## 1. この文書の位置づけ

- 対象は2級専用版の`exam.html`。
- この文書を基準として、2026-07-17に2級専用版の初期実装を行った。
- 公式に確認できた事項、第三者情報による暫定値、SCBTアプリ独自の練習仕様を混同しない。
- ユーザーが本書の進行案を確認した後、2級専用モードへ最小差分で実装する。

## 2. 参照資料と信頼度

### 公式・現在

- [英検S-CBT 体験版](https://www.eiken.or.jp/s-cbt/demo/)
  - 現在公開されているスピーキング体験版は3級・全6問。
  - 本番に近い画面構成や操作の確認には使えるが、2級の設問数・回答時間の根拠にはしない。
  - 体験版では録音されない。本番と異なる動作があることも公式に明記されている。
- [英検S-CBT 試験内容・方式](https://www.eiken.or.jp/s-cbt/test/)
  - スピーキングはヘッドセットを使う吹込み式で、録音された音声が採点される。
- [英検2級 試験内容](https://www.eiken.or.jp/eiken/exam/grade_2/solutions.html)
  - 約60語のパッセージ音読。
  - No.1はパッセージについての質問。
  - No.2は3コマのイラストについての説明。
  - No.3はカードのトピックに関連した意見。
  - No.4は日常生活・社会性のある一般的な事柄についての意見。
  - 黙読20秒、No.2の考慮時間20秒は公式に確認できる。
  - No.1・No.2ではカードを見られる。No.2終了後にカードを裏返し、No.3・No.4にはカードを使わない。

### 公式・旧資料

- [2019年度版 S-CBTスピーキング操作説明PDF](https://www.eiken.or.jp/s-cbt/documents/scbt_2019_speaking.pdf)
  - 現在の画面と完全には一致しない旧資料として扱う。
  - 録音表示、音声レベル表示、質問の聞き直し、早く回答を終えた場合の次問移動、Yes/No選択などの操作概念を確認する補助資料。

### 第三者資料

- 回答時間については、現在の公式ページで全項目の秒数を確認できなかった。
- 民間対策サイトに見られる秒数は試作時の暫定値にとどめ、本番同等と断定しない。
- 特に音読時間は資料間で30秒・45秒・60秒相当の揺れがあるため、ユーザー確認と試用を経て確定する。

## 3. 公式確認済みの基本構成

| 順序 | 内容 | 確認状態 |
|---|---|---|
| 1 | ヘッドセットを使う吹込み式で回答音声を録音 | 公式確認済み |
| 2 | 面接開始前の案内・ウォームアップ | 公式体験版で構造を確認。ただし現在の2級用台本は非公開 |
| 3 | 問題カードを表示 | 公式確認済み |
| 4 | パッセージを20秒黙読 | 公式確認済み |
| 5 | 約60語のパッセージを音読 | 公式確認済み。回答秒数は未確定 |
| 6 | No.1 パッセージについて回答 | 公式確認済み。回答秒数は未確定 |
| 7 | No.2 3コマの展開を説明 | 公式確認済み |
| 8 | No.2の前に20秒考える | 公式確認済み |
| 9 | No.2終了後にカードを見えない状態にする | 公式確認済み |
| 10 | No.3 カードの話題に関連した意見 | 公式確認済み。回答秒数は未確定 |
| 11 | No.4 一般的な話題についての意見 | 公式確認済み。回答秒数は未確定 |
| 12 | 終了案内 | 構造は公式体験版で確認。正確な2級用台本は非公開 |

## 4. 現在の2級専用版との差分

| 項目 | 現在の実装 | 必要な変更 |
|---|---|---|
| 開始前確認 | 専用画面なし | 出力音量、マイク権限、入力レベル、テスト録音、テスト再生を順番に行う |
| 音量スライダー | 表示のみで実音量と連動していない | 面接官・指示音声の音量へ連動させる |
| マイクレベル | なし | `AnalyserNode`によるライブメーターを表示する |
| 録音開始 | 受験者が「録音開始」を押す | 指示音声終了後に自動録音し、開始合図を表示・再生する |
| 録音終了 | 手動停止またはタイマー0 | 時間切れまたは「回答を終える」で安全に停止し、保存完了後に遷移する |
| 面接官 | プレースホルダー | 著作権上問題のない独自キャラクターと独自音声を使う |
| ウォームアップ | 10秒・1問 | 本番に近い非採点の導入会話を段階化する |
| 問題カード | 英文のみ | 約60語の英文と3コマ画像を表示する |
| 黙読 | 20秒 | 現状値を維持し、録音OFF・自動遷移を明示する |
| 音読 | 45秒 | 秒数を暫定扱いにし、検証後に確定する |
| No.1 | 30秒 | 暫定30秒。プロンプト再生と録音を分離する |
| No.2 | 30秒、画像なし | 20秒の考慮時間、3コマ画像、暫定60秒の回答へ変更する |
| No.3・No.4 | 各30秒 | 暫定35秒。Yes/No分岐と追質問を扱える構造にする |
| カード非表示 | なし | No.2終了後にカードを隠す |
| 聞き直し | なし | 質問ごとに上限2回の聞き直しを用意する |
| 問題移動 | 前へ・次へ・ステップ直接選択が可能 | 本番モードでは「前へ」とステップ直接選択を禁止する |
| 自動遷移 | 1秒ごとの減算で即座に次へ | 単調増加時刻を基準にし、録音停止・保存完了を待って次へ進む |
| 録音確認 | 各設問中に再生・DL・自己評価を表示 | 本番中は隠し、全問終了後の復習画面へ分離する |
| 録音失敗 | 汎用メッセージ | 拒否、端末なし、無音、保存失敗、再読み込み中断を個別表示する |

## 5. 提案する画面・録音の状態機械

### A. 受験前チェック

1. `speaking-preflight`
   - スピーキングが録音式であること、録音データの保存先、削除方法を説明する。
2. `audio-output-check`
   - 短い確認音声を再生し、音量スライダーを実音量へ連動させる。
3. `microphone-permission`
   - 操作説明後に限ってマイク許可を要求する。
4. `microphone-level-check`
   - ライブ入力メーターを表示する。小さすぎる・大きすぎる場合は警告するが、声質の良否を断定しない。
5. `test-recording`
   - 5秒程度のテスト録音を行う。
6. `test-playback`
   - 録音を再生し、「この音量で進む」または「やり直す」を選ばせる。

### B. 面接開始・ウォームアップ

7. `section-start`
   - スピーキング開始を明示する。
8. `grade-introduction`
   - 独自の面接官キャラクターが2級の開始を案内する。
9. `warmup-1` / `warmup-2`
   - 簡単な日常質問を出す。採点対象外と表示する。
   - 本番の正確な台本は公開確認できていないため、独自の練習用台本と明示する。

### C. 2級問題

10. `card-introduction`
    - 問題カードを表示し、これから黙読することを案内する。
11. `silent-reading`
    - 20秒。録音OFF。カード表示。時間切れで自動遷移。
12. `read-aloud-instruction`
    - 音読指示を最後まで再生してから開始合図を出す。
13. `read-aloud-recording`
    - 自動録音。カード表示。回答時間は要確定。
14. `no1-prompt` → `no1-recording`
    - 質問音声を再生後、自動録音。暫定30秒。カード表示。
15. `no2-preparation-instruction` → `no2-preparation`
    - 3コマを表示したまま20秒考える。録音OFF。
16. `no2-prompt` → `no2-recording`
    - 質問音声を再生後、自動録音。暫定60秒。カード表示。
17. `turn-card`
    - カードを画面から隠す。以後は再表示しない。
18. `no3-base-prompt` → `no3-choice` → `no3-followup-recording`
    - Yes/Noを画面で選び、選択に対応した追質問を再生する。暫定35秒。
19. `no4-base-prompt` → `no4-choice` → `no4-followup-recording`
    - Yes/Noを画面で選び、選択に対応した追質問を再生する。暫定35秒。
20. `section-finish`
    - 全問題終了を案内し、保存処理完了後に復習へ進む。

### D. 試験後の復習

- 問題ごとの録音再生、ダウンロード、削除、自己チェックを表示する。
- AIフィードバックを追加する場合は「公式採点ではない練習用の目安」と明記する。
- 本番モード中には録音再生や自己採点を表示しない。

## 6. 共通遷移ルール

- 指示・質問音声が終わる前に録音を開始しない。
- 音声終了後、短い一定の間と開始合図を入れて録音を開始する。
- 回答時間中だけ録音中表示と入力レベルを表示する。
- 「回答を終える」が押された場合は、`MediaRecorder.stop()`後の保存完了を待ってから遷移する。
- 時間切れでも同じ停止・保存手順を通す。保存前に次の設問へ進まない。
- 本番モードでは戻る操作、ステップ直接移動、回答中の再生確認を禁止する。
- 質問の聞き直しは最大2回。再生回数と残り回数を表示する。
- Yes/Noを選ばない場合は、質問を最大2回まで自動で再生し、それでも選ばれなければ無回答として次へ進める構造にする。
- 面接官音声、案内音声、録音を同時に走らせない。
- タイマーは`performance.now()`等の経過時間を基準にし、タブ負荷や描画遅延で秒数が伸びないようにする。
- ページ再読み込み・タブ離脱時は、進行中の録音が失われる可能性を警告する。

## 7. 暫定タイマー案

| 区間 | 初期案 | 根拠 |
|---|---:|---|
| テスト録音 | 5秒 | アプリ独自 |
| 黙読 | 20秒 | 公式確認済み |
| 音読 | 45秒 | 現在値を仮置き。公式の現在値は未確認 |
| No.1回答 | 30秒 | 第三者情報による暫定値 |
| No.2考慮 | 20秒 | 公式確認済み |
| No.2回答 | 60秒 | 第三者情報による暫定値 |
| No.3回答 | 35秒 | 第三者情報による暫定値 |
| No.4回答 | 35秒 | 第三者情報による暫定値 |

秒数は設定データへ分離し、検証後にコード変更なしで差し替えられるようにする。

## 8. 問題データに持たせる項目

各段階を固定HTMLではなく、次のようなデータで表現する。

- `id`
- `phase`
- `label`
- `durationSeconds`
- `timingStatus`: `official` / `provisional` / `app-specific`
- `promptAudio`または`promptVideo`
- `cardVisibility`
- `recordingMode`: `off` / `automatic`
- `replayLimit`
- `choice`: Yes/Noと追質問の対応
- `autoAdvance`
- `allowEarlyFinish`

録音メタデータには問題ID、開始日時、実録音時間、途中終了か時間切れか、聞き直し回数、保存結果を含める。

## 9. 画面方針

- 本番モードと練習モードを分ける。
- 本番モードは進行を自動化し、戻る・一時停止・途中再生を出さない。
- 練習モードでは、説明表示、再挑戦、問題後の録音確認を許可する。
- 問題カード以外の質問英文は、本番モードでは原則として画面に表示しない。練習モードでは補助表示を選択可能にする。
- 面接官は公式画面や公式人物を複製せず、独自制作の人物画像・動画・音声を使う。
- 右上の出力音量と、マイク入力メーターを別のものとして表示する。

## 10. 実装の順番

1. 2級専用モードに限定したスピーキング進行データと状態機械を追加する。
2. 受験前の音量・マイク・テスト録音画面を作る。
3. 音声再生、録音自動開始、録音停止・保存待ち、正確なタイマーを実装する。
4. 黙読、音読、No.1〜No.4、No.2考慮時間、カード非表示、Yes/No分岐を実装する。
5. 独自面接官素材と案内音声を組み込む。
6. 本番中の操作と試験後の復習画面を分離する。
7. 2級専用版で試験し、共有`app.js`・`styles.css`による全級開発版への影響を確認する。

## 11. 必須テスト

- Chrome・EdgeのPC表示とタブレット相当幅。
- HTTPSまたはlocalhostでマイク取得できること。
- マイク許可、拒否、端末なし、使用中、無音、過大入力。
- テスト録音の再生とやり直し。
- 指示音声終了から録音開始までの間隔が全問で同じであること。
- 自動終了と途中終了の両方で、音声が欠けずIndexedDBへ保存されること。
- 聞き直し上限2回とYes/No分岐。
- No.2まではカードが見え、No.3以降は見えないこと。
- タブ負荷や一時的な画面停止があってもタイマーが大きくずれないこと。
- 再読み込み、タブ離脱、保存容量不足、IndexedDB失敗時の案内。
- 全問終了後だけ録音の再生・ダウンロード・削除ができること。
- 2級専用版以外の既存機能を壊していないこと。

## 12. 実装前にユーザーと確定する項目

1. 暫定回答時間を、音読45秒・No.1 30秒・No.2 60秒・No.3/4 各35秒で試作するか。
2. 面接官を「静止画＋音声」から始めるか、「口の動きがある独自動画」まで最初から作るか。
3. ウォームアップを2問にし、採点対象外の独自練習会話としてよいか。
4. 本番モードでは質問英文を隠し、練習モードだけ表示できる設計でよいか。
5. 録音は問題ごとに保存し、全体結合音声は後から追加する方針でよいか。

## 13. 現在の停止線

- 2級専用版には、事前チェック、音量調整、マイクメーター、テスト録音・再生、ウォームアップ、黙読、音読、No.1〜4、No.2準備、カード非表示、Yes/No分岐、聞き直し、問題別保存、終了後の録音一覧を実装済み。
- 案内・質問音声はMicrosoft Natural Voiceの`en-US-AvaMultilingualNeural`で作成したMP3を使う。速度は0.88倍相当（`edge-tts --rate=-12%`）で統一し、ブラウザ読み上げは音源読込失敗時の予備とする。
- 実機マイクの許可、入力メーター、5秒録音、再生、全問通し録音はユーザー端末で確認する。
- 本番リスニング音声は引き続き量産しない。

## 14. No.2 3コマ問題の制作ルール

### 過去問画像5例から確認した共通構造

- 問題カードに`Your story should begin with this sentence:`と開始文を表示する。
- 開始文は人物名と最初の状況を示す。家族など2〜3人の中心人物が、その後の3コマにも継続して登場する。
- 横長の3コマを左から右へ読む。コマ番号や各コマ下の説明文は付けない。
- 1コマ目には、原則として1人の短い直接発言を置く。通常の発言吹き出しを使い、尻尾を実際の話者へ向ける。
- 1コマ目から2コマ目、2コマ目から3コマ目の境界付近に、矢印型の時間経過表示を置く。例は`The next day at ...`、`A week later`、`A few months later`、`That afternoon`など。
- 2コマ目と3コマ目では、時間が進んだだけでなく、決定・準備・実行・結果のいずれかが進展する。
- 思考吹き出しを使う場合は、人物から小さな丸を連ねた雲型にし、中には未来の予定、期待、心配、思い出などを示す「文字のない小場面」を描く。答えとなる英文を思考吹き出し内へ書かない。
- No.2の前に20秒の考慮時間を置き、開始合図は`Please begin.`とする。
- 過去問の人物、題材、文章、構図、絵柄はコピーしない。確認したのは出題文法と情報配置の型であり、問題内容と素材は独自制作する。

### 文字情報と絵情報の境界

- 画面へ出してよい英文は、開始文、1コマ目の直接発言、2つの時間経過表示だけを基本とする。
- 行動、原因、結果、表情、物の状態は絵から読み取らせる。`I didn't close the cap.`のように、状況の答えを説明する文章を後半のコマへ追加しない。
- 通常の発言は楕円または角丸の吹き出しと尻尾で話者を明示する。尻尾のない英文枠は禁止する。
- 思考・未来・期待は英文で説明せず、雲型吹き出し内の小場面で示す。どの人物の思考か、小さな丸の連なりで明示する。
- 時間経過表示は発言・思考とは別物として、矢印型ラベルでコマの境界へ置く。
- 画像生成AIには文字を描かせない。開始文、直接発言、時間表示はHTMLで正確に重ね、思考吹き出しの小場面だけは画像の一部として生成する。

### 問題内容の設計条件

- 開始文には、中心人物、場所または会話の主題、最初の状況を入れる。
- 1コマ目の直接発言が、その後の行動を始めるきっかけになるようにする。
- 各コマに最低1つ、主語と動詞で説明できる明確な動作を置く。
- 3コマ全体は「相談・決定→実行→結果」「問題発生→対応→その後」「希望・計画→準備→実現または予想外の結果」など、因果関係のある流れにする。
- 3コマ目は困りごとに限定しない。肯定的な結果、計画の実現、将来への期待、心配、次にしようとしていることも使用できる。
- 思考吹き出しは毎問必須ではない。文章だけでは表しにくい未来・期待・心配を答えさせたい場合に限って使う。
- 2級受験者が、開始文に続いて約5〜7文で説明できる情報量に抑える。
- 3コマで人物の顔、年齢、服装、持ち物、左右関係を一貫させる。
- 発言の尻尾、思考の丸い連結、時間矢印が別の人物やコマを指していないか、生成後に目視確認する。

### 画像生成用マスタープロンプト

```text
Use case: illustration-story
Asset type: EIKEN Grade 2 speaking-test picture-story card artwork for a browser exam simulator
Primary request: Create one clean, wide, three-panel sequential comic strip showing [CHARACTERS] in [SETTING].
Panel 1: [FIRST ACTION]. Place the speaking character at [LEFT/CENTER/RIGHT] beneath clean open space reserved for one direct-speech bubble. The later HTML speech-bubble tail must be able to point clearly to this person.
Panel 2: [SECOND ACTION]. Show a clear progression after [TIME LABEL 1].
Panel 3: [RESULT, NEXT ACTION, OR FUTURE DEVELOPMENT]. Show a clear progression after [TIME LABEL 2]. Do not explain the situation with written words.
Optional thought vignette: Only when the story tests a character's plan, expectation, worry, or imagined future, add a cloud-shaped thought bubble connected by two or three small circles to [THINKING CHARACTER]. Inside it, show a clear wordless miniature scene of [IMAGINED SCENE]. Do not place a sentence or caption inside the thought bubble.
Style/medium: polished educational exam illustration, realistic proportions, simple clean line art with soft restrained colors, clear facial expressions and actions, suitable for Japanese high-school English learners; professionally printed language-test clarity but fully original.
Composition/framing: wide horizontal strip, three equal rectangular panels from left to right, consistent characters and clothing across all panels, black panel borders, uncluttered backgrounds, actions readable at a glance.
Color palette: muted natural colors on a white paper-like background; strong enough contrast for a test card.
Constraints: no written words, no letters, no numbers, no panel labels, no explanatory captions, no logos, no trademarks, no watermark; do not imitate or reproduce any existing EIKEN sample artwork or characters; no extra panels; keep identities, clothing, and important objects consistent across panels.
```

### 生成後の必須チェック

1. 直接発言の尻尾が、発言者の顔または口元へ明確に向いているか。
2. 時間経過表示が吹き出しに見えず、コマの移行を示す矢印になっているか。
3. 2・3コマ目に、行動や結果を説明する英文を置いていないか。
4. 思考吹き出しを使った場合、英文ではなく小場面になっており、点々が思考している人物へつながっているか。
5. 各コマの人物、服装、持ち物が同じ人物として続いているか。
6. 絵だけを見て、誰が何をしているか、何が変化したかを説明できるか。
7. 5〜7文程度の模範ナレーションが作れ、絵にない情報を補わなくても成立するか。

### 第1回・試作No.2

- 開始文: `One day, Maya and her father went to a supermarket that had a refill station.`
- 1コマ目の発言: `We can use this bottle again.`
- 1コマ目の話者: Mayaの父。吹き出しの尻尾を父へ向ける。
- 時間表示1: `Ten minutes later`
- 時間表示2: `That evening`
- 3コマ目: 説明文を置かず、漏れた容器、驚いたMaya、拭いている父の絵だけから状況を読み取らせる。
- 画像: `assets/grade2-speaking-picture-story-01.png`
