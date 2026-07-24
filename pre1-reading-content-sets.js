(() => {
  const makeQuestion = (id, section, text, choices, correct, explanation) => ({
    id,
    section,
    type: "content",
    text,
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

  window.scbtPre1ReadingContentSets = [
    makeSet("set-01", "第1回", [
      makePage(
        "長文内容 3A",
        "Fungi Beneath the Forest",
        [
          "A forest may appear to be dominated by trees, but much of its biological activity takes place underground. Fine threads produced by fungi, known as hyphae, grow around or inside tree roots. Together, the fungi and roots form partnerships called mycorrhizae. The fungi receive sugars that trees make through photosynthesis. In exchange, their threads reach into spaces too small for roots and supply the trees with water and minerals, especially phosphorus and nitrogen. In nutrient-poor soils, this enlarged reach can matter more than simply growing additional fine roots. These partnerships are extremely common, although the fungi involved and the way they enter roots differ among tree species. A tree may associate with several kinds of fungi, and one fungus can be connected to the roots of more than one plant.",
          "The possibility that plants are linked through shared fungi has attracted considerable attention. In experiments, researchers have given one plant carbon containing an unusual chemical marker and later detected the marker in a nearby plant connected to the same fungus. Other studies suggest that water or nutrients can also move through such common mycorrhizal networks. These findings have inspired the popular image of a forestwide communication system in which older trees feed or warn younger ones. Yet experimental results are not consistent. Researchers may exclude insects and microbes, creating conditions that do not exist outside controlled experiments. Transfers measured in a greenhouse may also be much smaller in a forest, where roots, fungi, microbes, and soil water all offer alternative routes. It is difficult to determine whether material traveled through fungal threads or simply leaked into the soil and was absorbed later.",
          "Many scientists therefore object when the networks are described as evidence that trees deliberately cooperate. Fungi are living organisms pursuing their own survival, not passive pipes controlled by trees. Material may flow because of differences in concentration or because a fungus gains an advantage from keeping several hosts alive. Moreover, detecting carbon in a seedling does not prove that the amount improved its growth. The language used in public discussion can therefore run ahead of what measurements demonstrate. Researchers now use barriers that admit fungal threads but block roots, genetic analysis to identify the fungi, and repeated field measurements to separate these possibilities. Such work confirms that underground partnerships strongly influence forests. It also shows why the appealing idea of trees using a natural “internet” should be treated as a hypothesis rather than a complete explanation.",
        ],
        [
          makeQuestion(
            25,
            "長文内容 3A",
            "According to the first paragraph, what do fungi gain from mycorrhizal partnerships?",
            [
              "Protection from the smaller organisms that normally consume their underground threads.",
              "The ability to produce phosphorus and nitrogen without obtaining them from the soil.",
              "Sugars made by trees, in return for helping the trees obtain water and minerals.",
              "Control over which tree species are able to grow in a particular part of the forest.",
            ],
            3,
            "3 Sugars made by trees, in return for helping the trees obtain water and minerals.\n菌類は木が光合成で作る糖を受け取り、代わりに菌糸を通して水やリン・窒素などを木へ供給します。相互に資源を交換する関係です。"
          ),
          makeQuestion(
            26,
            "長文内容 3A",
            "What do the experiments described in the second paragraph suggest?",
            [
              "Materials can move between plants associated with the same fungus, but the route and amount are not always clear.",
              "Carbon moves through fungal networks in forests more efficiently than it does under greenhouse conditions.",
              "Older trees use only fungal threads, rather than roots or soil water, to provide resources to seedlings.",
              "Chemical markers prevent researchers from distinguishing fungal transfer from direct contact between tree roots.",
            ],
            1,
            "1 Materials can move between plants associated with the same fungus, but the route and amount are not always clear.\n標識した炭素などの移動は観察されていますが、森林では菌糸・根・土壌水など複数の経路があり、量や経路を断定しにくいと述べられています。"
          ),
          makeQuestion(
            27,
            "長文内容 3A",
            "Why are many scientists cautious about describing fungal networks as a natural “internet”?",
            [
              "Most trees are linked to only one fungus, so information cannot travel far enough to affect a forest.",
              "Genetic studies have shown that the fungi connected to older trees cannot survive around seedlings.",
              "Researchers have proved that any carbon received through a fungus damages a young tree’s growth.",
              "Resource movement does not by itself show that trees intentionally communicate or help one another.",
            ],
            4,
            "4 Resource movement does not by itself show that trees intentionally communicate or help one another.\n物質移動は濃度差や菌類自身の利益でも説明できます。移動が見つかっただけで、木が意図的に情報交換や援助をしているとは証明できません。"
          ),
        ]
      ),
      makePage(
        "長文内容 3B",
        "Living by Standard Time",
        [
          "For most of human history, communities measured time by the position of the sun. Noon was the moment when the sun reached its highest point, so a clock set accurately in one town could differ from a clock in a town farther east or west. The difference might be only a few minutes, but that caused little trouble when most journeys and business dealings were local. Church bells, market routines, and daylight mattered more than exact agreement with distant places. Even after mechanical clocks became common, residents usually adjusted them to local solar time. Travelers sometimes carried tables showing how many minutes to add or subtract at their destination. A town’s public clock could also represent local independence. There was no strong reason for every community to share the same noon.",
          "Railways and telegraphs changed the situation in the nineteenth century. A train might pass through several towns, each using a slightly different clock. Printed timetables became confusing, connections were easily missed, and dispatchers needed an agreed time to keep trains safely separated on a single track. A timetable might list a departure in local time but an arrival in the railway company’s time, placing the burden of conversion on passengers. Some railway companies therefore divided large areas into a few time zones and instructed stations to use railway time. This often happened before national governments established legal standards. Telegraph signals allowed observatories to send an accurate time to stations, where clocks could be reset together. Standardization was not simply a scientific improvement; it was a practical response to networks that linked distant communities more tightly than before.",
          "The change was not accepted immediately. Some towns continued displaying both local time and railway time, and public clocks could have two minute hands. Residents complained that a company headquartered far away was telling them how to organize daily life. The dispute was partly about who had the authority to define something as basic as noon. Religious schedules, factory hours, and local government meetings did not all switch on the same day. Adoption was also uneven because railway companies sometimes used different regional systems. Eventually, governments defined national zones, but even those boundaries reflected negotiation. Communities near a border often preferred the time used by the city with which they traded rather than the time that matched their exact longitude.",
          "Standard time made simultaneous activity on a large scale much easier. Financial markets could announce opening hours, newspapers could report when an event occurred, and later radio and telephone networks could coordinate programs and calls. Nevertheless, time zones did not remove politics from timekeeping. Countries have shifted their zones to strengthen commercial ties or national unity, and zone borders frequently bend around political boundaries. Even the placement of the international date line avoids some populated areas rather than following one perfectly straight path. Daylight-saving time adds another layer by changing clocks seasonally, although it is separate from the original decision to create standard zones. The history of standard time shows that a measurement can be technically precise while the system built around it remains a social choice.",
        ],
        [
          makeQuestion(
            28,
            "長文内容 3B",
            "Why did differences in local solar time cause few problems before long-distance networks developed?",
            [
              "Mechanical clocks were too inaccurate for people to notice that towns kept different times.",
              "Most activities involved nearby people, so exact coordination with distant towns was unnecessary.",
              "Churches and markets already received a standard national time from government observatories.",
              "Travelers adjusted the position of the sun so that noon occurred at the same moment everywhere.",
            ],
            2,
            "2 Most activities involved nearby people, so exact coordination with distant towns was unnecessary.\n移動や商取引の多くが地域内で完結していたため、離れた町と時計を分単位で合わせる必要がほとんどありませんでした。"
          ),
          makeQuestion(
            29,
            "長文内容 3B",
            "What was one reason railway companies introduced a shared system of time?",
            [
              "They wanted to prevent observatories from controlling the clocks used in railway stations.",
              "They needed each town to keep its solar time so passengers could identify their location.",
              "They were required by national laws to use time zones before publishing any train schedules.",
              "They needed clearer timetables and a reliable way to coordinate trains using the same tracks.",
            ],
            4,
            "4 They needed clearer timetables and a reliable way to coordinate trains using the same tracks.\n町ごとに時刻が違うと乗り継ぎが分かりにくく、単線上の列車を安全に離して運行することも難しくなるため、共通時刻が必要でした。"
          ),
          makeQuestion(
            30,
            "長文内容 3B",
            "What does the third paragraph indicate about the adoption of standard time?",
            [
              "It was a gradual and negotiated process rather than a single immediate change.",
              "It failed mainly because most railway companies refused to divide their networks into regions.",
              "It was welcomed by towns that wanted distant companies to control their religious schedules.",
              "It followed longitude exactly once national governments became responsible for zone boundaries.",
            ],
            1,
            "1 It was a gradual and negotiated process rather than a single immediate change.\n二重表示の時計、切替日の不一致、会社ごとの制度、境界地域の希望などがあり、一度に一律導入されたわけではありません。"
          ),
          makeQuestion(
            31,
            "長文内容 3B",
            "What can be concluded from the passage?",
            [
              "Daylight-saving time was the main invention that allowed railways to connect distant communities.",
              "Once clocks became technically accurate, governments no longer needed to make decisions about time.",
              "Standard time enabled wide coordination, but the organization of zones still reflected human priorities.",
              "Political borders became less important because every country eventually adopted identical time zones.",
            ],
            3,
            "3 Standard time enabled wide coordination, but the organization of zones still reflected human priorities.\n共通時刻は大規模な同時調整を可能にしましたが、時間帯や境界は貿易・国家統合など社会的、政治的な判断も反映しています。"
          ),
        ]
      ),
    ]),
    makeSet("set-02", "第2回", [
      makePage(
        "長文内容 3A",
        "The Bicycle Becomes Safer",
        [
          "Bicycles in the late nineteenth century did not all resemble those used today. One famous design had an enormous front wheel with pedals attached directly to it and a much smaller rear wheel. A large wheel traveled farther with each turn of the pedals, allowing skilled riders to move quickly. Its size was limited partly by the length of the rider’s legs, since the pedals rotated with the wheel itself. It also placed riders high above the ground. If the front wheel struck a stone or stopped suddenly, they could be thrown forward and seriously injured. Mounting and stopping required practice, which limited the machine’s appeal. Riding clubs celebrated speed and skill, but manufacturers recognized that a larger market wanted something less intimidating. Three-wheeled cycles and lower two-wheeled models existed, but they were often heavy or slow. Designers continued searching for a bicycle that combined speed with greater stability.",
          "The key development was a chain that transferred power from the pedals to the rear wheel. Gears made it possible for a turn of the pedals to drive the wheel farther, so the front wheel no longer had to be exceptionally large. With two wheels of similar size, the rider sat lower and could touch the ground more easily. The new design became known as the safety bicycle. Air-filled tires later made rides smoother than solid rubber tires had, while improvements in metal production allowed factories to make lighter frames in larger numbers. Better brakes and guards around moving parts made the machines more manageable, although early versions were still expensive for many workers. Competition and mass production gradually lowered prices. By the 1890s, these changes had transformed the bicycle from a specialized machine for daring riders into practical personal transportation.",
          "The safety bicycle had social effects as well. It gave many women a way to travel without depending on a carriage or a male relative. Riding also encouraged some women to adopt divided skirts or other less restrictive clothing, which attracted criticism from people who viewed such dress as improper. The bicycle did not create the movement for women’s independence, but it became a visible part of it. Cycling clubs organized trips beyond familiar neighborhoods, while maps and guidebooks began to serve independent travelers. Access was never equal, since a bicycle still cost money and safe roads were unevenly distributed. Even so, demand supported repair shops, manufacturing, and campaigns for smoother roads. Early automobile users later benefited from some of those road improvements. Although cars eventually replaced bicycles for many longer journeys, the basic arrangement of the safety bicycle remains the standard form today.",
        ],
        [
          makeQuestion(
            25,
            "長文内容 3A",
            "What was a disadvantage of the bicycle with a very large front wheel?",
            [
              "Its rear wheel prevented riders from traveling as far as each turn of the pedals should have allowed.",
              "It was stable at high speed but too heavy for factories to produce in large numbers.",
              "Its pedals could not be used unless another person helped the rider mount the bicycle.",
              "Its high riding position made a sudden stop particularly dangerous for the rider.",
            ],
            4,
            "4 Its high riding position made a sudden stop particularly dangerous for the rider.\n大きな前輪の上方に乗るため、前輪が石などで急停止すると前方へ投げ出され、重傷を負う危険がありました。"
          ),
          makeQuestion(
            26,
            "長文内容 3A",
            "How did the chain contribute to the development of the safety bicycle?",
            [
              "It connected the two wheels so that either one could be used to steer the bicycle.",
              "It allowed gearing to provide speed without requiring the rider to sit above a huge wheel.",
              "It made solid rubber tires flexible enough to absorb shocks from rough roads.",
              "It allowed factories to replace metal frames with lighter frames made entirely of wood.",
            ],
            2,
            "2 It allowed gearing to provide speed without requiring the rider to sit above a huge wheel.\nチェーンとギアでペダルの力を後輪へ伝えられたため、速度を得るために前輪を巨大化する必要がなくなりました。"
          ),
          makeQuestion(
            27,
            "長文内容 3A",
            "What does the author say about the wider influence of the safety bicycle?",
            [
              "It supported greater personal mobility and helped generate demand for related businesses and better roads.",
              "It began the movement for women’s independence by ending criticism of changes in women’s clothing.",
              "It caused automobile owners to oppose improvements that had originally been made for cyclists.",
              "It remained popular for long journeys because automobiles copied an entirely different basic design.",
            ],
            1,
            "1 It supported greater personal mobility and helped generate demand for related businesses and better roads.\n女性を含む人々の移動の自由を広げ、修理・製造業や道路改善運動も促したと説明されています。"
          ),
        ]
      ),
      makePage(
        "長文内容 3B",
        "Giving Rivers More Room",
        [
          "For centuries, communities have built walls and embankments to keep rivers from spreading across nearby land. Such defenses can prevent frequent small floods and protect homes, roads, and farms. However, they also separate a river from its natural floodplain, the broad low area where excess water once spread and slowed down. Floodplains normally receive sediment that renews soil and supports wetlands; a high levee interrupts that process. When levees narrow the channel, water may move faster and rise higher. Maintenance is expensive but often receives little attention during long periods without a flood. If a defense fails during an extreme event, the damage can be severe. Protection can also encourage more construction in areas that remain naturally exposed to flooding, increasing the amount that may eventually be lost.",
          "An alternative approach is sometimes described as “giving room to the river.” Instead of trying to confine every flood, planners identify selected places where water can safely spread. A levee may be moved farther from the channel, a wetland restored, or farmland designed to hold water temporarily. Some parks and sports fields are built at a lower level so they can fill during rare storms without damaging buildings. Farmers may receive payments for accepting temporary water at agreed times. By storing part of a flood upstream, these areas can lower the peak level that reaches a town. Restored floodplains may also trap sediment, improve water quality, and provide habitat for fish and birds. Engineers must still control where and when water enters. The aim is not to abandon all river defenses but to reduce the pressure placed on them.",
          "Creating space for water is socially difficult. Land that benefits an entire region may belong to a relatively small number of farmers or residents. Purchasing property, compensating owners, or changing how land can be used may take years. A technically suitable site may also contain homes, historic places, or livelihoods that cannot be valued only in financial terms. Some people fear that restored wetlands will bring insects or reduce local tax income, while others distrust flood maps based on uncertain future conditions. Projects can transfer risk if water is redirected without considering communities farther downstream. Past promises that were not kept may make residents skeptical of a new plan. Successful programs therefore involve local people early, explain who will receive benefits and bear costs, provide a fair appeal process, and continue monitoring after construction.",
          "The issue is becoming more urgent as a warmer climate increases heavy rainfall in many regions and raises the possibility that past flood records will underestimate future danger. Higher walls may still be essential around dense city centers and critical facilities. Elsewhere, floodplains, parks that temporarily store storm water, improved forecasts, and building restrictions can form additional layers of protection. Maps and emergency plans must be updated as development and rainfall patterns change. Residents also need to understand that a lower probability of flooding is not the same as zero risk. This combined strategy accepts that no single structure can eliminate danger. It also changes the measure of success: rather than asking only whether a river stayed inside its channel, planners consider avoided damage, ecological recovery, fair treatment of affected landowners, and how quickly communities can recover when flooding occurs.",
        ],
        [
          makeQuestion(
            28,
            "長文内容 3B",
            "What problem with traditional river defenses is mentioned in the first paragraph?",
            [
              "They prevent small floods but make it impossible for any buildings to be constructed near a river.",
              "They reduce water speed so much that sediment permanently blocks the protected river channel.",
              "They may encourage development in risky areas and produce serious losses if they fail.",
              "They protect farmland more effectively than towns, causing people to move away from city centers.",
            ],
            3,
            "3 They may encourage development in risky areas and produce serious losses if they fail.\n堤防による安心感で本来危険な地域の開発が進み、極端な洪水で堤防が破損すると被害対象が増えている可能性があります。"
          ),
          makeQuestion(
            29,
            "長文内容 3B",
            "How can giving a river more room help a community?",
            [
              "Allowing water to spread in selected areas can reduce the highest flood level reaching populated places.",
              "Removing every levee forces flood water to remain in wetlands until it completely disappears.",
              "Building homes on restored floodplains prevents sediment from entering the main river channel.",
              "Redirecting all flood water downstream protects natural habitats without affecting other communities.",
            ],
            1,
            "1 Allowing water to spread in selected areas can reduce the highest flood level reaching populated places.\n上流側の選定区域に一時的に水をためることで、町へ到達する洪水のピーク水位を下げられます。"
          ),
          makeQuestion(
            30,
            "長文内容 3B",
            "Why can floodplain-restoration projects take a long time to carry out?",
            [
              "Scientists must first prove that heavy rainfall will occur at exactly the same rate every year.",
              "Wetlands cannot hold flood water until all insects and birds have been removed from the area.",
              "Downstream communities generally receive all the benefits while upstream residents pay no costs.",
              "Projects involve conflicts over land, compensation, uncertain risks, and the distribution of costs and benefits.",
            ],
            4,
            "4 Projects involve conflicts over land, compensation, uncertain risks, and the distribution of costs and benefits.\n土地所有者への補償、土地利用変更、将来予測への不信、上下流間のリスク配分など、技術だけでは解けない調整が必要です。"
          ),
          makeQuestion(
            31,
            "長文内容 3B",
            "Which approach does the author support in the final paragraph?",
            [
              "Replacing urban flood walls with parks because natural measures always provide stronger protection.",
              "Combining necessary structures with flood-storage areas, planning rules, forecasts, and recovery measures.",
              "Judging flood policy successful only when no water leaves the river channel during an extreme event.",
              "Using historical flood records as the sole basis for future policy because climate estimates are uncertain.",
            ],
            2,
            "2 Combining necessary structures with flood-storage areas, planning rules, forecasts, and recovery measures.\n都市部の防壁も残しつつ、氾濫原・公園・予報・建築規制を重ねる複合戦略を支持しています。"
          ),
        ]
      ),
    ]),
    makeSet("set-03", "第3回", [
      makePage(
        "長文内容 3A",
        "Reading the Past in Tree Rings",
        [
          "In places with clear growing seasons, many trees add a visible ring of wood each year. Cells formed early in the season often differ from those produced later, creating a boundary that can be seen under magnification. A wide ring may indicate favorable conditions, while a narrow one may reflect drought, cold, insect damage, or competition from neighboring trees. The relationship is not as simple as “wide means wet,” because different species and locations respond to different factors. Unusual weather can occasionally create a false boundary within one year or make a true ring extremely hard to see. Scientists who study tree rings, called dendrochronologists, use a hollow drill to remove a thin core from a living tree without cutting it down. The sequence of wide and narrow rings in the core forms a pattern. An individual ring becomes meaningful when that pattern is compared with patterns from other trees.",
          "This comparison is known as crossdating. Suppose several trees show an unusually narrow ring followed two years later by an unusually wide one. A piece of older timber with the same sequence can be aligned with them even if its outermost rings are missing. Researchers check many possible matches, since counting from the edge of a damaged sample can easily produce an error. By overlapping living trees, dead logs, and wood used in old buildings, they can construct continuous chronologies extending far beyond the lifetime of any one tree. If the date when a building was constructed is known, its timbers can strengthen a regional sequence; in return, that sequence can help date an unknown structure. These records have also revealed periods of severe drought. Rings can contain chemical evidence, and a major volcanic eruption may affect growth across a wide region, helping researchers connect environmental events recorded in different places.",
          "Tree-ring evidence must nevertheless be calibrated carefully. A tree growing beside a stream may not record regional rainfall in the same way as one on a dry slope. Young and old trees can grow at different rates, and people may have watered or cut vegetation around a historical site. Researchers therefore sample many trees, compare species, and test ring patterns against modern weather records. Statistical methods remove long-term growth trends without erasing the shorter signals being studied, a choice that can itself affect the result. Scientists also combine the results with evidence from lake sediments, written documents, or ice cores. Samples that fail to match are reported rather than quietly discarded, because disagreement may reveal a local disturbance. A reconstruction of past climate is usually expressed as a range of probability rather than a perfectly certain annual report. The strength of dendrochronology comes not from trusting one tree, but from finding the same signal repeatedly in independent samples.",
        ],
        [
          makeQuestion(
            25,
            "長文内容 3A",
            "Why is a wide tree ring not automatically evidence of a wet year?",
            [
              "Ring width can be influenced by several conditions, and species and locations respond differently.",
              "A hollow drill causes the rings in a living tree to become wider after a sample is taken.",
              "Trees form more than one ring each year whenever insects or neighboring trees are present.",
              "Scientists cannot identify a ring until the tree has been cut down and its age is already known.",
            ],
            1,
            "1 Ring width can be influenced by several conditions, and species and locations respond differently.\n輪の幅は降水量だけでなく、寒さ、虫害、競争などにも左右され、樹種や場所によって反応も違います。"
          ),
          makeQuestion(
            26,
            "長文内容 3A",
            "What does crossdating allow researchers to do?",
            [
              "Replace missing outer rings by forcing old pieces of wood to continue growing in a laboratory.",
              "Determine the chemical composition of volcanic material without examining any other evidence.",
              "Match overlapping ring patterns to build a record longer than the life of a single tree.",
              "Prove that every narrow ring found across a region was caused by the same historical drought.",
            ],
            3,
            "3 Match overlapping ring patterns to build a record longer than the life of a single tree.\n生木、枯木、古材の特徴的な年輪パターンを重ね合わせ、1本の寿命を超える連続年代を作れます。"
          ),
          makeQuestion(
            27,
            "長文内容 3A",
            "What does the final paragraph suggest is essential for a reliable tree-ring study?",
            [
              "Selecting the single oldest tree because age removes the effects of its local environment.",
              "Looking for repeated patterns across many samples and checking them against other evidence.",
              "Using trees beside streams because their growth always represents rainfall across an entire region.",
              "Reporting one exact climate value for every year rather than showing a range of probability.",
            ],
            2,
            "2 Looking for repeated patterns across many samples and checking them against other evidence.\n多数の木・樹種を調べ、気象記録や湖底堆積物などと照合することが信頼性の核だと述べられています。"
          ),
        ]
      ),
      makePage(
        "長文内容 3B",
        "The Problem of the Perfect Banana",
        [
          "Wild bananas vary greatly in size, taste, color, and resistance to disease. Most bananas sold internationally, however, belong to one group known as Cavendish. The fruit is seedless, so farmers cannot plant its seeds. Instead, they grow new plants from pieces of existing ones, a method that reproduces nearly the same genetic individual. This produces fruit with predictable taste and appearance, which is useful to growers, shipping companies, supermarkets, and consumers. Ripening schedules, packaging, and storage have all been designed around that consistency. The system delivers an inexpensive fruit over great distances with remarkably little variation. It also means that Cavendish plants are genetically extremely similar. A disease able to infect one plant may therefore encounter the same weakness across enormous plantations and in banana-producing regions around the world.",
          "The industry has faced this situation before. During the first half of the twentieth century, export markets relied heavily on another banana called Gros Michel. A soil-dwelling fungus that caused Panama disease spread through plantations and made production increasingly difficult. Because the fungus could remain in soil for years, simply removing sick plants was ineffective. Some companies abandoned infected land and opened plantations elsewhere, an expensive response that disrupted workers and communities. Chemical attempts to control the disease brought costs without providing a lasting solution. Export companies eventually replaced Gros Michel with Cavendish, which resisted the form of the fungus causing the damage. The change preserved large-scale banana exports, but it also encouraged the industry to continue depending on a single uniform crop rather than addressing the broader vulnerability created by uniformity.",
          "A different form of the fungus, often called Tropical Race 4, can infect Cavendish plants. Once introduced, it can be carried in soil stuck to shoes, tools, vehicles, water, or planting material. There is no simple chemical treatment that removes it from an affected field. Farms use cleaning rules, restrictions on movement, and monitoring to delay its arrival and spread. Inspecting every person and vehicle is costly, and symptoms may appear only after contamination has already moved. Strict controls can also slow normal trade and make it harder for growers to obtain equipment. Such measures are especially difficult for small producers with limited money. They cannot eliminate every route of infection. The appearance of the fungus in new regions has therefore raised concern even where current production remains high.",
          "Researchers are pursuing several responses. Traditional breeding could introduce resistance from other bananas, but producing a seedless fruit with the taste, transport qualities, and high yields expected by the market is difficult. Genetic techniques may alter Cavendish itself, although public acceptance and regulations differ among countries. Gene banks and small farms preserve varieties that could supply useful traits, making their survival important to the whole industry. Another option is to grow and sell a wider range of bananas. That would spread risk, but supply chains and consumers have been organized around uniform fruit for decades. Retailers would need to accept different sizes and ripening behavior, while shoppers might have to pay more or try unfamiliar flavors. The history of Gros Michel suggests that finding one resistant replacement would buy time without solving the underlying problem. Long-term resilience will require biological diversity as well as new technology and changes in what markets are willing to accept.",
        ],
        [
          makeQuestion(
            28,
            "長文内容 3B",
            "Why does the international banana industry value Cavendish plants?",
            [
              "Their seeds can be stored cheaply and planted in any soil without spreading disease.",
              "Their genetic differences allow each region to produce a fruit with a unique taste and color.",
              "Their wild ancestors protect plantations from any disease that attacks a single plant.",
              "They produce consistent fruit that suits large-scale growing, transport, retail, and consumer expectations.",
            ],
            4,
            "4 They produce consistent fruit that suits large-scale growing, transport, retail, and consumer expectations.\n味や外見が予測しやすく、生産から販売までを標準化しやすい点が国際流通に適しています。"
          ),
          makeQuestion(
            29,
            "長文内容 3B",
            "What lesson does the author draw from the replacement of Gros Michel by Cavendish?",
            [
              "Panama disease disappeared because Cavendish plants removed the fungus from infected soil.",
              "Changing varieties protected exports but allowed dependence on a genetically uniform crop to continue.",
              "Consumers rejected Cavendish at first because it could not be transported as easily as Gros Michel.",
              "Export companies used the crisis to replace large plantations with many independent small farms.",
            ],
            2,
            "2 Changing varieties protected exports but allowed dependence on a genetically uniform crop to continue.\n品種交代で当時の病原菌には対応できましたが、単一の均一作物へ依存する構造自体は残りました。"
          ),
          makeQuestion(
            30,
            "長文内容 3B",
            "Why is Tropical Race 4 especially difficult to control?",
            [
              "It infects only farms that follow cleaning rules, so producers cannot identify risky behavior.",
              "It spreads mainly through banana seeds that international companies require farmers to import.",
              "It can travel in contaminated soil and cannot be removed easily once a field is affected.",
              "It reduces fruit quality only after export, making the fungus impossible to observe on farms.",
            ],
            3,
            "3 It can travel in contaminated soil and cannot be removed easily once a field is affected.\n靴・道具・車両などについた土で運ばれ、畑に入ると単純な薬剤処理では除去できないことが難しさです。"
          ),
          makeQuestion(
            31,
            "長文内容 3B",
            "What does the final paragraph suggest about protecting future banana production?",
            [
              "A durable solution will need greater crop diversity together with technical and market changes.",
              "Traditional breeding can quickly create a resistant banana with every quality the market currently demands.",
              "Genetically altering Cavendish is the only approach that governments and consumers are likely to accept.",
              "Supply chains can become more resilient while continuing to demand one identical fruit from every producer.",
            ],
            1,
            "1 A durable solution will need greater crop diversity together with technical and market changes.\n単一の耐病品種への交代だけでは同じ弱点を繰り返すため、多様性、技術、流通と消費者側の変化を組み合わせる必要があります。"
          ),
        ]
      ),
    ]),
    makeSet("set-04", "第4回", [
      makePage(
        "長文内容 3A",
        "The Architecture of Waiting",
        [
          "A five-minute wait does not always feel like five minutes. Studies of services have repeatedly shown that uncertainty, anxiety, and a lack of activity can make time seem longer. A passenger who knows that a train will arrive in eight minutes may feel calmer than one who has already waited three minutes with no information. Waiting before a service begins often feels longer than time spent completing an early step, even when the total duration is identical. Unexplained delays also seem less fair because people cannot tell whether they have been forgotten or whether someone else has received special treatment. Service managers therefore distinguish between actual waiting time and perceived waiting time. Reducing the first requires more staff, vehicles, or equipment, but improving the second may depend on communication and the way a queue is organized. The distinction matters because an expensive increase in capacity is not always the only possible response.",
          "Queue design can influence both fairness and experience. A single line leading to several service desks ensures that the next available worker takes the person who has waited longest. It can also look discouragingly long, even when it moves quickly. Separate lines appear shorter but may move at different speeds and leave customers regretting their choice. Visible progress matters too. Airports show stages in security lines, and repair companies give arrival windows or updates when a technician is delayed. Some businesses provide menus or forms while customers wait, allowing useful preparation to begin. Mirrors, displays, or a view of employees at work may reassure customers that progress is being made, though distractions should not hide a genuinely excessive delay. These methods do not make the queue disappear, but they replace empty, uncertain time with information or activity. Estimates must be credible; an inaccurate promise can create more frustration than no estimate at all.",
          "Virtual queues allow people to wait somewhere else after receiving a number or an electronic message. They can be helpful at clinics, restaurants, and public offices where a physical line would be uncomfortable. Yet they introduce new questions. People without reliable phones may be disadvantaged, and customers who return late can disrupt the order. No-shows make prediction harder, while urgent cases at a clinic may justifiably be served ahead of people who arrived earlier. A system that predicts waiting time badly may call many people at once or leave workers idle. Some users also feel less certain when they cannot see how many others are waiting. Good queue management therefore requires more than adding an app. Managers must decide what fairness means, make alternatives available, explain priority rules, and compare perceived improvements with actual capacity. Design can make waiting more understandable and useful, but it cannot permanently solve a shortage of service.",
        ],
        [
          makeQuestion(
            25,
            "長文内容 3A",
            "What is one reason a wait may feel longer than it actually is?",
            [
              "Customers generally prefer an unexplained delay to an arrival estimate that is completely accurate.",
              "A lack of information can make people uncertain about the delay and whether they have been overlooked.",
              "Adding more workers always increases anxiety because customers cannot see which person will serve them.",
              "People measure perceived time more accurately when they have nothing to do while waiting.",
            ],
            2,
            "2 A lack of information can make people uncertain about the delay and whether they have been overlooked.\n待ち時間や遅延理由が分からないと、不安や「忘れられたのでは」という感覚が生まれ、実時間以上に長く感じます。"
          ),
          makeQuestion(
            26,
            "長文内容 3A",
            "What does the second paragraph say about providing waiting-time estimates?",
            [
              "They are useful only when every customer is waiting in a separate line.",
              "They remove the need to increase capacity when a service is regularly overcrowded.",
              "They should deliberately be longer than the true wait so that customers begin preparing forms.",
              "They can improve the experience, but unreliable estimates may make customers more dissatisfied.",
            ],
            4,
            "4 They can improve the experience, but unreliable estimates may make customers more dissatisfied.\n情報は不確実さを減らしますが、守られない予告は、何も示さない場合より強い不満を生むことがあります。"
          ),
          makeQuestion(
            27,
            "長文内容 3A",
            "What is the author’s main point about virtual queues?",
            [
              "They are fair by definition because every user receives an electronic message at the same time.",
              "They work best when physical waiting is prohibited and customers must own reliable phones.",
              "They can improve waiting but require inclusive alternatives, accurate operation, and sufficient service capacity.",
              "They reduce actual demand by preventing late customers from returning to receive a service.",
            ],
            3,
            "3 They can improve waiting but require inclusive alternatives, accurate operation, and sufficient service capacity.\n便利な一方、電話を使えない人、遅刻、予測誤差などがあり、代替手段と実際の処理能力が欠かせません。"
          ),
        ]
      ),
      makePage(
        "長文内容 3B",
        "A Society Without Cash?",
        [
          "Cards and mobile payments have become common because they are fast and convenient. A shop can avoid handling coins, reduce the amount of money kept on the premises, and connect each sale automatically to its accounting system. Customers can buy online or make a small payment without searching for exact change. Digital records may help households follow spending and allow lenders to evaluate people who previously had little formal financial history. Merchants, however, pay transaction fees and may face delayed payments or disputes over whether a charge was authorized. Very small businesses do not always receive the same terms as large chains. Governments also see electronic transactions as a way to reduce unreported business activity. These mixed but substantial advantages have led some companies to stop accepting cash and some observers to predict that physical money will eventually disappear.",
          "A cashless system, however, does not serve everyone equally. Opening and maintaining a bank account may require identification, a stable address, a minimum balance, or fees that some people cannot manage. Older adults and people with certain disabilities may find unfamiliar devices difficult to use, especially when an interface changes. Children, recent migrants, and victims leaving controlling households can depend on cash because it works without an account shared with another person. Some people also use envelopes of notes to limit weekly spending in a way they find clearer than an electronic total. Cash permits a private gift or purchase without generating a permanent commercial record. Every digital payment, by contrast, creates data. Even when a purchase is legal and ordinary, customers may not want a company or payment provider to build a detailed picture of where and how they spend money.",
          "Resilience is another concern. Electronic payments depend on electricity, communication networks, software, and functioning financial institutions. A storm, technical failure, or cyberattack can interrupt several of these at once. Cash can continue moving locally during an outage and can therefore act as a backup system. That backup works only if households possess some notes, shops can make change, and cash machines or banks have supplied the area before the disruption. A rapid decline in normal cash use may weaken this emergency network even before cash officially disappears. Physical money is not cost-free or perfectly secure: notes must be transported and guarded, theft is possible, and hidden transactions can support tax evasion or crime. The comparison is thus not between an inefficient physical system and a flawless digital one. Each has costs and protects against different kinds of failure.",
          "Policy responses increasingly try to preserve choice while extending digital access. Some cities require essential businesses to accept cash. Banks and governments can offer low-cost accounts, accessible payment cards, spending limits, or systems that work temporarily offline. Consumer rules can restrict misuse of transaction data and clarify who bears a loss after fraud. Financial education helps only if products are genuinely affordable and easy to use. At the same time, maintaining cash requires machines, transport, and enough participating shops to keep the network practical. If each business assumes that another will preserve the system, access can vanish surprisingly quickly. The debate should therefore not be reduced to whether technology is good or bad. The more useful question is how to gain the efficiency of electronic payments without removing privacy, independence, and a reliable means of exchange from people who need them.",
        ],
        [
          makeQuestion(
            28,
            "長文内容 3B",
            "Which benefit of electronic payments is mentioned in the first paragraph?",
            [
              "They can produce automatic transaction records that are useful for accounting and financial assessment.",
              "They allow shops to operate without accounting systems or any connection to financial institutions.",
              "They prevent governments from learning about business activity that was previously unreported.",
              "They ensure that every person can borrow money without providing any financial history.",
            ],
            1,
            "1 They can produce automatic transaction records that are useful for accounting and financial assessment.\n電子決済の記録は店舗会計や家計管理に使え、正式な信用履歴が乏しい人の評価材料にもなり得ます。"
          ),
          makeQuestion(
            29,
            "長文内容 3B",
            "Why might some people continue to depend on cash?",
            [
              "Cash allows payment companies to give them a more complete record of their personal purchases.",
              "Cash is accepted only by businesses that do not require customers to prove their identity.",
              "They may lack suitable accounts or need a payment method independent of another person.",
              "They are legally prohibited from learning to use cards or mobile devices until they have a stable address.",
            ],
            3,
            "3 They may lack suitable accounts or need a payment method independent of another person.\n口座開設条件や費用の問題に加え、共有口座から離れる必要がある人などには、他者から独立して使える現金が重要です。"
          ),
          makeQuestion(
            30,
            "長文内容 3B",
            "What point does the author make when comparing cash and electronic payments?",
            [
              "Cash creates no social costs, whereas digital systems fail during every severe storm.",
              "Both systems have weaknesses, and each remains useful against different risks.",
              "Digital payments make tax evasion impossible, so their security disadvantages are unimportant.",
              "Physical money is safer from theft than electronic money is from any kind of technical failure.",
            ],
            2,
            "2 Both systems have weaknesses, and each remains useful against different risks.\n電子決済は停電・通信障害に弱く、現金には輸送費・盗難・脱税などの問題があり、それぞれ別のリスクに対応します。"
          ),
          makeQuestion(
            31,
            "長文内容 3B",
            "Which policy direction is supported by the final paragraph?",
            [
              "Ending cash infrastructure immediately so that businesses have an incentive to improve digital access.",
              "Relying on financial education rather than making payment products affordable or accessible.",
              "Preventing essential shops from using electronic systems when an offline option is available.",
              "Expanding inclusive digital options while keeping cash practical for those who rely on it.",
            ],
            4,
            "4 Expanding inclusive digital options while keeping cash practical for those who rely on it.\n低コストで利用しやすい電子手段を広げつつ、現金を必要とする人のために受入れと流通網も維持する方向です。"
          ),
        ]
      ),
    ]),
    makeSet("set-05", "第5回", [
      makePage(
        "長文内容 3A",
        "Languages Made for Whistling",
        [
          "In mountainous or densely forested regions, spoken words may not travel far, but a whistle can remain clear across a valley. Its narrow range of sound loses less energy than ordinary speech, and a listener can separate it from wind or the movement of animals. Some communities have developed whistled forms of their everyday languages for communication over such distances. Farmers, hunters, or herders could send a message without walking down one slope and up another. These are not independent codes with a few fixed signals. Speakers transform important sound patterns of the local spoken language into changes in pitch, length, and rhythm. In a language where pitch distinguishes words, whistles can reproduce those pitch movements. In other languages, whistlers may use shifts in pitch and interruptions of the sound to represent vowels and consonants. The exact method therefore depends on the structure of the language being whistled.",
          "Skilled listeners can understand much more than simple warnings. Herders may discuss where animals have gone, and neighbors can exchange messages about work or visitors. Context helps, just as it does in ordinary conversation, because several spoken sounds may be represented by similar whistles. A name, familiar location, or expected task can remove ambiguity. Distance and background noise still reduce accuracy, so users may repeat a message or ask for confirmation. Experiments have shown that experienced users identify sentences far more accurately than outsiders and improve with practice in meaningful situations. Brain-imaging studies also suggest that practiced listeners process whistled messages using some of the same language-related areas used for speech. People unfamiliar with the system may instead hear only unusual tones. These findings support the view that whistling is a form of linguistic communication, not merely imitation of bird calls or a collection of musical signals.",
          "Many whistled traditions are now declining. Roads, phones, and radios reduce the need to send messages across open land, while younger residents may move away or use a national language at school. The decline of the underlying spoken language can be especially serious because the whistle system depends on its sound patterns and vocabulary. Preservation projects record expert whistlers, prepare written and audio materials, and teach the practice in classes or cultural events. Such efforts can raise pride, connect generations, and attract visitors, but they face a challenge. A system learned only for a performance may survive as a symbol while losing its role in daily communication. Lessons are more effective when learners can use whistles for real tasks in the landscape where they developed. Researchers therefore work with communities to document not only sound patterns but also the situations, knowledge, and spoken languages that give those patterns meaning.",
        ],
        [
          makeQuestion(
            25,
            "長文内容 3A",
            "What does the first paragraph explain about whistled languages?",
            [
              "They use the same set of fixed warning signals regardless of the spoken language in a region.",
              "They developed mainly because whistles are easier to hear inside crowded modern cities.",
              "They represent features of an existing spoken language through patterns such as pitch and rhythm.",
              "They can reproduce vowels but cannot represent consonants or distinctions in tone.",
            ],
            3,
            "3 They represent features of an existing spoken language through patterns such as pitch and rhythm.\n独立した信号体系ではなく、地域の話し言葉の音の特徴を高さ・長さ・リズムなどへ変換しています。"
          ),
          makeQuestion(
            26,
            "長文内容 3A",
            "What have studies of experienced users shown?",
            [
              "They can interpret detailed messages, and their brains treat practiced whistling partly like language.",
              "They understand whistles without using context because every spoken sound has one unique whistle.",
              "They process whistled sentences only in brain areas associated with music and bird calls.",
              "They are less accurate than outsiders when a message concerns animals, work, or visitors.",
            ],
            1,
            "1 They can interpret detailed messages, and their brains treat practiced whistling partly like language.\n熟練者は文を高精度で理解でき、脳画像でも音声言語に関係する領域の一部が使われると示されています。"
          ),
          makeQuestion(
            27,
            "長文内容 3A",
            "What concern does the author express about efforts to preserve whistled traditions?",
            [
              "Recording experts may cause the national language used in schools to disappear.",
              "Teaching whistling will prevent roads and communication technology from reaching remote areas.",
              "Cultural events make it impossible for researchers to study the landscapes where whistles developed.",
              "The practice may remain as a performance while no longer functioning as everyday communication.",
            ],
            4,
            "4 The practice may remain as a performance while no longer functioning as everyday communication.\n授業や行事で形だけ残っても、日常の必要から使われなければ本来の伝達機能を失う可能性があります。"
          ),
        ]
      ),
      makePage(
        "長文内容 3B",
        "Moving Species to Save Them",
        [
          "As climates change, the temperature and rainfall suitable for a species may shift toward higher latitudes or elevations. In an unbroken landscape, plants and animals can sometimes move gradually as generations reproduce in new places. The pace differs greatly: a mobile insect may expand quickly, while a tree population advances only as seeds establish beyond its current edge. Roads, cities, farms, and isolated reserves can block that movement. Soil, daylight, or a necessary food species may also be absent even where temperature seems suitable. Some conservationists therefore propose assisted migration: deliberately moving organisms to areas where future conditions may be better. The idea ranges from transferring a population within its historical range to introducing a species into a region where it has never lived. The farther the move, the greater both the possible benefit and the controversy.",
          "Supporters argue that waiting for visible population collapse may leave too little time. Long-lived trees, for example, reproduce and spread slowly, while the climate around them may change substantially within one generation. Moving seeds from warmer parts of a species’ range into cooler forests could add genetic traits already adapted to heat. Researchers keep records of each seed source because populations from different places may respond differently despite belonging to the same species. Small experimental plantings can compare survival, growth, and reproduction without immediately relocating an entire population. For animals, a suitable site must include food, shelter, and possible breeding partners, not merely an acceptable temperature. Assisted movement may also be considered when a rare species is trapped on a mountaintop or island and has no connected habitat into which it can naturally expand.",
          "The risks are difficult to predict. A moved organism might compete with local species, introduce disease, breed with a related population, or alter relationships among predators, pollinators, and food plants. Moving only a few individuals can create low genetic diversity, while moving many increases the chance of transferring parasites. A harmless species can become invasive when released from enemies that controlled it in its original home. Effects may appear slowly; a newly introduced tree might spread only after reaching maturity decades later. Climate models also disagree about conditions many years ahead, so a location selected today may not remain suitable. Yet doing nothing is not risk-free either. A population may disappear while managers wait for certainty, taking unique genes, cultural value, and ecological functions with it.",
          "Because both action and inaction can cause harm, many experts favor a staged decision process. Managers first examine whether habitat protection, wildlife corridors, or movement within the current range could solve the problem. If a move beyond that range is considered, they assess disease, ecological similarity, cultural importance, and the possibility of reversing the introduction. No single formula can produce an automatic answer, because acceptable risk depends partly on what is likely to be lost. Limited trials are monitored for years, and results are recorded even when a project fails. Funding for follow-up must continue after the initial release, when public attention may have moved elsewhere. Local and Indigenous communities are included because they may bear consequences that distant organizations do not. Assisted migration is therefore not a simple rescue operation. It is a choice under uncertainty that requires comparing risks openly and accepting responsibility for long-term monitoring.",
        ],
        [
          makeQuestion(
            28,
            "長文内容 3B",
            "Why might a species be unable to move naturally as its suitable climate shifts?",
            [
              "Higher latitudes and elevations always contain predators that prevent any new population from forming.",
              "Human-altered landscapes may separate the species from places with future suitable conditions.",
              "Every form of assisted migration removes the species from its historical range immediately.",
              "Species can move only when temperature and rainfall remain unchanged for several generations.",
            ],
            2,
            "2 Human-altered landscapes may separate the species from places with future suitable conditions.\n道路・都市・農地・孤立した保護区が連続的な移動を妨げ、将来適地へ自力で到達できない場合があります。"
          ),
          makeQuestion(
            29,
            "長文内容 3B",
            "Why does the author mention moving seeds from warmer areas?",
            [
              "To show that rare trees can survive only if all seeds are moved beyond the species’ current range.",
              "To argue that cooler forests should be replaced completely with trees from warmer climates.",
              "To demonstrate that climate models can identify one permanently safe location for every tree.",
              "To give an example of using existing genetic adaptation to prepare a population for greater heat.",
            ],
            4,
            "4 To give an example of using existing genetic adaptation to prepare a population for greater heat.\n暖地由来の種子が持つ耐暑性を涼しい森林へ加え、将来の高温に備える例として挙げられています。"
          ),
          makeQuestion(
            30,
            "長文内容 3B",
            "What is one difficulty in judging the risks of assisted migration?",
            [
              "A moved species may have unexpected ecological effects, while future local conditions also remain uncertain.",
              "Scientists know that every introduced species becomes invasive but cannot predict how quickly it happens.",
              "Climate models agree about future habitats, but managers cannot identify any diseases carried by organisms.",
              "Doing nothing preserves all unique genes, so the risks of inaction cannot be compared with those of moving.",
            ],
            1,
            "1 A moved species may have unexpected ecological effects, while future local conditions also remain uncertain.\n競争・病気・交雑などの影響に加え、将来気候の予測にも幅があり、移送先が長く適地か断定できません。"
          ),
          makeQuestion(
            31,
            "長文内容 3B",
            "What approach to assisted migration is recommended in the final paragraph?",
            [
              "Moving species beyond their ranges first and studying less disruptive alternatives afterward.",
              "Leaving decisions to distant conservation organizations so that local interests do not influence science.",
              "Considering less risky options first, then using limited, monitored trials with affected communities involved.",
              "Approving a move only when managers can guarantee that it will be reversible many decades later.",
            ],
            3,
            "3 Considering less risky options first, then using limited, monitored trials with affected communities involved.\n生息地保護や回廊を先に検討し、範囲外移送ならリスク評価、小規模試験、長期監視、地域社会の参加を求めています。"
          ),
        ]
      ),
    ]),
  ];
})();
