(() => {
  const PREMIUM_TIER = "premium";
  const SYNC_VERSION = "20260817-v1";

  function findQuestion(pages, id) {
    for (const page of pages || []) {
      const question = (page.questions || []).find((item) => Number(item.id) === Number(id));
      if (question) return question;
    }
    return null;
  }

  function applySampleReadingExplanationFixes() {
    const sample = window.scbtGrade2Set01 || {};

    const q19 = findQuestion(sample.readingPages, 19);
    if (q19) {
      q19.explanation =
        "正答は3. For this reason です。前文では、雨・丘・周囲の騒音によってドラムの音が聞き取りにくくなり、さらに言語を知らない人には誤解される可能性があると説明されています。そのため、同じ話し方のパターンや社会的知識を共有する共同体どうしで最もよく機能した、という因果関係になります。\n\n1 By comparison は『比較すると』、2 Before long は『まもなく／やがて』、4 Nevertheless は『それにもかかわらず』という意味で、この因果関係には合いません。";
      q19.explanationTier = PREMIUM_TIER;
      q19.explanationSyncVersion = SYNC_VERSION;
    }

    const q22 = findQuestion(sample.readingPages, 22);
    if (q22) {
      q22.explanation =
        "正答は2. In addition です。直前では、人工の光によって昆虫が上下の感覚を乱され、旋回したり急上昇したりすることが説明されています。続く文では、照明の向きによって混乱の大きさが異なるという追加情報が示されるため In addition が最も自然です。\n\n1 For example は『例えば』、3 Nevertheless は『それにもかかわらず』、4 As a result は『その結果』です。ここでは具体例・逆接・直接の結果ではなく、研究結果をもう一つ付け加える流れです。";
      q22.explanationTier = PREMIUM_TIER;
      q22.explanationSyncVersion = SYNC_VERSION;
    }
  }

  function applyListeningExplanationFixes() {
    const set04 = (window.scbtGrade2VocabSets || []).find((set) => set?.key === "set-04");
    const question = (set04?.listeningQuestions || []).find((item) => Number(item.id) === 19);
    if (!question) return;

    question.explanation = `【正答】1. Staff members will practice emergency procedures.
【聞き取りの決め手】台本の “The Westside Swimming Pool will open one hour later than usual this Saturday because staff members will be practicing emergency procedures.” が理由を直接示しています。
【内容整理】土曜日は職員が緊急時の手順を練習するため、プールの開館が通常より1時間遅くなります。午前9時のレッスンは10時開始へ変更されますが、閉館時刻は通常どおりです。
【誤答分析】2は新しいインストラクターの研修とは述べていません。3の修理工事、4の貸切レースも台本にはありません。
【学習ポイント】Why 型では、変更された時刻そのものではなく because の後に示される原因を取ります。`;
    question.studyPoint = "Why 型では because の後に続く原因を優先して聞き、時刻変更そのものと理由を混同しない。";
    question.explanationTier = PREMIUM_TIER;
    question.explanationSyncVersion = SYNC_VERSION;
  }

  const COMMON_PRONUNCIATION_WORDS = new Set([
    "because",
    "people",
    "before",
    "without",
    "another",
    "however",
    "according",
    "question",
  ]);

  function pickPronunciationWords(text, limit = 4) {
    const words = String(text || "").match(/[A-Za-z]+(?:[-'][A-Za-z]+)*/g) || [];
    const seen = new Set();
    const preferred = [];
    const fallback = [];

    for (const word of words) {
      const key = word.toLowerCase();
      if (seen.has(key) || COMMON_PRONUNCIATION_WORDS.has(key)) continue;
      seen.add(key);
      if (word.length >= 8) preferred.push(word);
      else if (word.length >= 6) fallback.push(word);
    }

    return [...preferred, ...fallback].slice(0, limit);
  }

  function firstSentence(text) {
    const normalized = String(text || "").trim();
    if (!normalized) return "";
    const match = normalized.match(/^.*?[.!?](?:\s|$)/);
    return (match?.[0] || normalized).trim();
  }

  function buildSpeakingExplanation(step) {
    const label = String(step?.label || "");
    const question = String(step?.questionText || "").trim();
    const modelAnswer = String(step?.modelAnswer || "").trim();

    if (label === "Warm-up") {
      return `【質問】${question || "ウォームアップの質問に答えます。"}
【答え方】質問に直接1文で答えます。余裕があれば、場所・時・理由などを短く一つ加えます。
${modelAnswer ? `【解答例】${modelAnswer}\n` : ""}【評価上の位置づけ】これはこのアプリ独自のマイク確認用ウォームアップで、公式面接の採点対象ではありません。`;
    }

    if (label === "Silent Reading") {
      const sentence = firstSentence(step.cardText);
      return `【20秒で見る順番】タイトルで話題をつかみ、各文の主語と動詞、方法・理由を表す箇所、this / these / such / In this way などの指示表現を確認します。
${sentence ? `【読み始めの確認】第1文は “${sentence}” です。まず主題をつかんでから、No.1 の根拠になりそうな文を探します。\n` : ""}【準備の目的】全文を和訳するのではなく、音読の区切りとNo.1の根拠位置を先に見つけます。`;
    }

    if (label === "Read Aloud") {
      const sentence = firstSentence(step.cardText);
      const words = pickPronunciationWords(step.cardText);
      return `【読み方】意味のまとまりごとに区切り、主語と動詞の関係が聞き手に伝わる速さで読みます。
${sentence ? `【第1文】“${sentence}” を一息で急がず、意味の切れ目で自然に区切ります。\n` : ""}${words.length ? `【発音チェック】${words.join("、")} などの強勢・語末を意識します。\n` : ""}【評価の考え方】速さより、聞き取れる発音・自然な区切り・文末まで読み切ることを優先します。言い直しても長く止まらず続けます。`;
    }

    if (label === "No.1") {
      const evidence = String(step.answerEvidence || "").trim();
      const isWhy = /^why\b/i.test(question.replace(/^According to the passage,\s*/i, ""));
      return `【質問】${question}
${evidence ? `【正答の根拠】${evidence}\n` : ""}【答え方】${isWhy ? "Why 型なので Because + 主語 + 動詞で原因を直接答えます。" : "How 型・方法を問う問題では By + 動名詞などで、方法を直接答えると明確です。"}
${modelAnswer ? `【解答例】${modelAnswer}\n` : ""}【注意】本文を丸暗記する必要はありません。質問が求める方法・理由の中心語を落とさず、指示語がある場合は一文前まで戻って内容を復元します。`;
    }

    if (label === "No.2") {
      const story = step.pictureStory || {};
      const sequence = [
        story.openingSentence ? `冒頭文 “${story.openingSentence}”` : "カード指定の冒頭文",
        story.firstSpeech ? `${story.firstSpeechSpeaker || "人物"} の発言 “${story.firstSpeech}”` : "1コマ目の発言・行動",
        story.firstTimeLabel || "2コマ目",
        story.secondTimeLabel || "3コマ目",
      ].join(" → ");
      return `【場面の順序】${sequence} の順に説明します。
【必須要素】人物・行動・時間順を落とさず、地の文は基本的に過去形、絵の途中の動作は was / were + -ing を使うと自然です。
${modelAnswer ? `【解答例】${modelAnswer}\n` : ""}【評価の考え方】解答例との完全一致は不要です。現在表示されている3コマの人物・行動・順序に合っていて、英語として意味が通れば成立します。絵にない原因や感情を作り足さないようにします。`;
    }

    if (label === "No.3") {
      return `【質問】${question}
【答え方】I agree. / I disagree. などで立場を先に示し、その判断を支える理由を一つ以上続けます。
${modelAnswer ? `【解答例】${modelAnswer}\n` : ""}【評価の考え方】賛否そのものに唯一の正解はありません。現在の質問に直接答え、立場と理由が矛盾せず、理由が具体化されていれば成立します。`;
    }

    if (label === "No.4") {
      return `【質問】${question}
【答え方】Yes. / No. を先に言い、because または続く文で日常生活に基づく理由を示します。
${modelAnswer ? `【解答例】${modelAnswer}\n` : ""}【評価の考え方】一つの理由でも回答は成立しますが、余裕があれば理由を具体化したり、異なる二つ目の理由や短い具体例を加えます。現在の質問と関係のない別テーマへずれないことを最優先にします。`;
    }

    return String(step?.explanation || "");
  }

  function syncSpeakingExplanations() {
    for (const speakingSet of window.scbtGrade2SpeakingSets || []) {
      for (const step of speakingSet.speakingSteps || []) {
        const explanation = buildSpeakingExplanation(step);
        if (!explanation) continue;
        step.explanation = explanation;
        step.explanationTier = PREMIUM_TIER;
        step.explanationSyncVersion = SYNC_VERSION;
        if (step.label === "No.1") {
          step.studyPoint = "質問が求める方法・理由を本文から特定し、this・these・such などの指示語は一文前まで戻って復元する。";
        } else if (step.label === "No.2") {
          step.studyPoint = "現在表示されている3コマの人物・行動・時間順を守り、カード指定の冒頭文から過去形中心で説明する。";
        } else if (step.label === "No.3" || step.label === "No.4") {
          step.studyPoint = "現在の質問に直接答え、立場を先に示してから、その立場を支える具体的な理由を続ける。";
        }
      }
    }
  }

  applySampleReadingExplanationFixes();
  applyListeningExplanationFixes();
  syncSpeakingExplanations();
})();
