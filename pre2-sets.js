(() => {
  const readingInstructions = {
    vocabulary: "次の(1)から(15)までの空所に入る最も適切なものを、4つの選択肢から1つ選びなさい。",
    conversation: "次の(16)から(20)までの会話文を完成させるのに最も適切なものを、4つの選択肢から1つ選びなさい。",
    gap: "次の英文を読み、文意にそって(21)と(22)に入る最も適切なものを、4つの選択肢から1つ選びなさい。",
    content: "次の英文の内容に関して、質問に対する最も適切な答えを4つの選択肢から1つ選びなさい。",
  };

  const makeQuestion = (id, section, type, text, choices, correct, explanation) => ({
    id,
    section,
    type,
    text,
    choices,
    correct,
    explanation: `${correct}. ${choices[correct - 1]}\n${explanation}`,
  });

  const makePage = (label, kind, instruction, questions, passageTitle = "", passage = []) => ({
    label,
    kind,
    instruction,
    passageTitle,
    passage,
    questions,
  });

  const vocabularyBanks = [
    [
      ["The tickets for the concert were expensive, but Mia had saved enough money to (　　　) one.", ["print", "afford", "hide", "repair"], 2, "十分なお金を貯めたので、チケットを「買う余裕がある」という文脈です。"],
      ["Please (　　　) me to return this library book tomorrow. I often forget the due date.", ["remind", "invite", "allow", "expect"], 1, "返却を忘れないよう「思い出させる」が自然です。"],
      ["Our school buys vegetables from a (　　　) farm only three kilometers away.", ["private", "modern", "local", "foreign"], 3, "学校の近くにある「地元の」農場を表します。"],
      ["The bicycle shop will (　　　) Ken's broken brakes by Friday.", ["collect", "design", "repair", "borrow"], 3, "壊れたブレーキを「修理する」という意味です。"],
      ["The outdoor concert was (　　　) because of the heavy rain.", ["canceled", "prepared", "continued", "discovered"], 1, "大雨が理由なので、コンサートは「中止された」となります。"],
      ["The train was so (　　　) that we had to stand all the way to the city.", ["empty", "quiet", "crowded", "direct"], 3, "立たなければならないほど「混雑した」電車です。"],
      ["I forgot my umbrella, so I asked my friend if I could (　　　) hers.", ["lend", "borrow", "return", "order"], 2, "友人の傘を「借りる」ので borrow が適切です。"],
      ["Reading English news for ten minutes a day helped Leo (　　　) his vocabulary.", ["improve", "repeat", "translate", "introduce"], 1, "毎日の読書で語彙力を「向上させた」という文脈です。"],
      ["Visitors must stay on the path to (　　　) the rare flowers in the park.", ["measure", "protect", "replace", "recognize"], 2, "希少な花を「守る」ために道から出ないという意味です。"],
      ["If we leave now, we should (　　　) at the museum before it closes.", ["arrive", "appear", "attend", "enter"], 1, "博物館に閉館前に「到着する」が自然です。"],
      ["Everyone enjoyed the camping trip (　　　) Tom, who became sick and went home early.", ["because of", "instead of", "except for", "along with"], 3, "Tomだけを除くので except for が正解です。"],
      ["My sister is (　　　) seeing her host family again during her trip to Canada.", ["looking forward to", "getting used to", "taking care of", "catching up with"], 1, "再会を楽しみにしていることを表します。"],
      ["Could you (　　　) my cat while I am away this weekend?", ["take care of", "look up", "turn off", "pick out"], 1, "留守中に猫の「世話をする」という依頼です。"],
      ["Although the bus was late, we reached the airport (　　　) for our flight.", ["at once", "by chance", "in time", "for now"], 3, "飛行機に間に合う時間に到着したので in time です。"],
      ["After comparing three clubs, Aya finally (　　　) to join the photography club.", ["made a decision", "kept a secret", "took a break", "gave a speech"], 1, "比較した後に入部を「決めた」という文脈です。"],
    ],
    [
      ["Nina felt (　　　) before her first speech, but she relaxed after she began talking.", ["nervous", "honest", "patient", "lonely"], 1, "初めてのスピーチ前なので「緊張した」が自然です。"],
      ["The new lights use less electricity and will (　　　) the school's energy costs.", ["raise", "reduce", "include", "report"], 2, "使用電力が少ないため費用を「減らす」となります。"],
      ["The blue jacket is not (　　　) in this size, but we have a black one.", ["available", "comfortable", "valuable", "popular"], 1, "このサイズの青は「利用可能ではない・在庫がない」という意味です。"],
      ["I did not (　　　) Ms. Hill at first because she had changed her hairstyle.", ["respect", "follow", "recognize", "visit"], 3, "髪型が変わっていて「見分けられなかった」という文脈です。"],
      ["Our coach always (　　　) us to try again after we make a mistake.", ["encourages", "controls", "refuses", "warns"], 1, "失敗後に再挑戦するよう「励ます」が適切です。"],
      ["To (　　　) missing the bus, we left home twenty minutes earlier than usual.", ["avoid", "finish", "practice", "imagine"], 1, "バスに乗り遅れるのを「避ける」ためです。"],
      ["The restaurant looks expensive, but its lunch prices are quite (　　　).", ["ordinary", "serious", "ancient", "correct"], 1, "見た目に反して価格は「普通の」という対比です。"],
      ["This soup may (　　　) nuts, so people with allergies should ask the staff.", ["contain", "spread", "provide", "produce"], 1, "スープにナッツが「含まれる」可能性を表します。"],
      ["Can you (　　　) a good book about Japanese history for my project?", ["recommend", "promise", "celebrate", "describe"], 1, "良い本を「薦める」という依頼です。"],
      ["The number of visitors usually (　　　) during the town's summer festival.", ["increases", "returns", "passes", "reaches"], 1, "祭りの期間に来訪者数が「増える」という意味です。"],
      ["(　　　), Omar did not enjoy running, but now he trains three times a week.", ["At first", "At least", "In fact", "In public"], 1, "以前と現在の変化を示す「最初は」が適切です。"],
      ["I took my brother's lunch box (　　　) because ours look exactly the same.", ["in person", "by accident", "on purpose", "at last"], 2, "同じ見た目で誤って持ったので by accident です。"],
      ["The two new students quickly (　　　) their classmates and joined several activities.", ["got along with", "looked down on", "ran away from", "caught up with"], 1, "クラスメートと「仲良くなった」という意味です。"],
      ["More than one hundred students will (　　　) the beach cleanup on Saturday.", ["take part in", "get away with", "make fun of", "keep out of"], 1, "清掃活動に「参加する」となります。"],
      ["Lena became (　　　) astronomy after looking through a telescope at camp.", ["interested in", "afraid of", "ready for", "different from"], 1, "望遠鏡をきっかけに天文学に「興味を持った」となります。"],
    ],
    [
      ["The hotel could not (　　　) our reservation because every room was already taken.", ["accept", "solve", "repeat", "manage"], 1, "満室なので予約を「受け付ける」ことができません。"],
      ["Scientists hope to (　　　) why the birds have stopped visiting the lake.", ["discover", "introduce", "exchange", "express"], 1, "鳥が来なくなった理由を「発見する」という意味です。"],
      ["Please be (　　　). The doctor will see you as soon as she finishes this call.", ["patient", "active", "equal", "careful"], 1, "待つよう求めているので「辛抱強く」が自然です。"],
      ["The furniture store will (　　　) our new table on Tuesday morning.", ["deliver", "borrow", "repair", "choose"], 1, "店が購入品を「配達する」という意味です。"],
      ["This song sounds (　　　), but I cannot remember where I heard it.", ["familiar", "perfect", "private", "silent"], 1, "聞いたことがあるように「なじみがある」を表します。"],
      ["Do not (　　　) water while brushing your teeth. Turn off the tap.", ["waste", "boil", "share", "cover"], 1, "蛇口を閉めて水を「無駄にしない」という文脈です。"],
      ["The guide (　　　) taking the morning train because the afternoon one is often crowded.", ["suggested", "finished", "avoided", "considered"], 1, "朝の電車に乗ることを「提案した」となります。"],
      ["We need two more days to (　　　) the science report.", ["complete", "connect", "depend", "develop"], 1, "レポートを「完成させる」という意味です。"],
      ["Each student is (　　　) for returning the tablet in good condition.", ["responsible", "famous", "necessary", "similar"], 1, "端末を良い状態で返す「責任がある」を表します。"],
      ["The city plans to build a (　　　) garden that anyone can visit for free.", ["public", "central", "natural", "regular"], 1, "誰でも無料で利用できる「公共の」庭園です。"],
      ["Please call me (　　　) you arrive at the station.", ["as soon as", "as well as", "as far as", "as long as"], 1, "駅に着いたら「すぐに」電話するという意味です。"],
      ["We stopped at a bakery (　　　) to the sports center.", ["on the way", "at the end", "by the time", "in the middle"], 1, "目的地へ向かう「途中で」立ち寄ったことを表します。"],
      ["Kai rode his bicycle (　　　) taking the bus because the weather was nice.", ["instead of", "because of", "thanks to", "away from"], 1, "バスではなく自転車を選んだので instead of です。"],
      ["The town hopes more young families will move there (　　　).", ["in the future", "at present", "for example", "in return"], 1, "今後への期待なので「将来」が適切です。"],
      ["Mina was (　　　) her brother when he won the national contest.", ["proud of", "worried about", "tired of", "surprised at"], 1, "全国大会で優勝した兄を「誇りに思った」となります。"],
    ],
    [
      ["The students stayed after school to (　　　) the room for the welcome party.", ["prepare", "discover", "accept", "deliver"], 1, "歓迎会のため部屋を「準備する」という意味です。"],
      ["The old painting is very (　　　), so the museum keeps it behind glass.", ["valuable", "usual", "simple", "safe"], 1, "厳重に保管するほど「価値がある」という文脈です。"],
      ["The hotel will (　　　) the broken hair dryer with a new one.", ["replace", "collect", "protect", "borrow"], 1, "壊れた品を新品と「交換する」という意味です。"],
      ["Please (　　　) paper, cans, and plastic before putting them in the recycling boxes.", ["separate", "improve", "support", "attend"], 1, "資源ごとに「分ける」という指示です。"],
      ["I did not (　　　) that my passport had expired until the day before the trip.", ["realize", "prefer", "promise", "invite"], 1, "期限切れに「気づかなかった」という意味です。"],
      ["The school play was so (　　　) that all three evening shows sold out.", ["successful", "serious", "traditional", "responsible"], 1, "全公演完売なので「成功した」となります。"],
      ["Mark had to (　　　) the invitation because he would be out of town.", ["refuse", "recognize", "contain", "imagine"], 1, "不在のため招待を「断る」という意味です。"],
      ["Online reservations are (　　　) because customers can make them at any time.", ["convenient", "ancient", "expensive", "correct"], 1, "いつでも予約できて「便利だ」という文脈です。"],
      ["Whether the game is held tomorrow will (　　　) on the weather.", ["depend", "reduce", "belong", "continue"], 1, "開催可否が天候に「左右される」を表します。"],
      ["Buying a weekly train pass can (　　　) you money if you travel every day.", ["save", "raise", "spend", "lend"], 1, "定期券でお金を「節約できる」という意味です。"],
      ["The town is (　　　) its spring flower festival.", ["known for", "filled with", "ready for", "similar to"], 1, "その祭りで「知られている」となります。"],
      ["I left my notebook at home because I was (　　　) this morning.", ["in a hurry", "in danger", "in order", "in silence"], 1, "急いでいて忘れたので in a hurry です。"],
      ["Our group (　　　) a plan to collect rainwater for the school garden.", ["came up with", "looked after", "ran into", "took after"], 1, "計画を「考え出した」という意味です。"],
      ["Even after losing the first two games, the team did not (　　　).", ["give up", "grow up", "wake up", "show up"], 1, "負けても「あきらめなかった」という文脈です。"],
      ["We still (　　　) our exchange student by sending messages every month.", ["keep in touch with", "make room for", "pay attention to", "take the place of"], 1, "毎月連絡を取り「交流を続けている」となります。"],
    ],
    [
      ["It is (　　　) to rain this afternoon, so take an umbrella.", ["likely", "quiet", "valuable", "simple"], 1, "午後に雨が降る「可能性が高い」という意味です。"],
      ["More than two hundred people will (　　　) the free outdoor concert.", ["attend", "protect", "repair", "borrow"], 1, "コンサートに「出席する・参加する」となります。"],
      ["The nurse checked the child's (　　　) and found that he had a fever.", ["temperature", "height", "weight", "speed"], 1, "熱があるか調べるため「体温」を測ります。"],
      ["We plan to (　　　) our new neighbors to dinner this weekend.", ["invite", "deliver", "accept", "solve"], 1, "新しい隣人を食事に「招待する」という意味です。"],
      ["Making rice cakes at New Year is an old family (　　　).", ["tradition", "decision", "direction", "condition"], 1, "毎年続く家族の「伝統」を表します。"],
      ["Local companies agreed to (　　　) the children's sports event with money and equipment.", ["support", "separate", "recognize", "refuse"], 1, "資金と道具で行事を「支援する」となります。"],
      ["Strong winds may (　　　) the young trees, so workers tied them to poles.", ["damage", "improve", "contain", "recommend"], 1, "強風で木が「傷つく」可能性を表します。"],
      ["I (　　　) taking the train because driving in the city is stressful.", ["prefer", "complete", "realize", "promise"], 1, "車より電車を「好む」という比較です。"],
      ["The students worked together to (　　　) the problem with the robot.", ["solve", "attend", "waste", "repeat"], 1, "ロボットの問題を「解決する」となります。"],
      ["Several parents (　　　) to help serve lunch at the school event.", ["volunteered", "increased", "delivered", "appeared"], 1, "自分から手伝うことを「申し出た」という意味です。"],
      ["(　　　) the weather report, the snow will stop before noon.", ["According to", "Instead of", "Because of", "Along with"], 1, "天気予報の情報によれば、を表します。"],
      ["Riku was (　　　) school for three days because he had the flu.", ["absent from", "proud of", "ready for", "different from"], 1, "インフルエンザで学校を「欠席した」となります。"],
      ["We (　　　) milk while making the cake, so Dad went to the store.", ["ran out of", "looked after", "caught up with", "got over"], 1, "ケーキ作りの途中で牛乳を「使い切った」という意味です。"],
      ["Sara (　　　) the job offer because the office was too far from her home.", ["turned down", "put away", "gave back", "set up"], 1, "距離を理由に仕事の申し出を「断った」となります。"],
      ["The school sports day will (　　　) on the second Saturday in October.", ["take place", "make sense", "come true", "get lost"], 1, "行事がその日に「開催される」という意味です。"],
    ],
  ];

  const conversationBanks = [
    [
      ["A: Did you finish the poster for the book fair?\nB: Almost, but (　　　).\nA: The library opens at nine. I can ask Mrs. Cole tomorrow.", ["I do not know the opening time", "I have already printed fifty copies", "the fair ended yesterday", "I borrowed the newest book"], 1, "図書館の開館時刻を確認したい流れです。"],
      ["A: This soup tastes different today.\nB: (　　　) We used tomatoes from our garden.\nA: That explains the fresh taste.", ["It has no vegetables.", "Do you think so?", "I ordered it online.", "Please close the window."], 2, "味の感想を受け、材料の違いを説明する応答です。"],
      ["A: Are you coming to basketball practice after school?\nB: I cannot today. (　　　)\nA: I hope she feels better soon.", ["My sister is sick, so I need to go home.", "The team won last Saturday.", "I practice every Wednesday.", "The gym is next to the library."], 1, "相手の“I hope she feels better”につながる内容です。"],
      ["A: Excuse me, does this bus go to City Hall?\nB: No, (　　　). You need the number 12 bus.\nA: Thank you. I will wait for that one.", ["it stops there in five minutes", "this one goes to the airport", "the driver works at City Hall", "you can buy a ticket inside"], 2, "別のバスが必要だと説明する流れです。"],
      ["A: I left my science notebook in the classroom.\nB: The building is still open. (　　　)\nA: Good idea. I will go before the club meeting starts.", ["Why did you buy a new one?", "You should get it now.", "Our class is on the second floor.", "I finished the homework."], 2, "まだ開いているので今取りに行く提案が適切です。"],
    ],
    [
      ["A: Can I return this shirt? It is too small.\nB: Certainly. (　　　)\nA: Yes, here it is.", ["Did you bring the receipt?", "Would you like a smaller size?", "Did you wash it yesterday?", "Is the store crowded?"], 1, "返品手続きに必要なレシートを確認しています。"],
      ["A: Why are you taking the early train?\nB: (　　　)\nA: Then you should leave before seven.", ["My interview begins at nine.", "The station was built last year.", "I bought the ticket yesterday.", "The later train is cheaper."], 1, "早い電車に乗る理由として面接時刻が適切です。"],
      ["A: The school garden looks much better.\nB: Thanks. (　　　)\nA: I would like to help next time.", ["The vegetables were expensive.", "Our class pulled weeds this morning.", "It will rain in another city.", "The gate is always locked."], 2, "庭がきれいになった理由を説明しています。"],
      ["A: I heard you joined the drama club.\nB: Yes, but I am not acting in the play. (　　　)\nA: That sounds important, too.", ["I am helping with the lights.", "The play was very funny.", "My ticket is in my bag.", "I dislike watching plays."], 1, "演技以外の役割を説明する応答です。"],
      ["A: The printer is not working again.\nB: (　　　) He fixed it last week.\nA: I will call him now.", ["Let's ask Mr. Green.", "I printed the report.", "The paper is white.", "Please turn off the lights."], 1, "修理できる人物に頼む流れです。"],
    ],
    [
      ["A: Would you like to see the photo exhibition on Sunday?\nB: Yes. (　　　)\nA: It opens at ten, so how about meeting at nine thirty?", ["What time should we meet?", "Why did you lose the photos?", "Where did you buy the camera?", "Who closed the museum?"], 1, "待ち合わせ時刻の提案につながる質問です。"],
      ["A: I cannot find my train card.\nB: (　　　)\nA: You're right. I used it there this morning.", ["Did you check your jacket pocket?", "Do you want to take a train tomorrow?", "Is the station far from school?", "Did the train arrive late?"], 1, "最後に使った可能性のある場所を確認する流れです。"],
      ["A: Your presentation was easy to understand.\nB: Thank you. (　　　)\nA: The map was especially helpful.", ["Which part did you like best?", "Why did you miss the class?", "When will the test begin?", "How much was the computer?"], 1, "発表のどこが良かったか尋ねています。"],
      ["A: The hiking trail is closed today.\nB: Oh no. (　　　)\nA: Yes, there is a nature center near the lake.", ["Is there another place we can visit?", "Did you bring enough water?", "How high is the mountain?", "Why is your bag so heavy?"], 1, "代わりの訪問先を探す自然な流れです。"],
      ["A: Did you enjoy your first cooking lesson?\nB: Yes, although (　　　).\nA: Everyone makes mistakes at first.", ["I added too much salt", "the teacher gave me a recipe", "we cooked pasta", "the class started at four"], 1, "励ましの言葉につながる失敗内容です。"],
    ],
    [
      ["A: May I use this study room?\nB: Yes, but (　　　).\nA: I only need it until three.", ["you must finish by four", "the library has many books", "I studied there yesterday", "the room is on the first floor"], 1, "利用時間の条件を伝える応答です。"],
      ["A: Why are there boxes in the hallway?\nB: (　　　)\nA: I will help carry them after lunch.", ["The art club is moving to another room.", "The hallway was cleaned this morning.", "Our teacher bought a new desk.", "The boxes are made of paper."], 1, "箱を運ぶ手伝いにつながる理由です。"],
      ["A: I thought the movie started at seven thirty.\nB: (　　　)\nA: Then we should leave right now.", ["The time was changed to seven.", "The theater sells popcorn.", "I watched it last month.", "The tickets are in my pocket."], 1, "すぐ出発する必要がある時刻変更です。"],
      ["A: Your new shoes look comfortable.\nB: They are. (　　　)\nA: That was a good deal.", ["They were half price.", "I wear them at school.", "The store is downtown.", "My old shoes are blue."], 1, "お得だったという評価につながる値引き情報です。"],
      ["A: Can you come to the volunteer meeting tonight?\nB: I may be late because (　　　).\nA: No problem. We will save you a seat.", ["my piano lesson ends at six thirty", "the meeting room is large", "I joined last year", "the chairs are comfortable"], 1, "遅れる理由として前の予定が適切です。"],
    ],
    [
      ["A: This package is heavier than I expected.\nB: (　　　)\nA: Thanks. Let us carry it together.", ["Would you like some help?", "Where did you buy the tape?", "Did it arrive yesterday?", "How much did it cost?"], 1, "一緒に運ぶ流れにつながる申し出です。"],
      ["A: Are you still working at the café on Saturdays?\nB: No. (　　　)\nA: That will give you more study time.", ["I stopped because my exams are near.", "The café sells excellent cake.", "My friend works there, too.", "I usually start at ten."], 1, "勉強時間が増えるという返答につながる理由です。"],
      ["A: I cannot open this file on my tablet.\nB: (　　　)\nA: Good idea. The school computers may have the right program.", ["Try using a computer in the library.", "The tablet was a birthday gift.", "I finished the file yesterday.", "The library closes at six."], 1, "別の機器を使う解決策です。"],
      ["A: Why are you wearing your school uniform on Sunday?\nB: (　　　)\nA: I hope your team does well.", ["We have a debate contest today.", "I washed it yesterday.", "Our school is near the station.", "The uniform is comfortable."], 1, "チームへの応援につながる大会参加です。"],
      ["A: The museum tour is full this afternoon.\nB: That's too bad. (　　　)\nA: Yes, there are still places at eleven.", ["Can we join tomorrow morning?", "How old is the museum?", "Did you see the new painting?", "Where is the gift shop?"], 1, "別の時間帯を提案する自然な応答です。"],
    ],
  ];

  const readingContent = [
    {
      gap: {
        title: "The Extra Chair",
        passage: [
          "Rina's class was preparing for a music contest. She practiced the piano every day, but she became worried whenever other students listened. During one practice, she made several mistakes and stopped playing. Her teacher placed an empty chair beside the piano and told her to imagine that a close friend was sitting there. The teacher said that performing was not only about playing every note perfectly. It was also about (21).",
          "At first, Rina thought the idea was strange. However, she tried it during the next practice. She looked at the chair before she began and imagined her best friend smiling. Rina still made one small mistake, but she continued to the end. She realized that the audience wanted to enjoy the music, not search for every error. On the day of the contest, (22), and she played with confidence.",
        ],
        questions: [
          ["what feelings the music could share with listeners", "how quickly the piano could be moved", "which student practiced the longest", "why contests needed more chairs"],
          ["she remembered the empty-chair exercise", "her teacher played the piano for her", "the contest was suddenly canceled", "she decided not to perform"],
        ],
        correct: [1, 1],
        explanations: ["教師は完璧さだけでなく、音楽で気持ちを伝えることを教えました。", "本番でも友人を想像する練習を思い出し、自信を持てました。"],
      },
      email: {
        title: "From: Noah Carter <noah.carter@example.com>",
        passage: [
          "To: Emi Tanaka <emi.tanaka@example.com>",
          "Subject: Saturday's cooking class",
          "Hi Emi,\nThanks for telling me about the cooking class at your community center. I called the center today and learned that there are still places in Saturday's class. We will make vegetable curry and fruit yogurt. The class begins at 10 a.m. and finishes at 1 p.m.",
          "The staff said we do not need to bring cooking tools, but everyone should bring an apron and a container for extra food. The class costs 1,500 yen. I plan to go by bus because there is no parking near the center. Would you like to meet at the bus stop at 9:30? Please tell me by Thursday because I must give the center the final number of people.",
          "Your friend,\nNoah",
        ],
        questions: [
          ["What did Noah learn when he called the center?", ["The Saturday class still has space.", "The class has been moved to Sunday.", "Students must bring cooking tools.", "Only adults may join the class."], 1, "土曜クラスにはまだ空きがあると分かりました。"],
          ["What should participants bring?", ["Vegetables and yogurt.", "An apron and a food container.", "A bus ticket and a map.", "Cooking tools and plates."], 2, "エプロンと余った料理を入れる容器が必要です。"],
          ["Why does Noah need an answer by Thursday?", ["He must report how many people will attend.", "He wants to reserve a parking space.", "He needs time to buy an apron.", "He will change the class menu."], 1, "センターへ最終人数を伝えるためです。"],
        ],
      },
      article: {
        title: "Libraries of Things",
        passage: [
          "Most people think of books when they hear the word library. However, some libraries now lend objects as well as books. These services are sometimes called “libraries of things.” Members may borrow tools, board games, sports equipment, or even small musical instruments.",
          "One reason for these services is that many objects are only needed a few times a year. For example, a family may need a large tent for one camping trip but have no reason to buy one. Borrowing saves money and also reduces the number of unused objects kept at home. Some libraries hold classes where volunteers show members how to use tools safely.",
          "There are challenges, too. Objects can break or be returned late, and library workers must check every item carefully. Large equipment also needs storage space. For this reason, libraries often begin with a small collection chosen through surveys of local residents.",
          "The idea is spreading because it gives libraries a new way to support their communities. It also encourages people to share resources instead of buying everything themselves.",
        ],
        questions: [
          ["What can members do at a library of things?", ["Borrow useful objects as well as books.", "Sell old tools to other residents.", "Repair all library equipment.", "Keep musical instruments permanently."], 1, "本だけでなく道具やゲームなども借りられます。"],
          ["Why may a family borrow a tent?", ["They use tents every weekend.", "They need one only for a short time.", "The library asks them to camp.", "New tents cannot be bought."], 2, "一度の旅行など、短期間しか必要でないためです。"],
          ["What is one challenge for these libraries?", ["They cannot ask residents what they need.", "They need space and must inspect returned items.", "Volunteers refuse to teach safe tool use.", "Books become more expensive to purchase."], 2, "保管場所と返却品の点検が必要です。"],
          ["Why is the idea spreading?", ["It helps communities share resources.", "It makes every library much larger.", "It stops people from reading books.", "It allows workers to avoid checking items."], 1, "地域で資源を共有し、図書館が新しい支援を提供できるからです。"],
        ],
      },
    },
    {
      gap: {
        title: "A Different Kind of Map",
        passage: [
          "For a geography project, Mr. Lee asked his students to make a map of their neighborhood. Most students planned to draw streets and buildings. Yuto decided to make a sound map instead. He walked around with a small recorder and noted where he heard birds, traffic, music, and people talking. He wanted to show that a place can be understood not only by how it looks but also by (21).",
          "When Yuto played the recordings in class, students noticed patterns they had never considered. The park was quiet in the morning but full of children's voices after school. A narrow street sounded busy because delivery trucks used it at noon. The class added symbols for each sound to a large paper map. Their teacher said the project succeeded because (22), helping everyone experience a familiar area in a new way.",
        ],
        questions: [
          ["the sounds people hear there", "the age of its oldest building", "the number of maps in the city", "the price of recording equipment"],
          ["it combined careful listening with location information", "it copied a map from the Internet", "it included every street in the country", "it avoided showing changes during the day"],
        ],
        correct: [1, 1],
        explanations: ["Yutoは見た目だけでなく、その場所の音に注目しました。", "音と場所・時間を結び付けた点が新しい理解につながりました。"],
      },
      email: {
        title: "From: Lily Morgan <lily.morgan@example.com>",
        passage: [
          "To: Haru Sato <haru.sato@example.com>",
          "Subject: Book exchange day",
          "Hi Haru,\nOur student council is holding a book exchange next Wednesday. Students can bring up to three books that they have finished reading and exchange each one for another book. The event will be in the school hall from 3:30 to 5:00.",
          "Books must be clean and suitable for students our age. Textbooks and magazines will not be accepted. I am helping at the entrance, so I need to arrive at 3:00. Could you help us put the books on the tables? If you can, please come at the same time. We also need paper bags, so bring one if you have an extra bag at home.",
          "Your friend,\nLily",
        ],
        questions: [
          ["What can students do at the event?", ["Trade books they have finished for other books.", "Sell textbooks to teachers.", "Borrow magazines for one week.", "Donate any number of damaged books."], 1, "読み終えた本を別の本と交換できます。"],
          ["Which item will not be accepted?", ["A clean novel for teenagers.", "A science textbook.", "A short story collection.", "A book about sports."], 2, "教科書と雑誌は受け付けません。"],
          ["Why does Lily ask Haru to come at 3:00?", ["To help arrange books before the event.", "To choose the first three books.", "To clean the school hall alone.", "To meet a magazine seller."], 1, "開場前に本をテーブルへ並べる手伝いを頼んでいます。"],
        ],
      },
      article: {
        title: "Dark Sky Towns",
        passage: [
          "Streetlights make roads safer at night, but too much artificial light can cause problems. In some places, bright lights shine into homes and make it difficult for people to sleep. They can also hide stars and affect animals that depend on darkness.",
          "A growing number of towns are trying to reduce unnecessary nighttime light. They use lamps that point downward instead of sending light into the sky. Some lights become dimmer when streets are empty and brighten when a person or car approaches. These changes can save electricity while keeping important areas visible.",
          "Businesses sometimes worry that darker streets will make customers feel unsafe. Towns therefore test new lighting in limited areas and ask residents for opinions. They also measure traffic accidents and crime before and after the change.",
          "The goal is not to remove every light. It is to use the right amount in the right place. Towns that succeed may protect wildlife, lower energy costs, and allow residents to see more stars without making streets dangerous.",
        ],
        questions: [
          ["What can excessive artificial light do?", ["Improve everyone's sleep.", "Hide stars and disturb animals.", "Make homes use less electricity.", "Remove the need for streetlights."], 2, "過剰な光は星を見えにくくし、動物にも影響します。"],
          ["How do some modern streetlights work?", ["They always shine toward the sky.", "They turn off whenever a car arrives.", "They adjust brightness when streets are empty or busy.", "They are used only inside homes."], 3, "人や車の有無に応じて明るさを変えます。"],
          ["Why do towns test lighting in limited areas?", ["To study safety and hear residents' views.", "To make all businesses close earlier.", "To stop measuring energy use.", "To teach animals to avoid streets."], 1, "安全性や住民の反応を確認するためです。"],
          ["What is the main goal of dark sky towns?", ["To remove all lighting at night.", "To use only enough light where it is needed.", "To make stars brighter than the moon.", "To move every streetlight indoors."], 2, "必要な場所で適切な量の光を使うことが目的です。"],
        ],
      },
    },
    {
      gap: {
        title: "The Missing Recipe",
        passage: [
          "Sofia wanted to make her grandmother's apple cake for a school event. The recipe card was old, and part of it had become impossible to read. Sofia could see the ingredients, but she did not know how long the cake should stay in the oven. Instead of giving up, she called her aunt, who had watched her grandmother bake many times. Her aunt could not remember the exact number of minutes, but she explained (21).",
          "Sofia followed the advice and checked the cake when its top became golden. She also pushed a thin wooden stick into the center. When it came out clean, she knew the cake was ready. At the event, several people asked for the recipe. Sofia made a new copy with clear instructions and added her aunt's useful tips. In this way, (22) while making it easier for others to use.",
        ],
        questions: [
          ["how to tell when the cake was finished", "where to buy a new oven", "why apples were expensive", "who had lost the recipe card"],
          ["she preserved a family recipe", "she changed every ingredient", "the school canceled the event", "her aunt opened a bakery"],
        ],
        correct: [1, 1],
        explanations: ["正確な時間ではなく、焼き上がりを判断する方法を教わりました。", "古いレシピを分かりやすく書き直して残しました。"],
      },
      email: {
        title: "From: Ethan Brooks <ethan.brooks@example.com>",
        passage: [
          "To: Kenta Mori <kenta.mori@example.com>",
          "Subject: Science museum volunteers",
          "Hi Kenta,\nThe city science museum is looking for student volunteers during the summer vacation. I attended an information meeting yesterday. Volunteers will welcome visitors, show children how to use simple experiments, and help staff prepare materials.",
          "We must work at least four days in August, from 9:30 a.m. to 3:30 p.m. Before starting, everyone has to attend a training session on July 28. Lunch is provided, but we need to pay for our own transportation. I think it will be a good chance to practice speaking with many people. Applications close this Friday. Would you like to apply with me?",
          "Your friend,\nEthan",
        ],
        questions: [
          ["What will student volunteers do?", ["Help visitors and prepare experiment materials.", "Design a new museum building.", "Teach a full science course.", "Sell lunches to museum workers."], 1, "来館者対応、実験の補助、材料準備を行います。"],
          ["What must volunteers do before August?", ["Buy all experiment materials.", "Attend training on July 28.", "Work four days in July.", "Find their own lunch."], 2, "7月28日の研修参加が必須です。"],
          ["Why does Ethan want to volunteer?", ["To practice communicating with different people.", "To earn money for transportation.", "To avoid the summer vacation.", "To receive free science equipment."], 1, "多くの人と話す練習になると考えています。"],
        ],
      },
      article: {
        title: "Cooling Schoolyards",
        passage: [
          "On hot days, schoolyards covered with dark asphalt can become much warmer than nearby parks. This makes outdoor activities uncomfortable and may increase the risk of heat-related illness. Some schools are redesigning their yards to create cooler places.",
          "One method is to plant trees that provide shade. Another is to replace part of the asphalt with grass, soil, or lighter-colored materials that do not hold as much heat. Schools may also add covered areas with drinking-water stations.",
          "These projects can support learning as well as health. Science classes can measure temperatures in different parts of the yard, and students can help care for plants. However, trees need years to grow, and grass requires water and regular maintenance. Changes must also leave enough strong surfaces for sports and emergency vehicles.",
          "For this reason, many schools begin with a small section and compare temperatures before making larger changes. The best design depends on local weather, available money, and how the schoolyard is used.",
        ],
        questions: [
          ["Why can asphalt schoolyards be a problem?", ["They may become dangerously hot.", "They cannot be used for any sport.", "They always damage emergency vehicles.", "They prevent students from drinking water."], 1, "濃い色の舗装は熱を持ち、熱中症の危険を高めます。"],
          ["How can schools make yards cooler?", ["By adding shade and less heat-holding surfaces.", "By painting every tree a light color.", "By removing all places for sports.", "By closing yards throughout the year."], 1, "木陰や草地、明るい素材などを利用します。"],
          ["What is one challenge of planting trees and grass?", ["They need time, water, and maintenance.", "They make science lessons impossible.", "They cannot lower temperatures.", "They are never suitable for students."], 1, "成長時間や水、維持管理が必要です。"],
          ["Why do many schools start with a small area?", ["To test results before making a larger investment.", "To keep students away from every plant.", "To avoid measuring temperature.", "To use the yard only for vehicles."], 1, "効果を比較してから大規模な変更を判断するためです。"],
        ],
      },
    },
    {
      gap: {
        title: "The Quiet Member",
        passage: [
          "During group projects, Leo rarely spoke first. His classmates sometimes thought he had no ideas, but he was actually listening carefully and writing notes. When the class planned a charity event, the group could not agree on where to hold it. Leo looked at everyone's suggestions and noticed that the community hall was available on the only date that all members were free. He quietly showed the schedule to the group. His notes helped them (21).",
          "After that, the group leader began asking Leo directly what he had noticed. Leo still did not speak as often as some members, but his comments were useful because he had considered several opinions. The experience taught the group that good teamwork does not mean everyone must behave in the same way. It means (22) and using each person's strengths.",
        ],
        questions: [
          ["solve the disagreement", "cancel the charity event", "choose a new group leader", "avoid using the community hall"],
          ["making space for different ways of contributing", "letting one person make every decision", "speaking as quickly as possible", "writing fewer notes during meetings"],
        ],
        correct: [1, 1],
        explanations: ["全員の予定を整理して会場問題を解決しました。", "異なる参加方法を認め、長所を生かすことが協働だと学びました。"],
      },
      email: {
        title: "From: Grace Wilson <grace.wilson@example.com>",
        passage: [
          "To: Yui Nakata <yui.nakata@example.com>",
          "Subject: Our school garden",
          "Hi Yui,\nOur environmental club is starting a small garden behind the science building. We will grow tomatoes, herbs, and flowers that attract butterflies. Mr. Hall will teach us how to prepare the soil next Monday after school.",
          "The club already has tools, but each student should bring work gloves and a hat. We plan to work for about one hour every Monday and Thursday. During the summer vacation, members will take turns watering the plants. The vegetables will be used in the school's cooking classes. You said you wanted to learn more about plants. Would you like to join us on Monday?",
          "Your friend,\nGrace",
        ],
        questions: [
          ["What will the club grow?", ["Only vegetables for sale.", "Tomatoes, herbs, and butterfly-friendly flowers.", "Trees for the science building.", "Plants that need no water."], 2, "トマト、ハーブ、蝶を呼ぶ花を育てます。"],
          ["What should each student bring?", ["Tools and soil.", "Gloves and a hat.", "Food and a butterfly net.", "A cooking book and water."], 2, "道具はありますが、手袋と帽子が必要です。"],
          ["How will the vegetables be used?", ["They will be used in cooking lessons.", "They will be sent to another school.", "They will be given only to teachers.", "They will be displayed in the library."], 1, "学校の調理授業で使われます。"],
        ],
      },
      article: {
        title: "Repair Cafés",
        passage: [
          "When a lamp, toy, or small appliance breaks, many people throw it away. Sometimes the problem is simple, but the owner does not know how to fix it. Repair cafés are community events where volunteers help visitors repair such items.",
          "Visitors bring broken objects and sit with people who have skills in sewing, electronics, bicycle repair, or other areas. The volunteers do not simply take the object away and fix it. They explain the problem and encourage the owner to participate. This helps visitors learn skills and may keep useful products out of the trash.",
          "Not every item can be repaired. Replacement parts may be unavailable, and some electrical products are unsafe to open. Organizers need clear safety rules and must tell visitors that repairs are not guaranteed.",
          "Even when an object cannot be saved, the event can still be useful. Volunteers may explain how to choose a stronger product next time or where materials can be recycled correctly. Repair cafés also bring together people of different ages who might not otherwise meet.",
        ],
        questions: [
          ["What happens at a repair café?", ["Volunteers help owners understand and fix broken objects.", "Stores sell only new electrical products.", "Visitors leave items for guaranteed repair.", "Companies collect furniture for profit."], 1, "所有者とボランティアが一緒に修理します。"],
          ["Why are owners encouraged to participate?", ["So they can learn practical skills.", "So volunteers can leave early.", "So every repair is guaranteed.", "So they can buy replacement parts."], 1, "修理方法や技能を学べるためです。"],
          ["Why can some items not be repaired?", ["They are always too old.", "Parts may be missing or opening them may be unsafe.", "Visitors refuse to bring them.", "Organizers have no safety rules."], 2, "部品不足や安全上の問題があります。"],
          ["How can the event help when repair is impossible?", ["It can provide advice about buying or recycling.", "It can make the item work without parts.", "It can force stores to replace the item.", "It can guarantee money for the owner."], 1, "次の購入や適切なリサイクル方法を助言できます。"],
        ],
      },
    },
    {
      gap: {
        title: "One More Question",
        passage: [
          "Maya was interviewing a local baker for the school newspaper. She had prepared a list of questions and wanted to finish quickly. The baker answered each one politely. Near the end, he mentioned that his family had used the same oven for sixty years. This was not on Maya's list, but she became curious and asked how the oven had been kept working for so long. That extra question (21).",
          "The baker explained that his father had taught him how to clean and repair the oven. He also showed Maya an old photograph of the bakery. The story became the most interesting part of her article. Maya learned that preparation was important, but an interviewer also needed to listen for unexpected details. By doing so, (22) instead of simply collecting short answers.",
        ],
        questions: [
          ["led to a valuable family story", "made the baker end the interview", "caused the oven to stop working", "showed that her list was too long"],
          ["she could discover a deeper story", "she could avoid writing the article", "the baker could ask every question", "the newspaper could use fewer photographs"],
        ],
        correct: [1, 1],
        explanations: ["追加質問から家族とパン屋の歴史が引き出されました。", "注意深く聞くことで、表面的でない話を見つけられました。"],
      },
      email: {
        title: "From: Jack Evans <jack.evans@example.com>",
        passage: [
          "To: Mei Kato <mei.kato@example.com>",
          "Subject: Photography at the autumn festival",
          "Hi Mei,\nThe town office is asking students to take photographs at the autumn festival. The pictures may be used on the town website and in next year's festival guide. Students can photograph food stands, performances, decorations, and visitors enjoying the event.",
          "There will be a short meeting at the town office at 4 p.m. on September 20. A photographer will explain how to ask people for permission before taking close-up pictures. We can use cameras or smartphones, but we must upload our best ten photographs by October 5. I know you enjoy photography. Would you like to join the project with me?",
          "Your friend,\nJack",
        ],
        questions: [
          ["How may the photographs be used?", ["On the town website and in a future guide.", "Only in the students' classroom.", "To sell cameras at the festival.", "In a national newspaper every week."], 1, "町のサイトや翌年の案内に使われる可能性があります。"],
          ["What will students learn at the meeting?", ["How to repair smartphones.", "How to get permission for close-up photos.", "How to cook festival food.", "How to print next year's guide."], 2, "人物を近くから撮る際の許可の取り方を学びます。"],
          ["What must students do by October 5?", ["Attend another festival.", "Upload their best ten pictures.", "Buy a professional camera.", "Photograph only performances."], 2, "良い写真10枚を期限までにアップロードします。"],
        ],
      },
      article: {
        title: "Rain Gardens",
        passage: [
          "During heavy rain, water runs across roofs, roads, and parking areas. If too much reaches drains at once, streets may flood. A rain garden is a shallow planted area designed to collect some of this water for a short time.",
          "Rain gardens are usually placed where water naturally flows. They contain soil and plants that can survive both wet and dry conditions. Water slowly enters the ground instead of immediately moving into street drains. The plants may also provide food and shelter for insects and birds.",
          "Building a rain garden requires planning. It must not be too close to a building, and the soil must allow water to pass through at a safe speed. If water remains for too long, mosquitoes may become a problem. Owners also need to remove trash and care for the plants.",
          "A single small garden cannot prevent every flood. However, many rain gardens across a neighborhood can reduce pressure on drains. They can also turn plain areas beside roads or schools into attractive green spaces.",
        ],
        questions: [
          ["What is a rain garden designed to do?", ["Hold some rainwater temporarily.", "Send all water directly to roads.", "Keep every plant completely dry.", "Replace the roof of a building."], 1, "雨水を一時的に受け止め、ゆっくり地面へしみ込ませます。"],
          ["What kind of plants are useful in rain gardens?", ["Plants that can handle wet and dry periods.", "Plants that grow only inside buildings.", "Plants that need no soil.", "Plants that keep insects away completely."], 1, "湿った時期と乾いた時期の両方に耐える植物です。"],
          ["Why must the garden be planned carefully?", ["Water movement, location, and maintenance affect safety.", "Every garden must be very deep.", "Mosquitoes improve the soil.", "It should always touch a building."], 1, "場所、排水速度、維持管理を考える必要があります。"],
          ["What can many rain gardens do together?", ["Reduce pressure on drains and add green space.", "Prevent all rain from falling.", "Remove the need for any road.", "Make neighborhoods use more concrete."], 1, "地域全体で排水負担を減らし、緑地も増やせます。"],
        ],
      },
    },
  ];

  const writingContent = [
    {
      emailSource: [
        "Hi!",
        "I joined an after-school cooking class last week. We cooked dishes from different countries in small groups. 【下線部】The teacher asked each group to choose a country for next month's class. Do you think learning about other countries through food is a good idea?",
        "Your friend,\nAlex",
      ],
      emailAnswer: "Yes, I think it is a good idea because food can teach us about culture in an enjoyable way. Which countries can your group choose? Also, will students find the recipes themselves or will the teacher give them recipes for the class?",
      essayQuestion: "Do you think schools should have more lessons outdoors?",
      essayAnswer: "Yes, I think schools should have more lessons outdoors. First, students can learn directly from nature instead of only reading about it. Second, being outside can make lessons more active and enjoyable. Teachers must choose safe places, but outdoor classes can help students remember what they learn in the future.",
    },
    {
      emailSource: [
        "Hi!",
        "Our school held a book exchange yesterday. I brought two novels and returned home with a science book and a travel story. 【下線部】The student council wants to make the event larger next year. Do you think more students will join it?",
        "Your friend,\nAlex",
      ],
      emailAnswer: "Yes, I think more students will join because they can find books without spending money. Where will the larger event be held? Also, will students be able to bring magazines or only books? I hope your school holds it again.",
      essayQuestion: "Do you think towns should build more public sports facilities?",
      essayAnswer: "Yes, I think towns should build more public sports facilities. First, people of all ages would have safe places to exercise. Second, sports centers can bring neighbors together through teams and classes. Building them costs money, but healthier residents and stronger communities would be valuable results for everyone in town.",
    },
    {
      emailSource: [
        "Hi!",
        "I volunteered at a science museum during my vacation. I showed children how to do simple experiments and answered their questions. 【下線部】The museum plans to create a new program for teenage volunteers. Do you think many students will be interested?",
        "Your friend,\nAlex",
      ],
      emailAnswer: "Yes, many students will probably be interested because they can learn science and communication skills. How many days will the new program last? Also, what kinds of experiments will teenage volunteers help with? I would like to hear more about it.",
      essayQuestion: "Do you think more people will use digital tickets in the future?",
      essayAnswer: "Yes, I think more people will use digital tickets. First, they are convenient because people can buy and store them on their phones. Second, companies can reduce paper use and printing costs. Some people may prefer paper tickets, so both choices should remain available during this change for a while.",
    },
    {
      emailSource: [
        "Hi!",
        "My class started a garden behind our school. We grow vegetables and flowers, and students take turns watering them. 【下線部】Our teacher wants other classes to use the garden, too. Do you think this will be useful?",
        "Your friend,\nAlex",
      ],
      emailAnswer: "Yes, it will be useful because students can study plants and food in a real place. Which classes will use the garden? Also, will they grow different kinds of plants? I think sharing the garden could make many lessons more interesting.",
      essayQuestion: "Do you think high school students should have part-time jobs?",
      essayAnswer: "Yes, I think high school students should have part-time jobs if the hours are limited. First, they can learn responsibility by working with other people. Second, they can understand the value of money. However, schoolwork should come first, so students need a careful schedule during the busy school year too.",
    },
    {
      emailSource: [
        "Hi!",
        "I took photographs at our town festival last weekend. The town office may use some of them on its website. 【下線部】Next year, the office wants more students to join the photography team. Do you think that is a good plan?",
        "Your friend,\nAlex",
      ],
      emailAnswer: "Yes, it is a good plan because students can show the festival from a young person's view. How will the town choose the photography team? Also, will students receive lessons before the festival? Joining the team could be a valuable experience.",
      essayQuestion: "Do you think students should bring reusable drink bottles to school?",
      essayAnswer: "Yes, I think students should bring reusable bottles. First, schools could reduce the number of plastic bottles thrown away each day. Second, students can refill their bottles and save money. Schools should provide clean water stations, but this small habit can help both families and the environment over many years.",
    },
  ];

  const makeReadingPages = (setIndex) => {
    const vocabulary = vocabularyBanks[setIndex].map(([text, choices, correct, explanation], index) => {
      const placed = positionChoice(
        choices[correct - 1],
        choices.filter((_, choiceIndex) => choiceIndex !== correct - 1),
        ((index * 3 + setIndex) % 4) + 1,
      );
      return makeQuestion(index + 1, "短文の語句空所補充", "vocabulary", `(${index + 1}) ${text}`, placed.choices, placed.correct, explanation);
    });
    const conversations = conversationBanks[setIndex].map(([text, choices, correct, explanation], index) => {
      const placed = positionChoice(
        choices[correct - 1],
        choices.filter((_, choiceIndex) => choiceIndex !== correct - 1),
        ((index + setIndex * 2) % 4) + 1,
      );
      return makeQuestion(index + 16, "会話文の空所補充", "conversation", `(${index + 16}) ${text}`, placed.choices, placed.correct, explanation);
    });
    const content = readingContent[setIndex];
    const gapQuestions = content.gap.questions.map((choices, index) => {
      const correct = content.gap.correct[index];
      const placed = positionChoice(
        choices[correct - 1],
        choices.filter((_, choiceIndex) => choiceIndex !== correct - 1),
        ((index + setIndex + 1) % 4) + 1,
      );
      return makeQuestion(
        index + 21,
        "長文の語句空所補充",
        "long-gap",
        `(${index + 21}) 空所に入る最も適切なものを選びなさい。`,
        placed.choices,
        placed.correct,
        content.gap.explanations[index],
      );
    });
    const emailQuestions = content.email.questions.map(([text, choices, correct, explanation], index) => {
      const placed = positionChoice(
        choices[correct - 1],
        choices.filter((_, choiceIndex) => choiceIndex !== correct - 1),
        ((index * 2 + setIndex) % 4) + 1,
      );
      return makeQuestion(index + 23, "長文の内容一致（Eメール）", "reading", `(${index + 23}) ${text}`, placed.choices, placed.correct, explanation);
    });
    const articleQuestions = content.article.questions.map(([text, choices, correct, explanation], index) => {
      const placed = positionChoice(
        choices[correct - 1],
        choices.filter((_, choiceIndex) => choiceIndex !== correct - 1),
        ((index * 3 + setIndex + 2) % 4) + 1,
      );
      return makeQuestion(index + 26, "長文の内容一致（説明文）", "reading", `(${index + 26}) ${text}`, placed.choices, placed.correct, explanation);
    });

    return [
      makePage("短文の語句空所補充", "choice", readingInstructions.vocabulary, vocabulary),
      makePage("会話文の空所補充", "choice", readingInstructions.conversation, conversations),
      makePage("長文の語句空所補充", "long", readingInstructions.gap, gapQuestions, content.gap.title, content.gap.passage),
      makePage("長文の内容一致 A", "long", readingInstructions.content, emailQuestions, content.email.title, content.email.passage),
      makePage("長文の内容一致 B", "long", readingInstructions.content, articleQuestions, content.article.title, content.article.passage),
    ];
  };

  const makeWritingTasks = (setIndex) => {
    const content = writingContent[setIndex];
    return [
      {
        id: 30,
        kind: "email",
        label: "Eメール返信",
        targetWords: "40語〜50語",
        lead: "外国人の知り合いAlexから届いたEメールに、質問への答えとその理由を書いて返信しなさい。",
        note: "【下線部】について、その特徴を問う具体的な質問を2つ書きなさい。",
        sourceTitle: "AlexからのEメール",
        source: content.emailSource,
        fixedBefore: "Hi, Alex!\nThank you for your e-mail.",
        fixedAfter: "Best wishes,",
        points: [],
        pointsRule: "",
        wordRule: "語数",
        rubric: ["Alexの質問に明確に答える", "答えの理由を示す", "下線部について具体的な質問を2つする", "40〜50語に収める"],
        modelAnswer: content.emailAnswer,
      },
      {
        id: 31,
        kind: "essay",
        label: "英作文",
        targetWords: "50語〜60語",
        lead: "以下のQUESTIONについて、あなたの意見とその理由を2つ英文で書きなさい。",
        note: "QUESTIONに対応していない解答は0点になることがあります。",
        sourceTitle: "QUESTION",
        source: [content.essayQuestion],
        fixedBefore: "",
        fixedAfter: "",
        points: [],
        pointsRule: "",
        wordRule: "語数",
        rubric: ["自分の意見を明確にする", "理由を2つ示す", "理由を分かりやすく説明する", "50〜60語に収める"],
        modelAnswer: content.essayAnswer,
      },
    ];
  };

  const positionChoice = (correctChoice, distractors, position) => {
    const choices = [...distractors];
    choices.splice(position - 1, 0, correctChoice);
    return { choices, correct: position };
  };

  const makeListeningQuestion = (id, part, script, questionText, answer, distractors, position) => {
    const { choices, correct } = positionChoice(answer, distractors, position);
    return {
      id,
      section: `第${part}部`,
      part: `Part ${part}`,
      instruction:
        part === 1
          ? "対話を聞き、その最後の文に対する応答として最も適切なものを選びなさい。"
          : part === 2
            ? "対話と質問を聞き、最も適切な答えを選びなさい。"
            : "英文と質問を聞き、最も適切な答えを選びなさい。",
      audioFile: "",
      script,
      questionText,
      choices,
      correct,
      explanation: `${correct}. ${answer}\n台本の内容に直接合う応答・選択肢です。`,
    };
  };

  const part1Variants = [
    [
      ["Would you like to visit the new aquarium with me on Saturday?", "That sounds great. I'd love to go.", ["No, the aquarium closed last year.", "Yes, I visited it on Monday."]],
      ["Would you like to join our picnic by the river on Sunday?", "Sure. What should I bring?", ["I brought it yesterday.", "The river is under the bridge."]],
      ["Would you like to watch the school baseball game after class?", "Yes. Let's meet by the gym.", ["The team practiced last month.", "No, I cannot play the piano."]],
      ["Would you like to come to my sister's piano concert tonight?", "I'd be happy to. What time does it start?", ["She practices every morning.", "The piano is very heavy."]],
      ["Would you like to try the new Italian restaurant this Friday?", "Yes, let's make a reservation.", ["I cooked dinner last night.", "Friday is the fifth day."]],
    ],
    [
      ["Could you help me carry these boxes to the art room?", "Of course. Which box should I take?", ["The art room was painted blue.", "I bought these shoes yesterday."]],
      ["Could you feed my cat while I am away tomorrow?", "Sure. What time does she eat?", ["My cat is three years old.", "I went away last summer."]],
      ["Could you check my English report before class?", "Certainly. Give it to me when you're ready.", ["The class begins in Room 4.", "I wrote a report last month."]],
      ["Could you show me how to use this ticket machine?", "No problem. First, choose your destination.", ["My ticket was very expensive.", "The train arrived late."]],
      ["Could you take a picture of our group?", "Sure. Please stand closer together.", ["This camera belongs to my father.", "Our group meets on Tuesdays."]],
    ],
    [
      ["Do you know when the next bus to Central Station arrives?", "It should be here in five minutes.", ["I visited the station yesterday.", "The bus is painted green."]],
      ["Do you know what time the library closes today?", "Yes, it closes at six.", ["I returned three books.", "The clock is above the door."]],
      ["Do you know where the sports meeting will be held?", "It will be in the city gym.", ["The meeting lasted two hours.", "I play sports every weekend."]],
      ["Do you know how much this museum ticket costs?", "It is eight dollars for students.", ["The museum has old paintings.", "I lost my student card."]],
      ["Do you know which train goes to Lake Town?", "Take the one on Platform 3.", ["Lake Town is very beautiful.", "The train was crowded yesterday."]],
    ],
    [
      ["I think I left my wallet at the café.", "Let's call the café and ask.", ["The coffee tastes wonderful.", "I bought a new wallet."]],
      ["I cannot find the key to my bicycle.", "Check the pocket of your jacket.", ["Your bicycle is very fast.", "The key opened the front door."]],
      ["My phone stopped working this morning.", "You should take it to the repair shop.", ["I called you last night.", "The shop sells phone cases."]],
      ["I missed the last train home.", "You can stay at my house tonight.", ["The train was clean today.", "I usually walk to school."]],
      ["I forgot to bring my lunch today.", "You can share some of mine.", ["Lunch begins at twelve.", "I washed the lunch box."]],
    ],
    [
      ["Would you like some more soup?", "Yes, please. It is delicious.", ["I made soup last Tuesday.", "No, the spoon is on the table."]],
      ["Shall I open the window for you?", "Yes, please. It is warm in here.", ["The window was cleaned.", "I opened the store at nine."]],
      ["Can I lend you an umbrella?", "Thanks. That would be helpful.", ["It rained two weeks ago.", "My umbrella is in the hall."]],
      ["Would you like me to carry your bag?", "Thank you, but I can manage it.", ["The bag was on sale.", "I carry books every day."]],
      ["Shall I save you a seat near the stage?", "Yes, that would be great.", ["The stage is made of wood.", "I sat there yesterday."]],
    ],
    [
      ["The tennis lesson has been moved from Monday to Tuesday.", "Thanks for telling me. I can come on Tuesday.", ["I bought a tennis racket.", "Monday was sunny."]],
      ["Our meeting will start at four instead of three.", "All right. I will arrive before four.", ["The meeting room has ten chairs.", "I started a new book."]],
      ["The outdoor concert will be held in the gym because of rain.", "I see. I'll go directly to the gym.", ["The rain stopped last night.", "I exercise twice a week."]],
      ["The museum tour is now on Sunday morning.", "That's fine. Sunday morning works for me.", ["The museum opened in 1980.", "I saw the guide yesterday."]],
      ["The school bus will leave ten minutes earlier tomorrow.", "OK. I'll get to the stop early.", ["The bus has forty seats.", "Tomorrow is my birthday."]],
    ],
    [
      ["May I borrow this dictionary until Friday?", "Yes, but please return it before class.", ["Friday is usually busy.", "The dictionary has 500 pages."]],
      ["Can I use the computer in this room?", "Yes, but you need to sign in first.", ["The room has a large window.", "I bought a computer last year."]],
      ["Is it OK if I take pictures in the garden?", "Yes, but do not step off the path.", ["The flowers bloom in spring.", "I took the bus here."]],
      ["May I leave my bicycle beside the entrance?", "No, please use the parking area.", ["The entrance is on the left.", "My bicycle is new."]],
      ["Can I bring my younger brother to the event?", "Of course. Children are welcome.", ["My brother likes soccer.", "The event ended early."]],
    ],
    [
      ["Your drawing of the old bridge is excellent.", "Thank you. I spent a long time on it.", ["The bridge is closed today.", "I do not have any paper."]],
      ["The cake you made tastes wonderful.", "Thanks. It was my grandmother's recipe.", ["The cake shop opens at ten.", "I ate breakfast already."]],
      ["You did a great job leading the meeting.", "Thank you. Everyone helped me prepare.", ["The meeting is in the hall.", "I lost my notebook."]],
      ["Your garden looks beautiful this year.", "Thanks. We planted many new flowers.", ["The garden gate is locked.", "I visited a park yesterday."]],
      ["That was an interesting science presentation.", "Thank you. I enjoyed doing the research.", ["Science class is on Monday.", "The projector is expensive."]],
    ],
    [
      ["I have had a headache since this morning.", "You should rest and drink some water.", ["I bought a hat yesterday.", "The water bottle is blue."]],
      ["My ankle hurts after soccer practice.", "Put some ice on it and take a rest.", ["Our team won the game.", "The ice melted quickly."]],
      ["I feel tired because I stayed up too late.", "Try going to bed earlier tonight.", ["The bed is near the window.", "I watched that show, too."]],
      ["My eyes hurt after using the computer all day.", "You should look away from the screen for a while.", ["The computer is very light.", "I need new glasses tomorrow."]],
      ["I have a cough, so I may miss the trip.", "I hope you feel better soon.", ["The trip costs twenty dollars.", "I bought cough medicine last year."]],
    ],
    [
      ["It has been a long time since we met.", "Yes! Let's have coffee and catch up.", ["The café closes on Mondays.", "I met your brother yesterday."]],
      ["Welcome back from your trip to Canada.", "Thanks. I had a wonderful time.", ["Canada is a large country.", "I will pack my bag tonight."]],
      ["Congratulations on winning the speech contest.", "Thank you. I practiced very hard.", ["The contest begins at noon.", "I listened to a speech."]],
      ["Happy birthday! I brought you a small gift.", "Thank you. That is very kind of you.", ["My birthday was on a calendar.", "The store sells gifts."]],
      ["Good luck in tomorrow's soccer match.", "Thanks. We will do our best.", ["The match was canceled yesterday.", "I bought new shoes."]],
    ],
  ];

  const part2Sets = [
    [
      ["M: Are you ready to leave for the science fair? W: Almost. I printed our poster, but the model is still in the classroom. M: I can get it while you call a taxi. W: Good idea.", "What will the man probably do?", "Get the model from the classroom.", ["Print another poster.", "Call the science teacher.", "Take the bus home."]],
      ["W: This sweater is too large. Can I exchange it? M: Yes, if you have the receipt. W: I do, and I would like the same color in a smaller size. M: Let me check for you.", "What does the woman want?", "A smaller sweater in the same color.", ["A refund without a receipt.", "A sweater in another color.", "A larger sweater."]],
      ["M: Excuse me. How can I get to the history museum? W: Walk two blocks and turn right at the bank. It is across from the park. M: Is it far? W: No, about ten minutes.", "Where is the museum?", "Across from the park.", ["Next to the station.", "Behind the bank.", "Inside the park."]],
      ["W: Why did you leave basketball practice early? M: My sister called because she had forgotten her house key. W: Did you take her your key? M: Yes, then I went back to practice.", "Why did the boy leave practice?", "To help his sister enter the house.", ["To buy a new basketball.", "To visit a sick friend.", "To find his phone."]],
      ["M: I reserved a table for six tonight. W: Two people cannot come. Did you tell the restaurant? M: Yes. They changed it to four.", "What did the man do?", "Changed the number of people in the reservation.", ["Canceled dinner completely.", "Invited two more people.", "Moved dinner to tomorrow."]],
      ["W: The weather report says it will rain during our picnic. M: Then let's use the community hall. W: Is it available? M: Yes, I called this morning.", "What will they probably do?", "Hold the picnic inside the community hall.", ["Cancel the picnic forever.", "Meet in the rain.", "Go to a restaurant."]],
      ["M: How was your first day at the animal shelter? W: Busy. I cleaned bowls and prepared food. M: Did you walk the dogs? W: Not yet. New volunteers do that after training.", "What did the woman do at the shelter?", "Cleaned bowls and prepared food.", ["Walked every dog.", "Trained new workers.", "Answered telephone calls."]],
      ["W: My tablet cannot open this file. M: It may need a newer program. Try the library computer. W: I will. I need the file for class tomorrow.", "What does the man suggest?", "Using a computer at the library.", ["Buying a new tablet.", "Missing tomorrow's class.", "Deleting the file."]],
      ["M: The airport bus usually leaves at eight, right? W: Yes, but today it leaves at seven forty because of roadwork. M: Then we need to hurry.", "What is different today?", "The airport bus leaves earlier.", ["The road to the airport is closed.", "The bus leaves from another city.", "The flight has been canceled."]],
      ["W: I thought the concert tickets were twenty dollars. M: They are, but students get five dollars off. W: Great. I have my student card.", "How much will the woman pay?", "Fifteen dollars.", ["Five dollars.", "Twenty dollars.", "Twenty-five dollars."]],
    ],
    [
      ["W: Did you bring the tent for our camping trip? M: Yes, but I forgot the small stove. W: We can borrow one from the outdoor club. M: I'll call them now.", "What will the man probably do?", "Ask the outdoor club about a stove.", ["Buy a larger tent.", "Cancel the camping trip.", "Cook at home."]],
      ["M: This camera takes unclear pictures. W: The lens looks dirty. Let me clean it. M: Oh, the pictures are much better now.", "What was wrong with the camera?", "Its lens was dirty.", ["Its battery was missing.", "It was too expensive.", "Its screen was broken."]],
      ["W: Is Room 205 on this floor? M: No, this is the first floor. Take those stairs, and it is the second door on the left. W: Thank you.", "Where should the woman go?", "Upstairs to the second floor.", ["Outside the building.", "To the first room on the right.", "Downstairs to the basement."]],
      ["M: Why are you selling cookies after school? W: The music club needs money for new instruments. M: I'll buy some, then. W: Thank you.", "Why is the girl selling cookies?", "To raise money for her club.", ["To practice cooking for class.", "To open a bakery.", "To pay for a school trip."]],
      ["W: I booked two seats for the afternoon movie. M: The train may be late. Can we change to the evening show? W: Yes, I will do it online.", "What will the woman do?", "Change the movie time online.", ["Cancel the train.", "Buy tickets at the station.", "Watch the afternoon show alone."]],
      ["M: We planned to play tennis, but the courts are wet. W: How about visiting the sports museum instead? M: Good idea. It is nearby.", "What will they probably do?", "Go to a sports museum.", ["Dry the tennis courts.", "Play tennis indoors.", "Return home immediately."]],
      ["W: Did you enjoy helping at the town festival? M: Yes. I gave maps to visitors and answered questions. W: Were you nervous? M: At first, but the other volunteers helped me.", "What did the man do?", "Helped visitors find information.", ["Performed music on stage.", "Cooked food for volunteers.", "Designed the festival map."]],
      ["M: The printer stopped before it finished my report. W: There may be no paper. M: You're right. I will add some.", "Why did the printer stop?", "It had run out of paper.", ["The report was too long.", "The computer was off.", "The ink was the wrong color."]],
      ["W: Our flight is at noon, but the airport train is not running. M: Let's take the bus that leaves at eight thirty. W: That will give us enough time.", "How will they go to the airport?", "By bus.", ["By train.", "By taxi.", "By bicycle."]],
      ["M: I ordered vegetable soup, but this has chicken in it. W: I'm sorry. I will bring the correct soup right away. M: Thank you.", "What will the woman do?", "Replace the soup.", ["Bring the man a menu.", "Add more chicken.", "Cancel the man's order."]],
    ],
    [
      ["M: We need one more photo for the history display. W: I found an old picture of the station. M: Great. Can you scan it? W: Yes, after lunch.", "What will the woman do?", "Scan an old photograph.", ["Visit the station.", "Take a picture at lunch.", "Remove the history display."]],
      ["W: These library headphones only work on one side. M: I'll get another pair for you. W: Thanks. I need them for the language lesson.", "What is the problem?", "One side of the headphones does not work.", ["The lesson has been canceled.", "The headphones are too loud.", "The woman forgot her library card."]],
      ["M: Excuse me, where is the swimming pool? W: Go through the glass doors and turn left after the café. M: Is it beside the gym? W: Yes.", "What is next to the swimming pool?", "The gym.", ["The station.", "The library.", "The parking area."]],
      ["W: Why are you wearing boots today? M: Our class is visiting a farm, and the ground is muddy. W: I hope it stops raining. M: Me too.", "Why is the boy wearing boots?", "He will visit a muddy farm.", ["He is going mountain climbing.", "His shoes are at school.", "He works in a shoe store."]],
      ["M: I reserved the music room from three to four. W: Our meeting will last until four thirty. M: Then I'll ask if we can use it longer.", "What will the man ask about?", "Keeping the room for more time.", ["Starting the meeting earlier.", "Changing to a sports room.", "Buying a musical instrument."]],
      ["W: The hiking path is closed because a tree fell. M: Is the lake path open? W: Yes, and it is safer today.", "What will they probably do?", "Use the path around the lake.", ["Climb over the fallen tree.", "Cut down another tree.", "Cancel all future hikes."]],
      ["M: What did you do at the children's center? W: I read stories to a small group. M: Did they enjoy them? W: Yes, especially the story about a flying cat.", "What did the woman do?", "Read stories to children.", ["Taught children to fly kites.", "Fed cats at a shelter.", "Painted the center."]],
      ["W: My computer says the password is wrong. M: Are you using your old password? It changed yesterday. W: Oh, I did not read the message from school.", "Why can the woman not sign in?", "She is using an old password.", ["The computer has no power.", "The school lost her account.", "She forgot her name."]],
      ["M: The bus to the mountain leaves at nine. W: The train arrives at nine ten. M: Then we should take the earlier train.", "What do they need to do?", "Arrive on an earlier train.", ["Take a later bus.", "Walk to the mountain.", "Change the bus route."]],
      ["W: These apples are on sale, but some are damaged. M: The bag over there costs more, but all the apples look fresh. W: I'll buy that one.", "Which apples will the woman buy?", "The more expensive fresh apples.", ["The damaged sale apples.", "No apples at all.", "Apples from another town."]],
    ],
    [
      ["W: The bicycle tour starts at ten, but my tire is flat. M: The shop across the street opens at nine. W: I'll ask them to repair it.", "What will the woman probably do?", "Take her bicycle to a repair shop.", ["Miss the tour on purpose.", "Buy a tour ticket.", "Walk across town."]],
      ["M: I cannot hear the movie very well. W: We have special headphones at the front desk. M: That would help. I'll get a pair.", "What will the man get?", "A pair of headphones.", ["A movie ticket.", "A hearing test.", "A new seat at home."]],
      ["W: This package was delivered to the wrong apartment. M: The correct number is 304, not 340. W: I'll take it upstairs.", "What was wrong?", "The package went to the wrong apartment.", ["The package was empty.", "The address had no street.", "The man ordered two packages."]],
      ["M: Why are you practicing French during lunch? W: I will meet exchange students next week. M: Are they from France? W: Yes, and I want to welcome them.", "Why is the girl practicing French?", "To speak with visiting students.", ["To order lunch.", "To pass a math test.", "To teach her brother."]],
      ["W: I reserved a place on Saturday's zoo tour. M: It may rain all day. W: The tour is held even in rain, so I'll bring a coat.", "What will the woman do?", "Go on the tour with rain clothing.", ["Cancel the zoo tour.", "Move the tour indoors.", "Buy a coat for the man."]],
      ["M: The train to North City is delayed forty minutes. W: My meeting starts in an hour. M: The express bus leaves now and takes thirty minutes.", "What should the woman do?", "Take the express bus.", ["Wait for the delayed train.", "Cancel the meeting.", "Walk to North City."]],
      ["W: How was your day at the animal shelter? M: I wanted to walk dogs, but it rained. I cleaned their rooms instead. W: That was useful work.", "What did the man do?", "Cleaned rooms for animals.", ["Walked dogs in the rain.", "Built a new shelter.", "Stayed home all day."]],
      ["M: Our group report is due tomorrow, but Ken is absent. W: He sent his notes by e-mail. M: Great. I can add them tonight.", "How did Ken help the group?", "He sent his notes electronically.", ["He finished the whole report.", "He came to school late.", "He changed the due date."]],
      ["W: I thought this train stopped at West Park. M: It does on weekdays, but not on Sundays. W: Then I'll get off at Central and take a bus.", "What will the woman do?", "Change to a bus at Central.", ["Stay on the train to West Park.", "Wait until Monday.", "Walk from her home."]],
      ["M: This farmers' market closes at noon. W: Then we should buy vegetables first and look at crafts later. M: Good plan.", "What will they do first?", "Buy vegetables.", ["Look at crafts.", "Eat lunch.", "Leave the market."]],
    ],
    [
      ["M: Did you bring the music for today's practice? W: I left it at home, but I have a copy on my phone. M: We can print it in the library.", "What will they probably do?", "Print music from the woman's phone.", ["Practice without music.", "Go to the woman's home.", "Buy a new phone."]],
      ["W: This medicine bottle is difficult to open. M: Push the cap down while you turn it. W: Oh, now it opens.", "What helped the woman?", "Following the man's instructions.", ["Using a different bottle.", "Going to a hospital.", "Breaking the cap."]],
      ["M: Is the craft room near the entrance? W: It is on the third floor beside the elevator. M: Thanks. I have a class there.", "Where is the craft room?", "On the third floor.", ["Near the entrance.", "In the basement.", "Across the street."]],
      ["W: Why are you studying the city map? M: My cousin is visiting, and I want to show him interesting places. W: The river walk is beautiful.", "Why is the man looking at the map?", "To plan a tour for his cousin.", ["To find a new house.", "To study for a geography test.", "To repair the river walk."]],
      ["M: I booked a room with two beds, but this room has only one. W: I'm sorry. I will move you to the correct room.", "What will the woman do?", "Give the man another room.", ["Add a chair to this room.", "Cancel the reservation.", "Ask him to share one bed."]],
      ["W: The beach cleanup starts at eight, but strong winds are expected. M: The organizers moved it to next Saturday. W: Then I can still join.", "What happened to the cleanup?", "It was moved to another day.", ["It will start earlier.", "It was moved indoors.", "It has already finished."]],
      ["M: What did you do at the senior center? W: I showed people how to send photos with their phones. M: Were the instructions difficult? W: No, we practiced slowly.", "How did the woman help?", "She taught people to use a phone feature.", ["She took professional photos.", "She repaired the building.", "She organized a sports game."]],
      ["W: The school website does not show my club's new schedule. M: Send the information to Mr. Park. He updates the site. W: I will e-mail him now.", "What will the woman do?", "Contact the person who updates the website.", ["Create a new school website.", "Cancel the club schedule.", "Print the entire website."]],
      ["M: Our train arrives at the airport at eleven thirty. W: Check-in closes at eleven fifteen. M: Then we need the earlier train.", "Why do they need an earlier train?", "Their current train arrives after check-in closes.", ["The airport will close all day.", "Their flight leaves tomorrow.", "The earlier train is cheaper."]],
      ["W: I ordered a blue backpack, but you sent a green one. M: I apologize. We can exchange it without a fee. W: Please do that.", "What does the woman want?", "The backpack in the color she ordered.", ["A larger green backpack.", "Her delivery fee returned.", "A different kind of bag."]],
    ],
  ];

  const part3Sets = [
    [
      ["Attention, visitors. The east entrance of the city zoo is closed today because workers are repairing the gate. Please use the main entrance beside the bus stop. The elephant feeding will begin as usual at eleven.", "What should visitors do?", "Use the main entrance.", ["Wait until tomorrow.", "Enter beside the elephants.", "Repair the east gate."]],
      ["Mika wanted to read more books, but she often forgot to visit the library. She started borrowing electronic books on her tablet. Now she reads on the train each morning and finishes about two books a month.", "How did Mika begin reading more?", "She borrowed electronic books.", ["She stopped taking the train.", "She bought a larger library.", "She joined a sports club."]],
      ["Sea otters often float on their backs while eating. They may use a stone to break open hard shells. Some otters keep a favorite stone in a loose area of skin under one arm and use it many times.", "What is special about some sea otters?", "They keep and reuse a stone.", ["They never eat shellfish.", "They live only on land.", "They carry stones in their mouths all day."]],
      ["The Green Street Market now offers a delivery service for customers over seventy. Orders can be placed by phone before noon and are delivered the same afternoon. The service costs two dollars, but it is free on orders over thirty dollars.", "Who can use the special delivery service?", "Customers over seventy.", ["Only market workers.", "Anyone under thirty.", "Children with bicycles."]],
      ["The school music festival begins at one on Saturday. Students performing in the first program must arrive by eleven thirty. Families may enter at twelve forty-five, and tickets are not required.", "When may families enter?", "At twelve forty-five.", ["At eleven thirty.", "At one thirty.", "After the festival ends."]],
      ["The first paper clips were not all shaped like the ones used today. Many designs were created, but a simple double-loop shape became popular because it held paper firmly without needing to cut or damage it.", "Why did the double-loop paper clip become popular?", "It held paper without damaging it.", ["It was made only of paper.", "It cut documents quickly.", "It was the largest design."]],
      ["Students at West Hill School collect rainwater from the gym roof. The water is stored in two large tanks and used in the school garden. The project lowers water use and helps science classes study rainfall.", "How is the collected rainwater used?", "It waters the school garden.", ["It fills the swimming pool.", "It cleans the gym roof.", "It is sold to families."]],
      ["A doctor recommends taking a short walk after studying for a long time. Moving the body can help people feel more awake. However, the walk should not replace enough sleep or regular exercise.", "What does the doctor recommend?", "Taking short walks during long study periods.", ["Studying all night.", "Avoiding regular exercise.", "Sleeping while walking."]],
      ["Noah planned to visit a crowded beach, but his friends wanted a quieter trip. He found a lake where they could rent a small boat and walk through a forest. They decided to go there instead.", "Where will Noah and his friends go?", "To a lake.", ["To a crowded beach.", "To a city museum.", "To a shopping center."]],
      ["The town community center will offer free bicycle checks this Sunday. Mechanics will examine brakes and tires, but they will not replace expensive parts. Owners should arrive before three because the event ends at four.", "What will mechanics do?", "Check bicycle brakes and tires.", ["Give away new bicycles.", "Replace every expensive part.", "Keep bicycles for a week."]],
    ],
    [
      ["Passengers for Green City should note that the 9:10 train will leave from Platform 6 instead of Platform 4. The departure time has not changed. Staff members will be near the stairs to help.", "What has changed?", "The departure platform.", ["The destination.", "The ticket price.", "The departure time."]],
      ["Leo used to buy lunch every day. He wanted to save money, so he began making sandwiches at home three mornings a week. After one month, he had saved enough to buy a ticket for a basketball game.", "Why did Leo make sandwiches?", "To save money.", ["To open a restaurant.", "To help his basketball team.", "To avoid eating breakfast."]],
      ["Some desert plants open their flowers at night instead of during the day. Nighttime is cooler, so the flowers lose less water. Moths and bats may carry pollen between these flowers.", "Why do some desert flowers open at night?", "The cooler air helps them save water.", ["They need bright sunlight.", "No animals visit them.", "The desert is wetter at night."]],
      ["The North Library has started a homework help desk on Tuesdays and Thursdays. High school volunteers answer questions from younger students between four and six. Students do not need appointments, but they should bring their textbooks.", "What should students bring?", "Their textbooks.", ["Money for volunteers.", "A library computer.", "An appointment card."]],
      ["The city art contest is open to students aged twelve to eighteen. Pictures must show a place in the city and be submitted by May 20. Winners will have their work displayed at City Hall.", "What must the pictures show?", "A place in the city.", ["A famous person.", "A foreign country.", "The inside of a school."]],
      ["Before modern refrigerators, people used blocks of ice to keep food cold. In winter, workers cut ice from frozen lakes and stored it in special buildings covered with materials that slowed melting.", "How did people keep stored ice from melting quickly?", "They used specially covered buildings.", ["They put it in ovens.", "They carried it every day.", "They mixed it with food."]],
      ["A neighborhood group planted flowers along a road where drivers often went too fast. The flowers did not block the road, but they made the street look narrower. Drivers began slowing down, and residents felt safer.", "What happened after flowers were planted?", "Drivers reduced their speed.", ["The road became wider.", "Residents stopped walking.", "The flowers blocked all cars."]],
      ["Experts say students should adjust backpack straps so the bag sits close to the back. A bag hanging too low can be uncomfortable. Students should also carry only the books they need that day.", "What do experts advise?", "Adjusting the bag and limiting its contents.", ["Carrying every textbook.", "Wearing the bag very low.", "Using only one strap."]],
      ["Sara first planned to fly to Hill Island, but the flight times were inconvenient. She discovered that an evening ferry was cheaper and arrived early the next morning. She chose the ferry.", "How will Sara travel?", "By ferry.", ["By airplane.", "By train.", "By bicycle."]],
      ["The River Sports Center will close its pool from Monday through Wednesday for cleaning. The gym and tennis courts will remain open. Swimming lessons will continue on Thursday at their usual times.", "Which facility will be closed?", "The swimming pool.", ["The gym.", "The tennis courts.", "The entire sports center."]],
    ],
    [
      ["Shoppers at Bell Department Store can meet a local children's author at two today. The event has moved from the book section to the fifth-floor hall because more people than expected registered.", "Why was the event moved?", "More people registered than expected.", ["The author canceled.", "The book section closed forever.", "The hall was too small."]],
      ["Aya wanted to improve her photographs of birds. She used to walk close to them, but they flew away. A nature guide taught her to wait quietly near a tree. Now she gets clearer pictures without disturbing the birds.", "What did Aya learn to do?", "Wait quietly for birds.", ["Feed birds by hand.", "Use a louder camera.", "Run toward the birds."]],
      ["Honeybees show other bees where to find food by moving in a special pattern called a dance. The direction and length of the movement provide information about where flowers are located.", "What can a bee's dance communicate?", "The location of food.", ["The age of the hive.", "The color of the sky.", "The number of people nearby."]],
      ["Students can now reserve school study rooms through an online system. Reservations may be made up to one week ahead. If students are more than fifteen minutes late, the room becomes available to others.", "When may others use a reserved room?", "When the group is over fifteen minutes late.", ["Whenever the lights are on.", "One week before the reservation.", "Only after the school year."]],
      ["The Spring Food Fair will be held in Central Park this Sunday. Visitors can try dishes from twelve countries. Cooking demonstrations are free, but seats must be reserved online by Friday.", "What requires a reservation?", "Seats for cooking demonstrations.", ["Entrance to the park.", "All food at the fair.", "Walking through the event."]],
      ["The zipper was developed from several earlier fasteners. Early versions were difficult to use, but improvements to the small metal parts made zippers smoother and stronger. They later became common on clothing and bags.", "Why did zippers become more common?", "Their design became easier and stronger.", ["They were made without metal.", "They could only be used on shoes.", "Earlier fasteners disappeared immediately."]],
      ["A school reduced food waste by asking students to choose small or regular lunch portions. Students may take more food later if they are still hungry. Less food is now left on trays.", "How did the school reduce food waste?", "It offered different portion sizes.", ["It stopped serving lunch.", "It gave every student more food.", "It removed all trays."]],
      ["People who begin running should increase distance slowly. Adding too much too soon can cause pain or injury. Rest days are also important because the body needs time to recover.", "What advice is given to new runners?", "Increase distance gradually and rest.", ["Run the longest distance immediately.", "Never take a day off.", "Ignore pain after running."]],
      ["Ken and his family planned to camp in the mountains, but the campground was full. They found a farm that allowed visitors to stay in small cabins and help feed animals. They chose the farm.", "Where will Ken's family stay?", "At a farm.", ["At the full campground.", "In a city hotel.", "On a beach."]],
      ["The Westside Museum offers a quiet hour on the first Saturday morning of each month. During that time, sounds and lights are reduced for visitors who prefer a calmer environment. Regular hours begin at ten.", "What is special about the quiet hour?", "The museum reduces sound and light.", ["Every visitor must speak loudly.", "Tickets cost more.", "All exhibits are closed."]],
    ],
    [
      ["The 4 p.m. performance at Lake Theater will begin thirty minutes late because one actor's train was delayed. Audience members may wait in the café, where drinks will be half price.", "When will the performance begin?", "At four thirty.", ["At three thirty.", "At four.", "At five thirty."]],
      ["Maria wanted to learn to swim but felt nervous in deep water. She joined a beginner class that started in a shallow pool. After several lessons, she could swim across the larger pool confidently.", "What helped Maria?", "A class that began in shallow water.", ["Swimming alone in the sea.", "Avoiding the pool.", "Buying a larger pool."]],
      ["Owls can turn their heads much farther than humans can. Their eyes do not move easily inside their heads, so turning the head helps them look in different directions while hunting.", "Why do owls turn their heads so far?", "Their eyes do not move easily.", ["Their ears are too small.", "They cannot fly at night.", "Their necks have no bones."]],
      ["The Quick Box service lets customers pick up online orders from lockers at train stations. A code is sent to the customer's phone when the package arrives. Packages must be collected within three days.", "What do customers need to open a locker?", "A code sent to their phone.", ["A train ticket.", "A store employee.", "A paper map."]],
      ["The school's international day is next Friday. Each class will introduce a country through music, games, or food. Students bringing food must give a list of ingredients to their teacher by Monday.", "What must some students do by Monday?", "Submit a list of food ingredients.", ["Perform all the music.", "Choose another school.", "Buy tickets for Friday."]],
      ["The modern pencil developed after a large amount of graphite was found in England. People first wrapped pieces in string or sheepskin. Later, wood was used to make the pencils easier and cleaner to hold.", "Why was wood added to pencils?", "To make graphite easier to hold.", ["To make graphite softer.", "To replace writing completely.", "To make pencils heavier."]],
      ["Residents near a small lake built floating platforms for birds. The natural shore had become too crowded with buildings, so the platforms provided safer places for birds to rest and make nests.", "Why were floating platforms built?", "To give birds safer resting and nesting places.", ["To help people build houses.", "To make the lake smaller.", "To stop birds from landing."]],
      ["After working at a desk, people should gently move their shoulders and neck. Short stretching breaks can reduce stiffness, but movements should be slow. Sudden strong movements may cause pain.", "How should people stretch?", "Slowly and gently.", ["As strongly as possible.", "Only once a month.", "Without moving the shoulders."]],
      ["Tom wanted to visit an island, but the morning boat was sold out. He found an afternoon boat, but it returned too late. Instead, he chose a coastal town reachable by train.", "Where will Tom go?", "To a coastal town.", ["To the island.", "To a mountain village.", "To the airport."]],
      ["The city animal shelter needs old towels for washing and drying animals. Towels should be clean, but small marks are acceptable. Donations can be left at the front desk until the end of the month.", "What item does the shelter want?", "Clean used towels.", ["New animal cages.", "Food with small marks.", "Office desks."]],
    ],
    [
      ["Visitors to the summer flower show should enter through the south gate. The north gate is being used only by delivery trucks. Free maps are available beside the ticket desk.", "Which gate should visitors use?", "The south gate.", ["The north gate.", "The delivery gate.", "The garden gate."]],
      ["Riku often forgot new English words. He began writing each word in a short sentence about his own life. The personal examples were easier to remember, and his vocabulary test scores improved.", "How did Riku remember words better?", "He used them in personal sentences.", ["He stopped taking tests.", "He studied only word numbers.", "He wrote them on other students' papers."]],
      ["Penguins have feathers, although the feathers look different from those of flying birds. The short feathers overlap closely and help keep cold water away from the penguin's skin.", "How do penguin feathers help?", "They protect the skin from cold water.", ["They help penguins fly.", "They change water into ice.", "They make penguins invisible."]],
      ["The Smile Dental Clinic now sends appointment reminders by text message. Patients who want to change an appointment can reply to the message or call the clinic. Cancellations should be made at least one day ahead.", "How can patients change an appointment?", "By replying or calling.", ["Only by visiting in person.", "By sending a letter.", "By waiting until the next day."]],
      ["A student craft market will be held in the school gym on November 12. Students may sell handmade items, but they must register by November 1. Part of the money will support the school library.", "What must sellers do?", "Register before the market.", ["Give all money to the gym.", "Sell only library books.", "Hold the event in October."]],
      ["Early alarm clocks sometimes used a small candle. As the candle burned down, a nail placed in the wax fell onto a metal plate and made a sound. The method worked, but it had to be prepared carefully.", "How did the candle alarm make a sound?", "A nail fell onto metal.", ["The candle spoke.", "The wax rang a bell.", "A clock opened a window."]],
      ["A shopping center placed a box near each trash can for unwanted receipts. The paper is collected separately and recycled. Customers can also choose digital receipts at some stores.", "What happens to unwanted paper receipts?", "They are collected for recycling.", ["They are returned to customers.", "They are used as money.", "They are left on the floor."]],
      ["Sleep experts advise keeping phones away from the bed at night. Messages can interrupt sleep, and bright screens may make it harder to relax. A simple alarm clock can be used instead.", "What do sleep experts suggest?", "Keeping phones away from the bed.", ["Reading messages all night.", "Using brighter screens.", "Removing every clock."]],
      ["Aki planned a long bicycle trip, but strong wind was expected. She chose a shorter route through a forest and stopped at a small nature center along the way.", "Why did Aki change her route?", "Because of strong wind.", ["Because her bicycle was sold.", "Because the forest was closed.", "Because she missed a train."]],
      ["The East Hall will offer free computer lessons for older residents. The first class covers video calls, and the second explains online shopping safety. Students must bring their own tablet or laptop.", "What should students bring?", "A tablet or laptop.", ["A shopping bag.", "A video camera.", "Money for the lesson."]],
    ],
  ];

  const makeListeningQuestions = (setIndex) => {
    const positionPattern = [2, 1, 3, 2, 1, 3, 2, 1, 3, 2];
    const part1 = part1Variants.map((family, index) => {
      const [lastLine, answer, distractors] = family[setIndex];
      const leadIns = [
        "A: Hi. I have a question.\nB: Sure. What is it?\nA: ",
        "A: Excuse me.\nB: Yes, how can I help?\nA: ",
        "A: Can I ask you something?\nB: Of course.\nA: ",
      ];
      return makeListeningQuestion(
        index + 1,
        1,
        `${leadIns[index % leadIns.length]}${lastLine}`,
        "",
        answer,
        distractors,
        positionPattern[(index + setIndex) % positionPattern.length] > 3 ? 3 : positionPattern[(index + setIndex) % positionPattern.length],
      );
    });
    const part2 = part2Sets[setIndex].map(([script, question, answer, distractors], index) =>
      makeListeningQuestion(index + 11, 2, script, question, answer, distractors, ((index + setIndex * 2) % 4) + 1),
    );
    const part3 = part3Sets[setIndex].map(([script, question, answer, distractors], index) =>
      makeListeningQuestion(index + 21, 3, script, question, answer, distractors, ((index * 3 + setIndex) % 4) + 1),
    );
    return [...part1, ...part2, ...part3];
  };

  const speakingContent = [
    {
      cardTitle: "Community Notice Boards",
      cardText:
        "Some towns have put electronic notice boards in public places. The boards show information about local events, lost items, and emergency warnings. Residents can read new messages quickly, and town workers can update the information without printing posters. In this way, the boards help towns share useful news with many people.",
      no1: "According to the passage, how do electronic notice boards help towns share useful news?",
      pictureA:
        "Picture A: At a park event, a man is picking up litter, a woman is holding a large trash bag, a boy is sweeping the path, a girl is carrying bottles to a recycling box, and a worker is planting flowers.",
      pictureB:
        "Picture B: A girl wants to use a drinking fountain after running, but no water comes out because the fountain is broken.",
      no3: "Now, look at the girl in Picture B. Please describe the situation.",
      no4: "Do you think towns should use more electronic notice boards?",
      no5: "Do you often check local news or event information?",
    },
    {
      cardTitle: "Reusable Lunch Boxes",
      cardText:
        "Many people bring lunch to school or work in reusable boxes. These boxes can be washed and used many times, so they may reduce waste from paper and plastic packages. Some boxes have separate spaces for different foods. By using them, people can carry a balanced meal without producing much trash.",
      no1: "According to the passage, how can reusable lunch boxes reduce waste?",
      pictureA:
        "Picture A: In a school kitchen, a boy is washing vegetables, a girl is cutting bread, a teacher is stirring soup, another student is setting plates on a table, and a student is putting fruit into lunch boxes.",
      pictureB:
        "Picture B: A boy has opened his lunch bag at school, but he cannot eat because he left his lunch box at home.",
      no3: "Now, look at the boy in Picture B. Please describe the situation.",
      no4: "Do you think more people will bring homemade lunches in the future?",
      no5: "Do you like trying foods that you have never eaten before?",
    },
    {
      cardTitle: "Weekend Language Clubs",
      cardText:
        "Some community centers hold weekend language clubs. Local residents and people from other countries meet there to practice conversation through games and simple activities. Participants can learn natural expressions and also make new friends. By speaking in a relaxed place, they may become more confident about using another language.",
      no1: "According to the passage, how may weekend language clubs make participants more confident?",
      pictureA:
        "Picture A: At a language-club event, two students are playing a word game, a woman is writing on a whiteboard, a man is showing a map, a girl is asking a question, and another student is serving drinks.",
      pictureB:
        "Picture B: A boy wants to join a conversation group, but all the chairs are occupied and there is nowhere for him to sit.",
      no3: "Now, look at the boy in Picture B. Please describe the situation.",
      no4: "Do you think students should have more chances to speak with people from other countries?",
      no5: "Do you prefer studying alone or studying with other people?",
    },
    {
      cardTitle: "Pocket Parks",
      cardText:
        "In crowded cities, small empty spaces are sometimes changed into pocket parks. These tiny parks may have a few trees, benches, and flowers. Workers and shoppers can rest there for a short time. Pocket parks also add plants to areas with many buildings, making streets more pleasant for local people.",
      no1: "According to the passage, how do pocket parks make city streets more pleasant?",
      pictureA:
        "Picture A: In a small city park, an older man is reading on a bench, a woman is watering flowers, two children are watching a butterfly, a worker is trimming a tree, and a cyclist is filling a water bottle.",
      pictureB:
        "Picture B: A woman wants to sit on a park bench, but she cannot because several wet paint signs have been placed around it.",
      no3: "Now, look at the woman in Picture B. Please describe the situation.",
      no4: "Do you think cities should create more small parks?",
      no5: "Do you usually spend time outside on weekends?",
    },
    {
      cardTitle: "Mobile Libraries",
      cardText:
        "Mobile libraries carry books in buses or vans and visit areas far from regular libraries. People can borrow and return books when the vehicle comes to their neighborhood. Some mobile libraries also provide Internet access and reading events. Through these services, they give more people opportunities to find information and enjoy books.",
      no1: "According to the passage, how do mobile libraries give more people opportunities to enjoy books?",
      pictureA:
        "Picture A: Beside a library van, a driver is unloading book boxes, a librarian is helping a child choose a book, a woman is returning novels, a boy is using a tablet, and two children are listening to a story.",
      pictureB:
        "Picture B: An older man has come to return a book, but the mobile library has already left the bus stop.",
      no3: "Now, look at the man in Picture B. Please describe the situation.",
      no4: "Do you think mobile libraries will remain useful in the future?",
      no5: "Do you often borrow things instead of buying them?",
    },
  ];

  const makeSpeakingSteps = (setIndex) => {
    const content = speakingContent[setIndex];
    return [
      {
        label: "Warm-up",
        seconds: 10,
        prompt: "面接官の質問を聞いて答えてください。",
        visual: "面接官",
        recording: true,
        questionText: "How did you come here today?",
      },
      {
        label: "Silent Reading",
        seconds: 20,
        prompt: "問題カードの英文を20秒間で黙読してください。",
        visual: "カード",
        recording: false,
        cardTitle: content.cardTitle,
        cardText: content.cardText,
      },
      {
        label: "Read Aloud",
        seconds: 45,
        prompt: "タイトルから英文を声に出して読んでください。",
        visual: "カード",
        recording: true,
        cardTitle: content.cardTitle,
        cardText: content.cardText,
      },
      {
        label: "No.1",
        seconds: 30,
        prompt: "音読したパッセージの内容について答えてください。",
        visual: "カード",
        recording: true,
        cardTitle: content.cardTitle,
        cardText: content.cardText,
        questionText: content.no1,
      },
      {
        label: "No.2",
        seconds: 30,
        prompt: "Picture Aにいる人物の行動を、できるだけ多く説明してください。",
        visual: "カード",
        recording: true,
        pictureText: content.pictureA,
        questionText: "Now, look at the people in Picture A. Please tell me as much as you can about what they are doing.",
      },
      {
        label: "No.3",
        seconds: 30,
        prompt: "Picture Bの人物の状況を説明してください。",
        visual: "カード",
        recording: true,
        pictureText: content.pictureB,
        questionText: content.no3,
      },
      {
        label: "No.4",
        seconds: 30,
        prompt: "問題カードのトピックに関連した質問に、自分の意見と理由で答えてください。",
        visual: "面接官",
        recording: true,
        questionText: content.no4,
      },
      {
        label: "No.5",
        seconds: 30,
        prompt: "日常生活に関する質問に、自分の経験や理由を加えて答えてください。",
        visual: "面接官",
        recording: true,
        questionText: content.no5,
      },
    ];
  };

  window.scbtPre2ReadingPages = Array.from({ length: 5 }, (_, index) => makeReadingPages(index));
  window.scbtPre2WritingTasks = Array.from({ length: 5 }, (_, index) => makeWritingTasks(index));
  window.scbtPre2ListeningQuestions = Array.from({ length: 5 }, (_, index) => makeListeningQuestions(index));
  window.scbtPre2SpeakingSteps = Array.from({ length: 5 }, (_, index) => makeSpeakingSteps(index));
  window.scbtPre2Sets = Array.from({ length: 5 }, (_, index) => ({
    grade: "pre2",
    key: `set-${String(index + 1).padStart(2, "0")}`,
    setId: `pre2-set-${String(index + 1).padStart(2, "0")}`,
    label: `第${index + 1}回`,
    description: "リーディング29問／Eメール・英作文／リスニング30問／スピーキング収録",
    status: "ready",
    enabled: true,
    readingPages: window.scbtPre2ReadingPages[index],
    writingTasks: window.scbtPre2WritingTasks[index],
    listeningQuestions: window.scbtPre2ListeningQuestions[index],
    speakingSteps: window.scbtPre2SpeakingSteps[index],
  }));
})();
