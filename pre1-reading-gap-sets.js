(() => {
  const makeQuestion = (id, section, choices, correct, explanation) => ({
    id,
    section,
    type: "long-vocabulary",
    text: `Which word or phrase best fits blank (${id})?`,
    choices,
    correct,
    explanation,
  });

  const makePage = (label, passageTitle, passage, questions) => ({
    label,
    kind: "long",
    passageTitle,
    passage,
    questions,
  });

  const makeSet = (key, label, readingPages) => ({
    key,
    label,
    readingPages,
  });

  window.scbtPre1ReadingGapSets = [
    makeSet("set-01", "第1回", [
      makePage(
        "長文語句 2A",
        "Turning Down the Night Sky",
        [
          "Every spring and autumn, billions of birds migrate after dark. Stars and other natural cues help them keep their direction, but artificial light now competes with these signals. Bright office towers can draw birds away from their routes, particularly when clouds hide the sky. Some birds circle illuminated buildings until they are exhausted, while others collide with windows. (19), conservation groups have urged cities to reduce unnecessary lighting during the busiest weeks of migration.",
          "Several cities now run voluntary “lights-out” programs. Building owners are asked to switch off decorative lights and darken empty offices after midnight. At first, critics argued that a voluntary program would attract too few participants to make a measurable difference. Researchers therefore worked with volunteers who counted dead or injured birds near selected buildings over many migration seasons. They also recorded weather, since fog and wind can affect flight. Because the buildings did not use the same lighting every night, (20). The data showed substantially fewer collisions on nights when more windows were dark.",
          "The findings do not mean that entire city centers must be left without light. Street-level lighting may be needed for safety, and restaurants and theaters depend on visible signs. Most collisions, however, occur late at night, when many upper-floor offices are empty. Cities can also use motion sensors or shades that keep indoor light from spilling upward. By concentrating on particular buildings, hours, and seasons, lights-out programs (21). This targeted approach has persuaded some property managers who initially regarded the campaign as unrealistic.",
        ],
        [
          makeQuestion(
            19,
            "長文語句 2A",
            ["In comparison", "As a result", "For example", "Even so"],
            2,
            "2 As a result\n人工照明によって渡り鳥が消耗・衝突する問題が起きているため、その「結果として」消灯を求める動きが生まれた、という因果関係です。"
          ),
          makeQuestion(
            20,
            "長文語句 2A",
            [
              "the volunteers were told to avoid the area",
              "the program ended sooner than expected",
              "the birds learned to choose different routes",
              "the researchers could compare different lighting conditions",
            ],
            4,
            "4 the researchers could compare different lighting conditions\n建物の点灯状況が夜ごとに異なるため、研究者は明るい夜と暗い夜の衝突数を比較できました。直後の The data showed ... にも自然につながります。"
          ),
          makeQuestion(
            21,
            "長文語句 2A",
            [
              "can reduce the danger without making downtown areas completely dark",
              "have encouraged more businesses to remain open all night",
              "can prevent clouds from interfering with natural signals",
              "have made street-level safety measures unnecessary",
            ],
            1,
            "1 can reduce the danger without making downtown areas completely dark\n対象となる建物・時間・季節を限定することで、都心全体を暗くせずに鳥の危険を減らせる、という段落の要点です。"
          ),
        ]
      ),
      makePage(
        "長文語句 2B",
        "A Second Life for Electronics",
        [
          "Many modern electronic products are difficult to open. Their cases may be glued shut, and batteries or screens are often attached in ways that require special tools. Repair shops may also be denied the software needed to identify a fault. Manufacturers say these designs make devices thinner and more resistant to water. Consumer groups respond that the same choices (22). When one inexpensive component fails, the owner may have little practical choice but to buy a completely new product.",
          "In response, a growing number of governments have introduced “right-to-repair” rules. Depending on the law, manufacturers may have to sell replacement parts, provide repair manuals, or support products for a minimum number of years. Some companies warn that repairs by untrained people could cause fires or expose private data. (23), supporters note that independent repair shops already handle complicated devices and can follow safety standards when information and suitable parts are available.",
          "Repairability may also change how manufacturers earn money. A company that supplies official parts and diagnostic software can continue receiving income long after the original sale. It may also strengthen customer loyalty by keeping a trusted product useful longer. Designing products in modules can reduce the cost of updating them as well: a customer might replace a camera or battery without discarding the rest of a phone. Although such changes require manufacturers to reconsider familiar designs, they suggest that (24). The debate is therefore shifting from whether products should be repaired to how a reliable repair system can be built.",
        ],
        [
          makeQuestion(
            22,
            "長文語句 2B",
            [
              "allow old devices to operate with less electricity",
              "protect repair shops from unfair competition",
              "encourage consumers to replace products that could be repaired",
              "make replacement parts easier to manufacture",
            ],
            3,
            "3 encourage consumers to replace products that could be repaired\n部品1つの故障でも本体ごと買い替えざるを得ない、という次の文を導く内容です。薄型化や防水性というメーカー側の利点とは対照的です。"
          ),
          makeQuestion(
            23,
            "長文語句 2B",
            ["In other words", "Nevertheless", "For instance", "As a result"],
            2,
            "2 Nevertheless\nメーカー側は修理の危険性を主張していますが、支持者は適切な情報と部品があれば安全基準に従えると反論しています。逆接の Nevertheless が最適です。"
          ),
          makeQuestion(
            24,
            "長文語句 2B",
            [
              "most customers are unwilling to repair expensive devices",
              "water resistance will soon become less important",
              "governments should operate their own repair businesses",
              "repairability can support rather than threaten manufacturers",
            ],
            4,
            "4 repairability can support rather than threaten manufacturers\n公式部品や診断ソフトの販売が継続収入になる例から、修理しやすさはメーカーを脅かすだけでなく利益にもなり得る、とまとめるのが自然です。"
          ),
        ]
      ),
    ]),
    makeSet("set-02", "第2回", [
      makePage(
        "長文語句 2A",
        "The History Stored in Fish Ears",
        [
          "Fish do not have external ears, but inside their heads are small structures called otoliths. These hard pieces help fish maintain their balance. They also grow by adding thin layers of material, rather like the rings of a tree. The layers remain in the order in which they formed. Scientists can count them to estimate a fish’s age. More importantly, the material added at each stage contains a chemical record of the surrounding water. Otoliths therefore (19), even after the fish has traveled far from the place where it was born.",
          "Researchers use several parts of this record. The proportion of certain forms of oxygen can provide clues about water temperature. Other elements may have distinctive patterns in different rivers or coastal areas. (20), if young fish from one river have a recognizable chemical pattern, scientists can later look for that pattern in adults caught at sea. This allows them to estimate how many fish from each breeding area survive and where they migrate.",
          "The method is powerful, but an otolith is not a perfect diary. Pollution can alter the chemistry of a river, and a fish’s growth or diet can affect how some elements enter the otolith. Researchers must first collect samples from known locations and determine which chemical differences remain stable. They may also compare the results with tags, genetic data, or ocean-current models. In other words, the chemical record (21). Used carefully, however, it can reveal movements that would be nearly impossible to observe directly.",
        ],
        [
          makeQuestion(
            19,
            "長文語句 2A",
            [
              "prevent young fish from losing their balance",
              "change shape whenever water temperatures rise",
              "preserve evidence of conditions the fish experienced",
              "become less useful as a fish grows older",
            ],
            3,
            "3 preserve evidence of conditions the fish experienced\n成長層に周囲の水の化学的記録が残るため、魚が経験した環境の証拠を保存する、が本文の説明と一致します。"
          ),
          makeQuestion(
            20,
            "長文語句 2A",
            ["For example", "On the contrary", "Nevertheless", "As a result"],
            1,
            "1 For example\n直前の「場所ごとに元素のパターンが異なる」という一般説明を、特定の川で生まれた魚を追跡する例で具体化しています。"
          ),
          makeQuestion(
            21,
            "長文語句 2A",
            [
              "is accurate only when fish remain in one river",
              "has eliminated the need to catch fish for research",
              "can predict future changes in ocean currents",
              "must be interpreted together with other evidence",
            ],
            4,
            "4 must be interpreted together with other evidence\n化学記録には汚染・成長・食餌などの影響があるため、タグや遺伝情報など別の証拠と併せて解釈する必要があります。"
          ),
        ]
      ),
      makePage(
        "長文語句 2B",
        "Why Early Newspapers Shared So Much",
        [
          "Before electronic communication, newspaper editors often learned about distant events by receiving other newspapers through the mail. They selected reports from these “exchange papers,” shortened them, and printed them for local readers. Paying a reporter in every major city would have been far too expensive for a small newspaper. (22), the same account of an election, invention, or disaster might appear in dozens of publications, sometimes weeks after it was first written.",
          "This habit has become useful to historians. Digital collections now make it possible to search thousands of old newspaper pages at once. By comparing versions of a story, researchers can trace the route it took across a country. Changes made along the way are especially revealing. An editor might remove details that seemed irrelevant locally, add a political comment, or rewrite a headline to attract a particular audience. Such changes show that local editors (23), even when much of the wording came from somewhere else.",
          "The exchange system also created a danger. If the first report contained an error, later papers could repeat it without checking the original source. A modern reader may see the same claim in twenty newspapers and assume that twenty reporters confirmed it independently. In reality, all twenty versions may descend from one uncertain account. Repeated wording can create a false impression of broad agreement. Therefore, (24). Historians try to identify the earliest available version and seek letters, official records, or reports written by direct witnesses before deciding what probably happened.",
        ],
        [
          makeQuestion(
            22,
            "長文語句 2B",
            ["In contrast", "Accordingly", "For instance", "Even so"],
            2,
            "2 Accordingly\n各地に記者を置く費用を負担できなかった「そのため」、同じ記事を多くの地方紙が転載した、という因果関係です。"
          ),
          makeQuestion(
            23,
            "長文語句 2B",
            [
              "were rarely interested in national events",
              "preferred headlines written by distant reporters",
              "actively shaped reports for their own readers",
              "were unable to recognize copied material",
            ],
            3,
            "3 actively shaped reports for their own readers\n不要な詳細の削除、政治的コメントの追加、見出しの変更は、編集者が地元読者向けに記事を能動的に作り替えた証拠です。"
          ),
          makeQuestion(
            24,
            "長文語句 2B",
            [
              "the number of papers carrying a claim can be misleading",
              "most early newspapers should be excluded from digital collections",
              "local editors generally corrected errors made by larger papers",
              "official records are always more accurate than eyewitness reports",
            ],
            1,
            "1 the number of papers carrying a claim can be misleading\n多数の新聞に同じ記述があっても、元は1つの未確認情報かもしれません。掲載紙数を独立した裏付けの数とみなせない、という要点です。"
          ),
        ]
      ),
    ]),
    makeSet("set-03", "第3回", [
      makePage(
        "長文語句 2A",
        "The Value of Explaining a Lesson",
        [
          "Students often believe they understand a topic after reading it several times. Yet familiarity with the words does not always mean that they can explain the ideas. Educational researchers have found that expecting to teach material to someone else changes how students study. Instead of merely recognizing facts, they search for connections and possible questions. They also consider which examples would make an abstract point understandable. In other words, students who expect to become the teacher (19). This tendency is sometimes called the “protégé effect.”",
          "In one type of experiment, two groups receive the same study time. One group is told that it will take a test, while the other is told that it will teach the lesson to another student. At the end, both groups are actually given a test and no teaching occurs. (20), the students who prepared to teach frequently remember the main ideas more accurately and organize them more clearly. The expectation itself appears to influence their approach to learning.",
          "Explaining a lesson aloud can add another benefit: gaps become difficult to hide. A student may begin a sentence confidently and then realize that an important step is missing. However, a fluent explanation can still contain an error, especially if no listener asks questions. For this reason, learners should (21). They might check a textbook, invite a partner to challenge the explanation, or use practice questions afterward. Teaching is most valuable as a method of testing understanding, not simply as a performance.",
        ],
        [
          makeQuestion(
            19,
            "長文語句 2A",
            [
              "avoid looking for information beyond the assigned text",
              "usually spend less time thinking about likely questions",
              "can remember facts without understanding their relationships",
              "tend to prepare the material more carefully",
            ],
            4,
            "4 tend to prepare the material more carefully\n教える予定の生徒は、事実の暗記だけでなく関係性や質問まで考えるため、より注意深く準備する傾向がある、というまとめです。"
          ),
          makeQuestion(
            20,
            "長文語句 2A",
            ["As a result", "Even so", "Similarly", "For example"],
            2,
            "2 Even so\n実際には誰も教えなかった「それでも」、教えるつもりで準備した群の成績がよかった、という予想外の対比を表します。"
          ),
          makeQuestion(
            21,
            "長文語句 2A",
            [
              "replace written study with speaking practice",
              "avoid explaining topics they find difficult",
              "compare their explanation with reliable information",
              "memorize the explanation before presenting it",
            ],
            3,
            "3 compare their explanation with reliable information\n流暢でも誤りを含む可能性があるため、教科書で確認したり質問を受けたりして、信頼できる情報と照合する必要があります。"
          ),
        ]
      ),
      makePage(
        "長文語句 2B",
        "Ice Before Refrigerators",
        [
          "Before mechanical refrigerators became common, natural ice was a valuable product. During winter, workers cut large blocks from frozen ponds and rivers. The blocks were moved into icehouses, where thick walls and materials such as sawdust slowed melting. Some icehouses were partly underground, where temperatures changed less sharply than they did above ground. With careful storage, the ice (22). It could then be sold in summer to households, food businesses, and hospitals that needed a way to keep products cool.",
          "In the nineteenth century, merchants began sending natural ice much farther. Ships carried it from cold regions to warm ports, sometimes even across oceans. Sawdust packed between the blocks reduced contact with warm air and absorbed meltwater. Merchants expected part of every shipment to disappear, so they loaded much more ice than customers had ordered. Enough often survived to make the voyage profitable. The trade also required agents who understood prices and demand in distant cities. This combination of insulation, planning, and cheap sea transport (23).",
          "Artificial ice machines eventually made harvesting uncertain winter supplies less attractive. Nevertheless, the natural-ice business had already changed daily habits rather than disappearing without a legacy. It created delivery networks, encouraged shops to sell more perishable food, and taught consumers to expect cold drinks in hot weather. Some ice companies later used their storage buildings, wagons, and customer lists to enter the manufactured-ice or refrigeration business. (24), an industry based on frozen ponds helped prepare the market for the technology that replaced it.",
        ],
        [
          makeQuestion(
            22,
            "長文語句 2B",
            [
              "could be kept until warmer months",
              "became easier to cut as spring approached",
              "was used mainly to heat large buildings",
              "had to be sold immediately near the river",
            ],
            1,
            "1 could be kept until warmer months\n氷室の断熱によって融解を遅らせ、冬に切り出した氷を夏に販売できた、という時間の流れに合います。"
          ),
          makeQuestion(
            23,
            "長文語句 2B",
            [
              "made customers less willing to buy natural ice",
              "ended the need for icehouses near frozen rivers",
              "prevented any ice from melting during long voyages",
              "turned a seasonal local resource into an international product",
            ],
            4,
            "4 turned a seasonal local resource into an international product\n冬の寒冷地で採れる氷を、断熱・計画・海運によって遠い温暖な港まで商品として運べるようにした、という段落全体の要約です。"
          ),
          makeQuestion(
            24,
            "長文語句 2B",
            ["On the contrary", "In this sense", "For instance", "Even so"],
            2,
            "2 In this sense\n旧来の天然氷産業が流通網や消費習慣を作り、後継技術の市場を準備したという直前の内容を「この意味で」とまとめています。"
          ),
        ]
      ),
    ]),
    makeSet("set-04", "第4回", [
      makePage(
        "長文語句 2A",
        "When Beavers Meet Wildfire",
        [
          "Beavers change landscapes by building dams across streams. Water spreads behind a dam, raising the level of nearby groundwater and keeping plants moist. These wet areas can remain green even during a dry summer. The ponds may also release water gradually after rain instead of letting it rush downstream. (19), ecologists have begun asking whether beaver habitats can serve as refuges when wildfire moves through a valley. Fish and other animals may survive there, and wet vegetation may slow flames close to the stream.",
          "Satellite images taken after several large fires have shown unusually green strips around some beaver ponds. The pattern is promising, but researchers must interpret it cautiously. Beavers often choose places that already have reliable water, and land managers may also have protected those streams before a fire. A green area near a dam does not by itself prove that (20). Researchers therefore compare similar streams with and without beaver dams and examine changes over many years.",
          "Bringing beavers back is not suitable everywhere. Their dams can flood roads or farmland, and in very dry streams there may not be enough water or vegetation to support them. Some communities instead build simple structures that imitate part of a beaver dam’s effect, while others install devices that control pond levels. Local knowledge matters because the same intervention can produce different effects from one valley to another. These limitations mean that beaver-based restoration (21). Where conditions are appropriate, however, it may help a landscape hold water while also creating habitat for many species.",
        ],
        [
          makeQuestion(
            19,
            "長文語句 2A",
            ["Consequently", "In comparison", "Nevertheless", "For instance"],
            1,
            "1 Consequently\nビーバーのダム周辺が乾期にも湿っているため、その「結果として」山火事時の避難場所になり得るかが研究され始めました。"
          ),
          makeQuestion(
            20,
            "長文語句 2A",
            [
              "satellite images were taken immediately after the fire",
              "the stream contained fish before beavers arrived",
              "beavers were responsible for keeping it green",
              "land managers knew where the fire would spread",
            ],
            3,
            "3 beavers were responsible for keeping it green\nもともと水が安定した場所をビーバーが選んだ可能性などがあるため、緑地が残った原因をビーバーだけに帰すことはできません。"
          ),
          makeQuestion(
            21,
            "長文語句 2A",
            [
              "is less expensive than every other fire-management method",
              "should be treated as one tool rather than a complete solution",
              "will work best beside roads and agricultural fields",
              "depends on removing most native vegetation",
            ],
            2,
            "2 should be treated as one tool rather than a complete solution\n洪水被害や水不足など適さない条件もあるため、万能策ではなく、条件に応じて使う一つの手段だと結論づけるのが自然です。"
          ),
        ]
      ),
      makePage(
        "長文語句 2B",
        "The Real Price of Free Returns",
        [
          "Free returns helped online shopping grow by reducing the risk of buying something that could not be examined first. Some customers now practice “bracketing”: they order the same item in several sizes or colors, keep one, and return the rest. Easy return policies can therefore influence what people order, not merely what they send back. From the individual shopper’s point of view, this is convenient and often costs nothing. Across millions of orders, however, the practice can (22). Retailers must transport, inspect, and process far more merchandise.",
          "A returned product does not always go straight back on sale. Clothing may need cleaning or new packaging, and seasonal goods can lose value while they are being processed. Warehouse space is also occupied while decisions are made. In some cases, sorting an inexpensive item costs more than the item can be sold for, so it is sent to a liquidator or discarded. (23), every extra journey requires packaging, warehouse work, and transportation, adding to the environmental effects of the original purchase.",
          "Retailers are experimenting with several responses. Some charge a small return fee, while others allow free returns at stores but not by mail. Better photographs, detailed measurements, and tools that recommend a size can also help shoppers choose correctly the first time. Companies can analyze return data to identify confusing descriptions or products with inconsistent sizing. Used well, such information can (24). The challenge is to reduce waste without making online shopping inaccessible to customers who genuinely need to return unsuitable goods.",
        ],
        [
          makeQuestion(
            22,
            "長文語句 2B",
            [
              "make physical stores unnecessary for most retailers",
              "allow companies to predict which color will be popular",
              "prevent customers from comparing similar products",
              "greatly increase the volume of returned goods",
            ],
            4,
            "4 greatly increase the volume of returned goods\n同じ商品を複数注文して大半を返品する行動が何百万件も重なれば、返品量が大幅に増え、直後の輸送・検品・処理負担につながります。"
          ),
          makeQuestion(
            23,
            "長文語句 2B",
            ["Moreover", "On the contrary", "For example", "As a result"],
            1,
            "1 Moreover\n返品商品の再販売が難しいという問題に加えて、輸送・包装による環境負荷もある、と別の問題を追加しています。"
          ),
          makeQuestion(
            24,
            "長文語句 2B",
            [
              "guarantee that no customer will return an item",
              "replace the need for accurate product measurements",
              "prevent avoidable returns before a purchase is made",
              "encourage shoppers to order more versions of each product",
            ],
            3,
            "3 prevent avoidable returns before a purchase is made\n返品データから説明の曖昧さやサイズの不統一を直せば、購入前の判断が改善され、避けられる返品を未然に防げます。"
          ),
        ]
      ),
    ]),
    makeSet("set-05", "第5回", [
      makePage(
        "長文語句 2A",
        "Listening to the Forest",
        [
          "Wildlife surveys traditionally require researchers to walk through an area and look for animals or their tracks. This method is valuable, but it covers limited times and places. Small recording devices offer another approach. Left in a forest for weeks, they collect birdsong, insect calls, frog sounds, and even noises made by bats that humans cannot hear without special equipment. A long sound recording (19), including at night or during weather when fieldworkers are absent.",
          "The volume of material creates a new problem. A single project may produce thousands of hours of audio, far more than a person can examine. Computer programs can search for the sound pattern of a particular species and flag likely examples. Rare species are especially difficult because few examples exist for training. Rain, machinery, and calls from similar species can confuse the software, however. (20), experts usually listen to a sample of the flagged recordings and measure how often the program is wrong before trusting a large set of results.",
          "Researchers can also study the overall mixture of sounds, sometimes called a soundscape. A rich variety of calls may suggest that many species are active, but loudness or variety alone does not prove that an ecosystem is healthy. An invasive insect, for example, might dominate a recording. Scientists therefore combine audio with information from cameras, vegetation surveys, and direct observation. The approach works best when (21). It then becomes a powerful way to monitor change without requiring people to be present continuously.",
        ],
        [
          makeQuestion(
            19,
            "長文語句 2A",
            [
              "is useful only for animals that remain in one location",
              "can reveal activity that researchers would otherwise miss",
              "prevents weather from affecting wildlife behavior",
              "contains less information than a brief visual survey",
            ],
            2,
            "2 can reveal activity that researchers would otherwise miss\n録音機は人が不在の夜間や悪天候時にも作動するため、従来の現地観察では見逃す活動を捉えられます。"
          ),
          makeQuestion(
            20,
            "長文語句 2A",
            ["In contrast", "As a result", "For instance", "For this reason"],
            4,
            "4 For this reason\n雨音などによる誤判定があり得る「この理由から」、専門家が抽出結果の一部を聞いて誤りの割合を検証します。"
          ),
          makeQuestion(
            21,
            "長文語句 2A",
            [
              "sound is treated as one layer of evidence among several",
              "all unfamiliar sounds are removed from the recordings",
              "the loudest species is assumed to be the most important",
              "recording devices replace every form of fieldwork",
            ],
            1,
            "1 sound is treated as one layer of evidence among several\n音だけでは生態系の健全さを断定できず、カメラや植生調査などと組み合わせるため、複数ある証拠の一層として扱う、が適切です。"
          ),
        ]
      ),
      makePage(
        "長文語句 2B",
        "The Box That Changed Ports",
        [
          "For much of maritime history, cargo was loaded onto ships piece by piece. Barrels, sacks, and wooden cases came in different shapes and required large teams of workers to move and arrange them. Ships could remain in port for days, and goods were vulnerable to damage or theft. Trucks and trains then had to be unloaded and loaded again at the waterfront. (22), moving cargo between forms of transport was often slower and more expensive than carrying it across the ocean.",
          "Standard shipping containers offered a solution. A sealed metal box could be packed away from the port and transferred by crane among a truck, train, and ship. Yet the box alone did not produce dramatic savings. Ports needed powerful cranes and large storage areas, and shipping companies had to agree on container dimensions and locking systems. A company using a unique size (23), because other ships, railcars, and cranes could not handle its boxes efficiently.",
          "As ports rebuilt for containers, the effects spread beyond transportation. Ships spent less time waiting, cargo losses fell, and international trade became cheaper across increasingly long distances. At the same time, fewer workers were needed to load individual items. Some older waterfronts declined when new container terminals moved to locations with more land and deeper water. Neighborhoods that depended on traditional dock work were forced to adjust. The standardized box therefore (24). Its success came not only from a clever object, but from the costly cooperation and social change surrounding it.",
        ],
        [
          makeQuestion(
            22,
            "長文語句 2B",
            ["In comparison", "Even so", "Therefore", "For example"],
            3,
            "3 Therefore\n形の異なる荷物を何度も積み替える必要があった「そのため」、輸送手段間の移動が海上輸送そのものより遅く高くなることがありました。"
          ),
          makeQuestion(
            23,
            "長文語句 2B",
            [
              "could easily avoid rebuilding its port facilities",
              "could not gain the full benefit of the system",
              "was able to charge competitors for using its boxes",
              "needed fewer agreements with rail companies",
            ],
            2,
            "2 could not gain the full benefit of the system\n独自規格では他社の船・鉄道・クレーンが効率よく扱えないため、積み替えの容易さというコンテナ方式の利点を十分に得られません。"
          ),
          makeQuestion(
            24,
            "長文語句 2B",
            [
              "succeeded mainly because dockworkers opposed it",
              "made the location of ports less important",
              "affected transportation but had little influence on communities",
              "created winners and losers far beyond the shipping industry",
            ],
            4,
            "4 created winners and losers far beyond the shipping industry\n貿易の低価格化という利益だけでなく、港湾労働の減少や地域衰退も起きたため、海運業界を越えて利益を得る側と負担を受ける側を生みました。"
          ),
        ]
      ),
    ]),
  ];
})();
