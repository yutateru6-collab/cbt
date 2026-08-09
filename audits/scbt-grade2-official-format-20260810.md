# 英検2級S-CBT 公式形式監査メモ（2026-08-10確認）

## 目的・資料の範囲

英検2級をS-CBT形式で模擬する際に必要な、**現行の公式公開情報**だけを整理した監査メモである。出典はすべて公益財団法人 日本英語検定協会の公式ウェブページまたは同サイトから現行リンクされている公式PDFに限定した。確認日はすべて **2026-08-10**。

この文書では、協会が明記した事項と、公式公開資料で確認できず推測してはならない事項を分離する。特に、体験版は「実際のものとは一部異なる」と明記されているため、本番の秒数・画面遷移の根拠にはしない。

## 結論（実装で固定すべき基線）

| 項目 | 2級S-CBTの公式基線 | 出典・確認日 |
|---|---|---|
| 4技能の順番 | **Speaking → Listening → Reading → Writing** | [S-CBT FAQ](https://www.eiken.or.jp/s-cbt/faq/)（2026-08-10） |
| 技能枠 | Speaking 15分、Listening 25分、Reading / Writing 85分、合計125分（合計は目安） | [S-CBT 試験時間](https://www.eiken.or.jp/s-cbt/administration/times/index.html)（2026-08-10） |
| 解答機材 | 会場設置のPC・ヘッドセット・キーボード・マウスを使う。機材持込み、入力/配列設定の変更は不可 | [S-CBT FAQ](https://www.eiken.or.jp/s-cbt/faq/)（2026-08-10） |
| Speaking | ヘッドセットで音声を聞き、マイクへ発話して録音する**吹込み式／録音式** | [S-CBT 試験方法](https://www.eiken.or.jp/s-cbt/administration/test/)、[S-CBT 試験内容](https://www.eiken.or.jp/s-cbt/test/index.html)（各2026-08-10） |
| 従来型との内容関係 | 出題内容・難易度・採点基準は従来型と変わらない | [S-CBTについて](https://www.eiken.or.jp/s-cbt/about/)（2026-08-10） |

## 1. 試験進行・技能間の扱い

1. 通常受験では4技能を同日に実施し、公式の固定順は **Speaking → Listening → Reading → Writing** である。一次試験免除の申請者だけはSpeakingのみを受験する。
   出典：[S-CBT FAQ](https://www.eiken.or.jp/s-cbt/faq/)、[S-CBTについて](https://www.eiken.or.jp/s-cbt/about/)（各2026-08-10）

2. 2級の公表技能枠はSpeaking 15分、Listening 25分、Reading / Writing 85分、合計125分である。公式は合計時間を「目安」とし、進行状況により異なるとしている。**Reading単独、Writing単独の固定時間は公表されていない。**
   出典：[S-CBT 試験時間](https://www.eiken.or.jp/s-cbt/administration/times/index.html)（2026-08-10）

3. ReadingとWritingでは画面右上に残り時間を表示し、試験時間内なら見直し・訂正ができる。Listeningには残り時間を表示せず、試験時間内なら見直し・訂正ができるが、最後の問題の解答時間が終わると試験終了となる。
   出典：[S-CBT 試験内容](https://www.eiken.or.jp/s-cbt/test/index.html)（2026-08-10）

4. 開始後に退室した場合、原則として教室へ戻って試験を再開できない。やむを得ないトイレ・体調不良時は挙手して監督者へ申告する。さらに、4技能のうち1技能でも欠席・棄権すると、後続技能も受験できない。これは「技能間の休憩」ではなく、退室と後続技能に関する規約上の制約である。
   出典：[英検S-CBT受験規約 PDF](https://www.eiken.or.jp/s-cbt/documents/s-cbt_2021_kiyaku.pdf) 第12条（2026-08-10）

5. 公式の試験内容ページ、FAQ、現行リンクの受験規約を確認した範囲では、技能間に設ける**定時休憩の有無・長さ・画面遷移の待機秒数**は確認できなかった。よって、模擬アプリで休憩画面や任意の待機時間を設ける場合は、公式再現ではなくアプリ独自仕様として表示すべきである。
   確認対象：[S-CBT 試験内容](https://www.eiken.or.jp/s-cbt/test/index.html)、[S-CBT FAQ](https://www.eiken.or.jp/s-cbt/faq/)、[英検S-CBT受験規約 PDF](https://www.eiken.or.jp/s-cbt/documents/s-cbt_2021_kiyaku.pdf)（各2026-08-10）

## 2. 技能別の時間・出題形式

S-CBTは従来型と出題内容・難易度・採点基準が変わらないと公式に明記される。このため、以下の問題構成は公式の「2級の試験内容」ページを内容基線として記す。ただし、同ページのSpeaking欄は従来型の対面面接の説明であり、S-CBT固有の録音画面の進行を直接示すものではない。
出典：[S-CBTについて](https://www.eiken.or.jp/s-cbt/about/)、[2級の試験内容](https://www.eiken.or.jp/eiken/exam/grade_2/solutions.html)（各2026-08-10）

| 技能 | 公式の内容・問題数 | S-CBTの時間・解答方式 | 出典・確認日 |
|---|---|---|---|
| Speaking | 音読1、音読パッセージに関する質問1、3コマのイラスト展開説明1、受験者自身の意見を述べる質問2。従来型の説明では英語での個人面接・約7分 | 15分。ヘッドセットを使い、音声を聞いてマイクへ発話する吹込み式 | [2級の試験内容](https://www.eiken.or.jp/eiken/exam/grade_2/solutions.html)、[S-CBT 試験時間](https://www.eiken.or.jp/s-cbt/administration/times/index.html)、[S-CBT 試験方法](https://www.eiken.or.jp/s-cbt/administration/test/)（各2026-08-10） |
| Listening | 会話内容一致15問、文の内容一致15問。いずれも放送は1回、4肢選択 | 25分。画面の問題・選択肢を見ながらヘッドセットで聞き、マウスで選ぶ | [2級の試験内容](https://www.eiken.or.jp/eiken/exam/grade_2/solutions.html)、[S-CBT 試験時間](https://www.eiken.or.jp/s-cbt/administration/times/index.html)、[S-CBT 試験内容](https://www.eiken.or.jp/s-cbt/test/index.html)（各2026-08-10） |
| Reading | 短文語句空所補充17問、長文語句空所補充6問、長文内容一致8問。いずれも4肢選択 | Writingと共通で85分。PC画面の問題を読み、マウスで選ぶ | [2級の試験内容](https://www.eiken.or.jp/eiken/exam/grade_2/solutions.html)、[S-CBT 試験時間](https://www.eiken.or.jp/s-cbt/administration/times/index.html)、[S-CBT 試験方法](https://www.eiken.or.jp/s-cbt/administration/test/)（各2026-08-10） |
| Writing | 英文要約1題、指定トピックについての英作文1題。筆記型2級解答用紙の語数目安は要約45～55語、英作文80～100語 | Readingと共通で85分。申込時に筆記型またはタイピング型を選択 | [2級の試験内容](https://www.eiken.or.jp/eiken/exam/grade_2/solutions.html)、[S-CBT 試験時間](https://www.eiken.or.jp/s-cbt/administration/times/index.html)、[S-CBT 試験方法](https://www.eiken.or.jp/s-cbt/administration/test/)、[2級S-CBT解答用紙 PDF](https://www.eiken.or.jp/s-cbt/documents/sample_ans_2Q_2024.pdf)（各2026-08-10） |

### Speaking（S-CBT固有）

- PCの前でヘッドセットを装着し、画面上の指示に従って発話し、音声を録音する。対面の面接委員との会話ではない。
  出典：[S-CBT 試験内容](https://www.eiken.or.jp/s-cbt/test/index.html)、[S-CBTについて](https://www.eiken.or.jp/s-cbt/about/)（各2026-08-10）

- 体験版の注意事項には、実テストではYES/NO問題に無解答の場合、動画が自動再生されるのは「2回まで」とある。ただし体験版そのものは録音非対応で、実際の試験画面・機能と一部異なる。したがって、ここから各問の録音秒数・再録音可否・ビープ音・画面遷移を推定してはならない。
  出典：[S-CBT 体験版](https://www.eiken.or.jp/s-cbt/demo/)（2026-08-10）

- 公式公開資料では、2級S-CBTの**各設問の準備時間、発話/録音時間、録音開始・終了のUI、再録音可否、音声ファイル形式、ビープ音、設問ごとの画面遷移秒数**は確認できなかった。15分は技能全体の枠であり、設問別時間配分ではない。
  確認対象：[S-CBT 試験内容](https://www.eiken.or.jp/s-cbt/test/index.html)、[S-CBT 試験方法](https://www.eiken.or.jp/s-cbt/administration/test/)、[S-CBT 体験版](https://www.eiken.or.jp/s-cbt/demo/)、[S-CBT 試験時間](https://www.eiken.or.jp/s-cbt/administration/times/index.html)（各2026-08-10）

### Listening

- 問題・選択肢をPC画面で表示し、ヘッドセットの音声を聞いてマウスで選択肢をクリックする。残り時間は表示されない。
  出典：[S-CBT 試験内容](https://www.eiken.or.jp/s-cbt/test/index.html)（2026-08-10）

- 公式の2級内容基線は30問で、会話15問と文／パッセージ15問、いずれも1回放送の4肢選択である。
  出典：[2級の試験内容](https://www.eiken.or.jp/eiken/exam/grade_2/solutions.html)（2026-08-10）

- 公式公開資料では、選択肢の確定タイミング、問題番号の移動方式、個別問題の解答秒数、音声再生操作の可否は確認できなかった。1回放送であることと、最後の問題の解答時間終了で試験が終わること以外を本番仕様として固定しない。
  確認対象：[2級の試験内容](https://www.eiken.or.jp/eiken/exam/grade_2/solutions.html)、[S-CBT 試験内容](https://www.eiken.or.jp/s-cbt/test/index.html)（各2026-08-10）

### Reading / Writing

- ReadingはPC画面の問題・選択肢を見てマウスで解答する。Writingは申込時に選ぶ二方式であり、筆記型はPC画面で問題を見て解答用紙へ記述、タイピング型はPC画面で問題を見てキーボードに入力する。
  出典：[S-CBT 試験方法](https://www.eiken.or.jp/s-cbt/administration/test/)（2026-08-10）

- キーボードの持込み、入力/配列設定の変更はできない。タイピング型について公式は「1分間に30文字を入力できるタイプスピード」があれば支障はないとの目安を示す。
  出典：[S-CBT 試験内容](https://www.eiken.or.jp/s-cbt/test/index.html)（2026-08-10）

- 2級筆記型の公式解答用紙は、英文要約の語数目安を45～55語、英作文の語数目安を80～100語と示す。これは筆記型の公式用紙に明記された目安であり、同一内容のタイピング型にも同じ語数を適用することは本資料だけからは推測しない。
  出典：[2級S-CBT解答用紙 PDF](https://www.eiken.or.jp/s-cbt/documents/sample_ans_2Q_2024.pdf)（2026-08-10）

- Reading / Writing共通の85分内で見直し・訂正ができ、残り時間は画面右上に表示される。公式公開資料は、ReadingからWritingへの切替UI、相互の行き来の可否、画面ごとのボタン配置をテキスト仕様としては示していない。
  出典：[S-CBT 試験内容](https://www.eiken.or.jp/s-cbt/test/index.html)、[S-CBT 試験時間](https://www.eiken.or.jp/s-cbt/administration/times/index.html)（各2026-08-10）

## 3. 画面・操作と受験環境の公式要件

1. 問題内容はPC画面に表示される。Reading / Listeningはマウス操作で答え、Speakingはヘッドセットとマイク、タイピング型Writingは会場設置キーボードを使う。
   出典：[S-CBTについて](https://www.eiken.or.jp/s-cbt/about/)、[S-CBT 試験方法](https://www.eiken.or.jp/s-cbt/administration/test/)（各2026-08-10）

2. ヘッドセットは正しく装着し、受験者自身が音量を調整して聞き取れる状態にする。ほかの受験者の発話が聞こえるなどを理由に試験をやり直すことはできない。
   出典：[英検S-CBT受験規約 PDF](https://www.eiken.or.jp/s-cbt/documents/s-cbt_2021_kiyaku.pdf) 第14条（2026-08-10）

3. 受験ブースにはS-CBT向けのPC・ヘッドセットが用意され、会場にはパーテーション、防音対策、監視カメラ等がある（ただし会場により設備の一部が異なる）。
   出典：[テストセンターのイメージ](https://www.eiken.or.jp/s-cbt/administration/testcenter/)（2026-08-10）

4. 公式は5種類（Speaking、Listening、Reading、Writing筆記型、Writingタイピング型）の操作動画を案内している。一方、公開テキストから確認できるのは上記の操作原則までであり、画面寸法、配色、ボタン位置、アニメーション、進捗表示の細部は本監査では公式要件として断定しない。
   出典：[S-CBT 試験内容](https://www.eiken.or.jp/s-cbt/test/index.html)（2026-08-10）

## 4. 従来型との違い

| 観点 | S-CBT | 従来型 | 出典・確認日 |
|---|---|---|---|
| 実施日 | 4技能を1日で測る | 一次試験と二次試験の2日間 | [S-CBTについて](https://www.eiken.or.jp/s-cbt/about/)（2026-08-10） |
| Speaking方式 | ヘッドセットに発話し録音する吹込み式 | 面接委員1人との英語での個人面接 | [S-CBTについて](https://www.eiken.or.jp/s-cbt/about/)、[2級の試験内容](https://www.eiken.or.jp/eiken/exam/grade_2/solutions.html)（各2026-08-10） |
| R / L | PC画面、ヘッドセット、マウスで解答 | 公式2級案内では一次試験（R / W 85分、L約25分）として案内 | [S-CBT 試験方法](https://www.eiken.or.jp/s-cbt/administration/test/)、[2級の試験内容](https://www.eiken.or.jp/eiken/exam/grade_2/solutions.html)（各2026-08-10） |
| Writing | 申込時に筆記型またはタイピング型を選択できる | 2級の従来型案内は一次試験の記述式として案内 | [S-CBT 試験方法](https://www.eiken.or.jp/s-cbt/administration/test/)、[2級の試験内容](https://www.eiken.or.jp/eiken/exam/grade_2/solutions.html)（各2026-08-10） |
| 内容・難易度・採点基準・資格 | 従来型と変わらず、同様の級・スコアとして扱う | — | [S-CBTについて](https://www.eiken.or.jp/s-cbt/about/)（2026-08-10） |

## 5. アプリ実装・監査への適用境界

- 本番再現として必須なのは、4技能の順序、2級の125分という技能枠（S 15 / L 25 / R+W 85）、Listeningの非表示タイマー、R/Wの共通残時間表示、S-CBTの吹込み式Speaking、R/Lの画面＋マウス解答、Writing二方式という**明文化された基線**である。
- 2級Speakingの内容課題（音読、パッセージ質問、3コマ説明、意見質問2）は従来型と同じ出題内容という公式記述に基づく内容基線である。ただし、対面面接の進行を録音式画面へそのまま移植する根拠にはならない。
- 各Speaking問の秒数、録音状態・ビープ・再録音、Listening個別問題の操作制限、R/Wの設問移動、技能間の定時休憩は、本調査で現行の公式公開テキスト・公式PDFから確認できない。これらを「公式仕様」と表示してはならない。

## 参照した一次情報

1. [英検S-CBT 試験内容](https://www.eiken.or.jp/s-cbt/test/index.html) — 順序、各技能の画面操作、残り時間・見直し、体験版への導線。
2. [英検S-CBT 試験時間](https://www.eiken.or.jp/s-cbt/administration/times/index.html) — 2級の技能別時間と合計時間の注記。
3. [英検S-CBT 試験方法](https://www.eiken.or.jp/s-cbt/administration/test/) — 技能別の解答手段とWriting二方式。
4. [英検S-CBTについて](https://www.eiken.or.jp/s-cbt/about/) — 1日4技能、従来型との同一性、吹込み式、実施方式。
5. [英検S-CBT FAQ](https://www.eiken.or.jp/s-cbt/faq/) — 固定順序、機材、録音式、見直し・終了条件。
6. [2級の試験内容](https://www.eiken.or.jp/eiken/exam/grade_2/solutions.html) — 従来型と同一であるS-CBTの内容基線、問題数・形式。
7. [英検S-CBT受験規約 PDF](https://www.eiken.or.jp/s-cbt/documents/s-cbt_2021_kiyaku.pdf) — 退室・再入室、後続技能、受験環境。
8. [英検S-CBT 体験版](https://www.eiken.or.jp/s-cbt/demo/) — 体験版と実テストの差異、YES/NO再生回数の限定情報。
9. [テストセンターのイメージ](https://www.eiken.or.jp/s-cbt/administration/testcenter/) — 設置機材・会場環境。
10. [2級S-CBT解答用紙 PDF](https://www.eiken.or.jp/s-cbt/documents/sample_ans_2Q_2024.pdf) — 筆記型Writingの語数目安。
