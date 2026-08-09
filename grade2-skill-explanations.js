(() => {
  const PREMIUM_TIER = "premium";
  const grade2Set01 = window.scbtGrade2Set01 || {};
  const grade2Sets = Array.isArray(window.scbtGrade2VocabSets) ? window.scbtGrade2VocabSets : [];
  const contentSets = [{ key: "sample", data: grade2Set01 }, ...grade2Sets.map((data) => ({ key: data.key, data }))];
  const listeningEvidenceOverrides = {
    "sample:4":
      "A: I finished my section early. I can review those figures after lunch if that would help.",
    "sample:9":
      "B: Hello. I have an appointment at ten tomorrow, but my train has been canceled. A: I can move your appointment to two thirty, or you can come Thursday morning.",
    "sample:15": "B: Oh, it's the coffee maker I ordered. I thought it would arrive tomorrow.",
    "sample:22":
      "With permission from the garden manager, he connected a barrel to the roof’s drainpipe. The stored water is now used for flowers, while vegetables are still watered from the regular supply for safety.",
    "sample:23":
      "In college, she discovered that sound designers create background noise for films and games. She visited a small studio, where a designer showed her how ordinary objects can produce unusual effects. That experience led Elena to apply for a summer internship in professional audio production.",
    "sample:28":
      "His sister could visit the bakery, but she did not know which order to collect. Marcus forwarded her the confirmation message and asked her to pick it up on his behalf.",
    "set-02:3": "A: It could, but nobody will be home before six, and the bakery closes at five thirty.",
    "set-02:1":
      "B: I borrowed one pair for the science club demonstration and left it in my locker. A: Could you return it to the lab office before third period?",
    "set-02:8":
      "B: Could you make a new one with oat milk? Please use the same size and no sugar.",
    "set-02:9":
      "A: Hello. My cat has an appointment tomorrow afternoon, but she has stopped eating since this morning. B: The veterinarian can see her at eleven today if you can come then.",
    "set-02:10":
      "A: I can help pack them, but my car is too small to carry everything to the storage room. B: My uncle's van is available. I'll collect the boxes once the tables are folded.",
    "set-02:12":
      "B: The early ferry reaches the island at nine thirty. The later one doesn't arrive until ten forty. A: Then we should take the early ferry and have coffee near the harbor while we wait.",
    "set-02:13": "B: Use only the first clip. The other two give almost the same advice and take too much time.",
    "set-02:26":
      "Ben suggested arriving there before the usual dinner rush, and the family agreed to eat earlier than originally planned.",
    "set-02:27":
      "Trees in cities can make streets more comfortable during hot weather. Their leaves block some sunlight, while water released from the leaves can cool the surrounding air.",
    "set-03:3": "B: She planned to, but her professor added a laboratory session this afternoon.",
    "set-03:8":
      "A: I ordered a chocolate cake with strawberries, but this box contains a lemon cake. B: I'm sorry. Another customer has a similar name, and the boxes were probably switched. A: Could you bring the correct cake before my party starts at three?",
    "set-03:12":
      "B: The hotel rents bicycles, and there are bike paths along the river and through the old town. A: Let's use those.",
    "set-03:18":
      "Her story was more interesting than the cooking process itself. Ethan therefore changed his project into an audio report about how family recipes change over time.",
    "set-03:19":
      "Materials such as steel and concrete expand when they become warm and shrink when they cool. The gaps allow the bridge sections to move slightly without pushing hard against one another.",
    "set-03:20":
      "He suggested a freestanding bookcase, although the first model was too wide for the room. Lila selected a narrower one and used the remaining wall space for a small desk lamp.",
    "set-03:23":
      "Members then told a short story connected to the object. The activity gave them a clear starting point, and more members began speaking during each weekly meeting.",
    "set-03:26":
      "These organisms need both moisture and air to work well. If a compost pile is packed too tightly, not enough air can move through it. Turning the material regularly mixes in air and can help the contents break down more evenly and quickly over time.",
    "set-03:25":
      "The company’s accountant replied that its official business name had recently changed, so the document could not be processed. The amount and payment date were correct. Noah replaced only the company name, sent the invoice again, and soon received an email confirming that it had been accepted.",
    "set-03:30":
      "Isabel’s cousin offered her a similar jacket that fit well. She borrowed it for the ceremony and collected her own jacket from the tailor the following week.",
    "set-04:1":
      "A: Could you meet me there at one? I have the key, and we can take the boards to the hall together.",
    "set-04:7":
      "B: I have to leave at six. Can someone come tomorrow morning instead? A: Yes. We have an opening between nine and eleven, and there will be no extra charge.",
    "set-04:9":
      "A: Hello. My piano lesson is at five tomorrow, but the school has scheduled a parent meeting at the same time. B: I could teach you at seven tomorrow, or we could move the lesson to Saturday morning.",
    "set-04:10":
      "A: I'll count the rabbits in the open field, but we need someone to check the wooded trail. B: I can do that after I finish at the lake.",
    "set-04:12":
      "B: The express train takes thirty-five minutes and stops beside our hotel. A: Let's take the train.",
    "set-04:13":
      "A: The opening includes a long story about how the team chose its name. B: Remove that story and begin with the captain's interview.",
    "set-04:14": "A: I can't that night. My department is giving an online presentation to our London office at seven.",
    "set-04:16":
      "After testing several ideas, the students borrowed a projector from the media room. They created digital backgrounds that could change quickly between scenes during the performance.",
    "set-04:19":
      "Their leaves provide shade, reducing the amount of sunlight that reaches roads and buildings during the day. Trees also release water into the air through their leaves.",
    "set-05:1":
      "B: Do you still have the original file on your camera? A: Yes. Could you upload it in the computer room during lunch?",
    "set-05:3":
      "A: He was, but his car won't start, and the repair shop can't look at it until tomorrow.",
    "set-05:6":
      "Naomi has a camera with a long lens, but we only have one pair of binoculars. B: My father has an extra pair in his car. I'll ask to borrow them tonight.",
    "set-05:8":
      "B: You're right, but the kitchen added almond sauce to this plate by mistake. A: I have a nut allergy. Could you bring another serving without the sauce and use a clean plate?",
    "set-05:9":
      "B: Hello, this is Room Five Twenty. My key card suddenly stopped opening the door. A: I'm sorry. Cards sometimes stop working when they are kept near a phone. B: I'm in the lobby now. Can I get a replacement, or does someone need to check the lock?",
    "set-05:12":
      "A: The guesthouse offers a shuttle that meets the eleven ten train if guests reserve by Friday. B: Let's use the shuttle.",
    "set-05:13":
      "B: I also described every event in the final chapter in a full page. A: Shorten that plot summary to two or three sentences.",
    "set-05:15":
      "B: Really? The seller's description said the guitar would come without a case. A: There isn't an extra charge on the receipt, and the case looks almost new.",
    "set-05:20":
      "Yasmin had enough metal tins for twenty-five candles, but no safe containers for the rest. Rather than canceling her booth, she told the organizer that she would bring a smaller number of candles.",
    "set-05:19":
      "When salt is spread on an icy walkway, it mixes with a thin layer of water on the ice. This mixture freezes at a lower temperature than plain water.",
    "set-05:23":
      "Felix wiped each packet with a dry cloth before adding a new label. After that, the labels stayed in place.",
  };

  const stopWords = new Set([
    "a",
    "an",
    "and",
    "are",
    "as",
    "at",
    "be",
    "because",
    "been",
    "but",
    "by",
    "can",
    "could",
    "did",
    "do",
    "does",
    "for",
    "from",
    "had",
    "has",
    "have",
    "he",
    "her",
    "hers",
    "him",
    "his",
    "how",
    "i",
    "in",
    "is",
    "it",
    "its",
    "many",
    "more",
    "most",
    "of",
    "on",
    "or",
    "our",
    "she",
    "should",
    "some",
    "than",
    "that",
    "the",
    "their",
    "them",
    "there",
    "they",
    "this",
    "to",
    "was",
    "we",
    "were",
    "what",
    "when",
    "where",
    "which",
    "who",
    "why",
    "will",
    "with",
    "would",
    "you",
    "your",
  ]);

  function normalizeStem(word) {
    if (word.length > 5 && word.endsWith("ies")) return `${word.slice(0, -3)}y`;
    let stem = word;
    if (stem.length > 4 && /(ches|shes|xes|zes|sses)$/.test(stem)) stem = stem.slice(0, -2);
    else if (stem.length > 3 && stem.endsWith("s") && !stem.endsWith("ss")) stem = stem.slice(0, -1);
    if (stem.length > 5 && stem.endsWith("ing")) return stem.slice(0, -3);
    if (stem.length > 4 && stem.endsWith("ed")) return stem.slice(0, -2);
    return stem;
  }

  function tokenizeEnglish(value) {
    return (String(value || "").toLowerCase().match(/[a-z0-9]+/g) || [])
      .filter((word) => !stopWords.has(word))
      .map(normalizeStem);
  }

  function splitScript(script) {
    return String(script || "")
      .replace(/\s+(?=[A-Z]:\s)/g, "\n")
      .split(/(?<=[.!?])\s+|\n+/)
      .map((part) => part.trim())
      .filter(Boolean);
  }

  function selectListeningEvidence(question, setKey) {
    const override = listeningEvidenceOverrides[`${setKey}:${question.id}`];
    if (override) return override;
    const units = splitScript(question.script);
    if (units.length === 0) return "";

    const correctChoice = question.choices?.[question.correct - 1] || "";
    const correctTokens = new Set(tokenizeEnglish(correctChoice));
    const explanationTokens = new Set(tokenizeEnglish(question.explanation));
    const questionTokens = new Set(tokenizeEnglish(question.questionText || question.text));

    const questionText = String(question.questionText || question.text || "").toLowerCase();
    const ranked = units.map((unit, index) => {
      const unitTokens = new Set(tokenizeEnglish(unit));
      let score = 0;
      for (const token of correctTokens) if (unitTokens.has(token)) score += 6;
      for (const token of explanationTokens) if (unitTokens.has(token)) score += 1.5;
      for (const token of questionTokens) if (unitTokens.has(token)) score += 0.4;
      if (questionText.startsWith("why") && /\b(because|so|therefore|since|due to|as a result)\b/i.test(unit)) score += 3;
      if (questionText.startsWith("when") && /\b(today|tomorrow|yesterday|morning|afternoon|evening|monday|tuesday|wednesday|thursday|friday|saturday|sunday|\d{1,2}(?::\d{2})?)\b/i.test(unit)) score += 1.5;
      if (questionText.startsWith("where") && /\b(at|in|inside|outside|near|behind|upstairs|downstairs|station|office|room|hall|store|center)\b/i.test(unit)) score += 1;
      if (question.part === "Part 1") score += index / Math.max(units.length, 1) / 2;
      return { unit, index, score };
    });

    ranked.sort((a, b) => b.score - a.score || b.index - a.index);
    return ranked[0]?.unit || units.at(-1) || "";
  }

  function isGenericListeningExplanation(value) {
    const explanation = String(value || "").trim();
    return (
      !explanation ||
      /正答は?\s*\d|に当たる内容を選びます|本文では.+説明されています/.test(explanation)
    );
  }

  function getListeningQuestionType(questionText) {
    const normalized = String(questionText || "").trim().toLowerCase();
    if (normalized.startsWith("why")) return "Why 型なので、出来事そのものではなく、その原因・目的を示す部分まで確認します。";
    if (normalized.startsWith("how")) return "How 型なので、結果だけでなく、方法・手段・変化を表す動作を答えにします。";
    if (normalized.startsWith("when")) return "When 型なので、似た予定が複数出ても、質問された出来事に対応する日時だけを選びます。";
    if (normalized.startsWith("where")) return "Where 型なので、出発地・経由地ではなく、質問された人物や物の最終的な場所を確認します。";
    if (/what (?:will|does|did|should|must|can)/.test(normalized)) {
      return "What + 動詞型なので、質問の主語と時制を合わせ、提案・予定・実際の行動のどれを問うか見分けます。";
    }
    return "疑問文の主語と動詞を先に押さえ、台本中の同じ人物・時点・対象に対応する情報を選びます。";
  }

  function makeListeningStudyPoint(question) {
    if (question.part === "Part 1") {
      return "会話の「最初の問題→途中の提案や条件→最後の合意・行動」を追い、単語が聞こえただけの選択肢ではなく、質問への最終回答を選ぶ。";
    }
    return "放送の話題を先に捉え、but・however・instead・because・therefore などの後に来る決定的な情報を、主語・条件・時点まで選択肢と照合する。";
  }

  function buildListeningExplanation(question, setKey) {
    const correctChoice = question.choices?.[question.correct - 1] || "";
    const evidence = selectListeningEvidence(question, setKey);
    const baseExplanation = String(question.explanation || "").trim();
    const contentSummary = isGenericListeningExplanation(baseExplanation)
      ? `設問は「${question.questionText || question.text || ""}」を尋ねています。台本の根拠と正答の内容が同じ意味になることを確認します。`
      : baseExplanation;
    const wrongChoices = (question.choices || [])
      .map((choice, index) => ({ choice, number: index + 1 }))
      .filter(({ number }) => number !== question.correct)
      .map(({ choice, number }) => `${number}「${choice}」`)
      .join("、");
    const evidenceText = evidence
      ? `台本の “${evidence}” が決め手です。ここが ${question.correct}「${correctChoice}」と同じ内容です。`
      : `台本全体の流れから、${question.correct}「${correctChoice}」が質問への直接の答えになります。`;

    return `【正答】${question.correct}. ${correctChoice}
【聞き取りの決め手】${evidenceText}
【内容整理】${contentSummary}
【誤答の見分け方】${wrongChoices}は、台本中に似た語が出る場合でも、設問が尋ねる人物・理由・時点・条件・最終結果のいずれかが一致しません。
【設問の型】${getListeningQuestionType(question.questionText || question.text)}`;
  }

  for (const { key, data } of contentSets) {
    for (const question of data.listeningQuestions || []) {
      if (!Number.isInteger(question.correct) || !Array.isArray(question.choices)) continue;
      if (question.explanationTier !== PREMIUM_TIER) {
        question.explanation = buildListeningExplanation(question, key);
        question.studyPoint = makeListeningStudyPoint(question);
        question.explanationTier = PREMIUM_TIER;
      }
    }
  }

  function countEnglishWords(value) {
    return (String(value || "").trim().match(/[A-Za-z0-9]+(?:['’-][A-Za-z0-9]+)*/g) || []).length;
  }

  const writingGuides = {
    sample: {
      summary: `【要点の取り方】第1段落で repair clubs の仕組み、第2段落で利点、第3段落で運営上の問題を探します。要約では自分の賛否や修理クラブの新しいアイデアは加えません。
【本文から残す情報】利点は、実用的な技術を学ぶこと、製品の作られ方や廃棄を減らす意識を得ること、地域の大人と交流できることです。問題は、危険な修理には知識のある大人が必要で、部品代と時間がかかり、受け入れる品物の明確なルールも必要なことです。
【模範解答の構成】1文目と2文目で学習面・環境面・地域交流の利点をまとめ、3文目で安全・費用・時間・ルールの問題へ切り替えています。模範解答は{WORD_COUNT}語で、45〜55語の指定内です。
【採点上の注意】benefits だけで終わらず difficulties も入れます。「どんな物でも生徒だけで修理できる」と本文以上に一般化しないこと。small radios などの例を並べるより、上位概念の practical skills や useful items にまとめます。
【使える言い換え】fix broken items → make broken items useful again、throw items away → waste useful items、adults who know how to use tools safely → skilled adults`,
      essay: `【問いの確認】図書館や地域センターに、勉強・仕事用の静かな場所を設けることがよいかを問う意見論述です。I think ... で賛否を明示し、異なる理由を二つ示します。
【模範解答の構成】First では集中しやすいことを述べ、宿題中に会話や電話に邪魔されない例を加えています。Second では、自宅が混雑・騒がしい人にも適切な作業場所を提供できるという公平性を扱い、最後に公共施設が地域全体を支えられると結んでいます。
【理由の深め方】quiet だから good で止めず、「誰が」「どの場面で」「どう助かるか」まで書きます。Cost を使って反対を書く場合は、設置費や管理費を一つの理由にできますが、同じ理由の言い換えを二つに数えません。
【語数と採点】模範解答は{WORD_COUNT}語で、80〜100語の指定内です。内容・構成・語彙・文法の四観点を意識し、立場、理由1、具体例、理由2、結論の順を保ちます。
【別解】反対でも、既存スペースが減ることや防音・管理費を二つの独立した理由として論理的に説明できれば成立します。`,
    },
    "set-02": {
      summary: `【要点の取り方】food-sharing shelves の仕組みを一文で示し、第2段落の利点と第3段落の管理上の問題を対比します。本文の問い What are the advantages...? の後だけでなく、On the other hand 以降も必ず拾います。
【本文から残す情報】利点は、まだ安全な食品の廃棄を減らすこと、食費を抑えたい人を支えること、地域交流につながることです。問題は、日付が不明な食品や冷蔵が必要な食品の安全管理、受入れルール、定期確認がなければ信頼を失うことです。
【模範解答の構成】1文目で仕組み、2文目で三つの利点、3・4文目で安全性・ルール・信頼の問題をまとめています。模範解答は{WORD_COUNT}語で、45〜55語の指定内です。
【採点上の注意】leave unopened food とあるため、食べ残しを何でも置ける制度とは書きません。volunteers が確認する点と、利用者が trust を失う結果を因果で結ぶと正確です。
【使える言い換え】be thrown away → become waste、spend less on groceries → lower grocery costs、checked regularly → inspected often`,
      essay: `【問いの確認】チケットアプリが「よいか」ではなく、将来さらに利用者が増えるかを予測する問題です。冒頭は I think more people will ... のように、未来への判断を直接示します。
【模範解答の構成】First では24時間購入・行列回避・複数券の保存という利用者側の利便性、Second では座席・支払い・予定変更の管理という会社側の利点を述べています。最後にスマートフォンの使いやすさと決済の安全性を、普及を後押しする条件として結んでいます。
【理由の深め方】Convenience と Management を別理由にしており、同じ「便利」を繰り返していません。Security や Older people を使う場合も、将来の増減にどう影響するかまで書きます。
【語数と採点】模範解答は{WORD_COUNT}語で、80〜100語の指定内です。will を使った予測、二理由、具体的な効果、結論がそろっています。
【別解】増えないという立場でも、個人情報・不正利用への不安と、スマートフォン操作が難しい利用者の存在を別々に説明できれば成立します。`,
    },
    "set-03": {
      summary: `【要点の取り方】online museum tours の利用方法を短く示し、アクセス面の利点と、画面・通信・制作面の限界をまとめます。具体例を全部写さず、同じ種類の情報を一つの表現へ圧縮します。
【本文から残す情報】利点は、遠方や移動が難しい人も利用でき、学校が交通費や入館料なしで使え、拡大画像や追加説明を自分の速さで見られることです。限界は、実物の大きさ・質感を十分伝えられず、通信問題があり、制作に時間・機材・技能が必要なことです。
【模範解答の構成】1文目でアクセスと学習情報の利点、2文目で画面では失われる実物感、3文目で通信と制作コストをまとめています。模範解答は{WORD_COUNT}語で、45〜55語の指定内です。
【採点上の注意】online tours が実物見学を完全に置き換えるとは本文にありません。close-up images は利点ですが、size or texture を完全に示せないという限界と混同しないこと。
【使える言い換え】have difficulty traveling → cannot travel easily、at their own speed → at their own pace、requires special equipment → needs special equipment`,
      essay: `【問いの確認】環境保護に関わる会社で働く人が将来増えるかを予測します。環境保護が大切だという一般論だけでなく、「その会社を就職先に選ぶ人の数」へ理由を結び付けます。
【模範解答の構成】First では価値観に合う仕事を望む若者と仕事の目的意識、Second では環境配慮型の商品・サービスへの需要増と必要人材を説明しています。大学等の学習機会が増えて技能を持つ人が育つことを、将来予測の補強に使っています。
【理由の深め方】Career choices と Demand は別の因果です。「働きたい人が増える側」と「企業が雇いたい側」を組み合わせているため説得力があります。
【語数と採点】模範解答は{WORD_COUNT}語で、80〜100語の指定内です。will increase の立場、二つの理由、具体例、Therefore の結論が明確です。
【別解】増えないと考える場合は、専門技能を持つ人材の不足や、関連職の数・給与が限られる可能性を、将来の人数に結び付けて説明します。`,
    },
    "set-04": {
      summary: `【要点の取り方】clothing rental services の仕組みを示し、第2段落から利用者・環境面の利点、第3段落から会社・利用者双方の問題を取ります。
【本文から残す情報】利点は、購入せず様々な服を試せるため費用と収納を抑え、同じ服を複数人が使うことで廃棄を減らせることです。問題は、検品・洗浄の費用と時間、破損・返却遅れ、サイズや在庫の不足です。
【模範解答の構成】1文目で費用・収納、2文目で再利用と廃棄削減、3文目で管理コスト・サイズ・在庫をまとめています。模範解答は{WORD_COUNT}語で、45〜55語の指定内です。
【採点上の注意】special events は導入例であり中心要点ではありません。「レンタルなら必ず安い」「必ず廃棄がなくなる」と断定せず、may reduce の程度を保ちます。
【使える言い換え】without buying every item → while buying fewer clothes、need less storage space → keep fewer clothes at home、be unavailable → not be available`,
      essay: `【問いの確認】荷物受取ロッカーの設置がよいかを問う問題です。賛否を最初に示し、Convenience・Safety・Cost などから重ならない二理由を選びます。
【模範解答の構成】First では不在時でも後で受け取れる利便性、Second では雨や盗難から守り、暗証番号で本人だけが開けられる安全性を説明しています。最後に再配達削減という配送会社側の効果も加えています。
【理由の深め方】「便利」「安全」だけで終えず、after school or work、protect packages from rain、receive a code のように仕組みと場面を具体化しています。
【語数と採点】模範解答は{WORD_COUNT}語で、80〜100語の指定内です。二理由が明確で、具体例から Therefore の結論へ自然につながっています。
【別解】反対でも、設置・保守費用と、暗証番号漏えい・容量不足などを別理由として具体的に説明できれば成立します。`,
    },
    "set-05": {
      summary: `【要点の取り方】paid volunteer days の制度を一文で説明し、第2段落の地域・社員・会社への利点と、第3段落の通常業務・受入れ団体への負担を対比します。
【本文から残す情報】利点は、人手不足の地域団体を助け、社員が通常業務外の技能を学び、他部署の同僚と交流し、会社と地域の関係を強めることです。問題は、残る社員の仕事が増え、団体側に活動計画と経験差のある参加者の監督が必要なことです。
【模範解答の構成】1・2文目で三者への利点、However 以降で職場の負担と団体の準備・監督をまとめています。模範解答は{WORD_COUNT}語で、45〜55語の指定内です。
【採点上の注意】社員が休日に無給で活動する制度ではなく paid workdays です。poorly organized の結果だけでなく、その原因となる planning と supervising を残すと要点が明確です。
【使える言い換え】not have enough staff → lack workers、meet coworkers from other departments → connect with coworkers outside their departments、become busier → have more regular work`,
      essay: `【問いの確認】本やゲームを映画・テレビ化することがよいかを問う意見論述です。作品の人気予測ではなく、adaptation そのものへの賛否を示します。
【模範解答の構成】First では普段原作に触れない人へ物語を届け、原作への関心も生むこと、Second では作家・俳優等への新しい収入を説明しています。最後に、原作の中心的な考えを丁寧に扱うという品質条件を加え、既存ファンと新規層の両方へ結び付けています。
【理由の深め方】Fans と Income を独立した理由にし、viewers may become interested in the original work、create new income の具体的な結果まで書いています。
【語数と採点】模範解答は{WORD_COUNT}語で、80〜100語の指定内です。立場、二理由、具体化、品質への条件、結論がそろっています。
【別解】反対でも、原作の重要部分が失われる品質問題と、既存ファンの期待を損なう問題を、具体例を伴って説明すれば成立します。`,
    },
  };

  for (const { key, data } of contentSets) {
    const guide = writingGuides[key];
    if (!guide) continue;
    for (const task of data.writingTasks || []) {
      if (task.explanationTier === PREMIUM_TIER && String(task.explanation || "").trim()) continue;
      const template = guide[task.kind];
      if (!template) continue;
      const wordCount = countEnglishWords(task.modelAnswer);
      task.explanation = template.replaceAll("{WORD_COUNT}", String(wordCount));
      task.studyPoint =
        task.kind === "summary"
          ? "第1段落の話題、第2段落の利点、第3段落の問題を先にメモし、本文にない意見を加えず45〜55語へ圧縮する。"
          : "TOPICへ直接答え、立場→理由1と具体化→理由2と具体化→結論の順で、異なる二理由を80〜100語にまとめる。";
      task.explanationTier = PREMIUM_TIER;
    }
  }

  const speakingGuides = {
    sample: {
      warmupModel: "I like to read mystery novels because I enjoy solving problems.",
      warmupPoint: "本の種類を一つ答え、because の後に短い理由を加える。",
      silentReading: "第3文の such libraries が第2文の libraries that lend simple tools を指し、第4文の In this way が「道具を借りること」を受ける流れを確認します。",
      chunks: "Some people need tools / for small repairs at home, / but they do not want to buy tools / they will rarely use.",
      pronunciation: "repairs、rarely、equipment、resources",
      no1Evidence: "Residents borrow hammers and other equipment from such libraries. In this way, they can finish repairs without buying new tools.",
      no1Reference: "such libraries は「simple tools を貸し出し始めた libraries」、In this way は「そこで道具を借りること」を指します。",
      no2: "冒頭文の後、Emi's brother の発言、図書館員がtoolboxを渡しEmiが用紙に記入する場面、家で兄が棚を直しEmiが支える場面の順です。",
      no3: "賛成を先に示し、短期間だけ必要な物を借りられる利便性と、地域の廃棄物を減らせる環境面を別々の理由にしています。",
      no4: "Yes の後に、家族から実用技能を学べることと、家庭で責任感を持てることを理由として続けています。",
    },
    "set-01": {
      warmupModel: "I usually go shopping at a supermarket near my house.",
      warmupPoint: "場所を一つ直接答え、near my house などの情報を一つ加える。",
      silentReading: "第3文の these stations が第2文の refill stations を指し、第4文の By doing so が「空ボトルを持参して補充すること」を受ける流れを確認します。",
      chunks: "Many stores want to reduce / the plastic containers / they throw away.",
      pronunciation: "containers、installed、refill stations、products",
      no1Evidence: "Customers bring empty bottles and fill them at these stations. By doing so, they can buy daily products without using new plastic containers.",
      no1Reference: "these stations は soap and shampoo の refill stations、By doing so は空ボトルを持参して補充する行動を指します。",
      no2: "指定の冒頭文、Maya's father の発言、店員が使い方を示しMayaが補充する場面、家でボトルが漏れ父親が床を拭く場面の順です。",
      no3: "賛成を先に示し、plastic waste の削減と、買い方を意識するようになる効果を別々の理由として述べています。",
      no4: "Yes の後に、plastic bags を減らせる環境面と、丈夫で運びやすい実用面を続けています。",
    },
    "set-02": {
      warmupModel: "I last visited a museum during my summer vacation.",
      warmupPoint: "last visit を聞かれているため、during my summer vacation や last month のような過去の時を答える。",
      silentReading: "第3文の these tickets が第2文の digital tickets を指し、第4文の By doing so が「到着前にスマートフォンへ保存すること」を受ける流れを確認します。",
      chunks: "Many museums want visitors / to spend less time waiting / at entrances.",
      pronunciation: "museums、entrances、digital tickets、websites",
      no1Evidence: "Visitors save these tickets on their phones before they arrive. By doing so, they can enter museums without standing in long ticket lines.",
      no1Reference: "these tickets は museum websites の digital tickets、By doing so は到着前にスマートフォンへ保存する行動を指します。",
      no2: "指定の冒頭文、Rina の発言、博物館でスマートフォンの券を読み取る場面、親子がロボット展示を見て母親が写真を撮る場面の順です。",
      no3: "賛成を先に示し、見学の利便性と、複数言語で情報を提供できる学習支援を別理由にしています。",
      no4: "Yes の後に、教科書だけでは理解しにくいことを学べる点と、歴史・科学への関心が高まる点を続けています。",
    },
    "set-03": {
      warmupModel: "My mother usually buys groceries, and I sometimes help her.",
      warmupPoint: "Who を聞かれているため家族の人物を主語にし、必要なら自分の手伝いを一文加える。",
      silentReading: "第3文の such services が第2文の home delivery を指します。However で問題を提示し、so の後にスーパーの対応が続く因果を確認します。",
      chunks: "More people are ordering groceries online, / including older people / who have difficulty carrying heavy bags.",
      pronunciation: "groceries、including、customers、confidently、convenient",
      no1Evidence: "However, many older customers are not familiar with such services, so supermarkets provide simple guides and telephone support.",
      no1Reference: "such services は supermarkets が食料品を家庭へ届けるサービスです。so の前が支援を行う理由、後が結果です。",
      no2: "指定の冒頭文、Kenta の発言、祖母が野菜を選びKentaがサイト操作を教える場面、翌日に配達員が祖母へ食料品の袋を渡しKentaがそばにいる場面の順です。",
      no3: "賛成を先に示し、オンライン操作に慣れていない高齢者がいることと、支援により安全に必要品を買えることを因果でつないでいます。",
      no4: "Yes の後に、一日の出来事を話して理解を深められることと、健康的な食習慣につながることを述べています。",
    },
    "set-04": {
      warmupModel: "I usually eat rice, vegetables, and chicken for lunch.",
      warmupPoint: "昼食の内容を具体的な食べ物で答える。usually を使うと質問の習慣に自然に対応できる。",
      silentReading: "第3文の these sizes が第2文の several portion sizes を指し、第4文の In this way が「食べる前に量を選ぶこと」を受ける流れを確認します。",
      chunks: "Some schools are trying / to reduce the amount of food / thrown away at lunchtime.",
      pronunciation: "reduce、amount、portion sizes、environment、receive",
      no1Evidence: "Before eating, students choose one of these sizes carefully. In this way, they can leave less food on their plates.",
      no1Reference: "these sizes は several portion sizes、In this way は食べる前に自分に合う量を選ぶ行動を指します。",
      no2: "指定の冒頭文、Aoi の発言、Aoiが完食する一方で友人のトレーには多くの食事が残っている場面、食後にAoiが空のトレーを返し友人が残りを捨てる場面の順です。",
      no3: "賛成を先に示し、自分が食べられる量を本人が知っていることと、廃棄削減・責任ある判断につながることを述べています。",
      no4: "Yes の後に、料理が日常生活に必要な技能であることと、健康的な食品選びを学べることを理由にしています。",
    },
    "set-05": {
      warmupModel: "Yes, there is a small park near my home.",
      warmupPoint: "Is there ...? には Yes, there is. / No, there isn't. で直接答え、場所や大きさを一つ加える。",
      silentReading: "第3文の such problems が第2文の narrow paths を指します。so の前に住民の懸念、後に市職員の改善行動が置かれています。",
      chunks: "Local parks are important places / for exercise and relaxation, / but some people cannot use them easily.",
      pronunciation: "relaxation、wheelchairs、concerned、improvements、disabilities",
      no1Evidence: "In many parks, old paths are too narrow for wheelchairs. Many residents are concerned about such problems, so city workers are making paths wider and adding more benches.",
      no1Reference: "such problems は車いすには古い道が狭すぎる問題です。so の前が工事を行う理由、後が実際の改善です。",
      no2: "指定の冒頭文、Yuki's grandfather の発言、1か月後に市職員が道を広げる場面、その日の午後に祖父が広い道を使い、Yukiが新しいベンチに座って水を差し出す場面の順です。",
      no3: "賛成を先に示し、公共公園は全員に安全・快適であるべきことと、良い道やベンチが高齢者・障害者を助けることを述べています。",
      no4: "Yes の後に、健康維持とストレス軽減、自然を楽しめることを異なる利点として続けています。",
    },
  };

  function buildSpeakingExplanation(step, guide) {
    if (step.label === "Warm-up") {
      return `【答え方】${guide.warmupPoint}
【解答例の確認】${guide.warmupModel}
【評価上の位置づけ】これは、このアプリ独自のマイク確認用ウォームアップで、公式面接の設問ではありません。質問へ直接答え、面接官に届く声量で一文を言えれば十分です。余裕があれば理由や場所などを一つ加えます。`;
    }
    if (step.label === "Silent Reading") {
      return `【20秒で見る順番】タイトルで話題をつかみ、各文の主語と動詞、How / Why の答えになりそうな方法・原因、指示語の順に確認します。
【この本文の重要なつながり】${guide.silentReading}
【準備の目的】全文和訳ではなく、音読で区切る場所と No.1 の根拠位置を先に見つけます。`;
    }
    if (step.label === "Read Aloud") {
      return `【意味の区切り】${guide.chunks} のように、主語・動詞・修飾語のまとまりで読みます。
【発音ポイント】${guide.pronunciation} の強勢と語末を意識します。冠詞や複数形の -s も落とさないようにします。
【評価の考え方】速さより、聞き取れる発音・自然な区切り・文末まで読み切ることを優先します。言い直しがあっても長く止まらず続けます。`;
    }
    if (step.label === "No.1") {
      const answerForm = String(step.questionText || "").trim().toLowerCase().includes("why")
        ? "Why 型なので Because + 主語 + 動詞で原因を直接答えます。"
        : "How 型なので By + 動名詞で始めると、方法を直接答えられます。";
      return `【正答の核】本文の “${guide.no1Evidence}” が根拠です。
【指示語の復元】${guide.no1Reference}
【答えの作り方】${answerForm}質問文の動詞以降と本文の同じ表現を照合し、その直前にある主語＋動詞を答えの核にします。
【解答例】${step.modelAnswer}
【注意】本文を丸暗記する必要はありませんが、方法・原因の中心語を落とさず、質問と同じ主語関係になるように答えます。`;
    }
    if (step.label === "No.2") {
      const story = step.pictureStory || {};
      return `【場面の順序】${guide.no2}
【必須要素】カードの “${story.openingSentence || ""}” から始め、${story.firstSpeechSpeaker || "人物"} の発言 “${story.firstSpeech || ""}” を入れ、${story.firstTimeLabel || "次の場面"}、${story.secondTimeLabel || "最後の場面"} の順を守ります。
【文法】冒頭文と said などの地の文は過去形にし、吹き出しの発言は引用どおりに入れます。絵の途中の動作は was / were + -ing を使うと自然です。人物ごとに主語を置き、and / while で同じコマの二つの動作を結びます。
【解答例の見方】解答例は、冒頭文＋1コマ目の発言＋2コマ目の二動作＋3コマ目の二動作という構成です。絵にない原因や感情を作り足す必要はありません。
【評価の考え方】人物・行動・時間順が伝わることを優先します。細かな表現が解答例と違っても、絵に合い文法的に通じれば成立します。`;
    }
    if (step.label === "No.3") {
      return `【答え方】I agree. / I disagree. などで立場を先に示し、質問の話題に直接関係する理由を一つ以上続けます。
【解答例の骨組み】${guide.no3}
【解答例】${step.modelAnswer}
【評価の考え方】賛否そのものに唯一の正解はありません。立場と理由が矛盾せず、本文の一文を繰り返すだけでなく、自分の判断として説明できているかを確認します。`;
    }
    if (step.label === "No.4") {
      return `【答え方】Yes. / No. を先に言い、because または続く文で日常生活に基づく理由を示します。
【解答例の骨組み】${guide.no4}
【解答例】${step.modelAnswer}
【評価の考え方】一つの理由でも最低限の回答は成立しますが、十分な情報量を示すには理由を具体化し、余裕があれば異なる二つ目の理由や短い具体例を加えます。反対の立場でも、質問に直接答え理由が通っていれば問題ありません。`;
    }
    return "";
  }

  for (const speakingSet of window.scbtGrade2SpeakingSets || []) {
    const guide = speakingGuides[speakingSet.key];
    if (!guide) continue;
    for (const step of speakingSet.speakingSteps || []) {
      if (step.label === "Warm-up" && !String(step.modelAnswer || "").trim()) {
        step.modelAnswer = guide.warmupModel;
      }
      if (step.explanationTier === PREMIUM_TIER && String(step.explanation || "").trim()) continue;
      const explanation = buildSpeakingExplanation(step, guide);
      if (!explanation) continue;
      step.explanation = explanation;
      step.studyPoint =
        step.label === "No.1"
          ? "質問文の動詞以降を本文で探し、その直前の主語＋動詞を核にして、such・these・this などの指示内容を一文前まで戻って復元する。"
          : "";
      step.explanationTier = PREMIUM_TIER;
    }
  }

  for (const { key, data } of contentSets) {
    data.explanationPackage = {
      ...(data.explanationPackage || {}),
      id: data.explanationPackage?.id || `grade2-${key}-three-skills-v1`,
      label: data.explanationPackage?.label || "3技能・詳しい解説",
      title: data.explanationPackage?.title || `${key === "sample" ? "サンプル問題" : data.label || key} 3技能の詳しい解説`,
      version: Math.max(Number(data.explanationPackage?.version) || 0, 1),
      coveredModules: ["listening", "writing", "speaking"],
    };
  }
})();
