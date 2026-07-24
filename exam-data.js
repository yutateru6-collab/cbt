(() => {
  const grade2Set01 = window.scbtGrade2Set01 || {};
  const grade2VocabSets = window.scbtGrade2VocabSets || [];
  const pre1VocabSets = window.scbtPre1VocabSets || [];
  const pre1ReadingGapSets = window.scbtPre1ReadingGapSets || [];
  const pre1ReadingContentSets = window.scbtPre1ReadingContentSets || [];
  const pre1ListeningSets = window.scbtPre1ListeningSets || [];

  const modules = {
    speaking: {
      label: "スピーキング",
      title: "スピーキングテスト",
      start: "スタート",
    },
    listening: {
      label: "リスニング",
      title: "リスニングテスト",
      start: "開始",
    },
    reading: {
      label: "リーディング",
      title: "リーディング / ライティングテスト",
      start: "開始",
    },
    writing: {
      label: "ライティング",
      title: "リーディング / ライティングテスト",
      start: "開始",
    },
  };

  const readingInstructions = {
    short: "文脈に合う適切な語句を選びなさい。",
    conversation: "会話文の空所に入る最も適切なものを選びなさい。",
    longVocab: "長文の空所に入る最も適切なものを選びなさい。",
    longContent: "長文の内容に関する質問に答えなさい。",
  };

  function makeChoiceQuestion(id, label) {
    return {
      id,
      text: `${label}のダミー問題です。実際の問題文はあとで差し替えます。The students decided to (      ) after school.`,
      choices: ["practice", "borrow", "arrive", "compare"],
    };
  }

  function makeChoicePage(label, startId, count, instructionKey = "short") {
    return {
      label,
      kind: "choice",
      instruction: readingInstructions[instructionKey],
      questions: Array.from({ length: count }, (_, index) => makeChoiceQuestion(startId + index, label)),
    };
  }

  function makeLongPage(label, startId, count, title) {
    return {
      label,
      kind: "long",
      passageTitle: title,
      passage: [
        "This is a sample passage for the CBT prototype.",
        "The real passage will be added later. For now, this text is used to check layout, scrolling, answer selection, and review marks.",
        "Each grade can keep a different number of questions while using the same screen engine.",
      ],
      questions: Array.from({ length: count }, (_, index) => makeChoiceQuestion(startId + index, label)),
    };
  }

  function makeWritingTask(id, kind, label, targetWords, overrides = {}) {
    const base = {
      id,
      kind,
      label,
      targetWords,
      fixedBefore: "",
      fixedAfter: "",
      points: [],
      pointsRule: "",
      wordRule: "語数の目安",
      };

    if (kind === "email") {
      return {
        ...base,
        lead: "あなたは、外国人の知り合いからEメールで質問を受け取りました。質問に答える返信メールを英文で書きなさい。",
        note: "Eメール文中の下線部について、特徴を問う具体的な質問を2つしなさい。",
        sourceTitle: "AlexからのEメール",
        source: [
          "Hi!",
          "I bought a robot pet last week. It is cute, but the battery does not last long. Do you think robot pets will improve in the future?",
          "Your friend,",
          "Alex",
        ],
        fixedBefore: "Hi, Alex!\nThank you for your e-mail.",
        fixedAfter: "Best wishes,",
        ...overrides,
      };
    }

    if (kind === "summary") {
      return {
        ...base,
        lead: `以下の英文を読んで、その内容を${targetWords}の英語で要約し、解答欄に記入しなさい。`,
        note: "解答が英文の要約になっていないと判断された場合は、0点と採点されることがあります。英文をよく読んでから答えてください。",
        wordRule: "語数",
        sourceTitle: "Summary Passage",
        source: [
          "Many cities are trying to reduce food waste. Some restaurants now sell meals at lower prices near closing time.",
          "This helps customers save money and allows stores to throw away less food.",
        ],
        ...overrides,
      };
    }

    return {
      ...base,
      lead: "QUESTIONについて、あなたの意見とその理由を英文で書きなさい。",
      note: "理由は2つを目安にし、読み手に伝わるように具体的に書きなさい。",
      sourceTitle: "QUESTION",
      source: ["Do you think students should use digital textbooks at school?"],
      ...overrides,
    };
  }

  function makeGrade2SummaryTask() {
    return makeWritingTask(32, "summary", "英文要約", "45〜55語", {
      sourceTitle: "Community Tool Libraries",
      source: [
        "In some towns, people are starting tool libraries. These places allow residents to borrow items such as drills, ladders, and sewing machines. Many people only need such tools once or twice a year, so buying them can be expensive and wasteful. Tool libraries help people save money while reducing the number of things kept unused at home.",
        "Supporters say these libraries can also make communities stronger. Volunteers often repair broken tools and teach beginners how to use them safely. Because of this, neighbors who did not know one another may start talking and sharing skills. Some schools and community centers have begun working with tool libraries for local projects.",
        "However, there are challenges. Tools must be checked carefully after each use, and some items are costly to replace if they are lost or damaged. Libraries also need enough staff or volunteers to manage reservations. Without a clear system, users may have trouble borrowing the tools they need.",
      ],
      rubric: ["本文全体の要点を含める", "利点と課題の両方に触れる", "自分の意見や本文外の情報を入れない", "45〜55語に収める"],
      modelAnswer: "Tool libraries let people borrow tools they rarely use, helping them save money and reduce unused items at home. They can also strengthen communities because volunteers teach repair skills. However, tools must be checked carefully, and libraries need enough staff to manage reservations and problems.",
    });
  }

  function makeGrade2EssayTask() {
    return makeWritingTask(33, "essay", "英作文", "80〜100語", {
      lead: "以下のTOPICについて、あなたの意見とその理由を2つ書きなさい。",
      note: "POINTSは理由を書く際の参考となる観点です。ただし、これら以外の観点から理由を書いてもかまいません。",
      sourceTitle: "TOPIC",
      source: ["Do you think local governments should create more bicycle lanes in cities?"],
      points: ["Safety", "Cost", "The environment"],
      pointsRule: "POINTSは参考です。使っても使わなくてもかまいません。",
      rubric: ["自分の立場を明確にする", "理由を2つ示す", "理由を具体例で支える", "80〜100語に収める"],
      modelAnswer: "I think local governments should create more bicycle lanes. First, bicycle lanes can make streets safer. If cyclists have their own space, they are less likely to ride too close to cars or people walking. Second, bicycle lanes can help the environment. When short trips by bicycle become easier, some people may drive less. Building lanes costs money, but safer and cleaner streets are worth the cost.",
    });
  }

  function makePre1SummaryTask() {
    return makeWritingTask(32, "summary", "英文要約", "60〜70語", {
      sourceTitle: "Digital Receipts",
      source: [
        "Many stores now offer digital receipts instead of paper ones. Customers can receive them by e-mail or through an app after making a purchase. This system can reduce the amount of paper used by businesses, and it also helps shoppers keep records without carrying many small slips of paper. For companies, digital receipts may make it easier to understand buying habits and improve customer service.",
        "There are also advantages when customers need to return items. Paper receipts are often lost or damaged, but digital records can be found quickly. Some stores connect receipts to loyalty programs, allowing shoppers to check past purchases and receive useful information about products they have bought. They can also reduce the time employees spend searching for purchase records. As a result, digital receipts can make shopping more convenient for both customers and stores.",
        "At the same time, some concerns remain. Not all customers want to give stores their e-mail addresses or use apps for every purchase. Others worry that companies may collect too much personal data. In addition, older customers or people without smartphones may prefer paper receipts. Stores must therefore provide clear choices if they want digital receipts to become widely accepted.",
      ],
    });
  }

  function makePre1EssayTask() {
    return makeWritingTask(33, "essay", "英作文", "120〜150語", {
      lead: "Write an essay on the given TOPIC.",
      note: "Use TWO of the POINTS below to support your answer. Structure: introduction, main body, and conclusion.",
      sourceTitle: "TOPIC",
      source: ["Should companies be required to let employees work from home at least part of the week?"],
      points: ["Employee productivity", "Family life", "Local economies", "Office communication"],
      pointsRule: "POINTSから2つ選んで使ってください。",
      requiredPointCount: 2,
    });
  }

  function makeReadingQuestion(id, section, type, text, choices, correct, explanation) {
    return { id, section, type, text, choices, correct, explanation };
  }

  function placeCorrectChoice(question, correctPosition) {
    const position = Number(correctPosition);
    if (!Number.isInteger(position) || position < 1 || position > question.choices.length) return question;

    const choices = [...question.choices];
    const currentCorrectIndex = Math.max(0, Number(question.correct || 1) - 1);
    const [correctChoice] = choices.splice(currentCorrectIndex, 1);
    choices.splice(position - 1, 0, correctChoice);
    return { ...question, choices, correct: position };
  }

  function applyAnswerPatternToQuestions(questions, pattern) {
    return questions.map((question, index) => placeCorrectChoice(question, pattern[index] || question.correct));
  }

  function applyAnswerPatternToPages(pages, pattern) {
    let questionIndex = 0;
    return pages.map((page) => ({
      ...page,
      questions: page.questions.map((question) => placeCorrectChoice(question, pattern[questionIndex++] || question.correct)),
    }));
  }

  function makeGrade2ReadingPages() {
    const pages = [
      {
        label: "短文空所補充",
        kind: "choice",
        instruction: "文脈に合う最も適切な語句を選びなさい。",
        questions: [
          makeReadingQuestion(1, "短文空所補充", "vocabulary", "The science club had to (      ) its plan after the main hall became unavailable.", ["revise", "admire", "fold", "connect"], 1, "会場が使えなくなったので計画を「修正する」が自然です。"),
          makeReadingQuestion(2, "短文空所補充", "vocabulary", "Mika was (      ) to speak in front of the class at first, but she felt better after practicing with a friend.", ["reluctant", "recent", "ordinary", "equal"], 1, "最初は人前で話すのをためらっていた流れです。"),
          makeReadingQuestion(3, "短文空所補充", "vocabulary", "The manager asked all workers to keep their receipts so the office could make (      ) records.", ["accurate", "distant", "silent", "empty"], 1, "領収書を保管する目的は正確な記録を作ることです。"),
          makeReadingQuestion(4, "短文空所補充", "vocabulary", "Please (      ) the report to your e-mail before you send it to Mr. Lewis.", ["attach", "behave", "depend", "graduate"], 1, "メールにレポートを添付する場面です。"),
          makeReadingQuestion(5, "短文空所補充", "vocabulary", "The city plans to (      ) bus service to the new residential area next spring.", ["expand", "ignore", "measure", "export"], 1, "新しい住宅地へバスサービスを広げるという意味です。"),
          makeReadingQuestion(6, "短文空所補充", "vocabulary", "The experiment failed because the temperature in the room was not (      ).", ["constant", "ancient", "formal", "private"], 1, "実験では温度が一定であることが必要です。"),
          makeReadingQuestion(7, "短文空所補充", "vocabulary", "Eri tried to (      ) her parents that studying abroad for six months would help her become more independent.", ["convince", "decorate", "deliver", "translate"], 1, "両親に納得してもらおうとする文脈です。"),
          makeReadingQuestion(8, "短文空所補充", "vocabulary", "The article (      ) that short breaks during work can improve concentration.", ["claims", "borrows", "repairs", "freezes"], 1, "記事が主張している内容を表します。"),
          makeReadingQuestion(9, "短文空所補充", "vocabulary", "Students must get (      ) from their parents before joining the overnight volunteer trip.", ["permission", "furniture", "temperature", "competition"], 1, "宿泊を伴う行事には保護者の許可が必要です。"),
          makeReadingQuestion(10, "短文空所補充", "vocabulary", "The factory replaced several old machines in order to (      ) efficiency.", ["improve", "damage", "mention", "discover"], 1, "古い機械を交換する目的は効率を改善することです。"),
          makeReadingQuestion(11, "短文空所補充", "vocabulary", "Although the restaurant is small, it has a good (      ) among local families.", ["reputation", "direction", "surface", "permission"], 1, "地元の家族の間で評判がよいという意味です。"),
          makeReadingQuestion(12, "短文空所補充", "vocabulary", "His explanation was too (      ), so the teacher asked him to give more specific examples.", ["vague", "rapid", "polite", "secure"], 1, "具体例を求められているので、説明が曖昧だったと考えます。"),
          makeReadingQuestion(13, "短文空所補充", "phrase", "The outdoor concert was canceled (      ) the heavy rain and strong winds.", ["due to", "instead of", "as for", "apart from"], 1, "中止の理由を表す due to が合います。"),
          makeReadingQuestion(14, "短文空所補充", "vocabulary", "Mr. Tanaka is responsible for (      ) the volunteers before the festival begins.", ["organizing", "inventing", "polluting", "escaping"], 1, "ボランティアをまとめる役割を表します。"),
          makeReadingQuestion(15, "短文空所補充", "vocabulary", "After months of practice, Noah finally (      ) his fear of swimming in deep water.", ["overcame", "estimated", "reserved", "announced"], 1, "恐怖を克服したという文脈です。"),
          makeReadingQuestion(16, "短文空所補充", "vocabulary", "The medicine should be kept in a cool place and not be (      ) to direct sunlight.", ["exposed", "invited", "recycled", "compared"], 1, "直射日光にさらされないようにするという意味です。"),
          makeReadingQuestion(17, "短文空所補充", "vocabulary", "The school installed solar panels to (      ) its electricity costs.", ["reduce", "perform", "borrow", "interrupt"], 1, "太陽光パネルの目的は電気代を減らすことです。"),
        ],
      },
      {
        label: "長文語句 2A",
        kind: "long",
        passageTitle: "Repair Cafes at School",
        passage: [
          "At Westbrook High School, a group of students holds a repair cafe once a month. People bring broken lamps, bags, small radios, and other household items. The project was (18) by a science teacher who wanted students to understand how everyday objects are made.",
          "At first, only a few students came to help. However, the event (19) became popular because many people liked learning how to fix things instead of throwing them away. One important rule is that volunteers should not do all the work for visitors. They explain the process so the owners can (20) what went wrong.",
        ],
        questions: [
          makeReadingQuestion(18, "長文語句 2A", "long-vocabulary", "Which word best fits blank (18)?", ["started", "hidden", "delayed", "printed"], 1, "先生が企画を始めたという内容です。"),
          makeReadingQuestion(19, "長文語句 2A", "long-vocabulary", "Which word best fits blank (19)?", ["gradually", "separately", "carelessly", "silently"], 1, "最初は少数、その後だんだん人気になった流れです。"),
          makeReadingQuestion(20, "長文語句 2A", "long-vocabulary", "Which word best fits blank (20)?", ["understand", "replace", "advertise", "collect"], 1, "持ち主が問題点を理解できるよう説明します。"),
        ],
      },
      {
        label: "長文語句 2B",
        kind: "long",
        passageTitle: "A New Use for Empty Shops",
        passage: [
          "In many towns, small stores close when owners retire. Some local governments are trying to use these empty shops in new ways. In Maple Town, one empty shop was (21) into a place where high school students can sell products they make in business classes.",
          "The project gives students practical experience. They must decide prices, talk to customers, and keep records of sales. At the same time, the shop makes the shopping street feel more active. Some older residents say they now have a (22) to visit the street more often.",
          "There are still difficulties. The shop is open only twice a week because students are busy with classes and club activities. Also, teachers need to check the money carefully after each sale. Even so, the town believes the project is (23) because it connects young people with local businesses.",
        ],
        questions: [
          makeReadingQuestion(21, "長文語句 2B", "long-vocabulary", "Which word best fits blank (21)?", ["turned", "poured", "caught", "left"], 1, "空き店舗を別の用途の場所に変えたという文脈です。"),
          makeReadingQuestion(22, "長文語句 2B", "long-vocabulary", "Which word best fits blank (22)?", ["reason", "limit", "secret", "mistake"], 1, "商店街に行く理由ができたという意味です。"),
          makeReadingQuestion(23, "長文語句 2B", "long-vocabulary", "Which word best fits blank (23)?", ["worthwhile", "ordinary", "doubtful", "temporary"], 1, "困難はあるが価値があるという流れです。"),
        ],
      },
      {
        label: "メール 3A",
        kind: "long",
        passageTitle: "From: Riverside Community Garden",
        passage: [
          "From: Olivia Grant <olivia@riversidegarden.org>",
          "To: Daniel Rivera <drivera@eastparkhigh.edu>",
          "Date: April 12",
          "Subject: Student visit",
          "",
          "Dear Mr. Rivera,",
          "Thank you for asking about bringing your environmental science class to Riverside Community Garden. We welcome school groups on weekday mornings, and May 14 or May 21 would both be possible for your class. Because our paths are narrow, we ask groups with more than 25 students to divide into two smaller groups.",
          "During the visit, students can learn how volunteers grow vegetables without using chemical pesticides. They can also help plant herbs if the weather is good. Please tell your students to wear shoes that can get dirty. We will provide gloves and small tools, so they do not need to bring any equipment.",
          "There is no fee for school visits, but donations are welcome because they help us buy seeds for children’s workshops. If you choose a date, please send us the number of students and teachers by the end of next week.",
          "Sincerely,",
          "Olivia Grant",
        ],
        questions: [
          makeReadingQuestion(24, "メール 3A", "email-content", "Why does Olivia mention the garden paths?", ["Large groups may need to be separated.", "Students must repair the paths before visiting.", "Teachers cannot walk through the garden.", "The paths are closed on weekday mornings."], 1, "通路が狭いため、25人を超える場合は小グループに分ける必要があります。"),
          makeReadingQuestion(25, "メール 3A", "email-content", "What should students bring to the garden?", ["Shoes that can get dirty.", "Chemical pesticides for the plants.", "Their own gloves and tools.", "Vegetables from their school."], 1, "汚れてもよい靴を履くように書かれています。手袋と道具は庭側が用意します。"),
          makeReadingQuestion(26, "メール 3A", "email-content", "What does Olivia ask Mr. Rivera to do?", ["Send the group size by the end of next week.", "Pay the visit fee before choosing a date.", "Bring seeds for children’s workshops.", "Visit the garden alone before the class trip."], 1, "日程を選んだら、生徒と先生の人数を来週末までに送るよう依頼しています。"),
        ],
      },
      {
        label: "長文内容 3B",
        kind: "long",
        passageTitle: "The Quiet Room Project",
        passage: [
          "When lunch break started at North Valley High School, most students hurried to the cafeteria or the sports field. However, some students looked for empty corners in the library or stayed in classrooms with the lights off. They were not trying to break rules. They simply wanted a quiet place to recover from the noise of a busy school day.",
          "A counselor named Ms. Kato noticed this pattern and suggested turning an unused meeting room into a quiet room. The room would not be a place for sleeping or skipping class. Students could use it for twenty minutes at lunch to read, think, or calm down. At first, some teachers worried that the room would be difficult to supervise. Others felt that students should learn to spend time with their classmates.",
          "To test the idea, Ms. Kato asked four student volunteers to help. They created simple rules: no phones, no food, and no talking. They also kept a record of how many students used the room and asked users to complete short surveys. During the first month, the room was used by 68 different students. Many wrote that they were able to focus better in afternoon classes after spending time there.",
          "The survey results surprised the teachers. Some students used the room because they felt nervous before presentations. Others wanted to avoid arguments with friends until they felt calm enough to talk. A few students said they liked lunch with friends but still needed a short break from noise. After reading these comments, the school decided to continue the project and added a reservation system so the room would not become too crowded.",
          "The quiet room did not solve every problem at the school. However, it helped teachers understand that being social all day can be tiring for some teenagers. Ms. Kato says the goal is not to separate students from others, but to give them a choice. Now, several nearby schools are considering similar rooms of their own.",
        ],
        questions: [
          makeReadingQuestion(27, "長文内容 3B", "content", "Why did Ms. Kato suggest creating a quiet room?", ["Some students seemed to need a calm place during the school day.", "The school library had become too crowded for classes.", "Teachers wanted a new room for club meetings.", "Students had asked for a place to eat snacks."], 1, "騒がしい学校生活の中で静かな場所を必要とする生徒がいたためです。"),
          makeReadingQuestion(28, "長文内容 3B", "content", "What was one concern some teachers had about the quiet room?", ["It might be hard to supervise.", "It would cost too much money to build.", "It would be used by teachers too often.", "It might make the cafeteria smaller."], 1, "教師の懸念として監督の難しさが述べられています。"),
          makeReadingQuestion(29, "長文内容 3B", "content", "What did the student volunteers do?", ["They made rules and collected information from users.", "They painted the room during summer vacation.", "They taught younger students how to study.", "They prepared lunch for students who used the room."], 1, "ルール作成、利用記録、アンケートを行いました。"),
          makeReadingQuestion(30, "長文内容 3B", "content", "Why did the school add a reservation system?", ["To prevent the room from becoming too crowded.", "To choose only students with high grades.", "To stop students from using the library.", "To let parents check the room online."], 1, "混みすぎないよう予約制を加えました。"),
          makeReadingQuestion(31, "長文内容 3B", "content", "What is the main purpose of this passage?", ["To describe how one school tested a quiet room and what it learned.", "To compare several schools that built large libraries.", "To explain why lunch breaks should be shorter.", "To show how students can improve their presentation skills."], 1, "静かな部屋の試験導入と、その結果から得た学びを説明する文章です。"),
        ],
      },
    ];

    return applyAnswerPatternToPages(pages, [1, 3, 2, 4, 2, 1, 4, 3, 2, 4, 1, 3, 4, 2, 1, 3, 2, 4, 1, 3, 2, 1, 4, 3, 2, 4, 1, 3, 2, 4, 1]);
  }

  function makePre1ReadingPages() {
    const pages = [
      {
        label: "短文空所補充",
        kind: "choice",
        instruction: "文脈に合う最も適切な語句を選びなさい。",
        questions: [
          makeReadingQuestion(1, "短文空所補充", "vocabulary", "The mayor promised to make the decision-making process more (      ) so that citizens could understand how tax money was being spent.", ["transparent", "fragile", "portable", "accidental"], 1, "市民が税金の使い道を理解できるようにするので、透明性が高いという意味です。"),
          makeReadingQuestion(2, "短文空所補充", "vocabulary", "The professor’s theory was considered (      ) at first, but later research showed that many parts of it were accurate.", ["controversial", "decorative", "obedient", "mechanical"], 1, "当初は議論を呼ぶ理論だったが、後に正確さが示されたという流れです。"),
          makeReadingQuestion(3, "短文空所補充", "vocabulary", "The company tried to (      ) younger customers by using short videos and online events.", ["attract", "collapse", "restrict", "imitate"], 1, "動画やイベントで若い顧客を引きつけるという文脈です。"),
          makeReadingQuestion(4, "短文空所補充", "vocabulary", "Because the instructions were (      ), several participants completed the survey in different ways.", ["ambiguous", "regional", "grateful", "efficient"], 1, "手順が曖昧だったため回答方法が分かれたという意味です。"),
          makeReadingQuestion(5, "短文空所補充", "vocabulary", "The journalist was praised for her ability to (      ) complicated scientific ideas into language that ordinary readers could understand.", ["translate", "decorate", "postpone", "suspect"], 1, "難しい考えを分かりやすい言葉に置き換えるという意味です。"),
          makeReadingQuestion(6, "短文空所補充", "vocabulary", "The museum’s new director wants to (      ) its collection by including works from artists who have been ignored in the past.", ["diversify", "tighten", "multiply", "withdraw"], 1, "これまで軽視されてきた作家を加え、収蔵品を多様化する文脈です。"),
          makeReadingQuestion(7, "短文空所補充", "vocabulary", "The committee decided to (      ) the proposal because it lacked reliable data.", ["reject", "compose", "admire", "export"], 1, "信頼できるデータが不足しているので提案を退ける流れです。"),
          makeReadingQuestion(8, "短文空所補充", "vocabulary", "The patient’s symptoms were mild at first, but they became more (      ) over the next few days.", ["severe", "casual", "distant", "manual"], 1, "症状が数日で重くなったという意味です。"),
          makeReadingQuestion(9, "短文空所補充", "vocabulary", "Many historians argue that the treaty had a (      ) influence on relations between the two countries.", ["lasting", "sleepy", "random", "liquid"], 1, "二国間関係に長く続く影響を与えたという文脈です。"),
          makeReadingQuestion(10, "短文空所補充", "vocabulary", "The startup had to (      ) its hiring plans when investors became more cautious.", ["scale back", "look up", "break into", "hand over"], 1, "投資家が慎重になったため採用計画を縮小する流れです。"),
          makeReadingQuestion(11, "短文空所補充", "vocabulary", "The river is home to several fish species that are highly (      ) to changes in water temperature.", ["sensitive", "generous", "logical", "passive"], 1, "水温変化に敏感な魚種という意味です。"),
          makeReadingQuestion(12, "短文空所補充", "vocabulary", "When the evidence was examined closely, the witness’s story began to (      ).", ["fall apart", "take over", "set aside", "show off"], 1, "証拠を詳しく見ると証言の整合性が崩れたという意味です。"),
          makeReadingQuestion(13, "短文空所補充", "vocabulary", "The city introduced a new policy to (      ) the use of disposable plastic containers.", ["curb", "trace", "admire", "rescue"], 1, "使い捨て容器の利用を抑える政策です。"),
          makeReadingQuestion(14, "短文空所補充", "vocabulary", "Some employees were (      ) about the new evaluation system because the standards had not been explained clearly.", ["skeptical", "identical", "fertile", "temporary"], 1, "基準が不明確なので制度に懐疑的だったという意味です。"),
          makeReadingQuestion(15, "短文空所補充", "vocabulary", "The novelist’s early work was (      ) by critics, but readers gradually began to appreciate its originality.", ["dismissed", "installed", "licensed", "translated"], 1, "批評家に退けられたが後に評価されたという流れです。"),
          makeReadingQuestion(16, "短文空所補充", "vocabulary", "The research team tried to (      ) the results by repeating the experiment under the same conditions.", ["verify", "wander", "freeze", "donate"], 1, "同条件で実験を繰り返し結果を検証する文脈です。"),
          makeReadingQuestion(17, "短文空所補充", "vocabulary", "The plan sounds simple, but it could have serious (      ) for small businesses.", ["implications", "decorations", "symptoms", "vacations"], 1, "小規模事業者に重大な影響を及ぼす可能性を表します。"),
          makeReadingQuestion(18, "短文空所補充", "vocabulary", "The charity was able to (      ) enough support to open a second learning center.", ["generate", "isolate", "interrupt", "polish"], 1, "支援を生み出し、2つ目の学習センターを開いたという文脈です。"),
        ],
      },
      {
        label: "長文語句 2A",
        kind: "long",
        passageTitle: "Neighborhood Archives",
        passage: [
          "Several neighborhoods have started digital archive projects. Residents bring old photographs, letters, and maps to local libraries, where volunteers scan them and record short explanations. These projects help preserve memories that might otherwise be (19) when families move or older residents pass away.",
          "The archives are not only for historians. Teachers use the materials in class so students can compare their town today with the way it looked decades ago. This often makes local history feel more (20) because students can see streets and parks they know in the old photographs.",
          "There are challenges, however. Volunteers must ask owners for permission before making materials public, and some information is difficult to confirm. For this reason, archive teams often add notes explaining how reliable each item is. This cautious approach helps users understand the (21) of the materials.",
        ],
        questions: [
          makeReadingQuestion(19, "長文語句 2A", "long-vocabulary", "Which word best fits blank (19)?", ["lost", "printed", "charged", "measured"], 1, "家族の移動や高齢者の死によって記憶が失われる可能性を表します。"),
          makeReadingQuestion(20, "長文語句 2A", "long-vocabulary", "Which word best fits blank (20)?", ["relevant", "distant", "automatic", "violent"], 1, "自分の知る場所と結びつき、歴史が身近になるという意味です。"),
          makeReadingQuestion(21, "長文語句 2A", "long-vocabulary", "Which word best fits blank (21)?", ["limitations", "celebrations", "directions", "machines"], 1, "資料の信頼性や限界を理解する文脈です。"),
        ],
      },
      {
        label: "長文語句 2B",
        kind: "long",
        passageTitle: "Why Slow Research Matters",
        passage: [
          "In recent years, scientists have been encouraged to publish their findings quickly. Fast publication can be useful when society needs urgent information, such as during a public health crisis. However, some researchers warn that speed can (22) careful checking.",
          "Slow research gives scientists more time to test whether their results can be repeated. It also allows them to notice unexpected details that might be missed during a rushed project. Such details may seem minor at first, but they can later (23) an important discovery.",
          "Universities are beginning to discuss how they evaluate researchers. Instead of counting only the number of papers a person publishes, some institutions want to consider the quality and long-term value of the work. This change may encourage researchers to take a more (24) approach.",
        ],
        questions: [
          makeReadingQuestion(22, "長文語句 2B", "long-vocabulary", "Which word best fits blank (22)?", ["undermine", "decorate", "surround", "deliver"], 1, "速さが慎重な確認を損なう可能性を表します。"),
          makeReadingQuestion(23, "長文語句 2B", "long-vocabulary", "Which word best fits blank (23)?", ["lead to", "depend on", "run out", "care for"], 1, "小さな詳細が重要な発見につながるという意味です。"),
          makeReadingQuestion(24, "長文語句 2B", "long-vocabulary", "Which word best fits blank (24)?", ["deliberate", "careless", "temporary", "invisible"], 1, "急がず慎重な取り組みを促す文脈です。"),
        ],
      },
      {
        label: "長文内容 3A",
        kind: "long",
        passageTitle: "Libraries Without Late Fees",
        passage: [
          "For many years, public libraries charged people small fees when books were returned late. The fees were meant to encourage users to bring books back on time. Recently, however, some libraries have stopped charging them. They argue that late fees often keep people away from the library, especially families with limited incomes.",
          "One library system compared borrowing records before and after removing fees. It found that more people returned to using the library, and many overdue books were brought back once users learned that they would not face a fine. Staff members also spent less time handling small payments and more time helping visitors find information.",
          "Not everyone supports the change. Some people worry that books will be returned late more often if there is no penalty. To deal with this problem, libraries may still block users from borrowing more books until overdue items are returned. Supporters say this system protects the collection without discouraging people from coming back.",
        ],
        questions: [
          makeReadingQuestion(25, "長文内容 3A", "content", "Why have some libraries stopped charging late fees?", ["They believe the fees can prevent people from using libraries.", "They want to sell older books to local families.", "They no longer need users to return books.", "They found that collecting fees was illegal."], 1, "延滞料が特に低所得世帯を図書館から遠ざけると考えているためです。"),
          makeReadingQuestion(26, "長文内容 3A", "content", "What happened after one library system removed late fees?", ["Some overdue books were returned.", "Staff members stopped helping visitors.", "Borrowing records became impossible to compare.", "Users had to pay larger membership fees."], 1, "罰金がないと知って、延滞本を返す人が出たと述べられています。"),
          makeReadingQuestion(27, "長文内容 3A", "content", "How can libraries encourage users to return overdue books without charging fees?", ["They can stop users from borrowing more books until items are returned.", "They can close the library for several days each month.", "They can ask schools to collect books from homes.", "They can require visitors to buy books they borrow."], 1, "延滞本が返るまで新たな貸出を止める方法が示されています。"),
        ],
      },
      {
        label: "長文内容 3B",
        kind: "long",
        passageTitle: "Urban Heat and Hidden Inequality",
        passage: [
          "Cities are often warmer than surrounding rural areas because roads and buildings absorb heat during the day and release it at night. This phenomenon is known as the urban heat island effect. Although it affects entire cities, recent research shows that heat is not distributed equally. Some neighborhoods experience much higher temperatures than others.",
          "One reason is the amount of shade. Wealthier areas often have more trees, parks, and private gardens, while lower-income neighborhoods may have wider roads, fewer green spaces, and more large parking lots. As a result, people living in these areas may face greater health risks during heat waves. Elderly residents and people without air conditioning are especially vulnerable.",
          "City governments have tried several solutions. Planting trees is one approach, but it requires long-term care and careful planning. Trees must be watered, protected, and placed where they will not damage sidewalks or underground pipes. Another option is to use reflective materials on roofs and roads. These materials can reduce surface temperatures, but they may be expensive at first.",
          "Some experts argue that heat policies should be connected to housing and public health programs. Simply planting trees in wealthy districts will not solve the problem. Cities need to identify the neighborhoods where residents face the greatest risk and invest there first. In this way, efforts to reduce urban heat can also address deeper inequalities in city life.",
        ],
        questions: [
          makeReadingQuestion(28, "長文内容 3B", "content", "What does recent research show about urban heat?", ["Some parts of a city can be much hotter than others.", "Rural areas are usually hotter than large cities.", "Heat islands occur only in wealthy neighborhoods.", "Buildings release no heat after sunset."], 1, "都市全体ではなく、地域によって暑さに差があることが述べられています。"),
          makeReadingQuestion(29, "長文内容 3B", "content", "Why may lower-income neighborhoods face higher temperatures?", ["They often have fewer trees and more heat-absorbing surfaces.", "Their residents usually ask for warmer streets.", "They are always located far from city centers.", "Their buildings are required to be taller."], 1, "木や緑地が少なく、道路や駐車場などが多いことが理由です。"),
          makeReadingQuestion(30, "長文内容 3B", "content", "What is mentioned as a difficulty with planting trees?", ["They need care and must be placed carefully.", "They immediately make roads too cold to use.", "They cannot grow in any city neighborhood.", "They are less effective than closing parks."], 1, "水やり・保護・配置など長期的な管理が必要です。"),
          makeReadingQuestion(31, "長文内容 3B", "content", "What is the main point of the final paragraph?", ["Heat-reduction efforts should focus first on residents at greatest risk.", "Cities should stop using public health programs.", "Wealthy districts should receive all new tree-planting projects.", "Reflective roofs are the only solution to urban heat."], 1, "最もリスクの高い地域に先に投資すべきだという内容です。"),
        ],
      },
    ];

    return applyAnswerPatternToPages(pages, [2, 3, 4, 1, 2, 1, 4, 3, 1, 2, 4, 1, 3, 2, 4, 1, 3, 2, 1, 4, 3, 2, 4, 1, 3, 2, 4, 1, 3, 2, 4]);
  }

  function makeListeningQuestion(id, section, instruction, script, questionText, choices, correct, explanation) {
    return {
      id,
      section,
      instruction,
      audioFile: "",
      script,
      questionText,
      choices,
      correct,
      explanation,
    };
  }

  function makeGrade2ListeningQuestions() {
    const part1 = "会話の内容に関する質問に答えなさい。";
    const part2 = "英文の内容に関する質問に答えなさい。";
    const questions = [
      makeListeningQuestion(1, "第1部", part1, "M: Did you finish the poster for the music club? W: Almost. I still need to add the date and the room number. M: The meeting is in Room 204, right? W: Yes, and it starts at four.", "What does the woman still need to do?", ["Add some information to the poster.", "Change the club's meeting date.", "Find a different classroom.", "Print posters for every student."], 1, "女性は日付と部屋番号を加える必要があると言っています。"),
      makeListeningQuestion(2, "第1部", part1, "W: Are you going to the new bakery after school? M: I was, but my little brother asked me to help him with math. W: That is nice of you. M: I can go to the bakery tomorrow.", "Why will the boy not go to the bakery today?", ["He will help his brother study.", "He does not like sweet food.", "The bakery is closed today.", "He forgot to bring money."], 1, "弟の数学を手伝うためです。"),
      makeListeningQuestion(3, "第1部", part1, "M: I heard you joined the tennis team. W: Yes, but I am not playing in matches yet. The coach wants me to practice serving first. M: That makes sense. W: I hope I can play next month.", "What is the girl doing now?", ["Practicing one skill before joining matches.", "Teaching tennis to younger students.", "Looking for a different coach.", "Playing in matches every week."], 1, "試合にはまだ出ず、サーブを練習しています。"),
      makeListeningQuestion(4, "第1部", part1, "W: This library book is due today. M: You can renew it online if no one else is waiting for it. W: Really? I thought I had to come here. M: No, just use your library card number.", "What does the man tell the woman?", ["She can extend the loan online.", "She should buy a library card.", "She has to return the book today.", "She must wait for another person."], 1, "オンラインで貸出期間を延長できると説明しています。"),
      makeListeningQuestion(5, "第1部", part1, "M: The school festival starts at ten, but our class needs to arrive earlier. W: How early? M: At eight thirty. We have to set up the tables. W: OK. I will bring the price signs.", "Why do they need to arrive early?", ["To prepare their classroom booth.", "To watch the opening ceremony.", "To buy tickets before others.", "To clean the sports field."], 1, "机を準備する必要があります。"),
      makeListeningQuestion(6, "第1部", part1, "W: Your jacket looks new. M: Thanks, but I bought it at a used-clothing shop. W: It is in great condition. M: I know. It only cost ten dollars.", "What does the boy say about his jacket?", ["It was inexpensive and secondhand.", "It was a gift from his sister.", "It is too warm for the season.", "It needs to be repaired soon."], 1, "古着店で安く買ったと言っています。"),
      makeListeningQuestion(7, "第1部", part1, "M: Are you still taking guitar lessons? W: Yes, but I almost quit last month. M: Why didn't you? W: My teacher let me choose songs I actually like.", "Why did the girl continue her lessons?", ["She could practice music she enjoyed.", "Her friend joined the same class.", "The lessons became cheaper.", "Her parents bought her a guitar."], 1, "好きな曲を選べるようになったからです。"),
      makeListeningQuestion(8, "第1部", part1, "W: I heard your family moved. M: Yes, our new apartment is smaller, but it is closer to my mother's office. W: Is your commute shorter too? M: Much shorter. I can walk to school now.", "What is true about the boy's new home?", ["It is closer to his school.", "It has more rooms than before.", "It is far from his mother's office.", "It is in another city."], 1, "学校まで歩けるほど近くなりました。"),
      makeListeningQuestion(9, "第1部", part1, "M: I made a reservation for six at the Italian restaurant. W: Actually, Emily cannot come. Should we change it to five? M: I called already. The restaurant said it was fine. W: Great.", "What did the man do?", ["He told the restaurant about the change.", "He canceled dinner for everyone.", "He invited another friend.", "He chose a different restaurant."], 1, "人数変更を店に連絡済みです。"),
      makeListeningQuestion(10, "第1部", part1, "W: Our classroom is so hot today. M: The air conditioner is broken. The teacher said workers are coming this afternoon. W: Good. I could hardly focus during the test. M: Me neither.", "What is the problem?", ["The air conditioner is not working.", "The test was too difficult.", "Workers came to the wrong room.", "The classroom window is broken."], 1, "エアコンが壊れていることが問題です。"),
      makeListeningQuestion(11, "第1部", part1, "M: This tea tastes like peaches. W: It is made from dried flowers, not fruit. M: Really? It smells sweet. W: Many customers are surprised by that.", "What surprises the man?", ["The tea is not made from fruit.", "The tea is served cold.", "The tea shop is very old.", "The tea costs less than he expected."], 1, "果物ではなく乾燥した花から作られている点に驚いています。"),
      makeListeningQuestion(12, "第1部", part1, "W: I missed the train to the airport this morning. M: Oh no. Did you miss your flight? W: No, my father drove me there just in time. M: That was lucky.", "What happened to the woman?", ["She got to the airport with help.", "She missed her flight.", "She drove her father to the station.", "She bought the wrong ticket."], 1, "父親に車で送ってもらい間に合いました。"),
      makeListeningQuestion(13, "第1部", part1, "M: Could you tell Rachel I will be late? W: Sure. Are you stuck at the station? M: Yes. The next train leaves in twenty minutes. W: I will tell her to wait inside the cafe.", "What will the woman do?", ["Give Rachel a message.", "Buy train tickets for the man.", "Meet the man at the station.", "Call the cafe to cancel."], 1, "Rachelに遅れることを伝えます。"),
      makeListeningQuestion(14, "第1部", part1, "W: I am closing the shop tonight, but I do not know where to put the clean towels. M: They go in the cabinet under the counter. W: Thanks. I put them near the sink last time. M: That is why I could not find them.", "What should the woman do?", ["Put towels in the correct cabinet.", "Wash the towels again.", "Clean the sink before leaving.", "Move the counter near the door."], 1, "タオルをカウンター下の棚に入れる必要があります。"),
      makeListeningQuestion(15, "第1部", part1, "M: You look worried. W: My car stopped working on the way to a meeting. M: Did you call your client? W: Yes, and she said we could meet online instead.", "What happened to the woman?", ["Her car broke down.", "Her client canceled the meeting.", "She lost her computer.", "She arrived at the wrong office."], 1, "会議に向かう途中で車が故障しました。"),
      makeListeningQuestion(16, "第2部", part2, "A nature center has opened a new butterfly room. The room is kept warm and filled with plants that butterflies like. Visitors are asked not to touch the butterflies because their wings are easily damaged. Staff members are available to answer questions.", "What are visitors told not to do?", ["Touch the butterflies.", "Ask staff members questions.", "Look at the plants.", "Enter the warm room."], 1, "羽が傷つきやすいため触らないよう求められています。"),
      makeListeningQuestion(17, "第2部", part2, "Daniel enjoys drawing buildings, but he used to copy pictures from books. Last year, his art teacher told him to walk around the city and draw what he saw. Daniel now says his pictures look more natural because he studies real streets.", "What helped Daniel improve his drawings?", ["Drawing real places in the city.", "Copying more pictures from books.", "Taking photographs of his classmates.", "Painting only natural landscapes."], 1, "実際の街を観察して描くようになったことです。"),
      makeListeningQuestion(18, "第2部", part2, "Passengers on Flight 812 should go to Counter 6 if they need to change flights. Because of heavy snow in Denver, the flight will leave two hours later than planned. Passengers who only need to check bags should remain in the regular line.", "Who should go to Counter 6?", ["Passengers who need to change flights.", "Passengers who have already arrived in Denver.", "Passengers checking bags only.", "Passengers without tickets."], 1, "乗り継ぎ変更が必要な乗客がCounter 6へ行きます。"),
      makeListeningQuestion(19, "第2部", part2, "Ms. Grant is leading a history project at the town museum. She wants each student to send her a short progress report by e-mail every Friday. Students who have trouble finding information should visit her office on Tuesday afternoons.", "What should students do every Friday?", ["Send a progress report.", "Visit the museum office.", "Choose a new topic.", "Meet at the town library."], 1, "毎週金曜に進捗報告をメールで送ります。"),
      makeListeningQuestion(20, "第2部", part2, "A camera shop is displaying photographs taken by local teenagers. The owner expected mostly pictures of pets and friends, but many students sent photos of old buildings in town. The owner says the photos helped adults notice places they usually pass without thinking.", "What surprised the shop owner?", ["Many students photographed old buildings.", "Adults refused to visit the display.", "Most photos were taken by professional artists.", "The teenagers wanted to sell cameras."], 1, "多くの学生が古い建物の写真を送ったことに驚いています。"),
      makeListeningQuestion(21, "第2部", part2, "Maria moved to a small city for her first job. She expected to feel bored, but she likes being able to walk to work and talk with customers who remember her name. She says she may stay longer than she first planned.", "How does Maria feel about the city?", ["She likes living and working there.", "She wants to move to a larger city soon.", "She thinks customers are unfriendly.", "She is bored because she cannot drive."], 1, "仕事先も住む場所も気に入っています。"),
      makeListeningQuestion(22, "第2部", part2, "Two friends started a company that makes raincoats for dogs. They got the idea after walking their own dogs during a storm. At first, they sold only online, but a pet shop owner saw their products and offered to sell them in her store.", "How did the friends get their business idea?", ["They had a problem while walking their dogs.", "They worked at a pet shop together.", "They took a class about online sales.", "They found old raincoats in a store."], 1, "雨の日の犬の散歩から発想を得ました。"),
      makeListeningQuestion(23, "第2部", part2, "Before becoming a sports instructor, Mr. Hill taught science at a local school. He often used games to explain difficult ideas, and students enjoyed his classes. Later, he decided to help children learn teamwork through sports instead of textbooks.", "What did Mr. Hill use to do?", ["Teach at a school.", "Play professional sports.", "Write science textbooks.", "Run a local store."], 1, "以前は地元の学校で理科を教えていました。"),
      makeListeningQuestion(24, "第2部", part2, "A fitness trainer says beginners should not lift heavy weights suddenly. She recommends starting with light weights and increasing them little by little. This helps people avoid injuries and continue exercising for a longer time.", "What does the trainer recommend?", ["Increasing weight gradually.", "Exercising only once a month.", "Avoiding all weight training.", "Lifting the heaviest weights first."], 1, "少しずつ重さを増やすことを勧めています。"),
      makeListeningQuestion(25, "第2部", part2, "The Green Car Company is recalling one of its small cars. The seats are comfortable, and the engine works well, but the front windows may not close completely in heavy rain. Owners should bring their cars to a dealer for a free repair.", "What is the problem with the car?", ["The front windows may not close properly.", "The engine uses too much gas.", "The seats are uncomfortable.", "The dealer is charging for repairs."], 1, "大雨のとき前の窓が完全に閉まらない可能性があります。"),
      makeListeningQuestion(26, "第2部", part2, "A high school soccer team will play against a team from another town this weekend. The coach says the goal is not only to win but also to practice staying calm when playing unfamiliar opponents. The game will be held at the city sports park.", "What will the team do this weekend?", ["Play against a team from another town.", "Practice only with younger students.", "Watch a professional soccer game.", "Clean the city sports park."], 1, "別の町のチームと試合をします。"),
      makeListeningQuestion(27, "第2部", part2, "The word wallflower originally referred to a plant that often grew along stone walls. Later, people began using the word to describe someone who stands quietly near the wall at a party instead of dancing or talking.", "What does the speaker explain?", ["How the meaning of a word changed.", "How to grow flowers indoors.", "Why parties became popular.", "Where stone walls were first built."], 1, "wallflowerの語の意味の変化を説明しています。"),
      makeListeningQuestion(28, "第2部", part2, "A new cooking app suggests recipes based on food people already have at home. Users take a picture of the inside of their refrigerator, and the app lists meals they can make without shopping. The company says this can reduce food waste.", "What does the app help people do?", ["Use food they already have.", "Order food from restaurants.", "Learn to take better photos.", "Compare prices at supermarkets."], 1, "家にある食材で作れる料理を提案します。"),
      makeListeningQuestion(29, "第2部", part2, "At River Mall, the second floor will be closed next Monday morning. Workers will replace lights in the hallway. Stores on the first and third floors will open as usual, and signs will show customers where to go.", "What will happen at the mall?", ["Part of the mall will be closed for work.", "All stores will close for the whole day.", "Customers will receive free lights.", "The mall will open a new third floor."], 1, "2階の一部が作業のため閉鎖されます。"),
      makeListeningQuestion(30, "第2部", part2, "A bookstore has created a corner for books recommended by customers. Anyone can write a short card explaining why they liked a book. The owner says customers are more willing to try unfamiliar books when they see comments from other readers.", "Why did the bookstore create the corner?", ["To help customers discover books through others' comments.", "To sell only books written by local authors.", "To stop customers from writing reviews online.", "To make space for a coffee shop."], 1, "他の読者のコメントを通じて未知の本を手に取りやすくするためです。"),
    ];

    return applyAnswerPatternToQuestions(questions, [2, 4, 1, 3, 2, 1, 4, 3, 2, 4, 1, 3, 2, 4, 1, 3, 2, 4, 1, 3, 2, 4, 1, 3, 2, 4, 1, 3, 2, 4]);
  }

  function makeGrade2SpeakingSteps() {
    const cardTitle = "Shared Bicycles";
    const cardText = "Many cities have started shared bicycle programs. People can rent a bicycle at one station and return it at another. These programs are useful for short trips and may help reduce traffic. However, cities must make enough stations and keep the bicycles in good condition.";
    return [
      { label: "Warm-up", seconds: 10, prompt: "面接官の質問を聞いて、マイクに向かって答えます。", visual: "面接官", recording: true, questionText: "How did you come here today?" },
      { label: "Silent Reading", seconds: 20, prompt: "カードの英文を黙読します。録音はまだ始まりません。", visual: "カード", recording: false, cardTitle, cardText },
      { label: "Read Aloud", seconds: 45, prompt: "カードの英文を声に出して読みます。", visual: "カード", recording: true, cardTitle, cardText },
      { label: "No.1", seconds: 30, prompt: "カードの内容についての質問に答えます。", visual: "カード", recording: true, cardTitle, cardText, questionText: "According to the passage, why are shared bicycle programs useful?" },
      { label: "No.2", seconds: 30, prompt: "イラストの状況を説明します。", visual: "カード", recording: true, pictureText: "A man is trying to return a shared bicycle, but the station is full. Another person is waiting behind him.", questionText: "Please describe the situation." },
      { label: "No.3", seconds: 30, prompt: "カードのトピックに関連した質問に答えます。", visual: "面接官", recording: true, questionText: "Do you think more people will use shared transportation in the future?" },
      { label: "No.4", seconds: 30, prompt: "日常的な話題について、自分の意見を答えます。", visual: "面接官", recording: true, questionText: "Do you think students should do more volunteer work in their communities?" },
    ];
  }

  function makeListeningQuestions(sections) {
    return sections.flatMap((section) =>
      Array.from({ length: section.count }, (_, index) => {
        const id = section.start + index;
        return {
          id,
          section: section.label,
          instruction: section.instruction,
          choices: Array.from({ length: section.choiceCount }, (_, choiceIndex) => choiceIndex + 1),
        };
      }),
    );
  }

  function makeSpeakingSteps(type) {
    if (type === "pre1") {
      return [
        { label: "Warm-up", seconds: 10, prompt: "面接官の質問を聞いて、マイクに向かって答えます。", visual: "面接官", recording: true },
        { label: "Preparation", seconds: 60, prompt: "4コマのイラストを見て、ナレーションの内容を考えます。", visual: "カード", recording: false },
        { label: "Narration", seconds: 120, prompt: "4コマのイラストの展開を英語で説明します。", visual: "カード", recording: true },
        { label: "No.1", seconds: 30, prompt: "イラストに関連した質問に答えます。", visual: "カード", recording: true },
        { label: "No.2-3", seconds: 45, prompt: "カードのトピックに関連した質問に答えます。", visual: "面接官", recording: true },
        { label: "No.4", seconds: 30, prompt: "社会性のある内容について、自分の意見を答えます。", visual: "面接官", recording: true },
      ];
    }

    return [
      { label: "Warm-up", seconds: 10, prompt: "面接官の質問を聞いて、マイクに向かって答えます。", visual: "面接官", recording: true },
      { label: "Silent Reading", seconds: 20, prompt: "カードの英文を黙読します。録音はまだ始まりません。", visual: "カード", recording: false },
      { label: "Read Aloud", seconds: 45, prompt: "カードの英文を声に出して読みます。", visual: "カード", recording: true },
      { label: "No.1", seconds: 30, prompt: "カードの内容についての質問に答えます。", visual: "カード", recording: true },
      { label: "No.2", seconds: 30, prompt: "イラストの展開について説明します。", visual: "カード", recording: true },
      { label: "No.3-4", seconds: 30, prompt: "自分の考えを問う質問に答えます。", visual: "面接官", recording: true },
    ];
  }

  window.examData = {
    defaultGrade: "grade2",
    gradeOrder: ["pre2", "grade2", "pre1"],
    grades: {
      pre2: {
        key: "pre2",
        label: "準2級",
        displayName: "Grade Pre-2",
        modules,
        writtenExamSeconds: 80 * 60,
        listeningSeconds: 25 * 60,
        listeningAnswerSeconds: 10,
        readingQuestionCount: 29,
        writingQuestionCount: 2,
        listeningQuestionCount: 30,
        readingPages: [
          makeChoicePage("語い・熟語", 1, 15, "short"),
          makeChoicePage("会話文", 16, 5, "conversation"),
          makeLongPage("長文語句", 21, 2, "Sample Article"),
          makeLongPage("長文内容", 23, 7, "Summer Program"),
        ],
        writingTasks: [makeWritingTask(30, "email", "Eメール返信", "40語〜50語"), makeWritingTask(31, "essay", "意見論述", "50語〜60語")],
        listeningQuestions: makeListeningQuestions([
          { label: "第1部", start: 1, count: 10, choiceCount: 3, instruction: "対話を聞き、その最後の文に対する応答として最も適切なものを選びなさい。" },
          { label: "第2部", start: 11, count: 10, choiceCount: 4, instruction: "対話と質問を聞き、最も適切な答えを選びなさい。" },
          { label: "第3部", start: 21, count: 10, choiceCount: 4, instruction: "英文と質問を聞き、最も適切な答えを選びなさい。" },
        ]),
        speakingSteps: makeSpeakingSteps("grade2"),
      },
      grade2: {
        key: "grade2",
        setId: grade2Set01.setId || "prototype-grade2",
        defaultSet: "sample",
        label: "2級",
        displayName: "Grade 2",
        modules,
        writtenExamSeconds: 85 * 60,
        listeningSeconds: 25 * 60,
        listeningAnswerSeconds: 10,
        readingQuestionCount: 31,
        writingQuestionCount: 2,
        listeningQuestionCount: 30,
        readingPages: Array.isArray(grade2Set01.readingPages) ? grade2Set01.readingPages : makeGrade2ReadingPages(),
        writingTasks: Array.isArray(grade2Set01.writingTasks) ? grade2Set01.writingTasks : [makeGrade2SummaryTask(), makeGrade2EssayTask()],
        listeningQuestions: Array.isArray(grade2Set01.listeningQuestions) ? grade2Set01.listeningQuestions : makeGrade2ListeningQuestions(),
        speakingSteps: Array.isArray(grade2Set01.speakingSteps) ? grade2Set01.speakingSteps : makeGrade2SpeakingSteps(),
      },
      pre1: {
        key: "pre1",
        label: "準1級",
        displayName: "Grade Pre-1",
        modules,
        writtenExamSeconds: 90 * 60,
        listeningSeconds: 30 * 60,
        listeningAnswerSeconds: 10,
        readingQuestionCount: 31,
        writingQuestionCount: 2,
        listeningQuestionCount: 29,
        readingPages: makePre1ReadingPages(),
        writingTasks: [makePre1SummaryTask(), makePre1EssayTask()],
        listeningQuestions: makeListeningQuestions([
          { label: "第1部", start: 1, count: 12, choiceCount: 4, instruction: "会話の内容に関する質問に答えなさい。" },
          { label: "第2部", start: 13, count: 12, choiceCount: 4, instruction: "英文の内容に関する質問に答えなさい。" },
          { label: "第3部", start: 25, count: 5, choiceCount: 4, instruction: "Real-Life形式の放送内容に関する質問に答えなさい。" },
        ]),
        speakingSteps: makeSpeakingSteps("pre1"),
      },
    },
  };

  Object.entries(window.examData.grades).forEach(([gradeKey, grade]) => {
    if (Array.isArray(grade.sets) && grade.sets.length > 0) return;
    grade.sets = makeSetSlots(gradeKey, grade);
  });

  function makeSetSlots(gradeKey, grade) {
    const sampleSet = {
      key: gradeKey === "grade2" ? "sample" : "set-01",
      setId: gradeKey === "grade2" ? "grade2-sample" : grade.setId || `${gradeKey}-set-01`,
      label: gradeKey === "grade2" ? "サンプル問題" : "第1回",
      description: gradeKey === "grade2" ? "全技能サンプル" : "収録済み",
      status: "ready",
      enabled: true,
      readingPages: grade.readingPages,
      writingTasks: grade.writingTasks,
      listeningQuestions: grade.listeningQuestions,
      speakingSteps: grade.speakingSteps,
    };
    if (gradeKey === "grade2" && Array.isArray(grade2VocabSets) && grade2VocabSets.length > 0) {
      return [sampleSet, ...grade2VocabSets];
    }
    if (gradeKey === "pre1" && Array.isArray(pre1ListeningSets) && pre1ListeningSets.length > 0) {
      return pre1ListeningSets.map((set, index) => {
        const vocabSet = pre1VocabSets.find((candidate) => candidate.key === set.key);
        const readingGapSet = pre1ReadingGapSets.find((candidate) => candidate.key === set.key);
        const readingContentSet = pre1ReadingContentSets.find((candidate) => candidate.key === set.key);
        const readingPages = [
          ...(vocabSet?.readingPage ? [vocabSet.readingPage] : grade.readingPages.slice(0, 1)),
          ...(Array.isArray(readingGapSet?.readingPages) && readingGapSet.readingPages.length === 2
            ? readingGapSet.readingPages
            : grade.readingPages.slice(1, 3)),
          ...(Array.isArray(readingContentSet?.readingPages) && readingContentSet.readingPages.length === 2
            ? readingContentSet.readingPages
            : grade.readingPages.slice(3)),
        ];
        return {
          key: set.key || `set-${String(index + 1).padStart(2, "0")}`,
          setId: `pre1-${set.key || `set-${String(index + 1).padStart(2, "0")}`}`,
          label: set.label || `第${index + 1}回`,
          description:
            vocabSet && readingGapSet && readingContentSet
              ? "語彙・熟語18問／空所補充2大問／長文読解2大問／リスニングPart 1・2・3収録"
              : vocabSet && readingGapSet
                ? "語彙・熟語18問／空所補充2大問／リスニングPart 1・2・3収録"
              : vocabSet
                ? "語彙・熟語18問／リスニングPart 1・2・3収録"
                : "リスニングPart 1・2・3収録",
          status: "ready",
          enabled: true,
          readingPages,
          writingTasks: grade.writingTasks,
          listeningQuestions: set.questions,
          speakingSteps: grade.speakingSteps,
        };
      });
    }
    return [
      sampleSet,
      makePlannedSet(gradeKey, 2),
      makePlannedSet(gradeKey, 3),
      makePlannedSet(gradeKey, 4),
      makePlannedSet(gradeKey, 5),
    ];
  }

  function makePlannedSet(gradeKey, number) {
    const padded = String(number).padStart(2, "0");
    return {
      key: `set-${padded}`,
      setId: `${gradeKey}-set-${padded}`,
      label: `第${number}回`,
      description: "準備中",
      status: "planned",
      enabled: false,
    };
  }
})();
