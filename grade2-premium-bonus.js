(() => {
  const premiumParams = new URLSearchParams(window.location.search);
  const requestedPremiumPlanKey = String(premiumParams.get("plan") || "").toLowerCase();
  const premiumHasAccess = requestedPremiumPlanKey === "three" || requestedPremiumPlanKey === "five";
  const premiumPlanKey = "three";
  const premiumSetKeys = ["set-01", "set-02", "set-03"];
  const OFFICIAL_AI_PROVIDER_HOSTS = Object.freeze({
    chatgpt: Object.freeze(["chatgpt.com"]),
    gemini: Object.freeze(["gemini.google.com"]),
    claude: Object.freeze(["claude.ai"]),
    perplexity: Object.freeze(["perplexity.ai", "www.perplexity.ai"]),
  });
  const externalAiProviders = Object.freeze([
    Object.freeze({
      id: "chatgpt",
      label: "ChatGPT",
      href: "https://chatgpt.com/",
      description: "公式Web版。音声対応は利用中のモデル・プランをご確認ください。",
    }),
    Object.freeze({
      id: "gemini",
      label: "Gemini",
      href: "https://gemini.google.com/",
      description: "公式Web版。音声対応は利用中のモデル・プランをご確認ください。",
    }),
    Object.freeze({
      id: "claude",
      label: "Claude",
      href: "https://claude.ai/",
      description: "公式Web版。音声対応は利用中のモデル・プランをご確認ください。",
    }),
    Object.freeze({
      id: "perplexity",
      label: "Perplexity",
      href: "https://www.perplexity.ai/",
      description: "公式Web版。音声対応は利用中のモデル・プランをご確認ください。",
    }),
  ]);
  let aiGradingTrigger = null;
  let aiGradingDialogOpen = false;

  function isAllowedExternalAiProvider(provider) {
    if (!provider || typeof provider !== "object") return false;
    const allowedHosts = OFFICIAL_AI_PROVIDER_HOSTS[provider.id] || [];
    try {
      const url = new URL(provider.href);
      return (
        url.protocol === "https:" &&
        allowedHosts.includes(url.hostname.toLowerCase()) &&
        url.pathname === "/" &&
        !url.search &&
        !url.hash &&
        !url.username &&
        !url.password &&
        !url.port
      );
    } catch {
      return false;
    }
  }

  if (!premiumHasAccess) return;

  const fallbackVocabulary = [
    { id: "fallback-grant", setKey: "set-01", setLabel: "第1回", type: "vocabulary", term: "grant", context: "The club received a small （　　　） from the city." },
    { id: "fallback-evidence", setKey: "set-01", setLabel: "第1回", type: "vocabulary", term: "evidence", context: "Without enough （　　　）, the museum could not identify the artist." },
    { id: "fallback-keep-track-of", setKey: "set-01", setLabel: "第1回", type: "phrase", term: "keep track of", context: "Use an app to （　　　） your expenses." },
    { id: "fallback-in-advance", setKey: "set-02", setLabel: "第2回", type: "phrase", term: "in advance", context: "Please reserve a seat （　　　）." },
  ];

  const vocabularyNotes = {
    grant: ["助成金・補助金", "receive a grant from ... で「〜から補助金を受ける」。"],
    inspected: ["詳しく調べた・検査した", "inspect は安全確認や荷物の検査で使う。"],
    current: ["現在の・最新の", "current information は「最新情報」。"],
    firmly: ["強く・しっかりと", "命令・注意の強さを表す副詞。"],
    evidence: ["証拠", "without enough evidence は「十分な証拠がなくて」。"],
    reserve: ["予約する・確保する", "座席や部屋を前もって取っておく。"],
    temporary: ["一時的な", "permanent（恒久的な）と対で覚える。"],
    priority: ["優先事項", "top priority は「最優先」。"],
    persuade: ["説得する", "persuade + 人 + to do / by doing の形で使う。"],
    deliberately: ["故意に・わざと", "偶然ではなく意図して行ったことを示す。"],
    "keep track of": ["〜を記録して把握する", "支出・予定・進み具合と一緒に出やすい。"],
    "carry out": ["実施する", "carry out a survey / plan の組み合わせ。"],
    "call for": ["〜を必要とする", "状況が追加の人・対応を求めるときに使う。"],
    "draw up": ["（計画・予算など）を作成する", "draw up a budget / plan の形で確認。"],
    "as long as": ["〜という条件なら", "許可につく条件を最後まで聞き取る。"],
    "no longer": ["もはや〜ない", "以前と現在の変化を示す表現。"],
    "within walking distance": ["徒歩圏内に", "場所が近く、歩いて行ける距離であること。"],
    replacement: ["代わりの品・交換品", "壊れた物の代わりに届く新しい品。"],
    portable: ["持ち運びできる", "軽い・電池式など、外へ運べる物に使う。"],
    declined: ["断った", "offer や invitation を丁寧に断る文脈。"],
    accurately: ["正確に", "測定・記録などに誤りなく行うこと。"],
    appetite: ["食欲", "have little appetite で「食欲があまりない」。"],
    identify: ["特定する・見分ける", "特徴を手がかりに物や人を判別する。"],
    efficient: ["効率的な", "同じ時間・労力でより多くできること。"],
    otherwise: ["さもないと・そうでなければ", "前の条件を守らない場合の結果を示す。"],
    obstacle: ["障害・妨げ", "目標の達成を難しくする問題。"],
    investigate: ["調査する", "原因や事実をよく調べる。"],
    "catch up on": ["遅れていることを取り戻す", "支払い・宿題・仕事の遅れに使う。"],
    "fill in for": ["〜の代わりを務める", "人が不在のとき一時的に代わる。"],
    "unsubscribe from": ["〜の購読・利用を解除する", "メールや定額サービスをやめる。"],
    "keep an eye on": ["〜を見守る・注意して見る", "火にかけた鍋や子どもの様子に使う。"],
    "in addition to": ["〜に加えて", "Aに加えてBも、という追加を示す。"],
    "out of order": ["故障していて使えない", "機械・設備が一時的に使えない状態。"],
    "in advance": ["前もって", "予約・準備・連絡の場面で出る。"],
    exception: ["例外", "the only exception は「唯一の例外」。"],
    locate: ["位置を特定する・見つける", "人や物の場所を見つけ出す。"],
    reliable: ["信頼できる", "情報・機械・人が頼りになること。"],
    refund: ["返金", "商品を返品したときなどに戻るお金。"],
    patiently: ["辛抱強く", "急かさず、落ち着いて待つ・説明する。"],
    adopt: ["採用する", "新しい方法・制度を取り入れて使い始める。"],
    permanent: ["恒久的な", "temporary の反対で、長く続くこと。"],
    requirement: ["必要条件", "条件を満たさなければできないこと。"],
    revise: ["修正する・改訂する", "コメントを受けて文章・計画を直す。"],
    gradually: ["徐々に", "急ではなく、少しずつ変化する。"],
    "ran out of": ["〜を使い果たした", "run out of の過去形。紙・時間・お金などがなくなる。"],
    "keep up with": ["〜についていく・遅れないようにする", "変化・更新・授業の進みに使う。"],
    "take advantage of": ["〜を利用する・活用する", "良い機会やサービスをうまく使う。"],
    "take over": ["引き継ぐ・代わって担当する", "担当者ができなくなった仕事を引き受ける。"],
    "even if": ["たとえ〜でも", "条件が成り立っても結果が変わらないことを示す。"],
    "at least": ["少なくとも", "数字・時間・条件の下限を表す。"],
    "in case": ["〜の場合に備えて", "起こるかもしれないことへの準備。"],
    quotation: ["見積書・引用", "価格の文脈では ask for a quotation で「見積もりを依頼する」。"],
    determine: ["決定する・突き止める", "調査や計算によって答え・原因を明らかにする。"],
    smoothly: ["順調に・なめらかに", "作業や計画が問題なく進む様子を表す。"],
    reluctant: ["気が進まない", "be reluctant to do で「〜することに乗り気でない」。"],
    ingredient: ["材料・原料", "料理や製品を作る一つ一つの材料。"],
    label: ["ラベル・表示", "容器や商品に内容・注意などを示す表示。"],
    substantial: ["かなりの・相当な", "量・大きさ・重要性が無視できないほど大きい。"],
    attach: ["添付する・取り付ける", "attach a file to an email で「メールにファイルを添付する」。"],
    approach: ["方法・取り組み方", "an approach to a problem で「問題への取り組み方」。"],
    barely: ["かろうじて・ほとんど〜ない", "余裕がほぼない状態を表す副詞。"],
    "make up for": ["〜を埋め合わせる", "不足・損失・遅れを別のもので補う。"],
    conduct: ["実施する", "conduct a survey / experiment の組み合わせ。"],
    "stumbled upon": ["偶然見つけた", "探していない物や情報に偶然出会ったこと。"],
    "fill out": ["記入する", "fill out a form で「用紙に必要事項を記入する」。"],
    "provided that": ["〜という条件で", "条件が満たされる場合だけ成り立つことを示す。"],
    "at random": ["無作為に", "順番や基準を決めずランダムに選ぶこと。"],
    "under repair": ["修理中で", "機械・施設などが修理のため使えない状態。"],
    warranty: ["保証・保証書", "故障時の修理や交換条件を定めた保証。"],
    notify: ["知らせる・通知する", "notify + 人 + of / that の形で正式な連絡に使う。"],
    fragile: ["壊れやすい", "ガラスなど、注意して扱う必要がある物に使う。"],
    fortunately: ["幸いにも", "好ましい結果になったことを文全体に付け加える。"],
    drawback: ["欠点・不利な点", "benefit や advantage と対になる問題点。"],
    adjust: ["調整する", "温度・音量・予定などを適切な状態に変える。"],
    data: ["データ・資料", "調査や判断の根拠となる複数の情報。"],
    accurate: ["正確な", "数字・測定・情報が事実と合っていること。"],
    convinced: ["確信した・納得した", "be convinced that ... で「〜だと確信する」。"],
    intentionally: ["意図的に", "偶然ではなく、目的を持って行ったこと。"],
    "hand out": ["配る", "資料・紙・品物を複数の人に配布する。"],
    "picked out": ["選び出した", "複数の候補から一つを選ぶ、または見分ける。"],
    "compensate for": ["〜を補う・埋め合わせる", "不利益や不足を別の利点で補う。"],
    "call off": ["中止する", "予定されていた会議・試合・行事などを取りやめる。"],
    unless: ["〜でない限り", "例外となる条件を示す接続詞。"],
    "a short walk": ["歩いてすぐ", "場所が徒歩で近いことを表す。"],
    "on leave": ["休暇中で", "仕事を正式に休んでいる状態。"],
  };

  const studyPlans = {
    "14": {
      title: "14日で、3回に役割を持たせる",
      lead: "第1回で現状を知り、第2回で修正を試し、第3回を最終リハーサルにします。",
      items: [
        { day: "14日前", title: "受験環境を決める", body: "ヘッドセット・マイク・操作を確認。今回の目標を「時間配分」など一つだけ書く。" },
        { day: "13日前", title: "第1回を本番設定で通す", body: "途中で解説を見ず、4技能を順番どおりに進める。" },
        { day: "12日前", title: "第1回から修正点を一つ選ぶ", body: "失点を「知識」「読み方・聞き方」「時間・操作」に分け、最も大きい一つだけを選ぶ。" },
        { day: "11日前", title: "第2回で修正点を試す", body: "第1回で決めた一つだけを意識して通し、他の改善は増やさない。" },
        { day: "10日前", title: "要約と英作文を一本ずつ戻す", body: "要約は話題・利点・問題点、英作文は立場・理由二つ・説明の順で書き直す。" },
        { day: "9日前", title: "第3回で時間配分を固める", body: "迷った問題で止まらず、印を付けて進む動作を本番どおりに試す。" },
        { day: "8日前", title: "リスニングの根拠を再現する", body: "間違えた問題だけ、選択肢の差を見て再挑戦し、台本で根拠の一文を確認する。" },
        { day: "7日前", title: "スピーキングを録り直す", body: "No.1は疑問詞、No.2は指定文と時系列、No.3・4は結論と理由を確認する。" },
        { day: "6日前", title: "第1〜3回から弱点を戻す", body: "最も苦手な技能を一つ選び、解説と自分の解答を見比べて直す。" },
        { day: "5日前", title: "短文語句を文脈で戻す", body: "迷った問題を各回から選び、正答の意味と空所の前後を一緒に読む。" },
        { day: "4日前", title: "答案を一度だけ再提出する", body: "AI振り返りか自己チェックを使い、最優先の一点だけ直して書き直す。" },
        { day: "3日前", title: "第3回を最終リハーサルにする", body: "開始時刻も本番に寄せ、操作・時間・録音まで省略せず通す。" },
        { day: "2日前", title: "最後の弱点を一つ戻す", body: "下の弱点別ルートから一つだけ選び、30〜45分で終える。" },
        { day: "前日", title: "当日用に整える", body: "直前PDFと回答型の入口だけを見る。新しい問題は始めず、必要な持ち物と睡眠を優先する。" },
      ],
    },
    "7": {
      title: "7日で、3回を使って仕上げる",
      lead: "全部を詳しく復習せず、各回に一つだけ目的を置きます。第3回を最終リハーサルにします。",
      items: [
        { day: "7日前", title: "第1回で現状を測る", body: "本番設定で通し、失点が大きい技能と時間・操作の問題を一つずつ記録する。" },
        { day: "6日前", title: "第2回と書く型", body: "第2回で一つ改善を試し、要約か英作文を一本だけ型に沿って書き直す。" },
        { day: "5日前", title: "第3回と聞く根拠", body: "リスニングは選択肢の差を先に確認。復習は間違えた問題の根拠一文だけに絞る。" },
        { day: "4日前", title: "話す型を短く反復する", body: "No.1の疑問詞、No.2の時系列、No.3・4の結論と理由を一回ずつ録音する。" },
        { day: "3日前", title: "第3回を最終リハーサルにする", body: "試験当日と同じ順番で、見直し・録音・入力まで省略せず進める。" },
        { day: "2日前", title: "最優先の弱点だけ再現する", body: "下の弱点別ルートから一つ選び、30〜45分で終える。新しい教材へ広げない。" },
        { day: "前日", title: "当日用の準備だけをする", body: "チェックリストと最初の一文を確認。新しい問題や大量暗記はしない。" },
      ],
    },
  };

  const weaknessRoutes = {
    vocabulary: {
      title: "語彙・熟語で迷う",
      description: "意味を知っていても、文脈の中で決め切れない状態です。新しい語を増やす前に、模試で見た語を文と一緒に戻します。",
      steps: ["第1〜3回の短文語句から、迷った問題を10問だけ選ぶ。", "正答の日本語の意味と、空所に合う理由を声に出す。", "翌日は別の回を選び、前日の10問を最初に三問だけ確認する。"],
      note: "単語だけを眺めず、空所の前後とセットで判断する。",
    },
    reading: {
      title: "長文で時間が足りない",
      description: "全文を最初から訳し切ろうとして、設問に必要な情報へたどり着く前に時間を使っています。",
      steps: ["設問を先に読み、固有名詞・数字・理由・変化のどれを探すか決める。", "根拠になりそうな一文だけに印を付け、段落全体を訳し直さない。", "復習では「根拠の一文」と「選択肢が違う理由」を一つずつ確認する。"],
      note: "読む速さを上げようとするより、戻る場所を減らす。",
    },
    listening: {
      title: "聞こえても選べない",
      description: "音を追うことに集中し過ぎて、質問が何を聞いているかを保てていない状態です。",
      steps: ["再生前に選択肢の差を確認し、人・時間・場所・理由のどれが違うか丸を付ける。", "一度目は答えを選ぶ。台本は答えた後にだけ開く。", "根拠になった一文を声に出して一回だけまねる。"],
      note: "聞き取れなかった一語を取り返そうとして、次の情報を失わない。",
    },
    summary: {
      title: "英文要約がまとまらない",
      description: "細かい例を入れ過ぎるか、自分の意見を足してしまうと、45〜55語に収まりにくくなります。",
      steps: ["各段落を「話題」「利点」「問題点」の短い日本語メモにする。", "細かい例を捨て、同じ種類の利点・問題点を一文にまとめる。", "45〜55語で書き、本文にない意見や因果関係がないか確認する。"],
      note: "要約は賛成・反対を書く問題ではない。",
    },
    essay: {
      title: "英作文の理由が薄い",
      description: "理由を二つ書く前に、理由を三つ以上並べてしまうと、どれも説明不足になりやすいです。",
      steps: ["最初に立場を一文で決める。", "理由を二つだけ選び、それぞれに身近な例を一つ足す。", "書き終えたら、各理由が立場を支えているかだけ確認する。"],
      note: "難しい語を増やすより、理由と具体例のつながりをはっきりさせる。",
    },
    speaking: {
      title: "話し始めで止まる",
      description: "文法を正確にしようと考え過ぎると、準備時間が終わっても最初の一文が出ません。",
      steps: ["No.1は How / Why / What の答え方を一回ずつ声に出す。", "No.2は指定された書き出しから始め、各コマの人物と動作を順に述べる。", "No.3・4は結論と理由一つを録音し、直すのは一点だけにする。"],
      note: "言い直しは失敗ではない。沈黙を長くしない方を優先する。",
    },
    operation: {
      title: "操作・時間配分が不安",
      description: "英語力ではなく、録音・画面移動・見直しで注意を取られている状態です。",
      steps: ["第1〜3回のどれかを、最初から最後まで画面どおりに進める。", "迷った問題には印を付けて次へ進む練習をする。", "スピーキング前にマイク・音量・録音の確認を済ませる。"],
      note: "問題を増やさず、本番で初めて触る操作をゼロにする。",
    },
  };

  const aiPrompts = {
    speaking: [
      "あなたは英検2級レベルの英語スピーキング練習コーチです。",
      "添付した録音と、下に貼る設問・カードの内容を使って、私の回答を練習目的で振り返ってください。",
      "",
      "【設問・カードの内容】",
      "（ここに貼る）",
      "",
      "【特に気になること】",
      "（例：No.2で止まる／理由が続かない）",
      "",
      "【必ず守ること】",
      "- これは公式採点ではありません。CSEスコア、合否、点数は出さないでください。",
      "- 聞き取れない箇所は推測せず、「聞き取りにくい」と書いてください。",
      "- 質問への応答、情報量、発音と流暢さ、語彙・文法・語法、伝えようとする姿勢の順に確認してください。",
      "- 英検2級の学習者が次回そのまま使える、自然で短い英語を優先してください。",
      "- 難しい単語・長い模範解答を大量に出さないでください。",
      "- 改善点は多くても二つ、最優先は一つだけにしてください。聞き取れない発音を断定しないでください。",
      "",
      "【出力の順番】",
      "1. まず「質問への答えは伝わったか」を一文で言う。",
      "2. 各設問について、内容面の良かった点を一つ、次回直す点を一つ書く。",
      "3. 最優先で直す一点を選び、理由を説明する。",
      "4. 30秒でできる録り直しドリルを一つ出す。",
      "5. 私の内容を保ったまま、より言いやすい短い言い換えを二つまで提案する。",
    ].join("\n"),
    summary: [
      "あなたは英検2級レベルの英文要約を指導するコーチです。",
      "下の本文と私の要約を、45〜55語を目安に練習目的で確認してください。",
      "",
      "【本文】",
      "（ここに貼る）",
      "",
      "【私の要約】",
      "（ここに貼る）",
      "",
      "【必ず守ること】",
      "- 公式採点・CSEスコア・合否の断定はしないでください。",
      "- 本文にない意見や情報が入っていないかを最初に確認してください。",
      "- 内容・構成・語彙・文法の4観点で確認してください。",
      "- 最近の公式問題で多い「話題・利点・問題点」が押さえられているか確認し、本文構造が違う場合は本文の中心に合わせてください。",
      "- 語数は空白区切りで数え、目安内かを示してください。",
      "- 文法ミスを全部並べず、意味を損ねるものを優先してください。",
      "- 難しい表現へ言い換え過ぎず、2級で自然な英語にしてください。",
      "",
      "【出力の順番】",
      "1. 内容が本文の要約になっているかを一文で言う。",
      "2. 内容・構成・語彙・文法をそれぞれ一行で確認する。",
      "3. 「入っているべき要点」「削れる部分」をそれぞれ二つまで示す。",
      "4. 最優先の修正を一つだけ示す。",
      "5. 私の内容をできるだけ残した45〜55語の改善例を一つ出す。",
    ].join("\n"),
    essay: [
      "あなたは英検2級レベルの英作文を指導するコーチです。",
      "下のTOPIC、POINTS、私の答案を、80〜100語を目安に練習目的で確認してください。",
      "",
      "【TOPIC / POINTS】",
      "（ここに貼る）",
      "",
      "【私の答案】",
      "（ここに貼る）",
      "",
      "【必ず守ること】",
      "- 公式採点・CSEスコア・合否の断定はしないでください。",
      "- 内容・構成・語彙・文法の4観点で確認してください。",
      "- 私の立場が明確か、理由が二つあるか、理由と具体例がつながるかを優先してください。",
      "- POINTSは参考であり、使っていないことだけを理由に減点扱いしないでください。",
      "- 語数は空白区切りで数え、目安内かを示してください。",
      "- 文法ミスを全部列挙せず、意味を損ねるものを優先してください。",
      "- 難しい表現を足し過ぎず、2級で使いやすい文にしてください。",
      "",
      "【出力の順番】",
      "1. 立場と二つの理由が伝わるかを一文で言う。",
      "2. 内容・構成・語彙・文法を、それぞれ一行で確認する。",
      "3. 最優先で直す一点を一つだけ示す。",
      "4. 私の理由を保ったまま、80〜100語の改善例を一つ出す。",
    ].join("\n"),
  };

  const state = {
    templateKey: "summary",
    promptKey: "speaking",
    planKey: "14",
    weaknessKey: "vocabulary",
    vocabularyItems: [],
    vocabFilter: "all",
    vocabCurrentId: "",
    vocabMeaningVisible: false,
  };

  const writingTemplates = {
    summary: [
      "More [people / organizations] are [activity / change].",
      "This can help [group] [benefit 1] and [benefit 2].",
      "However, [problem 1], and [problem 2].",
    ].join("\n"),
    essay: [
      "I think [your answer].",
      "First, [reason 1]. This is because / For example, [support].",
      "Second, [reason 2]. As a result / For instance, [support].",
      "For these reasons, [restated answer].",
    ].join("\n"),
  };

  function escapeHtml(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function multilineHtml(value) {
    return escapeHtml(value).replace(/\n/g, "<br />");
  }

  function normalizeTerm(value) {
    return String(value == null ? "" : value).trim().toLowerCase();
  }

  function collectVocabulary() {
    const sourceSets = Array.isArray(window.scbtGrade2VocabSets) ? window.scbtGrade2VocabSets : [];
    const allowedSetKeys = new Set(premiumSetKeys);
    const items = sourceSets
      .filter((set) => allowedSetKeys.has(set && set.key))
      .flatMap((set) => {
        const choicePage = (set.readingPages || []).find((page) => page && page.kind === "choice") || set.readingPages && set.readingPages[0];
        return (choicePage && choicePage.questions || [])
          .filter((question) => question && ["vocabulary", "phrase"].includes(question.type))
          .map((question) => {
            const correctIndex = Number(question.correct) - 1;
            const term = question.choices && question.choices[correctIndex];
            if (!term) return null;
            return {
              id: set.key + "-" + question.id,
              setKey: set.key,
              setLabel: set.label || set.key,
              type: question.type,
              term,
              context: String(question.text || "").replace(/\(\s*[\u3000 ]*\)/g, "（　　　）"),
            };
          })
          .filter(Boolean);
      });

    return items.length > 0 ? items : fallbackVocabulary;
  }

  function renderTemplate() {
    document.querySelectorAll("[data-template-tab]").forEach((button) => {
      const isActive = button.dataset.templateTab === state.templateKey;
      button.classList.toggle("is-active", isActive);
      button.setAttribute("aria-selected", String(isActive));
    });

    document.querySelectorAll("[data-template-panel]").forEach((panel) => {
      panel.hidden = panel.dataset.templatePanel !== state.templateKey;
    });
  }

  function renderPrompt() {
    const prompt = document.querySelector("[data-ai-prompt]");
    if (prompt) prompt.textContent = aiPrompts[state.promptKey] || aiPrompts.speaking;

    document.querySelectorAll("[data-prompt-select]").forEach((button) => {
      const isActive = button.dataset.promptSelect === state.promptKey;
      button.classList.toggle("is-active", isActive);
      button.setAttribute("aria-selected", String(isActive));
    });
  }

  function renderStudyPlan() {
    const plan = studyPlans[state.planKey] || studyPlans["14"];
    const title = document.querySelector("[data-plan-title]");
    const lead = document.querySelector("[data-plan-lead]");
    const list = document.querySelector("[data-study-plan-list]");

    if (title) title.textContent = plan.title;
    if (lead) lead.textContent = plan.lead;
    if (list) {
      list.innerHTML = plan.items.map((item) => {
        return "<li class='schedule-item'><span class='schedule-day'>" + escapeHtml(item.day) + "</span><div><h4>" + escapeHtml(item.title) + "</h4><p>" + escapeHtml(item.body) + "</p></div></li>";
      }).join("");
    }

    document.querySelectorAll("[data-study-plan]").forEach((button) => {
      const isActive = button.dataset.studyPlan === state.planKey;
      button.classList.toggle("is-active", isActive);
      button.setAttribute("aria-selected", String(isActive));
    });
  }

  function renderWeaknessRoute() {
    const route = weaknessRoutes[state.weaknessKey] || weaknessRoutes.vocabulary;
    const result = document.querySelector("[data-weakness-result]");
    if (result) {
      const steps = route.steps.map((step) => "<li>" + escapeHtml(step) + "</li>").join("");
      result.innerHTML = "<div><h3>" + escapeHtml(route.title) + "</h3><p>" + escapeHtml(route.description) + "</p><p class='route-note'>" + escapeHtml(route.note) + "</p></div><div><ol class='route-list'>" + steps + "</ol></div>";
    }

    document.querySelectorAll("[data-weakness]").forEach((button) => {
      const isActive = button.dataset.weakness === state.weaknessKey;
      button.classList.toggle("is-active", isActive);
      button.setAttribute("aria-pressed", String(isActive));
    });
  }

  function getFilteredVocabulary() {
    if (state.vocabFilter.indexOf("set-") === 0) {
      return state.vocabularyItems.filter((item) => item.setKey === state.vocabFilter);
    }
    return state.vocabularyItems;
  }

  function currentVocabularyItem() {
    const items = getFilteredVocabulary();
    if (items.length === 0) return null;
    const selected = items.find((item) => item.id === state.vocabCurrentId);
    if (selected) return selected;
    state.vocabCurrentId = items[0].id;
    return items[0];
  }

  function renderVocabulary() {
    const total = state.vocabularyItems.length;
    const count = document.querySelector("[data-vocab-count]");
    const position = document.querySelector("[data-vocab-position]");
    const card = document.querySelector("[data-vocab-card]");
    const filteredItems = getFilteredVocabulary();

    if (count) count.textContent = "第1〜3回の " + total + " 語・熟語を収録";

    document.querySelectorAll("[data-vocab-filter]").forEach((button) => {
      const isActive = button.dataset.vocabFilter === state.vocabFilter;
      button.classList.toggle("is-active", isActive);
      button.setAttribute("aria-pressed", String(isActive));
    });

    if (!card) return;
    const item = currentVocabularyItem();
    if (!item) {
      if (position) position.textContent = "0 / 0";
      card.innerHTML = "<div class='vocab-empty'><div><strong>この回の語彙を読み込めませんでした。</strong><br />「すべて」に戻してもう一度確認してください。<div class='vocab-card-actions'><button class='bonus-button primary' type='button' data-action='show-all-vocabulary'>すべての語を見る</button></div></div></div>";
      return;
    }

    const note = vocabularyNotes[normalizeTerm(item.term)] || ["意味を確認する", "この文脈で、空所の前後と一緒に覚える。"];
    const typeLabel = item.type === "phrase" ? "熟語・語句" : "語彙";
    const currentIndex = filteredItems.findIndex((entry) => entry.id === item.id);
    if (position) position.textContent = (currentIndex + 1) + " / " + filteredItems.length;
    const definition = state.vocabMeaningVisible
      ? "<div class='vocab-definition'><strong>" + escapeHtml(note[0]) + "</strong>" + escapeHtml(note[1]) + "</div>"
      : "<div class='vocab-definition'><strong>意味を思い出してから確認</strong>まず自分で意味と使い方を言ってみてください。</div>";

    card.innerHTML =
      "<div class='vocab-card-topline'><span class='vocab-set-label'>" + escapeHtml(item.setLabel) + "</span><span>この回の正答語</span></div>" +
      "<h3>" + escapeHtml(item.term) + "</h3>" +
      "<span class='vocab-type'>" + typeLabel + "</span>" +
      "<p class='vocab-context' lang='en'>" + multilineHtml(item.context) + "</p>" +
      definition +
      "<div class='vocab-card-actions'>" +
      "<button class='bonus-button subtle' type='button' data-action='vocab-previous'>前へ</button>" +
      "<button class='bonus-button subtle' type='button' data-action='vocab-reveal'>" + (state.vocabMeaningVisible ? "意味を隠す" : "意味を見る") + "</button>" +
      "<button class='bonus-button primary' type='button' data-action='vocab-next'>次へ</button>" +
      "<button class='bonus-button subtle' type='button' data-action='vocab-random'>ランダムに出す</button>" +
      "</div>";
  }

  function moveVocabulary(offset) {
    const items = getFilteredVocabulary();
    if (items.length === 0) return;
    const foundIndex = items.findIndex((item) => item.id === state.vocabCurrentId);
    const currentIndex = foundIndex < 0 ? 0 : foundIndex;
    const nextIndex = (currentIndex + offset + items.length) % items.length;
    state.vocabCurrentId = items[nextIndex].id;
    state.vocabMeaningVisible = false;
    renderVocabulary();
  }

  async function copyText(value) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(value);
      return true;
    }

    const textarea = document.createElement("textarea");
    textarea.value = value;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.append(textarea);
    textarea.select();
    const copied = document.execCommand ? document.execCommand("copy") : false;
    textarea.remove();
    return copied;
  }

  function updateCopyStatus(message) {
    const status = document.querySelector("[data-copy-status]");
    if (!status) return;
    status.textContent = message;
    window.setTimeout(() => {
      if (status.textContent === message) status.textContent = "";
    }, 4000);
  }

  async function copyCurrentPrompt() {
    try {
      const copied = await copyText(aiPrompts[state.promptKey] || aiPrompts.speaking);
      updateCopyStatus(copied ? "コピーしました。設問と一緒にAIへ貼り付けてください。" : "コピーできませんでした。文章を選択してコピーしてください。");
    } catch {
      updateCopyStatus("コピーできませんでした。文章を選択してコピーしてください。");
    }
  }

  function applyPlanMode() {
    const planLabel = "3回プレミアム";
    const setRange = "第1〜3回";
    const examHref = "./exam.html?plan=" + premiumPlanKey;

    document.title = "2級・" + planLabel + "購入者特典 | S-CBT直前リハーサル";
    if (requestedPremiumPlanKey === "five" && window.history?.replaceState) {
      const normalizedUrl = new URL(window.location.href);
      normalizedUrl.searchParams.set("plan", "three");
      window.history.replaceState(null, "", normalizedUrl.toString());
    }
    document.querySelectorAll("[data-exam-link]").forEach((link) => {
      link.setAttribute("href", examHref);
      link.textContent = link.hasAttribute("data-exam-cta")
        ? setRange + "の模試へ進む"
        : "← " + planLabel + "へ戻る";
    });
    document.querySelectorAll("[data-set-range]").forEach((element) => {
      element.textContent = setRange;
    });

    const badge = document.querySelector("[data-plan-badge]");
    if (badge) badge.textContent = "英検2級｜" + planLabel + "購入特典";
    const description = document.querySelector("[data-plan-description]");
    if (description) {
      description.textContent = "第1〜3回を使い切り、書く・話す・振り返る・受験日まで整えるところまでを一つにつないだ仕上げセットです。";
    }
  }

  function openAiGradingDialog(trigger) {
    const dialog = document.querySelector("[data-ai-grading-dialog]");
    if (!dialog) return;
    aiGradingTrigger = trigger || document.activeElement;
    aiGradingDialogOpen = true;
    document.body.classList.add("ai-grading-dialog-open");
    if (typeof dialog.showModal === "function") {
      if (!dialog.open) dialog.showModal();
    } else {
      dialog.setAttribute("open", "");
      dialog.classList.add("ai-grading-dialog-fallback-open");
    }
    dialog.querySelector("[data-action='close-ai-grading']")?.focus();
  }

  function restoreAiGradingFocus() {
    aiGradingDialogOpen = false;
    document.body.classList.remove("ai-grading-dialog-open");
    const trigger = aiGradingTrigger;
    aiGradingTrigger = null;
    if (trigger && document.contains(trigger) && typeof trigger.focus === "function") trigger.focus();
  }

  function closeAiGradingDialog() {
    const dialog = document.querySelector("[data-ai-grading-dialog]");
    if (!dialog) {
      restoreAiGradingFocus();
      return;
    }
    try {
      if (typeof dialog.close === "function" && dialog.open) dialog.close();
      else dialog.removeAttribute("open");
    } catch {
      dialog.removeAttribute("open");
    }
    dialog.classList.remove("ai-grading-dialog-fallback-open");
    restoreAiGradingFocus();
  }

  function openExternalAi(provider) {
    const selectedProvider = externalAiProviders.find((item) => item.id === provider);
    if (!isAllowedExternalAiProvider(selectedProvider)) return;
    closeAiGradingDialog();
    window.location.assign(selectedProvider.href);
  }

  function trapAiGradingDialogFocus(event) {
    if (event.key !== "Tab" || !aiGradingDialogOpen) return;
    const dialog = document.querySelector("[data-ai-grading-dialog]");
    if (!dialog?.open) return;
    const focusable = [...dialog.querySelectorAll("button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex='-1'])")].filter(
      (element) => !element.hidden && element.getAttribute("aria-hidden") !== "true",
    );
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    const active = document.activeElement;
    if (event.shiftKey && (active === first || !dialog.contains(active))) {
      event.preventDefault();
      last.focus();
      return;
    }
    if (!event.shiftKey && (active === last || !dialog.contains(active))) {
      event.preventDefault();
      first.focus();
    }
  }

  function countWords(value) {
    const normalized = String(value || "").trim();
    return normalized ? normalized.split(/\s+/).length : 0;
  }

  function renderWordCount(key) {
    const input = document.querySelector("[data-word-input='" + key + "']");
    const output = document.querySelector("[data-word-count='" + key + "']");
    if (!input || !output) return;
    const count = countWords(input.value);
    const minimum = Number(input.dataset.minWords || 0);
    const maximum = Number(input.dataset.maxWords || Number.POSITIVE_INFINITY);
    let note = "・あと" + Math.max(0, minimum - count) + "語";
    if (count >= minimum && count <= maximum) note = "・目安内";
    if (count > maximum) note = "・" + (count - maximum) + "語オーバー";
    output.textContent = count + "語" + note;
    output.classList.toggle("is-in-range", count >= minimum && count <= maximum);
    output.classList.toggle("is-over-range", count > maximum);
  }

  async function copyWritingTemplate(key, button) {
    const value = writingTemplates[key];
    if (!value) return;
    const originalText = button.textContent;
    try {
      const copied = await copyText(value);
      button.textContent = copied ? "コピーしました" : "選択してコピーしてください";
    } catch {
      button.textContent = "選択してコピーしてください";
    }
    window.setTimeout(() => {
      button.textContent = originalText;
    }, 3000);
  }

  function initializePremiumBonus() {
    document.querySelectorAll("[data-bonus-content]").forEach((block) => {
      block.hidden = false;
    });
    const lockedBlock = document.querySelector("[data-bonus-locked]");
    if (lockedBlock) lockedBlock.hidden = true;

    applyPlanMode();
    renderTemplate();
    renderPrompt();
    renderStudyPlan();
    renderWeaknessRoute();
    renderWordCount("summary");
    renderWordCount("essay");
  }

  document.addEventListener("input", (event) => {
    const writingInput = event.target.closest("[data-word-input]");
    if (writingInput) renderWordCount(writingInput.dataset.wordInput || "");
  });

  const aiGradingDialog = document.querySelector("[data-ai-grading-dialog]");

  document.addEventListener("click", (event) => {
    if (
      aiGradingDialogOpen &&
      aiGradingDialog &&
      !aiGradingDialog.contains(event.target) &&
      !event.target.closest("[data-action='open-ai-provider-dialog'], [data-action='open-ai-grading']")
    ) {
      closeAiGradingDialog();
    }

    const templateTab = event.target.closest("[data-template-tab]");
    if (templateTab) {
      state.templateKey = templateTab.dataset.templateTab || "summary";
      renderTemplate();
      return;
    }

    const promptTab = event.target.closest("[data-prompt-select]");
    if (promptTab) {
      state.promptKey = promptTab.dataset.promptSelect || "speaking";
      renderPrompt();
      return;
    }

    const planTab = event.target.closest("[data-study-plan]");
    if (planTab) {
      state.planKey = planTab.dataset.studyPlan || "14";
      renderStudyPlan();
      return;
    }

    const weaknessButton = event.target.closest("[data-weakness]");
    if (weaknessButton) {
      state.weaknessKey = weaknessButton.dataset.weakness || "vocabulary";
      renderWeaknessRoute();
      return;
    }

    const vocabFilter = event.target.closest("[data-vocab-filter]");
    if (vocabFilter) {
      state.vocabFilter = vocabFilter.dataset.vocabFilter || "all";
      state.vocabCurrentId = "";
      state.vocabMeaningVisible = false;
      renderVocabulary();
      return;
    }

    const actionButton = event.target.closest("[data-action]");
    if (!actionButton) return;
    const action = actionButton.dataset.action;

    if (action === "open-ai-provider-dialog" || action === "open-ai-grading") {
      openAiGradingDialog(actionButton);
      return;
    }

    if (action === "close-ai-grading") {
      closeAiGradingDialog();
      return;
    }

    if (action === "open-external-ai") {
      openExternalAi(actionButton.dataset.aiProvider || "");
      return;
    }

    if (action === "copy-prompt") {
      copyCurrentPrompt();
      return;
    }

    if (action === "copy-template") {
      copyWritingTemplate(actionButton.dataset.templateCopy || "", actionButton);
      return;
    }

    if (action === "clear-writing") {
      const key = actionButton.dataset.writingKey || "";
      const input = document.querySelector("[data-word-input='" + key + "']");
      if (input) {
        input.value = "";
        renderWordCount(key);
        input.focus();
      }
      return;
    }

    if (action === "print-checklist") {
      window.print();
      return;
    }

    if (action === "show-all-vocabulary") {
      state.vocabFilter = "all";
      state.vocabCurrentId = "";
      state.vocabMeaningVisible = false;
      renderVocabulary();
      return;
    }

    if (action === "vocab-reveal") {
      state.vocabMeaningVisible = !state.vocabMeaningVisible;
      renderVocabulary();
      return;
    }

    if (action === "vocab-previous") {
      moveVocabulary(-1);
      return;
    }

    if (action === "vocab-next") {
      moveVocabulary(1);
      return;
    }

    if (action === "vocab-random") {
      const items = getFilteredVocabulary();
      if (items.length === 0) return;
      state.vocabCurrentId = items[Math.floor(Math.random() * items.length)].id;
      state.vocabMeaningVisible = false;
      renderVocabulary();
    }
  });

  aiGradingDialog?.addEventListener("click", (event) => {
    if (event.target === event.currentTarget) closeAiGradingDialog();
  });
  aiGradingDialog?.addEventListener("cancel", (event) => {
    event.preventDefault();
    closeAiGradingDialog();
  });
  aiGradingDialog?.addEventListener("close", () => {
    aiGradingDialog.classList.remove("ai-grading-dialog-fallback-open");
    restoreAiGradingFocus();
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && aiGradingDialogOpen) {
      event.preventDefault();
      closeAiGradingDialog();
      return;
    }
    trapAiGradingDialogFocus(event);
  });

  initializePremiumBonus();
})();
