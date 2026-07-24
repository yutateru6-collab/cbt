(() => {
  const makeQuestion = (id, type, text, choices, correct, explanation) => ({
    id,
    section: "短文空所補充",
    type,
    text,
    choices,
    correct,
    explanation,
  });

  const makeSet = (key, label, questions) => ({
    key,
    setId: `pre1-${key}`,
    label,
    description: "準1級 語彙・熟語18問",
    status: "ready",
    enabled: true,
    readingPage: {
      label: "短文空所補充",
      kind: "choice",
      instruction: "文脈に合う最も適切な語句を、4つの選択肢から1つ選びなさい。",
      passageTitle: "",
      passage: [],
      questions,
    },
  });

  window.scbtPre1VocabSets = [
    makeSet("set-01", "第1回", [
      makeQuestion(
        1,
        "vocabulary",
        "Auditors noticed a (　　　) between the warehouse records and the actual stock; the physical count was sixty units lower.",
        ["discrepancy", "connection", "pattern", "balance"],
        1,
        "1 discrepancy\n帳簿上の在庫数と実際の在庫数が一致していないため、discrepancy「食い違い」が正解です。connection は「関連」、pattern は「傾向」、balance は「均衡」で、60個少ないという不一致を表しません。"
      ),
      makeQuestion(
        2,
        "vocabulary",
        "After the storm damaged two schools beyond repair, the council decided to (　　　) half of its emergency budget to rebuilding them before autumn.",
        ["recover", "withhold", "allocate", "transfer"],
        3,
        "3 allocate\n緊急予算の半分を学校再建という特定目的に「割り当てる」ので allocate が適切です。recover は「取り戻す」、withhold は「差し控える」、transfer は「移す」ですが、予算を目的別に配分する意味では allocate が最も自然です。"
      ),
      makeQuestion(
        3,
        "vocabulary",
        "Mina remained (　　　) about the operation even after a lengthy consultation with the surgeon, and she asked for another explanation of the possible complications in detail.",
        ["receptive", "apprehensive", "skeptical", "indifferent"],
        2,
        "2 apprehensive\n合併症について再度説明を求めるほど手術を不安に感じているので、apprehensive「心配して」が正解です。receptive は「受け入れる姿勢の」、skeptical は「懐疑的な」、indifferent は「無関心な」です。"
      ),
      makeQuestion(
        4,
        "vocabulary",
        "Before publishing the allegation, the reporter obtained financial records from three independent sources to (　　　) it.",
        ["publicize", "simplify", "dispute", "substantiate"],
        4,
        "4 substantiate\n疑惑を報道する前に複数の独立資料で裏付ける場面なので、substantiate「証拠で実証する」が正解です。publicize は「公表する」、simplify は「単純化する」、dispute は「異議を唱える」です。"
      ),
      makeQuestion(
        5,
        "vocabulary",
        "During a routine inspection, engineers discovered that the coastal bridge's untreated bolts were especially (　　　) to corrosion after years of exposure to salty air.",
        ["susceptible", "adaptable", "resistant", "accustomed"],
        1,
        "1 susceptible\n海辺の塩分を含む空気でボルトが腐食していたため、susceptible to「～の影響を受けやすい」が合います。adaptable は「適応できる」、resistant は「耐性がある」、accustomed は「慣れている」です。"
      ),
      makeQuestion(
        6,
        "vocabulary",
        "The railway introduced cheaper midday fares as an (　　　) for commuters to travel outside the crowded morning period.",
        ["compensation", "incentive", "restriction", "rebate"],
        2,
        "2 incentive\n混雑時間を避けてもらうための動機づけとして割引を導入したので、incentive「奨励策」が正解です。compensation は「補償」、restriction は「制限」、rebate は「払い戻し・割引額」です。"
      ),
      makeQuestion(
        7,
        "vocabulary",
        "The rental agreement never (　　　) mentioned drones, so the owner could not rely on that clause when objecting to the tenant's device.",
        ["privately", "routinely", "mutually", "explicitly"],
        4,
        "4 explicitly\n契約条項にドローンが明確に書かれていなかったため、explicitly「明示的に」が正解です。privately は「内密に」、routinely は「日常的に」、mutually は「相互に」です。"
      ),
      makeQuestion(
        8,
        "vocabulary",
        "The factory reopened only four days after the fire despite losing one production building, demonstrating the remarkable (　　　) of its staff and supply network.",
        ["prosperity", "efficiency", "resilience", "uniformity"],
        3,
        "3 resilience\n火災後わずか4日で操業を再開できた回復力を示しているため、resilience「回復力・立ち直る力」が正解です。prosperity は「繁栄」、efficiency は「効率」、uniformity は「均一性」です。"
      ),
      makeQuestion(
        9,
        "vocabulary",
        "With reservoir levels continuing to fall during the driest spring in decades, the mayor ordered public buildings to (　　　) water use before imposing restrictions on households.",
        ["monitor", "curtail", "restore", "distribute"],
        2,
        "2 curtail\n貯水量が低下しているため、公共施設の水使用を「削減する」curtail が適切です。monitor は「監視する」、restore は「回復させる」、distribute は「配分する」です。"
      ),
      makeQuestion(
        10,
        "vocabulary",
        "Once all expenses were calculated, the additional cost proved (　　　), representing less than one tenth of one percent of the budget and too little to affect the council's final decision.",
        ["incidental", "substantial", "variable", "negligible"],
        4,
        "4 negligible\n追加費用が予算の0.1％未満なので、negligible「無視できるほど小さい」が正解です。incidental は「付随的な」、substantial は「かなりの」、variable は「変動する」です。"
      ),
      makeQuestion(
        11,
        "vocabulary",
        "Years of minor leaks caused a gradual (　　　) of the theater's wooden beams and weakened several load-bearing joints, although no single incident seemed serious.",
        ["deterioration", "contamination", "restoration", "adjustment"],
        1,
        "1 deterioration\n小さな水漏れが長年続き木材が徐々に悪化したため、deterioration「劣化」が正解です。contamination は「汚染」、restoration は「修復」、adjustment は「調整」です。"
      ),
      makeQuestion(
        12,
        "vocabulary",
        "Although several members praised the proposal at Monday's meeting, the board declined to (　　　) it until independent cost estimates for the expansion became available.",
        ["revise", "circulate", "endorse", "postpone"],
        3,
        "3 endorse\n費用の確認ができるまで提案を正式に支持しない場面なので、endorse「承認・支持する」が正解です。revise は「修正する」、circulate は「回覧する」、postpone は「延期する」です。"
      ),
      makeQuestion(
        13,
        "vocabulary",
        "During his first interview, the driver's explanation initially sounded (　　　), but security footage later showed that his car had entered from another street.",
        ["confidential", "plausible", "consistent", "accidental"],
        2,
        "2 plausible\n後で映像に否定されるまでは説明がもっともらしく聞こえたので、plausible「もっともらしい」が正解です。confidential は「機密の」、consistent は「一貫した」、accidental は「偶然の」です。"
      ),
      makeQuestion(
        14,
        "vocabulary",
        "The laboratory released only a (　　　) report because samples from two remote sites had not yet arrived for analysis, and researchers warned that several conclusions might change.",
        ["comprehensive", "confidential", "definitive", "preliminary"],
        4,
        "4 preliminary\n一部の試料が未到着で最終結論を出せないため、preliminary「暫定的な・予備的な」が合います。comprehensive は「包括的な」、confidential は「機密の」、definitive は「決定的な」です。"
      ),
      makeQuestion(
        15,
        "phrase",
        "Rather than replace every vehicle immediately, the city will (　　　) its oldest diesel buses over the next six years.",
        ["phase out", "write off", "bring back", "set aside"],
        1,
        "1 phase out\n6年間かけて古いバスを段階的に廃止するため、phase out が正解です。write off は「損失として処理する」、bring back は「復活させる」、set aside は「取っておく」です。"
      ),
      makeQuestion(
        16,
        "phrase",
        "Managers must not (　　　) repeated safety complaints from night-shift workers without a formal review simply because no serious accident has occurred at the plant during the current inspection cycle.",
        ["bring up", "look into", "brush aside", "point out"],
        3,
        "3 brush aside\n事故がまだないという理由で安全上の訴えを退けてはいけないので、brush aside「軽視して退ける」が正解です。bring up は「話題に出す」、look into は「調査する」、point out は「指摘する」です。"
      ),
      makeQuestion(
        17,
        "phrase",
        "The purchase may (　　　) after the bank withdrew financing, even though both companies have already approved the terms, leaving months of legal work without a potential buyer.",
        ["go ahead", "wind down", "come along", "fall through"],
        4,
        "4 fall through\n銀行が融資を撤回したため買収が成立しない可能性があり、fall through「計画などが失敗に終わる」が正解です。go ahead は「進む」、wind down は「徐々に終了する」、come along は「進展する」です。"
      ),
      makeQuestion(
        18,
        "phrase",
        "The director refused to (　　　) one designer for praise because the entire team had contributed to the successful exhibition and several members had solved equally difficult technical problems.",
        ["call in", "single out", "turn away", "bring along"],
        2,
        "2 single out\nチーム全員が貢献したため一人だけを特別に選んで称賛しなかったので、single out が正解です。call in は「呼び入れる」、turn away は「追い返す」、bring along は「連れてくる」です。"
      ),
    ]),

    makeSet("set-02", "第2回", [
      makeQuestion(
        1,
        "vocabulary",
        "Closing the regional train line had serious (　　　) for rural businesses for several months afterward, as they lost customers and struggled to receive supplies.",
        ["exemptions", "repercussions", "precautions", "fluctuations"],
        2,
        "2 repercussions\n鉄道路線の廃止が地方企業へ深刻な悪影響を及ぼしたので、repercussions「余波・重大な影響」が正解です。exemptions は「免除」、precautions は「予防策」、fluctuations は「変動」です。"
      ),
      makeQuestion(
        2,
        "vocabulary",
        "Accountants had to (　　　) two conflicting sets of sales records before every unexplained entry could be reported to the tax office and the annual audit could begin.",
        ["preserve", "disclose", "verify", "reconcile"],
        4,
        "4 reconcile\n食い違う2組の記録を照合し、矛盾を解消する必要があるため、reconcile「照合して一致させる」が正解です。preserve は「保存する」、disclose は「開示する」、verify は「正しいか確認する」ですが、二つを一致させる意味は弱いです。"
      ),
      makeQuestion(
        3,
        "vocabulary",
        "The conservator was (　　　), photographing every layer of paint and labeling each fragment before beginning the restoration.",
        ["meticulous", "discreet", "adaptable", "conventional"],
        1,
        "1 meticulous\n修復前に塗料の層や破片を一つずつ記録する非常に注意深い作業なので、meticulous「細部まで綿密な」が正解です。discreet は「慎重で口が堅い」、adaptable は「適応力のある」、conventional は「従来型の」です。"
      ),
      makeQuestion(
        4,
        "vocabulary",
        "A sudden (　　　) of rental apartments within walking distance of the university pushed prices up and forced many students to live farther away.",
        ["density", "mobility", "scarcity", "ownership"],
        3,
        "3 scarcity\n賃貸物件が不足した結果、家賃が上昇しているため、scarcity「不足・希少性」が正解です。density は「密度」、mobility は「移動性」、ownership は「所有権」です。"
      ),
      makeQuestion(
        5,
        "vocabulary",
        "Following repeated safety violations, the agency voted to permanently (　　　) the operator's license rather than suspend it again.",
        ["extend", "revoke", "suspend", "transfer"],
        2,
        "2 revoke\n一時停止ではなく免許を永久に取り消すため、revoke「正式に取り消す」が正解です。extend は「延長する」、suspend は「一時停止する」、transfer は「移す」です。"
      ),
      makeQuestion(
        6,
        "vocabulary",
        "Applicants called the selection process (　　　) because equally qualified people received different results during the same week depending on which official reviewed their forms.",
        ["arbitrary", "procedural", "transparent", "flexible"],
        1,
        "1 arbitrary\n同等の応募者でも担当者次第で結果が変わるため、arbitrary「恣意的な」が正解です。procedural は「手続き上の」、transparent は「透明性の高い」、flexible は「柔軟な」です。"
      ),
      makeQuestion(
        7,
        "vocabulary",
        "Despite the committee's public claim of unity, two members recorded their (　　　) in a written objection after the final vote on the decision.",
        ["approval", "inquiry", "compromise", "dissent"],
        4,
        "4 dissent\n全会一致という発表に反して、2人が書面で反対意見を残したため、dissent「異議・反対意見」が正解です。approval は「承認」、inquiry は「調査」、compromise は「妥協」です。"
      ),
      makeQuestion(
        8,
        "vocabulary",
        "Nora (　　　) accepted the temporary post only after her search for a permanent position had failed, and she planned to leave soon.",
        ["jointly", "readily", "reluctantly", "publicly"],
        3,
        "3 reluctantly\n常勤職が見つからず、すぐ辞めるつもりで仕方なく臨時職を受けたため、reluctantly「気が進まないまま」が正解です。jointly は「共同で」、readily は「快く」、publicly は「公に」です。"
      ),
      makeQuestion(
        9,
        "vocabulary",
        "Several schools installed shaded roofs and planted trees to (　　　) the effects of extreme heat on students during summer.",
        ["mitigate", "document", "predict", "magnify"],
        1,
        "1 mitigate\n屋根や樹木によって猛暑の影響を和らげるので、mitigate「緩和する」が正解です。document は「記録する」、predict は「予測する」、magnify は「拡大する」です。"
      ),
      makeQuestion(
        10,
        "vocabulary",
        "Medical researchers found that frequently rotating night shifts had a (　　　) effect on alertness over the following six months, even when workers slept for eight hours during the day.",
        ["incidental", "comparable", "beneficial", "detrimental"],
        4,
        "4 detrimental\n夜勤の頻繁な交代が注意力へ悪影響を与えたため、detrimental「有害な」が正解です。incidental は「付随的な」、comparable は「同程度の」、beneficial は「有益な」です。"
      ),
      makeQuestion(
        11,
        "vocabulary",
        "The spokesperson damaged her (　　　) during three televised interviews by changing key details each time reporters asked how the confidential files had been released.",
        ["eligibility", "credibility", "anonymity", "liability"],
        2,
        "2 credibility\n説明の重要部分を何度も変えたことで信頼性を損なったため、credibility「信頼性」が正解です。eligibility は「資格」、anonymity は「匿名性」、liability は「法的責任」です。"
      ),
      makeQuestion(
        12,
        "vocabulary",
        "To reduce rent and administrative costs, the charity plans to (　　　) its three local offices in a single central building by next summer.",
        ["decentralize", "refurbish", "consolidate", "relocate"],
        3,
        "3 consolidate\n3つの事務所を一つの建物へ統合するので、consolidate「統合する」が正解です。decentralize は「分散させる」、refurbish は「改装する」、relocate は「移転する」ですが、複数を一つにまとめる意味がありません。"
      ),
      makeQuestion(
        13,
        "vocabulary",
        "The engineers concluded that the tunnel was (　　　) after finding a route that met both the two-year deadline and the limited budget without changing the planned station locations.",
        ["desirable", "flexible", "sufficient", "feasible"],
        4,
        "4 feasible\n期限と予算の両方を満たす経路が見つかり、実行可能と判断したので、feasible「実現可能な」が正解です。desirable は「望ましい」、flexible は「柔軟な」、sufficient は「十分な」です。"
      ),
      makeQuestion(
        14,
        "vocabulary",
        "An unusually large harvest left farmers with a (　　　) they could not sell before the autumn festival, while storage facilities were already full.",
        ["reserve", "surplus", "shortage", "yield"],
        2,
        "2 surplus\n収穫量が多すぎて売れない余剰分が生じたため、surplus「余剰」が正解です。reserve は「蓄え」、shortage は「不足」、yield は「収穫量」です。"
      ),
      makeQuestion(
        15,
        "phrase",
        "Under the revised policy, departments may (　　　) unused training funds into the next fiscal year without special approval instead of returning them.",
        ["hand over", "turn over", "carry over", "take over"],
        3,
        "3 carry over\n未使用の予算を翌年度へ繰り越せるため、carry over が正解です。hand over は「引き渡す」、turn over は「引き渡す・裏返す」、take over は「引き継ぐ」です。"
      ),
      makeQuestion(
        16,
        "phrase",
        "Company officials tried to (　　　) the seriousness of the data breach in their first statement to customers, but investigators later found that thousands of records were exposed.",
        ["play down", "set out", "bring about", "look into"],
        1,
        "1 play down\n実際には多数の記録が流出していたのに深刻さを小さく見せようとしたので、play down「軽く扱う」が正解です。set out は「説明する・出発する」、bring about は「引き起こす」、look into は「調査する」です。"
      ),
      makeQuestion(
        17,
        "phrase",
        "Delegates decided to (　　　) negotiations after confidential proposals appeared online, and both groups immediately left the meeting.",
        ["speed up", "draw out", "set up", "break off"],
        4,
        "4 break off\n機密案の流出後に双方が会場を去り、交渉を打ち切ったので、break off が正解です。speed up は「加速する」、draw out は「長引かせる」、set up は「設定する」です。"
      ),
      makeQuestion(
        18,
        "phrase",
        "Engineers warned that new compatibility problems could (　　　) without warning during the first weeks of operation when the updated payment system was connected to older store equipment.",
        ["die down", "crop up", "fade out", "slip away"],
        2,
        "2 crop up\n新旧システムの接続時に予期しない問題が生じる可能性があるため、crop up「突然発生する」が正解です。die down は「弱まる」、fade out は「徐々に消える」、slip away は「いつの間にか去る」です。"
      ),
    ]),

    makeSet("set-03", "第3回", [
      makeQuestion(
        1,
        "vocabulary",
        "Before the acquisition, lawyers were asked to (　　　) every supplier contract for hidden debts and unusual cancellation clauses.",
        ["authorize", "negotiate", "scrutinize", "distribute"],
        3,
        "3 scrutinize\n買収前に隠れた債務や不自然な条項を詳しく調べるため、scrutinize「綿密に調査する」が正解です。authorize は「認可する」、negotiate は「交渉する」、distribute は「配布する」です。"
      ),
      makeQuestion(
        2,
        "vocabulary",
        "Frequent changes in tax policy over a single year created economic (　　　), causing several investors to delay projects until the rules became clearer.",
        ["instability", "transparency", "diversity", "prosperity"],
        1,
        "1 instability\n税制が頻繁に変わり投資家が計画を延期したため、instability「不安定さ」が正解です。transparency は「透明性」、diversity は「多様性」、prosperity は「繁栄」です。"
      ),
      makeQuestion(
        3,
        "vocabulary",
        "During preliminary tests, technicians confirmed that the new software and the hospital's older sensors were (　　　), so no adapters would be needed.",
        ["identical", "accessible", "durable", "compatible"],
        4,
        "4 compatible\n新しいソフトと古いセンサーがアダプターなしで一緒に使えるため、compatible「互換性がある」が正解です。identical は「同一の」、accessible は「利用しやすい」、durable は「耐久性のある」です。"
      ),
      makeQuestion(
        4,
        "vocabulary",
        "The new transit app's main (　　　) during long journeys was that it stopped working in rural areas where mobile signals were weak.",
        ["breakthrough", "shortcoming", "precaution", "complication"],
        2,
        "2 shortcoming\n電波の弱い地域で使えないというアプリの欠点を述べているため、shortcoming「欠点」が正解です。breakthrough は「画期的進展」、precaution は「予防策」、complication は「複雑化・合併症」です。"
      ),
      makeQuestion(
        5,
        "vocabulary",
        "Within hours of the flood warning, the charity managed to (　　　) its nationwide volunteer network, bring teams from three neighboring provinces, and deliver emergency supplies before nearby roads closed that same evening.",
        ["assign", "register", "mobilize", "supervise"],
        3,
        "3 mobilize\n警報から数時間で全国のボランティア網を動員したため、mobilize「動員する」が正解です。assign は「割り当てる」、register は「登録する」、supervise は「監督する」です。"
      ),
      makeQuestion(
        6,
        "vocabulary",
        "Both parties accepted Lena as an (　　　) mediator because she had no previous relationship with either organization.",
        ["authoritative", "reserved", "sympathetic", "impartial"],
        4,
        "4 impartial\nどちらの組織とも関係がなく、双方から受け入れられたため、impartial「公平な」が正解です。authoritative は「権威ある」、reserved は「控えめな」、sympathetic は「同情的な」です。"
      ),
      makeQuestion(
        7,
        "vocabulary",
        "As a final (　　　) after weeks of negotiation, the landlord offered one month of free parking but refused to reduce the rent itself.",
        ["concession", "subsidy", "guarantee", "settlement"],
        1,
        "1 concession\n家賃は下げない代わりに無料駐車を認める譲歩なので、concession「譲歩」が正解です。subsidy は「補助金」、guarantee は「保証」、settlement は「合意・解決」です。"
      ),
      makeQuestion(
        8,
        "vocabulary",
        "The normally busy station was (　　　) empty during the strike, apart from two security guards and a reporter waiting near the entrance.",
        ["formerly", "virtually", "evenly", "openly"],
        2,
        "2 virtually\n警備員と記者以外は人がいなかったので、virtually「ほとんど・事実上」が正解です。formerly は「以前は」、evenly は「均等に」、openly は「公然と」です。"
      ),
      makeQuestion(
        9,
        "vocabulary",
        "After reinforcement, the mountain bridge should (　　　) winds far stronger than those recorded during last winter's severe storm without closing the road.",
        ["deflect", "absorb", "redirect", "withstand"],
        4,
        "4 withstand\n補強後の橋が強風を受けても閉鎖せず耐えられるという意味なので、withstand「耐える」が正解です。deflect は「そらす」、absorb は「吸収する」、redirect は「方向を変える」で、橋自体の耐久性を表しません。"
      ),
      makeQuestion(
        10,
        "vocabulary",
        "Automatic data entry made the second manual review (　　　), since the same information had already been checked by the system.",
        ["redundant", "mandatory", "confidential", "efficient"],
        1,
        "1 redundant\n同じ情報が自動で確認済みなので、二度目の手作業は不要となり、redundant「余分な・不要な」が正解です。mandatory は「義務的な」、confidential は「機密の」、efficient は「効率的な」です。"
      ),
      makeQuestion(
        11,
        "vocabulary",
        "After colleagues discovered that he had deleted measurements contradicting his theory, serious questions arose about the researcher's professional (　　　), and the journal immediately opened a formal inquiry.",
        ["expertise", "privacy", "integrity", "morale"],
        3,
        "3 integrity\n自説に不都合な測定値を削除したことで職業上の誠実さが疑われるため、integrity「誠実さ」が正解です。expertise は「専門知識」、privacy は「プライバシー」、morale は「士気」です。"
      ),
      makeQuestion(
        12,
        "vocabulary",
        "By cross-training nurses before flu season, the hospital hoped to (　　　) staffing shortages during the peak weeks if many employees became ill.",
        ["predict", "forestall", "document", "quantify"],
        2,
        "2 forestall\n流行前の訓練で人員不足が起きるのを未然に防ごうとしているため、forestall「先回りして防ぐ」が正解です。predict は「予測する」、document は「記録する」、quantify は「数量化する」です。"
      ),
      makeQuestion(
        13,
        "vocabulary",
        "During the product's first year, complaints about the device were (　　　), appearing in small clusters separated by several months with no reported problems.",
        ["sporadic", "persistent", "gradual", "simultaneous"],
        1,
        "1 sporadic\n苦情が数か月の間隔を空けて時折まとまって出ているため、sporadic「散発的な」が正解です。persistent は「持続的な」、gradual は「徐々の」、simultaneous は「同時の」です。"
      ),
      makeQuestion(
        14,
        "vocabulary",
        "Staff cuts after a month-long hiring freeze created a large (　　　) of unopened applications from across the county, and some residents waited three months for a response.",
        ["deficit", "volume", "schedule", "backlog"],
        4,
        "4 backlog\n未処理の申請書がたまり、回答が遅れているため、backlog「未処理分の蓄積」が正解です。deficit は「不足・赤字」、volume は「量」、schedule は「予定」です。"
      ),
      makeQuestion(
        15,
        "phrase",
        "The insurer introduced an extra screening stage to (　　　) suspicious claims before any payments were authorized.",
        ["sort out", "weed out", "point out", "bring out"],
        2,
        "2 weed out\n支払い前に疑わしい請求を選別して排除するため、weed out「好ましくないものを取り除く」が正解です。sort out は「整理・解決する」、point out は「指摘する」、bring out は「引き出す」です。"
      ),
      makeQuestion(
        16,
        "phrase",
        "Workers placed temporary barriers along the river to (　　　) the weakened bank, where earlier floods had removed much of the soil, before the next period of heavy rain.",
        ["build up", "clear out", "cut back", "shore up"],
        4,
        "4 shore up\n弱くなった川岸を仮設の防壁で補強するため、shore up「支える・補強する」が正解です。build up は「築き上げる」、clear out は「一掃する」、cut back は「削減する」です。"
      ),
      makeQuestion(
        17,
        "phrase",
        "While cataloging a box of donated letters for a public exhibition, the librarian happened to (　　　) an unpublished manuscript by a well-known poet.",
        ["look after", "go through", "come across", "turn down"],
        3,
        "3 come across\n寄贈資料を整理中に未発表原稿を偶然見つけたため、come across「偶然出会う・見つける」が正解です。look after は「世話をする」、go through は「調べる・経験する」、turn down は「断る」です。"
      ),
      makeQuestion(
        18,
        "phrase",
        "After two weak sales quarters, the retailer decided to (　　　), delaying new stores and further reducing its advance orders until consumer demand showed signs of recovery the following spring.",
        ["scale back", "branch out", "press ahead", "start over"],
        1,
        "1 scale back\n新店舗を延期し発注量も減らすため、scale back「規模を縮小する」が正解です。branch out は「事業を広げる」、press ahead は「前進を続ける」、start over は「やり直す」です。"
      ),
    ]),

    makeSet("set-04", "第4回", [
      makeQuestion(
        1,
        "vocabulary",
        "Publishing detailed expense records for the first time directly increased the council's (　　　), since residents could now question officials about individual purchases.",
        ["confidentiality", "flexibility", "efficiency", "accountability"],
        4,
        "4 accountability\n支出を公開し住民が担当者へ説明を求められるため、accountability「説明責任」が正解です。confidentiality は「機密性」、flexibility は「柔軟性」、efficiency は「効率」です。"
      ),
      makeQuestion(
        2,
        "vocabulary",
        "The construction permit for the eastern site remains (　　　) until soil tests confirm that the hillside can safely support the planned apartments.",
        ["binding", "provisional", "unanimous", "routine"],
        2,
        "2 provisional\n土壌検査の結果が出るまでは許可が確定していないため、provisional「暫定的な」が正解です。binding は「拘束力のある」、unanimous は「全会一致の」、routine は「日常的な」です。"
      ),
      makeQuestion(
        3,
        "vocabulary",
        "The scientist used satellite data to (　　　) claims that the forest had fully recovered from the wildfire because large damaged areas remained visible.",
        ["clarify", "repeat", "rebut", "verify"],
        3,
        "3 rebut\n衛星画像に広い被害地域が残り、「完全に回復した」という主張を反証しているため、rebut「反論・反証する」が正解です。clarify は「明確にする」、repeat は「繰り返す」、verify は「正しさを確認する」です。"
      ),
      makeQuestion(
        4,
        "vocabulary",
        "By omitting evidence that challenged its conclusion while giving great weight to several unverified statements from local activists, the report presented a serious (　　　) of what had actually occurred.",
        ["distortion", "disclosure", "interpretation", "summary"],
        1,
        "1 distortion\n結論に反する証拠を省き、出来事をゆがめて伝えたため、distortion「歪曲」が正解です。disclosure は「開示」、interpretation は「解釈」、summary は「要約」です。"
      ),
      makeQuestion(
        5,
        "vocabulary",
        "The coalition proved surprisingly (　　　); a minor disagreement over meeting dates caused three organizations to withdraw.",
        ["informal", "strategic", "hostile", "fragile"],
        4,
        "4 fragile\n会議日程の小さな対立で複数団体が離脱したため、fragile「壊れやすい・不安定な」が正解です。informal は「非公式な」、strategic は「戦略的な」、hostile は「敵対的な」です。"
      ),
      makeQuestion(
        6,
        "vocabulary",
        "At next month's meeting, the ministry will decide whether to (　　　) its decision on the nearby coastal project until local residents have completed a formal consultation.",
        ["reverse", "defer", "enforce", "announce"],
        2,
        "2 defer\n住民との正式協議が終わるまで決定を先送りするので、defer「延期する」が正解です。reverse は「覆す」、enforce は「施行する」、announce は「発表する」です。"
      ),
      makeQuestion(
        7,
        "vocabulary",
        "Because the fines were too small to prevent illegal dumping after a six-month trial, officials concluded that they were not an effective (　　　).",
        ["deterrent", "penalty", "exemption", "remedy"],
        1,
        "1 deterrent\n罰金が不法投棄を思いとどまらせる効果を持たなかったため、deterrent「抑止するもの」が正解です。penalty は「罰そのもの」、exemption は「免除」、remedy は「改善策」です。"
      ),
      makeQuestion(
        8,
        "vocabulary",
        "The twelve families own the farmland (　　　), so any sale requires the approval of every household.",
        ["separately", "privately", "collectively", "temporarily"],
        3,
        "3 collectively\n12家族が共同所有し、売却に全世帯の同意が必要なので、collectively「共同で」が正解です。separately は「別々に」、privately は「私的に」、temporarily は「一時的に」です。"
      ),
      makeQuestion(
        9,
        "vocabulary",
        "From the pattern of scorch marks alone, investigators could (　　　) without interviewing witnesses that the fire began after the restaurant had closed.",
        ["allege", "infer", "assume", "recall"],
        2,
        "2 infer\n焼け跡という証拠から出火時刻を推論しているため、infer「推論する」が正解です。allege は「証拠未確定のまま主張する」、assume は「仮定する」、recall は「思い出す」です。"
      ),
      makeQuestion(
        10,
        "vocabulary",
        "Although the volcano has not erupted for seven centuries, underground activity suggests that it is (　　　) rather than extinct and must remain closely monitored.",
        ["unstable", "isolated", "extinct", "dormant"],
        4,
        "4 dormant\n長期間噴火していなくても地下活動があり、死火山ではなく休眠状態なので、dormant「休止中の」が正解です。unstable は「不安定な」、isolated は「孤立した」、extinct は「活動を終えた」です。"
      ),
      makeQuestion(
        11,
        "vocabulary",
        "A six-month study in its first stage will examine the project's (　　　), including whether it can operate within budget without permanent subsidies.",
        ["legality", "popularity", "viability", "durability"],
        3,
        "3 viability\n恒久的補助金なしで予算内に運営できるかを調べるため、viability「実行・存続可能性」が正解です。legality は「合法性」、popularity は「人気」、durability は「耐久性」です。"
      ),
      makeQuestion(
        12,
        "vocabulary",
        "The new regulation will (　　　) small family farms from filing weekly reports for the coming year, but annual records will still be required.",
        ["exempt", "discourage", "protect", "isolate"],
        1,
        "1 exempt\n小規模農家には週次報告を課さないので、exempt A from B「AをBから免除する」が正解です。discourage は「思いとどまらせる」、protect は「守る」、isolate は「隔離する」です。"
      ),
      makeQuestion(
        13,
        "vocabulary",
        "Restoring the nineteenth-century clock for the town museum required an experienced specialist because its (　　　) mechanism contained hundreds of tiny interlocking brass pieces.",
        ["symmetrical", "intricate", "conventional", "authentic"],
        2,
        "2 intricate\n何百もの小さな部品が複雑にかみ合う仕組みなので、intricate「複雑で精巧な」が正解です。symmetrical は「左右対称の」、conventional は「従来型の」、authentic は「本物の」です。"
      ),
      makeQuestion(
        14,
        "vocabulary",
        "A sudden (　　　) of visitors from across the region during the three-day summer festival, which had been heavily advertised abroad, strained the island's limited water supply and filled every available guest room.",
        ["migration", "shortage", "departure", "influx"],
        4,
        "4 influx\n祭りで来訪者が急に大量流入したため、influx「流入」が正解です。migration は「移住・移動」、shortage は「不足」、departure は「出発」です。"
      ),
      makeQuestion(
        15,
        "phrase",
        "Technical teams met throughout the weekend to (　　　) the remaining disagreements before a delayed regulatory deadline for the merger expired on Monday morning and the two companies signed the contract.",
        ["map out", "point out", "iron out", "leave out"],
        3,
        "3 iron out\n契約締結前に残った意見の相違を解消するため、iron out「問題を解決する」が正解です。map out は「計画を練る」、point out は「指摘する」、leave out は「省く」です。"
      ),
      makeQuestion(
        16,
        "phrase",
        "The government agreed to (　　　) the regional railway with an emergency loan after banks refused further credit.",
        ["bail out", "buy out", "phase in", "close down"],
        1,
        "1 bail out\n銀行が融資を拒否した鉄道会社を緊急融資で救済するため、bail out が正解です。buy out は「買収する」、phase in は「段階的に導入する」、close down は「閉鎖する」です。"
      ),
      makeQuestion(
        17,
        "phrase",
        "The pain returned before the next dose was due, although the first dose had initially provided complete relief for several hours, suggesting that the medicine's effect had begun to (　　　).",
        ["kick in", "wear off", "flare up", "die out"],
        2,
        "2 wear off\n次の服用時刻より前に痛みが戻り、薬の効果が薄れたため、wear off が正解です。kick in は「効き始める」、flare up は「急に悪化する」、die out は「消滅する」です。"
      ),
      makeQuestion(
        18,
        "phrase",
        "The chair announced that she would immediately (　　　) after the ethics investigation, allowing her deputy to lead the organization for the remainder of her five-year term without another election.",
        ["stand by", "move in", "carry on", "step down"],
        4,
        "4 step down\n倫理調査後に副代表へ組織運営を任せるため、step down「役職を辞任する」が正解です。stand by は「待機・支持する」、move in は「入居する」、carry on は「続ける」です。"
      ),
    ]),

    makeSet("set-05", "第5回", [
      makeQuestion(
        1,
        "vocabulary",
        "The court's ruling established a (　　　) that lawyers later cited repeatedly in several national appeals involving the same type of digital evidence.",
        ["precedent", "provision", "verdict", "appeal"],
        1,
        "1 precedent\n後の同種事件で引用される判断基準を作ったため、precedent「判例・前例」が正解です。provision は「条項」、verdict は「評決」、appeal は「上訴」です。"
      ),
      makeQuestion(
        2,
        "vocabulary",
        "The city hoped the steep entry fee would (　　　) motorists who could easily take the nearby train; weekday traffic fell during the morning rush after the new subway opened.",
        ["confront", "exclude", "caution", "dissuade"],
        4,
        "4 dissuade\n高い料金によって自動車利用を思いとどまらせ、実際に交通量が減ったため、dissuade「断念させる」が正解です。confront は「立ち向かう」、exclude は「除外する」、caution は「注意する」です。"
      ),
      makeQuestion(
        3,
        "vocabulary",
        "The laboratory's (　　　) safety standards led it to reject equipment with even minor weaknesses in protective seals.",
        ["consistent", "stringent", "flexible", "voluntary"],
        2,
        "2 stringent\n保護部分にわずかな弱点がある装置さえ不合格にする厳格な基準なので、stringent「厳しい」が正解です。consistent は「一貫した」、flexible は「柔軟な」、voluntary は「任意の」です。"
      ),
      makeQuestion(
        4,
        "vocabulary",
        "During a news conference held downtown, the museum denied any formal (　　　) with the election campaign, stating that a volunteer had displayed the poster without permission.",
        ["funding", "attendance", "affiliation", "reputation"],
        3,
        "3 affiliation\n選挙運動との公式な関係を否定しているため、affiliation「提携・所属関係」が正解です。funding は「資金提供」、attendance は「出席」、reputation は「評判」です。"
      ),
      makeQuestion(
        5,
        "vocabulary",
        "Technicians managed to (　　　) most of the inaccessible images from the damaged drive before it failed completely and copied them to a secure server.",
        ["retrieve", "restore", "transmit", "archive"],
        1,
        "1 retrieve\n壊れたドライブからアクセス不能だった画像を取り出したため、retrieve「回収する」が正解です。restore は「元の状態に戻す」、transmit は「送信する」、archive は「保管する」です。"
      ),
      makeQuestion(
        6,
        "vocabulary",
        "Even after the battery was redesigned, some fire risk remained (　　　) in its chemical structure under normal operating conditions and could not be removed entirely.",
        ["accidental", "external", "temporary", "inherent"],
        4,
        "4 inherent\n設計変更後も化学構造そのものに危険が内在しているため、inherent「本質的に備わった」が正解です。accidental は「偶発的な」、external は「外部の」、temporary は「一時的な」です。"
      ),
      makeQuestion(
        7,
        "vocabulary",
        "The duplicate payment resulted from an (　　　) during the monthly review; neither accountant noticed that two invoices carried the same reference number.",
        ["assumption", "compromise", "oversight", "exception"],
        3,
        "3 oversight\n二人の会計担当者が請求書番号の重複を見落としたため、oversight「見落とし」が正解です。assumption は「仮定」、compromise は「妥協」、exception は「例外」です。"
      ),
      makeQuestion(
        8,
        "vocabulary",
        "Researchers released the findings (　　　), before independent checks were complete, and later had to withdraw several conclusions.",
        ["anonymously", "prematurely", "selectively", "privately"],
        2,
        "2 prematurely\n独立検証が終わる前に結果を発表し、後で撤回したため、prematurely「時期尚早に」が正解です。anonymously は「匿名で」、selectively は「選択的に」、privately は「非公開で」です。"
      ),
      makeQuestion(
        9,
        "vocabulary",
        "Before its capital campaign, the rapidly growing charity introduced independent reviews intended to (　　　) donor confidence in the controls governing future spending after several regional offices opened.",
        ["assess", "acknowledge", "publicize", "bolster"],
        4,
        "4 bolster\n大規模な資金募集前に独立審査で寄付者の信頼を強めるため、bolster「強化する」が正解です。assess は「評価する」、acknowledge は「認める」、publicize は「公表する」で、信頼そのものを高める意味ではありません。"
      ),
      makeQuestion(
        10,
        "vocabulary",
        "The proposal was not (　　　): each section contained useful details, but its recommendations repeatedly contradicted one another.",
        ["coherent", "concise", "comprehensive", "objective"],
        1,
        "1 coherent\n各部分に情報はあるものの提案同士が矛盾しているため、coherent「筋が通った・一貫した」の否定が合います。concise は「簡潔な」、comprehensive は「包括的な」、objective は「客観的な」です。"
      ),
      makeQuestion(
        11,
        "vocabulary",
        "With no official sales figures available, online (　　　) spread quickly among overseas traders and caused the company's share price to swing sharply.",
        ["consultation", "regulation", "speculation", "disclosure"],
        3,
        "3 speculation\n公式数字がない中で憶測が広がり株価が乱高下したため、speculation「憶測」が正解です。consultation は「協議」、regulation は「規制」、disclosure は「情報開示」です。"
      ),
      makeQuestion(
        12,
        "vocabulary",
        "The foundation agreed to fully (　　　) volunteers for train fares and meals within two weeks, provided that they submitted the original receipts.",
        ["compensate", "reimburse", "subsidize", "reward"],
        2,
        "2 reimburse\n領収書に基づいて交通費や食費を払い戻すため、reimburse「立て替え費用を返金する」が正解です。compensate は「損失などを補償する」、subsidize は「補助金を出す」、reward は「功績に報いる」です。"
      ),
      makeQuestion(
        13,
        "vocabulary",
        "At the final construction stage, the (　　　) effect of several small shipping delays left the project almost a month behind its original schedule.",
        ["marginal", "temporary", "random", "cumulative"],
        4,
        "4 cumulative\n複数の小さな遅れが積み重なって約1か月の遅延になったため、cumulative「累積的な」が正解です。marginal は「わずかな」、temporary は「一時的な」、random は「無作為な」です。"
      ),
      makeQuestion(
        14,
        "vocabulary",
        "Inspectors reviewed maintenance records to confirm the airline's (　　　) with safety rules before renewing its operating certificate.",
        ["compliance", "reliance", "resistance", "awareness"],
        1,
        "1 compliance\n運航証明を更新する前に安全規則を順守しているか確認するため、compliance with「～の順守」が正解です。reliance は「依存」、resistance は「抵抗」、awareness は「認識」です。"
      ),
      makeQuestion(
        15,
        "phrase",
        "During the emergency, the engineer was able to (　　　) years of field experience instead of waiting for headquarters when the written procedures proved inadequate.",
        ["act on", "draw on", "reflect on", "dwell on"],
        2,
        "2 draw on\n手順書が不十分な状況で長年の経験を活用したため、draw on「経験などを利用する」が正解です。act on は「情報などに基づいて行動する」、reflect on は「振り返って考える」、dwell on は「長々と考え続ける」です。"
      ),
      makeQuestion(
        16,
        "phrase",
        "A new manager managed to (　　　) the failing factory, making it profitable within a year without dismissing permanent staff even though suppliers had threatened to cancel contracts.",
        ["shut down", "scale up", "turn around", "buy out"],
        3,
        "3 turn around\n赤字工場を1年で黒字化したため、turn around「業績などを好転させる」が正解です。shut down は「閉鎖する」、scale up は「規模を拡大する」、buy out は「買収する」です。"
      ),
      makeQuestion(
        17,
        "phrase",
        "The landlord chose to (　　　) roof repairs until winter despite repeated warnings from the building inspector in spring, but the leak worsened during several weeks of heavy rain.",
        ["put off", "carry out", "speed up", "pay for"],
        1,
        "1 put off\n屋根の修理を冬まで延期した結果、雨漏りが悪化したため、put off「延期する」が正解です。carry out は「実施する」、speed up は「早める」、pay for は「費用を払う」です。"
      ),
      makeQuestion(
        18,
        "phrase",
        "While the director recovered from surgery, her deputy agreed to (　　　) and attend all negotiations on the organization's behalf until she returned to work three months later.",
        ["drop out", "sit back", "step aside", "stand in"],
        4,
        "4 stand in\n代表の療養中に副代表が一時的に代役を務めるため、stand in「代わりを務める」が正解です。drop out は「脱退する」、sit back は「傍観する」、step aside は「身を引く」です。"
      ),
    ]),
  ];
})();
