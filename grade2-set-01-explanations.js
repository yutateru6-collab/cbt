(() => {
  const set01 = (window.scbtGrade2VocabSets || []).find((set) => set?.key === "set-01");
  if (!set01) return;

  const readingStudyPoints = {
    1: "grant は返済を前提としない「助成金・補助金」。permit（許可証）や receipt（領収書）と区別する。",
    2: "inspect は「異常がないか詳しく調べる」。空港・工場・建物などの点検場面でよく使われる。",
    3: "current は「現在の・最新の」。changed that morning と old website が強い手掛かりになる。",
    4: "firmly は、危険を止めるために「きっぱりと」話す様子を表す。声の大きさではなく態度を示す副詞。",
    5: "evidence は判断を支える「証拠」。without enough evidence to say ... のまとまりで覚える。",
    6: "reserve seats は「席を予約・確保する」。before they sell out が reserve を選ぶ決め手。",
    7: "temporary は「一時的な」。for two weeks のような期間限定の表現と結び付きやすい。",
    8: "top priority は「最優先事項」。先に行われた行動が何かを見て、優先順位を判断する。",
    9: "persuade + 人 + by doing で「～することで人を説得する」。考えを変えてもらう場面で使う。",
    10: "deliberately は「故意に」。not by the wind と someone threw a stone が偶然ではないことを示す。",
    11: "keep track of は、変化する数字や記録を継続して「把握する」。支出・時間・進捗と相性がよい。",
    12: "carry out a survey は「調査を実施する」。survey、experiment、plan などとよく組み合わされる。",
    13: "call for は「～を必要とする」。注文増加という状況から extra workers が必要になる流れを取る。",
    14: "draw up は計画・契約書・予算案などを「作成する」。まだ書かれていない文書を作る場面。",
    15: "as long as は許可に付く条件を表す。「～するという条件なら」と置き換えて確認する。",
    16: "no longer は過去から現在への変化を表し、「以前はそうだったが、今はもう違う」という意味。",
    17: "within walking distance of ... は「～から徒歩圏内に」。前置詞まで含めた固定表現で覚える。",
    18: "空所の直後の rather than merely decorative features に注目し、「装飾ではなく何だったか」を要約する。",
    19: "Instead は「水を増やしたのではなく、順番を決めた」と目的を修正する合図。道具の機能を前後から捉える。",
    20: "In this sense は、直前までの具体例を受けて筆者のまとめを述べる表現。逆接や時を表す表現と区別する。",
    21: "Even so は「風には利点がある。それでも他の条件も必要だ」という譲歩・逆接の流れを作る。",
    22: "海岸線沿いに進む行動と、飛行能力が未発達という条件を結び、長い外洋横断を避けると推論する。",
    23: "limited time and money が、保護の優先順位を決める必要性を示す。調査方法ではなく最終目的を選ぶ。",
    24: "メールの目的は冒頭の reservation is now complete と、本文全体の最終案内を組み合わせて判断する。",
    25: "以前の案内と今回の変更を区別する。in an earlier notice は古い情報を使った誤答への注意信号。",
    26: "reply by Thursday afternoon の後に続く二つの依頼、参加確認と notepad の希望を両方拾う。",
    27: "continue an older practice は、昔の淡色素材と現代の反射素材を結ぶ本文の中心的な言い換え。",
    28: "列挙された roof shape、sunlight、space use と、近隣住民へのまぶしさを一つにまとめた選択肢を選ぶ。",
    29: "A turning point came when ... が変化を直接示す。brightest only から地域条件に合う比較へ移った。",
    30: "第4段落の二つの具体情報、導入先の広がりと温度地図の利用を両方含む選択肢を探す。",
    31: "true 問題では一箇所だけでなく本文全体を要約する。古い発想＋現代素材＋地域条件という三点を確認する。",
  };

  const readingExplanationOverrides = {
    1: `【正解の根拠】市に public support を申請し、部活動が money を受け取った場面です。grant は公的機関などが特定の活動へ出す「助成金・補助金」なので、正答は2です。
【誤答分析】permit は「許可証」、receipt は支払い後の「領収書」、survey は意見や実態を調べる「調査」で、受け取ったお金を表せません。`,
  };

  for (const page of set01.readingPages || []) {
    for (const question of page.questions || []) {
      if (readingExplanationOverrides[question.id]) question.explanation = readingExplanationOverrides[question.id];
      question.explanationTier = "premium";
      question.studyPoint = readingStudyPoints[question.id] || "";
    }
  }

  const listeningExplanations = {
    1: `【聞き取りの決め手】女子の Could you upload it from the media room? が依頼の中心です。したがって正答は3です。
【内容整理】録音は編集済みですが、メールでは大きすぎるため共有フォルダーへアップロードする必要があります。男子はその作業を引き受けます。
【誤答分析】1は interview section doesn't need any more changes と反対。2はファイルが大きくメール送信できません。4の最終タイトルは女子が男子へ送ります。
【学習ポイント】「誰が誰に何を頼んだか」を整理し、Could you ...? の直後を優先して聞く。`,
    2: `【聞き取りの決め手】That class has moved to Thursday が曜日変更を直接示すため、正答は1です。
【内容整理】開始時刻は7時のままで、登録もやり直す必要はありません。受講者は同じ会員証を持参します。
【誤答分析】2は starting time is still seven と反対。3は講師が研修に参加するだけで交代とは言っていません。4は your name is already on the new list と反対です。
【学習ポイント】moved to Thursday は「木曜日へ変更」。変わった情報と変わらない情報を分けてメモする。`,
    3: `【聞き取りの決め手】A repair worker is coming to look at our washing machine が在宅理由なので、正答は4です。
【内容整理】本来は兄が対応する予定でしたが、急な追加勤務になり、女性が午後2時から5時の間に修理業者を待ちます。
【誤答分析】1の家事を終える話はありません。2は兄が在宅する予定でしたが取りやめです。3はカフェの配達ではなく、カフェで会う予定を翌日に変更します。
【学習ポイント】was supposed to は「～する予定だったが実現しなかった」という変更の手掛かり。`,
    4: `【聞き取りの決め手】I can print the labels while you check the addresses. が女性の申し出なので、正答は2です。
【内容整理】男子が住所を確認し、女性が配送ラベルを印刷します。急ぎの2箱には速達ラベルを使います。
【誤答分析】1の住所確認は男子の作業。3は箱を仙台まで運ぶのではなく、郵便室へ持っていきます。4はプリンターがすでに直っています。
【学習ポイント】offer を問う問題では I can ... の後を聞き、相手の作業と混同しない。`,
    5: `【聞き取りの決め手】go to the service office と downstairs がそろっているため、正答は3です。
【内容整理】紛失物は到着ホームではなく、すでに階下のサービスオフィスへ移されています。男性はそこでキーホルダーの特徴を説明します。
【誤答分析】1のRiversideは列車の出発地。2のホームは男性がすでに確認済み。4の警察署は会話に出ていません。
【学習ポイント】Where should ...? では最後に示された具体的な行き先を取る。upstairs と downstairs の聞き分けにも注意。`,
    6: `【聞き取りの決め手】Then I'll bring my small camping stove. が男性の最終決定なので、正答は1です。
【内容整理】昼食はMinaが用意するため、男性は温かい飲み物用の湯を沸かす小型コンロを持参します。
【誤答分析】2の手袋は男性自身の持ち物で、グループ用とは言っていません。3のサンドイッチは不要になりました。4の天気予報を持参する話ではありません。
【学習ポイント】was going to ... は当初の予定、Then I'll ... は変更後の決定を表す。`,
    7: `【聞き取りの決め手】The pharmacy inside West Mall has it in stock が当日入手できる場所を示し、正答は1です。
【内容整理】現在の薬局には錠剤しかなく、液体薬は翌朝入荷します。処方箋をWest Mall内の薬局へ送ってもらいます。
【誤答分析】2の診療所で受け取るとは言っていません。3では液体薬は今日入手できません。4の駅近くの薬局は会話に出ません。
【学習ポイント】in stock は「在庫がある」。today と tomorrow morning を対比して聞く。`,
    8: `【聞き取りの決め手】Could you replace it with the mushroom soup? が依頼なので、正答は2です。
【内容整理】店員が見た目の似た seafood soup を誤って運びました。女性はサラダを残し、注文どおりのマッシュルームスープだけを求めます。
【誤答分析】1は salad をそのまま置くと言っています。3の料理一覧は頼んでいません。4は間違って届いたスープです。
【学習ポイント】replace A with B は「AをBと取り替える」。with の後が新しく持ってくる物。`,
    9: `【聞き取りの決め手】元の金曜午前の予約を Four on Friday is best. に変えているため、正答は4です。
【内容整理】会社の重要な会議が入ったので、男性は歯のクリーニングを金曜午後4時へ変更します。
【誤答分析】1は同じ歯科医を希望・確認しているだけ。2の住所更新は来院時の手続き。3は所要時間を尋ねていません。
【学習ポイント】Why did ... call? は会話の用件全体を問う。細かな確認事項ではなく、最初の問題と最終決定を結ぶ。`,
    10: `【聞き取りの決め手】I can move the bags が男性の担当なので、正答は3です。
【内容整理】男性は販売用テーブルを設置した後、カートを使って土の袋を各花壇のそばへ4袋ずつ運びます。
【誤答分析】1の水やりは女性の担当。2は植物販売のテーブルを準備しますが、花を売るとは言っていません。4はカートを借りるだけです。
【学習ポイント】複数の作業が出る対話では、主語と順番を対応させる。after I finish ... の後が問われる行動。`,
    11: `【聞き取りの決め手】Our delivery is expected next Wednesday. が入荷日を直接示すため、正答は2です。
【内容整理】大きいサイズの灰色は今日ありますが、女性が希望する青色の大きいサイズは次の水曜日に届きます。
【誤答分析】1のtodayは灰色の在庫。3と4の日程は会話にありません。
【学習ポイント】色・サイズ・日付を組み合わせて聞く。同じ商品でも条件の一部だけ一致する選択肢に注意。`,
    12: `【聞き取りの決め手】The hotel runs a concert shuttle ... と Let's reserve two seats が結論なので、正答は1です。
【内容整理】車は駐車料金が高く、地下鉄は終演前に最終便が出ます。往復できるホテルのシャトルを選びます。
【誤答分析】2は帰りに使えません。3は最初に検討しただけ。4はホテルから15キロあり非現実的です。
【学習ポイント】probably を問う問題では、最後の合意を聞く。That sounds easiest と Let's ... が決定の合図。`,
    13: `【聞き取りの決め手】cut the long description of the hotel's rooms and restaurants が助言なので、正答は3です。
【内容整理】月面着陸の説明は残し、宇宙ホテルの例も一つは残します。削るのは部屋やレストランの長い描写です。
【誤答分析】1は keep that part と反対。2は keep one example と反対。4の導入部を削る指示はありません。
【学習ポイント】keep と cut の対象を対にして聞く。質問の suggest removing は cut の目的語を探す。`,
    14: `【聞き取りの決め手】the supplier is delivering new shelves to my apartment at that time が理由なので、正答は2です。
【内容整理】男性は朝に自宅で棚の配送を受けるため開店できませんが、配送後の夕方なら閉店勤務を代われます。
【誤答分析】1の式典に出るのは女性。3は別店舗を閉める話ではありません。4はCarlosに会うのではなく、女性が朝番を頼む予定です。
【学習ポイント】Why can't ...? では but の後に続く本人の事情を取る。人物の家族・予定を取り違えない。`,
    15: `【聞き取りの決め手】I expected it back next week と returned it so quickly の対比から、正答は4です。
【内容整理】契約書は誤った階に届きましたが、男性が驚いたのは宛先ミスではなく、弁護士から予想より早く返ってきたことです。
【誤答分析】1は会社名自体は正しく、階番号だけが誤り。2と3は事実ですが、男性の surprise の理由ではありません。
【学習ポイント】What surprised ...? では surprised の直前・直後を聞き、単なる出来事と驚きの原因を分ける。`,
    16: `【聞き取りの決め手】すべてを書いている間に later points を聞き逃したため、正答は2です。
【内容整理】Ninaはノートを decisions と tasks に分け、重要事項に絞ることで会議の流れを追いやすくしました。
【誤答分析】1は同僚に教わっただけで共有目的ではありません。3の「すべてを正確に記録」が失敗の原因。4は会議前に作業を準備する話ではありません。
【学習ポイント】Why did ... change? は、変更前の問題と変更後の改善を結び付ける。because がなくても因果を取る。`,
    17: `【聞き取りの決め手】morning planetarium tickets may use them for any afternoon show が正答3を直接支えます。
【内容整理】プラネタリウムは機器テストのため午後1時まで閉鎖されますが、午前券は午後の上映へ振り替えられます。
【誤答分析】1はメインホールが9時からで、9時前ではありません。2は来場者が機器を試すのではありません。4の割引情報はありません。
【学習ポイント】ticket holders を「チケットを持つ人」と素早く捉え、may use them の them が tickets を指すと確認する。`,
    18: `【聞き取りの決め手】Instead, he rented a small garden plot near his office. が解決策なので、正答は1です。
【内容整理】工事でベランダの日光が減り、室内は狭かったため、Omarは職場近くの区画を借りて昼休みに世話をします。
【誤答分析】2は considered しただけで実行していません。3は栽培を継続しています。4は毎日植物を運ぶのではなく、道具を運ぶのが不便です。
【学習ポイント】considered A, but ... Instead, B の流れでは、Aは不採用、Bが実際の行動。`,
    19: `【聞き取りの決め手】leave the train at Central Station and use the free bus が移動方法なので、正答は4です。
【内容整理】今夜8時以降はLake Street駅に停車しないため、Central Station北口の無料バスへ乗り換えます。
【誤答分析】1は北口から歩くのではありません。2は今夜の代替手段を案内しています。3は別の列車ではなくバスです。
【学習ポイント】交通案内では、降りる場所・出口・乗り換える交通手段を一続きで聞く。`,
    20: `【聞き取りの決め手】She wanted to improve her breathing technique がグループ変更の理由で、正答は2です。
【内容整理】Elenaは最初に中級グループを選びましたが、速さより先に呼吸法を整えるため遅いグループへ移りました。
【誤答分析】1は中級グループが終了したとは言っていません。3は経験者を避けたのではありません。4は時間帯の情報がありません。
【学習ポイント】before trying to run faster が目的の順序を示す。「先に何を改善したいか」を取る。`,
    21: `【聞き取りの決め手】chemicals that may help remove tiny insects が可能な利点なので、正答は1です。
【内容整理】anting は鳥が羽の間にアリを入れる行動で、アリの化学物質が体の小さな虫を除く可能性があります。ただし目的は未確定です。
【誤答分析】2の餌探し、3のアリの保護、4の羽の成長はいずれも説明されていません。
【学習ポイント】may help は「可能性」を示す。研究で断定されていない内容を、確定的に言い換えない。`,
    22: `【聞き取りの決め手】he would carry it across campus every day が軽い機種を選ぶ理由で、正答は3です。
【内容整理】高性能機は重く、軽い機種は画面が小さい一方で電池が長持ちします。毎日の持ち運びを優先しました。
【誤答分析】1は画面がより小さいので反対。2は高性能機を選びませんでした。4は価格の比較がありません。
【学習ポイント】商品比較では、各モデルの長所・短所と、購入者が最終的に優先した条件を対応させる。`,
    23: `【聞き取りの決め手】students must bring their own paper or canvas が持参物なので、正答は4です。
【内容整理】絵の具と筆は学校が用意しますが、紙またはキャンバスは各自で準備します。教師はいますが通常授業はありません。
【誤答分析】1は provided とあるため不要。2の完成作品、3の教師の許可書は求められていません。
【学習ポイント】provided と must bring を対比する。案内放送では「用意される物」と「自分で持つ物」を分けて聞く。`,
    24: `【聞き取りの決め手】delivery trucks stopping ... before sunrise が実際の騒音源で、正答は1です。
【内容整理】Priyaは当初レストランを疑いましたが、閉店後も音が続き、早朝の配送トラックが原因だと分かりました。
【誤答分析】2は最初の推測にすぎません。3の修理作業は出ていません。4の別入口は原因ではなく、管理人が行った対策です。
【学習ポイント】first thought ... but ... noticed ... の流れでは、最初の推測ではなく後で判明した事実を選ぶ。`,
    25: `【聞き取りの決め手】will therefore take place in the community hall により屋内開催へ変わり、正答は2です。
【内容整理】大雨予報のため会場だけが広場からホールへ変更されます。日曜の同じ開始時刻で、既存チケットは有効です。
【誤答分析】1は same starting time と反対。3は日付変更なし。4はチケットなしでは入場できません。
【学習ポイント】変更案内は「変わったもの」と「変わらないもの」を整理する。therefore の後が決定事項。`,
    26: `【聞き取りの決め手】a kitchen timer that rings every fifty minutes が休憩を思い出す方法なので、正答は3です。
【内容整理】Danielは電話の複数アラームではなくキッチンタイマーを使い、50分働くごとに5分歩きます。
【誤答分析】1は午後だけ止めるのではありません。2は Rather than により不採用。4は集中が切れてからではなく、定期的に休みます。
【学習ポイント】rather than A, he started B では、AではなくBを採用したと聞き分ける。`,
    27: `【聞き取りの決め手】clean、store's label、show the receipt の三条件を満たすため、正答は4です。
【内容整理】その店の商品が入っていた清潔な瓶にラベルが残り、購入証明を示した場合だけ追加ポイントを得られます。
【誤答分析】1は期限だけでは不十分。2の他店の瓶はリサイクルのみ。3は元のラベルが必要です。
【学習ポイント】条件が複数ある案内では、一つだけ合う選択肢を避け、and で結ばれた条件をすべて照合する。`,
    28: `【聞き取りの決め手】he sent her several voice messages と Mei used those recordings が方法を示し、正答は2です。
【内容整理】祖父が病気で面会できなかったため、Meiは地域の店や祭りを説明した音声メッセージを発表に使いました。
【誤答分析】1の店主への取材、4の図書館調査はありません。3の対面インタビューは祖父の回復後へ延期されました。
【学習ポイント】Instead の後に代替手段が示される。planned と actually used を区別する。`,
    29: `【聞き取りの決め手】help keep the ground from becoming muddy after rain が目的の一つなので、正答は1です。
【内容整理】ウッドチップは雨後のぬかるみを減らし、来園者を決められた道へ導いて木の根も守ります。
【誤答分析】2は根を道へ伸ばすのではなく損傷を減らします。3の植樹場所表示ではありません。4はチップ自体が徐々に分解します。
【学習ポイント】one purpose なら複数の効果のうち一つでよい。選択肢の主語・対象が本文と同じか確認する。`,
    30: `【聞き取りの決め手】After completing two training sessions, he was allowed to work with the dogs. が正答4を直接支えます。
【内容整理】新人の間は餌の準備と食器洗いを行い、研修後に犬の世話が許可されました。現在も食事準備は一部続けています。
【誤答分析】1は新人を指導していません。2は食事準備をやめていません。3の土曜勤務は現在の予定で、研修直後の変化ではありません。
【学習ポイント】What happened after ...? では after に続く結果を探す。現在の習慣との混同に注意。`,
  };

  for (const question of set01.listeningQuestions || []) {
    if (listeningExplanations[question.id]) question.explanation = listeningExplanations[question.id];
    question.explanationTier = "premium";
  }

  const writingGuides = {
    32: {
      explanationTier: "premium",
      explanation: `【要点の取り方】第1段落は「高校の始業時刻を遅らせる学校がある」という話題、第2段落は利点、第3段落は問題点です。自分の賛否は入れません。
【内容の骨組み】利点は、睡眠が増えて授業に集中しやすくなり、通学事情による1時間目の遅刻も減り得ることです。問題点は、放課後活動や仕事の時間が減り、家庭の朝の予定調整が難しくなることです。
【模範解答の構成】1文目で変更を提示し、2文目で利点、3文目で問題点をまとめています。模範解答は49語で、45〜55語の指定内です。
【採点上の注意】benefitだけ、またはproblemだけに偏らないこと。本文にない「成績が必ず上がる」などの断定や、自分の意見は加えないこと。
【使える言い換え】start the school day later → start classes later、feel more awake → pay attention more easily、leave less time for → reduce the time available for`,
    },
    33: {
      explanationTier: "premium",
      explanation: `【問いの確認】AIを学習に使うことがよいかを問われています。冒頭で立場を明確にし、その立場を支える異なる理由を二つ書きます。
【模範解答の構成】I think ... で賛成を示し、First では自分に合う説明を得られること、Second では弱点練習と即時フィードバックを扱っています。最後にresponsiblyを用いて条件付きで結論をまとめています。
【理由の具体化】「便利だから」で終わらず、難しい説明を簡単にしてもらう例と、過去形の追加問題を作ってもらう例によって理由を具体化しています。
【語数と採点】模範解答は89語で、80〜100語の指定内です。内容・構成・語彙・文法を意識し、First と Second が同じ内容の言い換えにならないようにします。
【使える表現】explanations that match their needs、provide practice for weak points、receive quick feedback、use it responsibly`,
    },
  };

  for (const task of set01.writingTasks || []) {
    if (writingGuides[task.id]) Object.assign(task, writingGuides[task.id]);
  }

  const speakingGuides = {
    "Warm-up": {
      modelAnswer: "I usually go shopping at a supermarket near my house.",
      explanation: `【答え方】場所を一つ答え、余裕があれば near my house や with my family などを加えます。
【確認ポイント】これは、このアプリ独自のマイク確認用ウォームアップで、公式面接の設問ではありません。短くても、質問に直接答えて声量とマイクを確認できれば十分です。`,
    },
    "Read Aloud": {
      explanation: `【音読の区切り】Many stores want to reduce / the plastic containers / they throw away. のように意味のまとまりで区切ります。
【発音ポイント】containers、installed、refill stations、products の語末を落とさず、By doing so は前文の行動を受けるまとまりとして読みます。
【評価の考え方】速さより、聞き取れる発音・自然な区切り・文末まで読み切ることを優先します。言い直しても止まらず続けます。`,
    },
    "No.1": {
      explanation: `【正答の根拠】本文の Customers bring empty bottles and fill them at these stations. を使います。these stations は soap and shampoo の refill stations を指します。
【答え方】How can ...? なので By + 動名詞で始めると、方法を直接答えられます。
【確認ポイント】empty bottles と filling them at refill stations の二要素を入れます。本文を一語一句暗記する必要はありません。`,
    },
    "No.2": {
      explanation: `【構成】指定された冒頭文から始め、1コマ目の発言、A few minutes later、That evening at home の順に三場面を説明します。
【文法ポイント】物語なので過去形を基本にし、絵の途中動作は was filling、was showing、was looking、was wiping のように過去進行形で表せます。
【内容ポイント】店員が使い方を示す場面と、家でボトルが漏れて父親が床を拭く場面を落とさないこと。絵にない原因を作り足す必要はありません。
【評価の考え方】細かな語彙より、人物・行動・順序が伝わることを優先します。`,
    },
    "No.3": {
      explanation: `【答え方】I agree. または I disagree. で立場を示し、その後に理由を一つ以上続けます。
【模範解答の骨組み】refill stations can reduce plastic waste と、people think more carefully about what they buy の二点で賛成を支えています。
【確認ポイント】質問の more stores should offer refill stations に直接答えること。単に refill stations の説明を繰り返すだけにしません。`,
    },
    "No.4": {
      explanation: `【答え方】Yes. または No. を先に言い、because を使うか、続く文で理由を示します。
【模範解答の骨組み】reusable bags reduce plastic bag use という環境面と、stronger and easier to carry という実用面を組み合わせています。
【確認ポイント】一つの理由でも最低限の回答は成立しますが、十分な情報量を示すには理由を具体化します。時間に余裕があれば、異なる二つ目の理由や短い具体例を加えます。`,
    },
  };

  const speakingTargets = [];
  if (Array.isArray(set01.speakingSteps)) speakingTargets.push(set01.speakingSteps);
  const separateSpeakingSet = (window.scbtGrade2SpeakingSets || []).find((set) => set?.key === "set-01");
  if (Array.isArray(separateSpeakingSet?.speakingSteps)) speakingTargets.push(separateSpeakingSet.speakingSteps);

  for (const steps of speakingTargets) {
    for (const step of steps) {
      const guide = speakingGuides[step.label];
      if (!guide) continue;
      Object.assign(step, guide, { explanationTier: "premium" });
    }
  }

  set01.explanationPackage = {
    id: "grade2-set-01-premium-v1",
    label: "3回プレミアム購入特典",
    title: "第1回 詳しい解説",
    version: 1,
  };
})();
