(() => {
  const pre1ListeningSets = [
  {
    "key": "set-01",
    "label": "第1回",
    "questions": [
      {
        "id": 1,
        "section": "第1部",
        "part": "Part 1",
        "instruction": "対話と最後の質問を聞き、最も適切な答えを4つから選んでください。",
        "voice": "Conversation",
        "audioFile": "",
        "script": "A: Liam, are you still presenting the new software at tomorrow’s staff meeting?\nB: I was supposed to, but the updated version hasn’t been installed on the office computers yet.\nA: Couldn’t you demonstrate it on your laptop?\nB: That would work for the basic features. The problem is that the security settings are different from the ones everyone will actually use.\nA: So, you’d rather wait until the system is ready?\nB: Exactly. I’ll give a short progress report tomorrow and schedule the demonstration for next week.",
        "questionText": "What will the man probably do at tomorrow’s meeting?",
        "text": "What will the man probably do at tomorrow’s meeting?",
        "choices": [
          "Give a brief update on the software.",
          "Demonstrate basic features from his laptop.",
          "Ask the staff to change their security settings.",
          "Postpone the entire meeting until next week."
        ],
        "correct": 1,
        "explanation": "男性はソフトウェアの実演を翌週に延期し、明日の会議では短い進捗報告だけをすると述べています。"
      },
      {
        "id": 2,
        "section": "第1部",
        "part": "Part 1",
        "instruction": "対話と最後の質問を聞き、最も適切な答えを4つから選んでください。",
        "voice": "Conversation",
        "audioFile": "",
        "script": "B: You seem tired, Maya. Was the baby awake again?\nA: Only once. I’m actually exhausted because I’ve been doing all the grocery shopping and cooking since my brother moved in.\nB: I thought he was helping while he looked for an apartment.\nA: He does wash the dishes, but only after I remind him.\nB: Have you told him the arrangement isn’t working?\nA: Not directly. I didn’t want to make him feel unwelcome.\nB: Still, he probably doesn’t realize how much you’re doing.\nA: That’s true. I think it’s time we divided the chores more fairly.",
        "questionText": "What does the woman imply about her brother?",
        "text": "What does the woman imply about her brother?",
        "choices": [
          "He should move out of her home immediately.",
          "He is already doing enough to help her.",
          "He should do a fairer share of the chores.",
          "He is too busy to help with the baby."
        ],
        "correct": 3,
        "explanation": "女性は家事の大部分を自分が担当しており、『もっと公平に分担する時だ』と述べています。弟にも、より多くの家事を担当してほしいという意味です。"
      },
      {
        "id": 3,
        "section": "第1部",
        "part": "Part 1",
        "instruction": "対話と最後の質問を聞き、最も適切な答えを4つから選んでください。",
        "voice": "Conversation",
        "audioFile": "",
        "script": "A: Did Professor Grant approve your survey questions?\nB: Mostly. She said the questions were clear, but the group I planned to interview was too narrow.\nA: Are you going to add more first-year students from your course?\nB: No. She said increasing the sample size wouldn’t solve the main problem.\nA: Then you’ll need participants with different academic backgrounds.\nB: Right. I’ll contact students in several departments before I begin collecting responses.",
        "questionText": "What change will the man make to his research?",
        "text": "What change will the man make to his research?",
        "choices": [
          "Interview more students from his own course.",
          "Include students from several different departments.",
          "Rewrite all of the survey questions.",
          "Begin collecting the survey responses immediately."
        ],
        "correct": 2,
        "explanation": "問題は人数の少なさではなく、対象となる学生の範囲が狭いことです。男性は複数の学部の学生に連絡すると決めています。"
      },
      {
        "id": 4,
        "section": "第1部",
        "part": "Part 1",
        "instruction": "対話と最後の質問を聞き、最も適切な答えを4つから選んでください。",
        "voice": "Conversation",
        "audioFile": "",
        "script": "B: Good afternoon. I’m calling about the camera I left for repair on Monday.\nA: Yes, Mr. Cole. The technician found that the battery was damaged by moisture.\nB: That’s strange. I’ve never used it in the rain.\nA: Moisture can also build up if the camera moves quickly from a cold place to a warm one.\nB: Is the repair covered by the warranty?\nA: Unfortunately, accidental moisture damage isn’t covered.\nB: I see. Please don’t replace the battery yet. Send me the cost estimate first.\nA: Certainly. We’ll email it this afternoon.",
        "questionText": "What does the man ask the woman to do?",
        "text": "What does the man ask the woman to do?",
        "choices": [
          "Check whether the camera was used in rain.",
          "Replace the battery under the warranty.",
          "Explain how to prevent future moisture damage.",
          "Send him an estimate before replacing the battery."
        ],
        "correct": 4,
        "explanation": "男性は、すぐにバッテリーを交換せず、まず修理費の見積もりを送るよう依頼しています。"
      },
      {
        "id": 5,
        "section": "第1部",
        "part": "Part 1",
        "instruction": "対話と最後の質問を聞き、最も適切な答えを4つから選んでください。",
        "voice": "Conversation",
        "audioFile": "",
        "script": "A: Theo, are you joining us for the charity run next month?\nB: I’d like to, but my knee still hurts after longer runs.\nA: Didn’t the doctor say you could exercise again?\nB: Yes, but she recommended cycling or swimming until I can run without discomfort.\nA: Then perhaps you could help at one of the water stations instead.\nB: That makes sense. I still want to support the event, and that wouldn’t delay my recovery.",
        "questionText": "What will the man probably do at the charity run?",
        "text": "What will the man probably do at the charity run?",
        "choices": [
          "Complete a shorter version of the run.",
          "Join a cycling event instead of running.",
          "Volunteer at one of the water stations.",
          "Skip the event until his knee fully recovers."
        ],
        "correct": 3,
        "explanation": "男性はまだ長時間走れませんが、イベントには協力したいと考えています。そのため、給水所の手伝いをする可能性が高いです。"
      },
      {
        "id": 6,
        "section": "第1部",
        "part": "Part 1",
        "instruction": "対話と最後の質問を聞き、最も適切な答えを4つから選んでください。",
        "voice": "Conversation",
        "audioFile": "",
        "script": "B: The landlord said a plumber can come on Thursday morning.\nA: Thursday? I’ll be at work, and I don’t want anyone entering the apartment when neither of us is home.\nB: He offered to supervise the visit himself.\nA: That helps, but the leak has already damaged the cabinet under the sink.\nB: I know. I asked whether someone could come sooner, but Thursday was the earliest appointment.\nA: Then let’s move the dishes and cleaning supplies tonight so nothing else gets ruined.\nB: Good idea. I’ll also take photos in case we need to discuss the damage later.",
        "questionText": "Why was the woman initially concerned?",
        "text": "Why was the woman initially concerned?",
        "choices": [
          "No one would be home during the repair.",
          "The landlord might charge for the cabinet damage.",
          "The plumber was unable to come on Thursday.",
          "Their belongings could not be moved beforehand."
        ],
        "correct": 1,
        "explanation": "女性が最初に心配したのは、自分たちが不在の間に作業員が部屋へ入ることです。家主が立ち会うと聞いて、その心配は軽くなっています。"
      },
      {
        "id": 7,
        "section": "第1部",
        "part": "Part 1",
        "instruction": "対話と最後の質問を聞き、最も適切な答えを4つから選んでください。",
        "voice": "Conversation",
        "audioFile": "",
        "script": "A: Are you still interested in the hiking trip this weekend?\nB: Yes, but I may need to skip the overnight part.\nA: Is the weather forecast worrying you?\nB: Not really. My father is recovering from surgery, and I don’t want to be too far away overnight. I could still join the daytime hike if we return before dinner.\nA: Of course. We can choose the shorter trail and be back by late afternoon.",
        "questionText": "Why may the man skip the overnight part of the trip?",
        "text": "Why may the man skip the overnight part of the trip?",
        "choices": [
          "The weather may make the longer trail unsafe.",
          "He wants to remain near his recovering father.",
          "He does not have suitable overnight equipment.",
          "He is too tired to complete the daytime hike."
        ],
        "correct": 2,
        "explanation": "男性は、手術後の父親から一晩中離れた場所にいたくないと述べています。天候が理由ではありません。"
      },
      {
        "id": 8,
        "section": "第1部",
        "part": "Part 1",
        "instruction": "対話と最後の質問を聞き、最も適切な答えを4つから選んでください。",
        "voice": "Conversation",
        "audioFile": "",
        "script": "B: Nina, have you decided whether to coordinate the neighborhood festival again?\nA: I’ve been thinking about it, but I’m not sure I should.\nB: Last year’s event went well. Is the budget a problem?\nA: No. I’m concerned newer volunteers never get a chance to lead.\nB: But they may not feel ready for the whole event.\nA: Then we could divide the job. One person could manage the schedule while another handles local businesses.\nB: So you’d stay involved without being the main coordinator?\nA: Exactly. I can advise them, but someone else should take primary responsibility.",
        "questionText": "What does the woman imply?",
        "text": "What does the woman imply?",
        "choices": [
          "The festival should operate with a smaller budget.",
          "The committee should cancel this year’s festival.",
          "The newer volunteers are not prepared to lead.",
          "Another volunteer should take the main leadership role."
        ],
        "correct": 4,
        "explanation": "女性は自分が助言役として関わる一方で、別のボランティアに中心的な責任を担当してほしいと考えています。"
      },
      {
        "id": 9,
        "section": "第1部",
        "part": "Part 1",
        "instruction": "対話と最後の質問を聞き、最も適切な答えを4つから選んでください。",
        "voice": "Conversation",
        "audioFile": "",
        "script": "A: Did you accept the position at the design firm?\nB: Not yet. The work sounds interesting, but the contract includes frequent weekend travel.\nA: I thought you said travel was one reason you applied.\nB: Occasional travel is fine. I didn’t realize I’d be away almost every other weekend during the first six months.\nA: Could you ask whether the schedule is flexible?\nB: I will. If they can reduce the weekend trips, I’d still like to take the job.",
        "questionText": "What is the man’s main concern?",
        "text": "What is the man’s main concern?",
        "choices": [
          "The job requires too much weekend travel.",
          "The design work may not be interesting enough.",
          "The employment contract lasts only six months.",
          "The firm may not offer him a promotion."
        ],
        "correct": 1,
        "explanation": "男性は出張そのものではなく、最初の半年間、ほぼ隔週で週末に出張する点を問題にしています。"
      },
      {
        "id": 10,
        "section": "第1部",
        "part": "Part 1",
        "instruction": "対話と最後の質問を聞き、最も適切な答えを4つから選んでください。",
        "voice": "Conversation",
        "audioFile": "",
        "script": "B: The direct train to Brookdale won’t run this Saturday because of track repairs.\nA: Then should we cancel our visit to the museum?\nB: We don’t have to. There’s a replacement bus from Central Station.\nA: Does it stop near the museum?\nB: Not exactly. It ends at the temporary bus stop on River Street, about a fifteen-minute walk away.\nA: That’s manageable, but the exhibition entrance closes at four.\nB: If we leave an hour earlier than planned, we should still arrive in plenty of time.\nA: All right. Let’s do that.",
        "questionText": "What will the speakers probably do?",
        "text": "What will the speakers probably do?",
        "choices": [
          "Cancel their visit because the train is unavailable.",
          "Take a later direct train from Central Station.",
          "Leave earlier and use the replacement bus.",
          "Arrive after the exhibition entrance has closed."
        ],
        "correct": 3,
        "explanation": "二人は予定より1時間早く出発し、代行バスを利用する案に合意しています。博物館への訪問は中止しません。"
      },
      {
        "id": 11,
        "section": "第1部",
        "part": "Part 1",
        "instruction": "対話と最後の質問を聞き、最も適切な答えを4つから選んでください。",
        "voice": "Conversation",
        "audioFile": "",
        "script": "A: You looked frustrated after the project meeting, Daniel.\nB: I was. Everyone assumed I’d lead the next phase because I handled the client presentation.\nA: Don’t you want the promotion that might come with it?\nB: Eventually, yes. But I’m already supervising two new employees, and taking this on now would affect the quality of my current work.\nA: Have you told your manager that?\nB: I’m going to explain that I can contribute, but someone else should coordinate the next phase.",
        "questionText": "What does the man think about leading the next phase?",
        "text": "What does the man think about leading the next phase?",
        "choices": [
          "It would guarantee him an immediate promotion.",
          "It could reduce the quality of his current work.",
          "It would help him train the new employees.",
          "It should be decided by the firm’s client."
        ],
        "correct": 2,
        "explanation": "男性は現在すでに新入社員を指導しており、新しい責任を引き受けると現在の仕事の質が下がると考えています。"
      },
      {
        "id": 12,
        "section": "第1部",
        "part": "Part 1",
        "instruction": "対話と最後の質問を聞き、最も適切な答えを4つから選んでください。",
        "voice": "Conversation",
        "audioFile": "",
        "script": "B: How was your first pottery class?\nA: More difficult than I expected. My bowl collapsed twice before I finished it.\nB: Are you thinking of quitting?\nA: No, the instructor was patient, and I enjoyed working with the clay.\nB: Then what bothered you?\nA: The class moves quickly because several students already have experience.\nB: Could you practice at the open studio before the next lesson?\nA: That’s what the instructor suggested. I’ll go on Wednesday so I can keep up more easily.",
        "questionText": "What has the woman decided to do?",
        "text": "What has the woman decided to do?",
        "choices": [
          "Quit the pottery class before the next lesson.",
          "Practice at the open studio on Wednesday.",
          "Ask the instructor to slow down the class.",
          "Make another bowl by herself at home."
        ],
        "correct": 2,
        "explanation": "女性は授業の進度についていくため、次の授業前の水曜日にオープンスタジオで練習すると決めています。"
      },
      {
        "id": 13,
        "section": "第2部",
        "part": "Part 2",
        "instruction": "英文と質問を聞き、内容に最も合う4つの選択肢から選んでください。",
        "voice": "Narration",
        "audioFile": "",
        "script": "The Green Book\nDuring much of the twentieth century, African Americans who traveled by car in the United States could not assume that hotels, restaurants, or gas stations would serve them. Some towns were openly dangerous for Black visitors, especially after dark. In 1936, Victor Hugo Green, a postal worker in New York, began publishing a guide that listed places where Black travelers were likely to be welcomed. The guide was updated regularly and eventually covered many parts of the country.\nThe book was practical, but it also revealed a larger social reality. Its listings included not only hotels and restaurants but also beauty salons, nightclubs, and other businesses that formed a travel network. Green wrote that he hoped the guide would one day become unnecessary. Publication ended in the 1960s, but historians now use surviving copies to understand both racial exclusion and the businesses that helped travelers move more safely.",
        "questionText": "What problem did Black travelers often face?",
        "text": "What problem did Black travelers often face?",
        "choices": [
          "They had difficulty finding safe services.",
          "They rarely owned cars outside New York.",
          "They were asked to publish travel guides.",
          "They avoided traveling during the day."
        ],
        "correct": 1,
        "explanation": "正答は1です。Paragraph 1: They had difficulty finding safe services."
      },
      {
        "id": 14,
        "section": "第2部",
        "part": "Part 2",
        "instruction": "英文と質問を聞き、内容に最も合う4つの選択肢から選んでください。",
        "voice": "Narration",
        "audioFile": "",
        "script": "The Green Book\nDuring much of the twentieth century, African Americans who traveled by car in the United States could not assume that hotels, restaurants, or gas stations would serve them. Some towns were openly dangerous for Black visitors, especially after dark. In 1936, Victor Hugo Green, a postal worker in New York, began publishing a guide that listed places where Black travelers were likely to be welcomed. The guide was updated regularly and eventually covered many parts of the country.\nThe book was practical, but it also revealed a larger social reality. Its listings included not only hotels and restaurants but also beauty salons, nightclubs, and other businesses that formed a travel network. Green wrote that he hoped the guide would one day become unnecessary. Publication ended in the 1960s, but historians now use surviving copies to understand both racial exclusion and the businesses that helped travelers move more safely.",
        "questionText": "How is the Green Book used today?",
        "text": "How is the Green Book used today?",
        "choices": [
          "To advertise old hotels and restaurants.",
          "To study exclusion and support networks.",
          "To compare modern gas station prices.",
          "To prove travel became risk-free."
        ],
        "correct": 2,
        "explanation": "正答は2です。Paragraph 2: To study exclusion and support networks."
      },
      {
        "id": 15,
        "section": "第2部",
        "part": "Part 2",
        "instruction": "英文と質問を聞き、内容に最も合う4つの選択肢から選んでください。",
        "voice": "Narration",
        "audioFile": "",
        "script": "Mangrove Forests\nMangroves grow where land and sea meet in warm coastal areas. Their roots stand in muddy, salty water that would kill many other trees. These roots hold sediment in place and slow waves, so mangrove forests can reduce coastal erosion and help protect communities during storms. They also create sheltered water where young fish, shellfish, and birds can feed or hide. For coastal towns, these benefits can make mangroves a natural partner to human-built defenses.\nFor this reason, many countries try to restore damaged mangroves. Success often depends on ecological repair. However, planting seedlings is not enough if the site is too exposed or if tidal water cannot move naturally. Restoration projects often have to reopen water channels, choose species suited to the location, and involve local workers who will continue protecting the area. When these conditions are ignored, many young trees die before they can form a forest, wasting money and public trust.",
        "questionText": "What is one benefit of mangrove roots?",
        "text": "What is one benefit of mangrove roots?",
        "choices": [
          "They slow waves near the coast.",
          "They make seawater less salty.",
          "They prevent all storm damage.",
          "They attract fish away from shores."
        ],
        "correct": 1,
        "explanation": "正答は1です。Paragraph 1: They slow waves near the coast."
      },
      {
        "id": 16,
        "section": "第2部",
        "part": "Part 2",
        "instruction": "英文と質問を聞き、内容に最も合う4つの選択肢から選んでください。",
        "voice": "Narration",
        "audioFile": "",
        "script": "Mangrove Forests\nMangroves grow where land and sea meet in warm coastal areas. Their roots stand in muddy, salty water that would kill many other trees. These roots hold sediment in place and slow waves, so mangrove forests can reduce coastal erosion and help protect communities during storms. They also create sheltered water where young fish, shellfish, and birds can feed or hide. For coastal towns, these benefits can make mangroves a natural partner to human-built defenses.\nFor this reason, many countries try to restore damaged mangroves. Success often depends on ecological repair. However, planting seedlings is not enough if the site is too exposed or if tidal water cannot move naturally. Restoration projects often have to reopen water channels, choose species suited to the location, and involve local workers who will continue protecting the area. When these conditions are ignored, many young trees die before they can form a forest, wasting money and public trust.",
        "questionText": "What is important in mangrove restoration?",
        "text": "What is important in mangrove restoration?",
        "choices": [
          "Planting as many trees as possible.",
          "Keeping tidal water from the site.",
          "Matching species and site conditions.",
          "Replacing local workers with machines."
        ],
        "correct": 3,
        "explanation": "正答は3です。Paragraph 2: Matching species and site conditions."
      },
      {
        "id": 17,
        "section": "第2部",
        "part": "Part 2",
        "instruction": "英文と質問を聞き、内容に最も合う4つの選択肢から選んでください。",
        "voice": "Narration",
        "audioFile": "",
        "script": "Oral Rehydration Therapy\nSevere diarrhea can be deadly not mainly because food is lost, but because the body loses water and essential salts in a relatively short time. This danger is especially serious for young children in places where medical care is hard to reach. Oral rehydration therapy was developed to treat this problem with a drink containing clean water, salts, and glucose. The glucose helps the intestine absorb sodium, and water follows, replacing fluid that has been lost.\nThe treatment is simple enough to use outside hospitals, which is why health organizations have promoted packets of oral rehydration salts around the world. It does not kill the germs that caused the illness, and serious cases may still need medical care. Even so, for many patients it can prevent dehydration from becoming fatal. Its importance comes from combining basic science with a form that families and clinics can actually use.",
        "questionText": "Why can severe diarrhea become dangerous?",
        "text": "Why can severe diarrhea become dangerous?",
        "choices": [
          "It prevents patients from eating.",
          "It causes rapid fluid and salt loss.",
          "It makes glucose impossible to absorb.",
          "It always requires hospital treatment."
        ],
        "correct": 2,
        "explanation": "正答は2です。Paragraph 1: It causes rapid fluid and salt loss."
      },
      {
        "id": 18,
        "section": "第2部",
        "part": "Part 2",
        "instruction": "英文と質問を聞き、内容に最も合う4つの選択肢から選んでください。",
        "voice": "Narration",
        "audioFile": "",
        "script": "Oral Rehydration Therapy\nSevere diarrhea can be deadly not mainly because food is lost, but because the body loses water and essential salts in a relatively short time. This danger is especially serious for young children in places where medical care is hard to reach. Oral rehydration therapy was developed to treat this problem with a drink containing clean water, salts, and glucose. The glucose helps the intestine absorb sodium, and water follows, replacing fluid that has been lost.\nThe treatment is simple enough to use outside hospitals, which is why health organizations have promoted packets of oral rehydration salts around the world. It does not kill the germs that caused the illness, and serious cases may still need medical care. Even so, for many patients it can prevent dehydration from becoming fatal. Its importance comes from combining basic science with a form that families and clinics can actually use.",
        "questionText": "What is one limitation of the treatment?",
        "text": "What is one limitation of the treatment?",
        "choices": [
          "It cannot treat any children safely.",
          "It must be mixed by doctors.",
          "It does not remove the cause.",
          "It works only inside hospitals."
        ],
        "correct": 3,
        "explanation": "正答は3です。Paragraph 2: It does not remove the cause."
      },
      {
        "id": 19,
        "section": "第2部",
        "part": "Part 2",
        "instruction": "英文と質問を聞き、内容に最も合う4つの選択肢から選んでください。",
        "voice": "Narration",
        "audioFile": "",
        "script": "Green Roofs\nA green roof is a roof partly or completely covered with plants placed above waterproof layers. In crowded cities, ordinary roofs and roads absorb sunlight and release heat, adding to the heat island effect. Plants on roofs cool the surface through shade and evaporation, and the roof layers can also help insulate the building below. As a result, green roofs may reduce the need for air conditioning during long heat waves.\nTheir value is not limited to temperature. Soil and plants can hold rainwater, slow runoff, and filter some pollutants before water reaches drains during sudden heavy summer rainstorms. Some green roofs also create small habitats or public spaces. However, they usually cost more to install than simple reflective roofs, and they require maintenance such as irrigation, weeding, and replacing dead plants. For building owners, the decision depends on whether the extra public and environmental benefits justify the higher cost over time.",
        "questionText": "How can green roofs cool buildings?",
        "text": "How can green roofs cool buildings?",
        "choices": [
          "They release heat into roads.",
          "They block all sunlight indoors.",
          "They use shade and evaporation.",
          "They remove waterproof roof layers."
        ],
        "correct": 3,
        "explanation": "正答は3です。Paragraph 1: They use shade and evaporation."
      },
      {
        "id": 20,
        "section": "第2部",
        "part": "Part 2",
        "instruction": "英文と質問を聞き、内容に最も合う4つの選択肢から選んでください。",
        "voice": "Narration",
        "audioFile": "",
        "script": "Green Roofs\nA green roof is a roof partly or completely covered with plants placed above waterproof layers. In crowded cities, ordinary roofs and roads absorb sunlight and release heat, adding to the heat island effect. Plants on roofs cool the surface through shade and evaporation, and the roof layers can also help insulate the building below. As a result, green roofs may reduce the need for air conditioning during long heat waves.\nTheir value is not limited to temperature. Soil and plants can hold rainwater, slow runoff, and filter some pollutants before water reaches drains during sudden heavy summer rainstorms. Some green roofs also create small habitats or public spaces. However, they usually cost more to install than simple reflective roofs, and they require maintenance such as irrigation, weeding, and replacing dead plants. For building owners, the decision depends on whether the extra public and environmental benefits justify the higher cost over time.",
        "questionText": "What is one concern about green roofs?",
        "text": "What is one concern about green roofs?",
        "choices": [
          "They provide no public benefits.",
          "They cannot hold rainwater.",
          "They increase stormwater runoff.",
          "They need money and maintenance."
        ],
        "correct": 4,
        "explanation": "正答は4です。Paragraph 2: They need money and maintenance."
      },
      {
        "id": 21,
        "section": "第2部",
        "part": "Part 2",
        "instruction": "英文と質問を聞き、内容に最も合う4つの選択肢から選んでください。",
        "voice": "Narration",
        "audioFile": "",
        "script": "The Rosetta Stone\nThe Rosetta Stone is a broken stone slab found by French soldiers in Egypt in 1799. It carries an official decree about King Ptolemy V, but the same message was written in three scripts: hieroglyphs, Demotic, and ancient Greek. At the time, scholars in Europe could still read Greek, while knowledge of Egyptian hieroglyphs had largely disappeared. This made the stone valuable because it offered a direct comparison between known and unknown writing systems in the same text.\nThe stone did not solve the puzzle immediately. Scholars first used the Greek text to understand the decree and to identify royal names written in Egyptian scripts. Later, Jean-Francois Champollion realized that hieroglyphs could represent sounds, not just ideas or pictures. That insight helped open ancient Egyptian writing to modern study for later scholars. The stone became famous not because its message was unusual, but because its repeated text made translation possible.",
        "questionText": "Why was the Rosetta Stone valuable to scholars?",
        "text": "Why was the Rosetta Stone valuable to scholars?",
        "choices": [
          "It repeated one text in three scripts.",
          "It described an unknown Egyptian king.",
          "It was perfectly preserved when found.",
          "It proved Greek had disappeared."
        ],
        "correct": 1,
        "explanation": "正答は1です。Paragraph 1: It repeated one text in three scripts."
      },
      {
        "id": 22,
        "section": "第2部",
        "part": "Part 2",
        "instruction": "英文と質問を聞き、内容に最も合う4つの選択肢から選んでください。",
        "voice": "Narration",
        "audioFile": "",
        "script": "The Rosetta Stone\nThe Rosetta Stone is a broken stone slab found by French soldiers in Egypt in 1799. It carries an official decree about King Ptolemy V, but the same message was written in three scripts: hieroglyphs, Demotic, and ancient Greek. At the time, scholars in Europe could still read Greek, while knowledge of Egyptian hieroglyphs had largely disappeared. This made the stone valuable because it offered a direct comparison between known and unknown writing systems in the same text.\nThe stone did not solve the puzzle immediately. Scholars first used the Greek text to understand the decree and to identify royal names written in Egyptian scripts. Later, Jean-Francois Champollion realized that hieroglyphs could represent sounds, not just ideas or pictures. That insight helped open ancient Egyptian writing to modern study for later scholars. The stone became famous not because its message was unusual, but because its repeated text made translation possible.",
        "questionText": "What did Champollion realize about hieroglyphs?",
        "text": "What did Champollion realize about hieroglyphs?",
        "choices": [
          "Hieroglyphs were only decoration.",
          "Greek was impossible to read.",
          "The decree was historically false.",
          "Hieroglyphs could represent sounds."
        ],
        "correct": 4,
        "explanation": "正答は4です。Paragraph 2: Hieroglyphs could represent sounds."
      },
      {
        "id": 23,
        "section": "第2部",
        "part": "Part 2",
        "instruction": "英文と質問を聞き、内容に最も合う4つの選択肢から選んでください。",
        "voice": "Narration",
        "audioFile": "",
        "script": "Radiocarbon Dating\nRadiocarbon dating changed archaeology by giving scientists a way to estimate the age of once-living materials and build more precise historical timelines without relying only on written records. It was developed in the late 1940s by a team led by Willard Libby at the University of Chicago. While plants and animals are alive, they take in a small amount of carbon-14 from the environment. After death, they stop taking it in, and the remaining carbon-14 slowly decays at a predictable rate.\nBy measuring how much carbon-14 remains, researchers can estimate when wood, bone, cloth, or other organic material stopped exchanging carbon with the environment. The method is powerful, but it is not useful for every object. It cannot date stone tools directly, and very old samples contain too little carbon-14 to measure reliably. Modern laboratories also adjust results using other records, such as tree rings, because carbon levels in the atmosphere have changed over time.",
        "questionText": "What is radiocarbon dating based on?",
        "text": "What is radiocarbon dating based on?",
        "choices": [
          "The shape of ancient stone tools.",
          "The decay of carbon-14 after death.",
          "The language written on old cloth.",
          "The exact location of a sample."
        ],
        "correct": 2,
        "explanation": "正答は2です。Paragraph 1: The decay of carbon-14 after death."
      },
      {
        "id": 24,
        "section": "第2部",
        "part": "Part 2",
        "instruction": "英文と質問を聞き、内容に最も合う4つの選択肢から選んでください。",
        "voice": "Narration",
        "audioFile": "",
        "script": "Radiocarbon Dating\nRadiocarbon dating changed archaeology by giving scientists a way to estimate the age of once-living materials and build more precise historical timelines without relying only on written records. It was developed in the late 1940s by a team led by Willard Libby at the University of Chicago. While plants and animals are alive, they take in a small amount of carbon-14 from the environment. After death, they stop taking it in, and the remaining carbon-14 slowly decays at a predictable rate.\nBy measuring how much carbon-14 remains, researchers can estimate when wood, bone, cloth, or other organic material stopped exchanging carbon with the environment. The method is powerful, but it is not useful for every object. It cannot date stone tools directly, and very old samples contain too little carbon-14 to measure reliably. Modern laboratories also adjust results using other records, such as tree rings, because carbon levels in the atmosphere have changed over time.",
        "questionText": "What is one limitation of radiocarbon dating?",
        "text": "What is one limitation of radiocarbon dating?",
        "choices": [
          "It can test only metal objects.",
          "It ignores changes in atmosphere.",
          "It cannot date stone directly.",
          "It was never used in archaeology."
        ],
        "correct": 3,
        "explanation": "正答は3です。Paragraph 2: It cannot date stone directly."
      },
      {
        "id": 25,
        "section": "第3部",
        "part": "Part 3",
        "instruction": "SituationとQuestionを読んだ後、放送を聞き、条件に最も合う選択肢を選んでください。",
        "voice": "Narration",
        "audioFile": "",
        "script": "B: For student presentations, most groups use rooms on the west side. Cedar is the largest, with space for thirty people and a built-in screen, but it is on the second floor, and the lift nearby is being repaired today. Maple is on the entrance level and has twenty seats; however, it only has a whiteboard, so you would need to bring your own equipment. Olive is also on the entrance level. It holds eighteen people comfortably, and a wall screen is included. Pine has a screen and is close to the office, but it seats only twelve.",
        "situation": "You are helping your teacher reserve a room for a student presentation. It must seat 18 people, have a screen, and be easy to reach without stairs. You hear a staff explanation.",
        "questionText": "Which room should you reserve?",
        "text": "Which room should you reserve?",
        "choices": [
          "Cedar Room",
          "Maple Room",
          "Olive Room",
          "Pine Room"
        ],
        "correct": 3,
        "explanation": "解説：18人が入れ、スクリーンがあり、階段なしで行ける部屋が必要。Olive Roomだけが3条件を満たす。\n各選択肢：\n1. 30人入りスクリーンもあるが、2階でリフトが使えない。\n2. 入口階で20席あるが、スクリーンがない。\n3. 正答。入口階、18人収容、スクリーンあり。\n4. スクリーンはあるが12人しか入らない。"
      },
      {
        "id": 26,
        "section": "第3部",
        "part": "Part 3",
        "instruction": "SituationとQuestionを読んだ後、放送を聞き、条件に最も合う選択肢を選んでください。",
        "voice": "Narration",
        "audioFile": "",
        "script": "A: Passengers heading toward the riverside area should listen carefully. The regular 5:05 train has been canceled because of signal trouble. A city bus will leave from East Bus Stop at 5:10 and reach Riverside Square at 5:45, but bicycles are not allowed on board during the evening rush. Taxis at the Harbor Desk can carry bicycles if space is available, though drivers expect heavy traffic and cannot promise arrival before 6. A replacement local train will depart from South Platform at 5:18. Bicycle spaces are open, and it is scheduled to reach Riverside Station at 5:52. The tram gate is for downtown passengers only.",
        "situation": "You are taking your bicycle to a riverside hotel tonight. Your usual train is canceled, and you need to arrive before 6 p.m. You hear a station announcement.",
        "questionText": "Where should you wait?",
        "text": "Where should you wait?",
        "choices": [
          "South Platform",
          "East Bus Stop",
          "Harbor Taxi Desk",
          "City Tram Gate"
        ],
        "correct": 1,
        "explanation": "解説：自転車を持っていて、6時前にホテル方面へ着く必要がある。South Platformの代替列車だけが自転車可で5:52到着予定。\n各選択肢：\n1. 正答。自転車スペースがあり、5:52到着予定。\n2. 5:45到着だが、夕方は自転車不可。\n3. 自転車は可能だが、6時前到着を保証できない。\n4. ダウンタウン方面で、目的地が違う。"
      },
      {
        "id": 27,
        "section": "第3部",
        "part": "Part 3",
        "instruction": "SituationとQuestionを読んだ後、放送を聞き、条件に最も合う選択肢を選んでください。",
        "voice": "Narration",
        "audioFile": "",
        "script": "B: Thanks for coming to help with the community fair. The sorting table is inside the gym, and the work is light, but that team starts at 10 and will be finished before lunch. Stage crew still needs people from 1:30, but it involves moving speaker stands and boxes from the storage room. The welcome desk opens again after the lunch break. Volunteers there check names, give out maps, and stay inside the main entrance. The garden team also starts at 1:30 and does not require heavy lifting, but the work is outside, helping visitors find the plant sale.",
        "situation": "You signed up as a volunteer after lunch. You cannot lift heavy boxes, and you prefer a task indoors. You are listening to the coordinator.",
        "questionText": "Which task should you choose?",
        "text": "Which task should you choose?",
        "choices": [
          "Sorting table",
          "Stage crew",
          "Garden team",
          "Welcome desk"
        ],
        "correct": 4,
        "explanation": "解説：昼食後に参加、重い物を持てない、屋内希望。Welcome deskは午後再開、屋内、作業も受付中心。\n各選択肢：\n1. 屋内で軽作業だが、午前中に終わる。\n2. 午後からだが、重い機材や箱を運ぶ。\n3. 午後で重労働ではないが、屋外作業。\n4. 正答。午後、屋内、重い作業なし。"
      },
      {
        "id": 28,
        "section": "第3部",
        "part": "Part 3",
        "instruction": "SituationとQuestionを読んだ後、放送を聞き、条件に最も合う選択肢を選んでください。",
        "voice": "Narration",
        "audioFile": "",
        "script": "A: If you need service today, we have several options. Basic Start can be activated while you wait and has no long-term contract, but it is only for customers getting a new number. Flex Connect costs a little more each month, yet we can move your present number over in about thirty minutes, and you can cancel at the end of any month. Family Value includes number transfer and a discount on two lines, but it requires a one-year agreement. Data Plus has no contract and plenty of data; however, the SIM cards for number transfer will not arrive until next week.",
        "situation": "You are changing phone service today. You want to keep your current number and avoid a one-year contract. You hear a clerk explain the plans.",
        "questionText": "Which plan should you choose?",
        "text": "Which plan should you choose?",
        "choices": [
          "Basic Start",
          "Flex Connect",
          "Family Value",
          "Data Plus"
        ],
        "correct": 2,
        "explanation": "解説：今の番号を残し、1年契約を避けたい。Flex Connectは番号移行ができ、月ごとに解約可能。\n各選択肢：\n1. 即日・契約なしだが、新番号専用。\n2. 正答。番号移行ができ、長期契約なし。\n3. 番号移行はできるが、1年契約が必要。\n4. 契約なしだが、番号移行用SIMが来週までない。"
      },
      {
        "id": 29,
        "section": "第3部",
        "part": "Part 3",
        "instruction": "SituationとQuestionを読んだ後、放送を聞き、条件に最も合う選択肢を選んでください。",
        "voice": "Narration",
        "audioFile": "",
        "script": "B: This is a safety drill for all hotel guests. If you are on floors one through three, please walk to the Main Lobby using the nearest exit signs. Guests on floors four and five should use the West stairwell and meet staff outside the garden door. Guests on floors six through ten who may have difficulty using stairs should go to the refuge area beside the service elevators and wait for hotel staff. Please do not use the guest elevators during the drill. The parking entrance is being used by employees who are checking emergency lights, so guests should not gather there.",
        "situation": "You are staying on the seventh floor of a hotel and cannot use stairs quickly. You hear an emergency announcement during a safety drill.",
        "questionText": "Where should you go?",
        "text": "Where should you go?",
        "choices": [
          "Refuge area",
          "Main Lobby",
          "West stairwell",
          "Parking entrance"
        ],
        "correct": 1,
        "explanation": "解説：7階にいて階段移動が難しいため、6-10階で階段利用が難しい人向けのrefuge areaへ行く。\n各選択肢：\n1. 正答。6-10階で階段が難しい客向け。\n2. 1-3階の客向け。\n3. 4-5階で階段を使える客向け。\n4. 従業員用の確認場所で、客は集まらない。"
      }
    ]
  },
  {
    "key": "set-02",
    "label": "第2回",
    "questions": [
      {
        "id": 1,
        "section": "第1部",
        "part": "Part 1",
        "instruction": "対話と最後の質問を聞き、最も適切な答えを4つから選んでください。",
        "voice": "Conversation",
        "audioFile": "",
        "script": "B: Have you finished revising the orientation guide for new employees?\nA: Almost. The information is accurate, but I’m not sure the instructions are clear to someone unfamiliar with our system.\nB: The manager wants the final version printed by Friday.\nA: I know. Could we ask two employees who joined last month to follow the instructions without any help?\nB: That might delay printing by a day, but it would reveal any confusing sections.\nA: Exactly. I’ll send them the draft this afternoon and revise it based on their comments.",
        "questionText": "What will the woman do?",
        "text": "What will the woman do?",
        "choices": [
          "Print the orientation guide immediately.",
          "Have recent employees test the instructions.",
          "Ask the manager to rewrite the guide.",
          "Remove the unfamiliar parts from the system."
        ],
        "correct": 2,
        "explanation": "女性は、新入社員に説明書を実際に使ってもらい、分かりにくい部分を確認してから修正すると述べています。"
      },
      {
        "id": 2,
        "section": "第1部",
        "part": "Part 1",
        "instruction": "対話と最後の質問を聞き、最も適切な答えを4つから選んでください。",
        "voice": "Conversation",
        "audioFile": "",
        "script": "A: Our group presentation is next week, but the charts still aren’t finished.\nB: Has Owen fallen behind again?\nA: I thought so at first, but he says he didn’t know he was responsible for them.\nB: Didn’t you assign everyone’s tasks at the first meeting?\nA: We discussed the main sections, but we never wrote down who would prepare each visual.\nB: Then the problem isn’t necessarily Owen’s effort.\nA: Right. We need to clarify everyone’s responsibilities before dividing up the remaining work.",
        "questionText": "What is the group’s main problem?",
        "text": "What is the group’s main problem?",
        "choices": [
          "The presentation date was changed unexpectedly.",
          "Owen refuses to prepare any visual materials.",
          "The charts contain inaccurate research results.",
          "The members’ responsibilities were not clearly assigned."
        ],
        "correct": 4,
        "explanation": "メンバーごとの担当を明確に決めていなかったことが問題です。Owenの努力不足だとは断定されていません。"
      },
      {
        "id": 3,
        "section": "第1部",
        "part": "Part 1",
        "instruction": "対話と最後の質問を聞き、最も適切な答えを4つから選んでください。",
        "voice": "Conversation",
        "audioFile": "",
        "script": "B: I think my mother should move closer to us. Since she injured her wrist, even grocery shopping has been difficult.\nA: Has she said she wants to move?\nB: No. She insists she can manage, but I’m worried.\nA: Her injury is temporary, and she values her independence. Why not arrange grocery deliveries and visit her more often for now?\nB: You think moving would be too drastic?\nA: At least until you know whether she’ll still need help after her wrist heals.",
        "questionText": "What does the woman suggest?",
        "text": "What does the woman suggest?",
        "choices": [
          "Arrange temporary support before considering a move.",
          "Ask his mother to move immediately.",
          "Do all of his mother’s shopping himself.",
          "Wait until his mother requests assistance."
        ],
        "correct": 1,
        "explanation": "女性は、母親をすぐに引っ越させるのではなく、食料品の配達や訪問回数を増やして一時的に支えるよう提案しています。"
      },
      {
        "id": 4,
        "section": "第1部",
        "part": "Part 1",
        "instruction": "対話と最後の質問を聞き、最も適切な答えを4つから選んでください。",
        "voice": "Conversation",
        "audioFile": "",
        "script": "A: I was charged for another month of the fitness app, although I thought I had canceled it.\nB: Let me check your account. It appears you turned off promotional emails but didn’t cancel the membership itself.\nA: I must have misunderstood the settings. Can the charge be refunded?\nB: I’m afraid monthly payments are nonrefundable once the new period begins.\nA: Then please make sure it doesn’t renew again.\nB: Certainly. You’ll still have access until the end of this billing period.\nA: That’s fine. I may as well use it until then.",
        "questionText": "What will the man do?",
        "text": "What will the man do?",
        "choices": [
          "Refund the woman’s latest monthly payment.",
          "Remove the app from the woman’s device.",
          "Prevent the membership from renewing again.",
          "End the woman’s access immediately."
        ],
        "correct": 3,
        "explanation": "返金はできませんが、男性は次回以降の自動更新を停止します。現在の利用期間が終わるまでは使用できます。"
      },
      {
        "id": 5,
        "section": "第1部",
        "part": "Part 1",
        "instruction": "対話と最後の質問を聞き、最も適切な答えを4つから選んでください。",
        "voice": "Conversation",
        "audioFile": "",
        "script": "B: I’ve been waking up several times during the night, even on days when I exercise.\nA: Did your doctor identify a cause?\nB: Not exactly. She asked about my habits and seemed concerned that I drink coffee late in the afternoon.\nA: Caffeine can remain in your system longer than people expect.\nB: She suggested avoiding it after lunch and recording how well I sleep for two weeks.\nA: That sounds reasonable. The record should show whether it makes a difference.",
        "questionText": "What will the man probably do?",
        "text": "What will the man probably do?",
        "choices": [
          "Exercise less often during the next two weeks.",
          "Visit another doctor about his sleep.",
          "Avoid afternoon coffee and track his sleep.",
          "Replace coffee with a stronger energy drink."
        ],
        "correct": 3,
        "explanation": "男性は医師の助言に従い、昼食後のコーヒーを避け、2週間の睡眠状態を記録する可能性が高いです。"
      },
      {
        "id": 6,
        "section": "第1部",
        "part": "Part 1",
        "instruction": "対話と最後の質問を聞き、最も適切な答えを4つから選んでください。",
        "voice": "Conversation",
        "audioFile": "",
        "script": "A: I’m calling about the room I reserved for Friday. My aunt has difficulty using stairs, so we need the elevator.\nB: The elevator is currently being repaired, but the work is expected to be completed on Tuesday.\nA: Is that date guaranteed?\nB: Not yet. The technician will inspect it tomorrow and confirm the schedule.\nA: I don’t want to cancel the reservation unnecessarily.\nB: Would you like me to contact you as soon as we receive confirmation?\nA: Yes, please. Then I can decide whether we need another hotel.",
        "questionText": "What does the woman ask the man to do?",
        "text": "What does the woman ask the man to do?",
        "choices": [
          "Cancel her reservation without charging a fee.",
          "Contact her when the repair schedule is confirmed.",
          "Reserve a room on the hotel’s ground floor.",
          "Arrange transportation to another nearby hotel."
        ],
        "correct": 2,
        "explanation": "女性は予約をすぐには取り消さず、エレベーターの修理日程が確定したら連絡してほしいと依頼しています。"
      },
      {
        "id": 7,
        "section": "第1部",
        "part": "Part 1",
        "instruction": "対話と最後の質問を聞き、最も適切な答えを4つから選んでください。",
        "voice": "Conversation",
        "audioFile": "",
        "script": "B: I may have to stop volunteering at the library on Wednesday evenings.\nA: That’s a shame. You’ve been helping with the children’s program for nearly two years.\nB: I enjoy it, but my professional certification exam is in three months.\nA: Could someone take your shift until the exam is over?\nB: That would be ideal. I don’t want to leave permanently, but I need more study time for a while.\nA: I’ll ask the other volunteers whether they can share your duties.\nB: I’d appreciate that. I could return to my regular schedule after the exam.",
        "questionText": "What does the man imply?",
        "text": "What does the man imply?",
        "choices": [
          "He no longer enjoys working with children.",
          "He plans to leave the library permanently.",
          "He wants to take his exam at a later date.",
          "He wants a temporary break from his regular shift."
        ],
        "correct": 4,
        "explanation": "男性は永久に辞めたいのではなく、資格試験が終わるまで一時的に担当を休みたいと考えています。"
      },
      {
        "id": 8,
        "section": "第1部",
        "part": "Part 1",
        "instruction": "対話と最後の質問を聞き、最も適切な答えを4つから選んでください。",
        "voice": "Conversation",
        "audioFile": "",
        "script": "A: The company offered me the position, and I’d be allowed to work from home twice a week.\nB: That sounds like what you wanted. Why haven’t you accepted?\nA: New employees must spend the first month training at the company’s regional office.\nB: Is that much farther away than the regular office?\nA: Yes. The journey would take nearly two hours each way.\nB: Could you stay near the regional office during the week?\nA: Possibly, but I need to find out whether the company would help with accommodation costs.",
        "questionText": "What is the woman’s main concern?",
        "text": "What is the woman’s main concern?",
        "choices": [
          "The temporary training location is extremely inconvenient.",
          "The regular position offers too little remote work.",
          "The company has not officially offered her the job.",
          "The regional office provides inadequate training."
        ],
        "correct": 1,
        "explanation": "女性が問題にしているのは、入社後1か月間の研修場所まで片道約2時間かかることです。"
      },
      {
        "id": 9,
        "section": "第1部",
        "part": "Part 1",
        "instruction": "対話と最後の質問を聞き、最も適切な答えを4つから選んでください。",
        "voice": "Conversation",
        "audioFile": "",
        "script": "B: The people in the apartment above mine have been making noise late at night.\nA: Have you spoken to them?\nB: Once. They apologized, but the noise started again a few days later.\nA: Before contacting the landlord, you should record the dates and times when it happens.\nB: Why is that necessary?\nA: A detailed record will show that this is an ongoing problem rather than a single incident.\nB: That makes sense. I’ll start keeping one tonight.",
        "questionText": "What does the woman advise the man to do?",
        "text": "What does the woman advise the man to do?",
        "choices": [
          "Speak to the neighbors every night.",
          "Keep a record of the repeated noise.",
          "Move to another apartment immediately.",
          "Ask the landlord to visit the neighbors."
        ],
        "correct": 2,
        "explanation": "女性は、継続的な問題であることを示すため、騒音が発生した日時を記録するよう助言しています。"
      },
      {
        "id": 10,
        "section": "第1部",
        "part": "Part 1",
        "instruction": "対話と最後の質問を聞き、最も適切な答えを4つから選んでください。",
        "voice": "Conversation",
        "audioFile": "",
        "script": "A: Have you chosen photographs for the club exhibition?\nB: Most of them. The theme is city architecture, so I selected pictures of modern office buildings.\nA: They’re technically impressive, but the collection feels somewhat limited.\nB: Do you think I should use photographs from another city?\nA: Not necessarily. Markets, stations, and older houses are also part of the city’s architecture.\nB: So you think I’ve interpreted the theme too narrowly.\nA: Yes. Some of your other photographs would make the exhibition more varied.",
        "questionText": "How does the woman feel about the man’s selection?",
        "text": "How does the woman feel about the man’s selection?",
        "choices": [
          "The photographs were taken in the wrong city.",
          "The photographs are technically poor.",
          "The exhibition should focus only on old houses.",
          "The selection represents the theme too narrowly."
        ],
        "correct": 4,
        "explanation": "女性は写真の技術的な質ではなく、男性が『都市建築』というテーマを現代的なオフィスビルだけに限定しすぎていると考えています。"
      },
      {
        "id": 11,
        "section": "第1部",
        "part": "Part 1",
        "instruction": "対話と最後の質問を聞き、最も適切な答えを4つから選んでください。",
        "voice": "Conversation",
        "audioFile": "",
        "script": "B: I’m having trouble balancing my evening statistics course with my part-time job.\nA: Can your employer reduce your hours until the course ends?\nB: I asked, but the store is already short of staff.\nA: Would it be possible to take the course next semester instead?\nB: Yes. It isn’t required for my current program, and my other two courses are more important.\nA: Then postponing it sounds more sensible than giving up the job you need.\nB: I agree. I’ll withdraw from statistics and register again later.",
        "questionText": "What has the man decided to do?",
        "text": "What has the man decided to do?",
        "choices": [
          "Postpone the statistics course until a later semester.",
          "Leave his part-time job before the course ends.",
          "Replace his two important courses with statistics.",
          "Ask another employee to attend the course."
        ],
        "correct": 1,
        "explanation": "男性は必要な仕事を辞めず、重要度の低い統計学の授業を今学期は取りやめ、後の学期に受講すると決めています。"
      },
      {
        "id": 12,
        "section": "第1部",
        "part": "Part 1",
        "instruction": "対話と最後の質問を聞き、最も適切な答えを4つから選んでください。",
        "voice": "Conversation",
        "audioFile": "",
        "script": "A: Sophie says she doesn’t want to continue her piano lessons.\nB: Is she no longer interested in music?\nA: She still plays at home. She just becomes anxious whenever her teacher mentions the regional competition.\nB: Perhaps the competition has made the lessons feel like an obligation.\nA: That’s what I’m thinking. Her music school also offers a group class without exams or competitions.\nB: We could ask whether she’d prefer that before allowing her to quit completely.\nA: Agreed. She may enjoy playing again if there’s less pressure.",
        "questionText": "What will the speakers probably do?",
        "text": "What will the speakers probably do?",
        "choices": [
          "Encourage Sophie to enter the regional competition.",
          "Allow Sophie to stop playing piano completely.",
          "Find Sophie a more demanding piano teacher.",
          "Ask Sophie about joining a less competitive class."
        ],
        "correct": 4,
        "explanation": "二人はピアノを完全にやめさせる前に、試験や大会のない、負担の少ないグループ授業を本人に提案する予定です。"
      },
      {
        "id": 13,
        "section": "第2部",
        "part": "Part 2",
        "instruction": "英文と質問を聞き、内容に最も合う4つの選択肢から選んでください。",
        "voice": "Narration",
        "audioFile": "",
        "script": "The Pony Express\nThe Pony Express is often remembered as a symbol of frontier courage, but it was created to solve a practical communication problem. In 1860, many people were moving west, and California needed faster contact with the eastern United States. Riders carried mail in relays from Missouri to California, changing horses at stations along the route. A letter could cross the distance in about ten days, which was much faster than earlier methods. This speed mattered to newspapers, businesses, and officials.\nThe service was impressive, but it was also expensive and short-lived. Congress soon supported a transcontinental telegraph line, and as the wires advanced, messages could travel instantly between connected towns. When San Francisco and New York were linked by telegraph in 1861, the Pony Express was no longer needed. Although it operated for only about eighteen months, its dramatic image survived far longer than its business model.",
        "questionText": "Why was the Pony Express created?",
        "text": "Why was the Pony Express created?",
        "choices": [
          "To train riders for the army.",
          "To replace newspapers in California.",
          "To carry passengers across the mountains.",
          "To speed communication with the West."
        ],
        "correct": 4,
        "explanation": "正答は4です。Paragraph 1: To speed communication with the West."
      },
      {
        "id": 14,
        "section": "第2部",
        "part": "Part 2",
        "instruction": "英文と質問を聞き、内容に最も合う4つの選択肢から選んでください。",
        "voice": "Narration",
        "audioFile": "",
        "script": "The Pony Express\nThe Pony Express is often remembered as a symbol of frontier courage, but it was created to solve a practical communication problem. In 1860, many people were moving west, and California needed faster contact with the eastern United States. Riders carried mail in relays from Missouri to California, changing horses at stations along the route. A letter could cross the distance in about ten days, which was much faster than earlier methods. This speed mattered to newspapers, businesses, and officials.\nThe service was impressive, but it was also expensive and short-lived. Congress soon supported a transcontinental telegraph line, and as the wires advanced, messages could travel instantly between connected towns. When San Francisco and New York were linked by telegraph in 1861, the Pony Express was no longer needed. Although it operated for only about eighteen months, its dramatic image survived far longer than its business model.",
        "questionText": "Why did the service become unnecessary?",
        "text": "Why did the service become unnecessary?",
        "choices": [
          "The route became too dangerous.",
          "Telegraph service connected distant cities.",
          "Newspapers stopped using western mail.",
          "California no longer needed contact."
        ],
        "correct": 2,
        "explanation": "正答は2です。Paragraph 2: Telegraph service connected distant cities."
      },
      {
        "id": 15,
        "section": "第2部",
        "part": "Part 2",
        "instruction": "英文と質問を聞き、内容に最も合う4つの選択肢から選んでください。",
        "voice": "Narration",
        "audioFile": "",
        "script": "A Vault for Seeds\nThe Svalbard Global Seed Vault was built to protect crop diversity, not to replace ordinary gene banks. Around the world, researchers store seeds from food plants so future farmers can use traits such as disease resistance or drought tolerance. The vault, located inside a frozen mountain in Norway's Arctic region, keeps duplicate seed samples as a backup. If a national collection is damaged by war, disaster, funding cuts, or equipment failure, the stored copies can help restore it.\nThe vault works under what are called black box conditions. The boxes are not opened by the vault staff, and the depositing gene bank still owns the seeds. This arrangement builds trust because countries are not giving away control of valuable genetic material. The Arctic location and artificial cooling help keep the seeds cold, but the facility has also been upgraded to handle a warmer and wetter climate securely.",
        "questionText": "What is the vault's main purpose?",
        "text": "What is the vault's main purpose?",
        "choices": [
          "To sell seeds to farmers directly.",
          "To grow crops in Arctic conditions.",
          "To keep backup copies of seeds.",
          "To replace national gene banks."
        ],
        "correct": 3,
        "explanation": "正答は3です。Paragraph 1: To keep backup copies of seeds."
      },
      {
        "id": 16,
        "section": "第2部",
        "part": "Part 2",
        "instruction": "英文と質問を聞き、内容に最も合う4つの選択肢から選んでください。",
        "voice": "Narration",
        "audioFile": "",
        "script": "A Vault for Seeds\nThe Svalbard Global Seed Vault was built to protect crop diversity, not to replace ordinary gene banks. Around the world, researchers store seeds from food plants so future farmers can use traits such as disease resistance or drought tolerance. The vault, located inside a frozen mountain in Norway's Arctic region, keeps duplicate seed samples as a backup. If a national collection is damaged by war, disaster, funding cuts, or equipment failure, the stored copies can help restore it.\nThe vault works under what are called black box conditions. The boxes are not opened by the vault staff, and the depositing gene bank still owns the seeds. This arrangement builds trust because countries are not giving away control of valuable genetic material. The Arctic location and artificial cooling help keep the seeds cold, but the facility has also been upgraded to handle a warmer and wetter climate securely.",
        "questionText": "Why are black box conditions important?",
        "text": "Why are black box conditions important?",
        "choices": [
          "They make seeds grow faster.",
          "They reduce the need for cooling.",
          "They let vault staff inspect every seed.",
          "They help depositors keep control."
        ],
        "correct": 4,
        "explanation": "正答は4です。Paragraph 2: They help depositors keep control."
      },
      {
        "id": 17,
        "section": "第2部",
        "part": "Part 2",
        "instruction": "英文と質問を聞き、内容に最も合う4つの選択肢から選んでください。",
        "voice": "Narration",
        "audioFile": "",
        "script": "Octopus Arms\nAn octopus does not control its body in the same way most animals do. Each of its eight arms is covered with suckers that can feel and taste the surroundings, and a large share of the animal's neurons are located outside the central brain. This unusual arrangement helps the arms handle complex movements, such as reaching, twisting, and grasping, without waiting for every small command from the brain. It reduces the burden on one central controller.\nScientists once described octopus arms as if they almost had minds of their own. Recent studies, however, suggest a more connected system. In experiments, octopuses learned to send one arm through a maze to reach food, even when the arm could not be seen. The results indicate that the arm supplies information, while the central brain still plays a role in choosing the correct movement, rather than leaving the arm fully independent.",
        "questionText": "What is unusual about octopus arms?",
        "text": "What is unusual about octopus arms?",
        "choices": [
          "They contain no sensory organs.",
          "They move only by fixed reflexes.",
          "They hold many of the animal's neurons.",
          "They are controlled by eight eyes."
        ],
        "correct": 3,
        "explanation": "正答は3です。Paragraph 1: They hold many of the animal's neurons."
      },
      {
        "id": 18,
        "section": "第2部",
        "part": "Part 2",
        "instruction": "英文と質問を聞き、内容に最も合う4つの選択肢から選んでください。",
        "voice": "Narration",
        "audioFile": "",
        "script": "Octopus Arms\nAn octopus does not control its body in the same way most animals do. Each of its eight arms is covered with suckers that can feel and taste the surroundings, and a large share of the animal's neurons are located outside the central brain. This unusual arrangement helps the arms handle complex movements, such as reaching, twisting, and grasping, without waiting for every small command from the brain. It reduces the burden on one central controller.\nScientists once described octopus arms as if they almost had minds of their own. Recent studies, however, suggest a more connected system. In experiments, octopuses learned to send one arm through a maze to reach food, even when the arm could not be seen. The results indicate that the arm supplies information, while the central brain still plays a role in choosing the correct movement, rather than leaving the arm fully independent.",
        "questionText": "What did recent studies suggest?",
        "text": "What did recent studies suggest?",
        "choices": [
          "The arms work with the brain.",
          "The brain cannot learn routes.",
          "Maze experiments are impossible.",
          "Octopuses use vision only."
        ],
        "correct": 1,
        "explanation": "正答は1です。Paragraph 2: The arms work with the brain."
      },
      {
        "id": 19,
        "section": "第2部",
        "part": "Part 2",
        "instruction": "英文と質問を聞き、内容に最も合う4つの選択肢から選んでください。",
        "voice": "Narration",
        "audioFile": "",
        "script": "MRI Scans\nMagnetic resonance imaging, or MRI, lets doctors see detailed images inside the body without using X-rays or cutting into the patient. Instead, the scanner uses a strong magnetic field, radio waves, and computer processing. This makes MRI especially useful for soft tissues such as the brain, muscles, and organs. Because it does not use ionizing radiation, it can be preferred when doctors need detailed images and want to avoid unnecessary radiation exposure, especially in some clinical cases.\nMRI is not risk-free, however. The strong magnet can pull on certain metal objects or medical implants, so careful screening is required before a patient enters the scanner room. Radiofrequency energy can also cause heating, and the machine's loud knocking sounds make ear protection important. Another practical limitation is that patients must stay very still; movement can reduce image quality and make the scan less useful, especially during longer examinations.",
        "questionText": "Why can MRI be useful to doctors?",
        "text": "Why can MRI be useful to doctors?",
        "choices": [
          "It creates detailed images without X-rays.",
          "It repairs damaged organs directly.",
          "It removes all need for screening.",
          "It works only on bones."
        ],
        "correct": 1,
        "explanation": "正答は1です。Paragraph 1: It creates detailed images without X-rays."
      },
      {
        "id": 20,
        "section": "第2部",
        "part": "Part 2",
        "instruction": "英文と質問を聞き、内容に最も合う4つの選択肢から選んでください。",
        "voice": "Narration",
        "audioFile": "",
        "script": "MRI Scans\nMagnetic resonance imaging, or MRI, lets doctors see detailed images inside the body without using X-rays or cutting into the patient. Instead, the scanner uses a strong magnetic field, radio waves, and computer processing. This makes MRI especially useful for soft tissues such as the brain, muscles, and organs. Because it does not use ionizing radiation, it can be preferred when doctors need detailed images and want to avoid unnecessary radiation exposure, especially in some clinical cases.\nMRI is not risk-free, however. The strong magnet can pull on certain metal objects or medical implants, so careful screening is required before a patient enters the scanner room. Radiofrequency energy can also cause heating, and the machine's loud knocking sounds make ear protection important. Another practical limitation is that patients must stay very still; movement can reduce image quality and make the scan less useful, especially during longer examinations.",
        "questionText": "What is one safety issue with MRI?",
        "text": "What is one safety issue with MRI?",
        "choices": [
          "It always exposes patients to X-rays.",
          "It turns soft tissue into metal.",
          "Its magnet can pull certain objects.",
          "It cannot be used with computers."
        ],
        "correct": 3,
        "explanation": "正答は3です。Paragraph 2: Its magnet can pull certain objects."
      },
      {
        "id": 21,
        "section": "第2部",
        "part": "Part 2",
        "instruction": "英文と質問を聞き、内容に最も合う4つの選択肢から選んでください。",
        "voice": "Narration",
        "audioFile": "",
        "script": "Bird-Friendly Coffee\nCoffee can be grown in very different ways. On some farms, trees are removed so coffee plants grow in open sun, which can increase production but reduces habitat. Shade-grown coffee is raised beneath a canopy of trees and other plants. Smithsonian's Bird Friendly program promotes farms that keep this layered vegetation, because it provides food and shelter for migratory and local birds in tropical regions. Such farms can resemble simplified forests.\nThe idea connects consumer choices with conservation. When roasters and shoppers choose certified coffee, they support farmers who maintain forest-like conditions instead of clearing land completely. The approach does not mean every coffee farm becomes a nature reserve, and it may require more careful management than sun-grown systems. Still, it shows how an everyday product can be linked to habitat protection far from where it is finally consumed. This matters because many migratory birds spend winter there.",
        "questionText": "What is one feature of shade-grown coffee?",
        "text": "What is one feature of shade-grown coffee?",
        "choices": [
          "It requires farms to remove all trees.",
          "It grows beneath layered vegetation.",
          "It is produced only in cold regions.",
          "It prevents birds from entering farms."
        ],
        "correct": 2,
        "explanation": "正答は2です。Paragraph 1: It grows beneath layered vegetation."
      },
      {
        "id": 22,
        "section": "第2部",
        "part": "Part 2",
        "instruction": "英文と質問を聞き、内容に最も合う4つの選択肢から選んでください。",
        "voice": "Narration",
        "audioFile": "",
        "script": "Bird-Friendly Coffee\nCoffee can be grown in very different ways. On some farms, trees are removed so coffee plants grow in open sun, which can increase production but reduces habitat. Shade-grown coffee is raised beneath a canopy of trees and other plants. Smithsonian's Bird Friendly program promotes farms that keep this layered vegetation, because it provides food and shelter for migratory and local birds in tropical regions. Such farms can resemble simplified forests.\nThe idea connects consumer choices with conservation. When roasters and shoppers choose certified coffee, they support farmers who maintain forest-like conditions instead of clearing land completely. The approach does not mean every coffee farm becomes a nature reserve, and it may require more careful management than sun-grown systems. Still, it shows how an everyday product can be linked to habitat protection far from where it is finally consumed. This matters because many migratory birds spend winter there.",
        "questionText": "What does the program show?",
        "text": "What does the program show?",
        "choices": [
          "Coffee farming cannot support wildlife.",
          "Consumers must stop drinking coffee.",
          "Certification removes all farm challenges.",
          "A product can support distant habitats."
        ],
        "correct": 4,
        "explanation": "正答は4です。Paragraph 2: A product can support distant habitats."
      },
      {
        "id": 23,
        "section": "第2部",
        "part": "Part 2",
        "instruction": "英文と質問を聞き、内容に最も合う4つの選択肢から選んでください。",
        "voice": "Narration",
        "audioFile": "",
        "script": "Domesday Book\nIn 1086, William the Conqueror ordered a survey of much of England. The result became known as Domesday Book. Officials recorded who held land, how it was used, and what resources, workers, and animals were connected to each estate. Entries were organized by county and estate. The survey helped the king understand the wealth of his new kingdom and the payments that could be expected from landholders. It also strengthened royal control after conquest.\nFor modern historians, the book is valuable for a different reason. It gives a rare detailed picture of society soon after the Norman Conquest, including patterns of land ownership and local economic life. However, it was not a neutral census in the modern sense. It was created for royal administration, so it reflects the interests of the government that ordered it. That purpose must be remembered when interpreting its details as historical evidence.",
        "questionText": "Why did William order the survey?",
        "text": "Why did William order the survey?",
        "choices": [
          "To collect stories about battles.",
          "To choose a new royal language.",
          "To understand land and wealth.",
          "To replace all local officials."
        ],
        "correct": 3,
        "explanation": "正答は3です。Paragraph 1: To understand land and wealth."
      },
      {
        "id": 24,
        "section": "第2部",
        "part": "Part 2",
        "instruction": "英文と質問を聞き、内容に最も合う4つの選択肢から選んでください。",
        "voice": "Narration",
        "audioFile": "",
        "script": "Domesday Book\nIn 1086, William the Conqueror ordered a survey of much of England. The result became known as Domesday Book. Officials recorded who held land, how it was used, and what resources, workers, and animals were connected to each estate. Entries were organized by county and estate. The survey helped the king understand the wealth of his new kingdom and the payments that could be expected from landholders. It also strengthened royal control after conquest.\nFor modern historians, the book is valuable for a different reason. It gives a rare detailed picture of society soon after the Norman Conquest, including patterns of land ownership and local economic life. However, it was not a neutral census in the modern sense. It was created for royal administration, so it reflects the interests of the government that ordered it. That purpose must be remembered when interpreting its details as historical evidence.",
        "questionText": "What should historians remember about the book?",
        "text": "What should historians remember about the book?",
        "choices": [
          "It served royal administration.",
          "It ignored land ownership.",
          "It was written for tourists.",
          "It avoided economic information."
        ],
        "correct": 1,
        "explanation": "正答は1です。Paragraph 2: It served royal administration."
      },
      {
        "id": 25,
        "section": "第3部",
        "part": "Part 3",
        "instruction": "SituationとQuestionを読んだ後、放送を聞き、条件に最も合う選択肢を選んでください。",
        "voice": "Narration",
        "audioFile": "",
        "script": "B: This is a message from ClearPath Delivery about your school order. The driver could not leave the package at the school office because it contains temperature-sensitive materials. The Front Desk at our local branch closes at 4:30 and does not have a refrigerator. Evening Locker pickup is available until 9, but those lockers are for books and clothing only. Your package has been moved to the Cold Storage Counter at the branch behind City Hall. That counter stays open until 7, and the box will remain chilled there. Neighbor Pickup is available for ordinary parcels, but not for refrigerated items.",
        "situation": "You ordered science materials for tomorrow's class. You cannot leave school before 5 p.m., and the package must stay refrigerated. You hear a delivery message.",
        "questionText": "Where should you collect it?",
        "text": "Where should you collect it?",
        "choices": [
          "Front Desk",
          "Evening Locker",
          "Neighbor Pickup",
          "Cold Storage Counter"
        ],
        "correct": 4,
        "explanation": "解説：5時以降しか行けず、冷蔵保管が必要。Cold Storage Counterは7時まで開き、冷蔵保管される。\n各選択肢：\n1. 4:30に閉まり、冷蔵設備もない。\n2. 9時まで使えるが、冷蔵品不可。\n3. 普通の荷物のみで、冷蔵品は不可。\n4. 正答。7時まで開き、冷蔵保管される。"
      },
      {
        "id": 26,
        "section": "第3部",
        "part": "Part 3",
        "instruction": "SituationとQuestionを読んだ後、放送を聞き、条件に最も合う選択肢を選んでください。",
        "voice": "Narration",
        "audioFile": "",
        "script": "A: Our Saturday technology day has four sessions left. App Basics is designed for beginners, but it is mainly a demonstration by the instructor, with only a short question period at the end. Career Talk is useful for students considering computer jobs, though no computers are used. Web Lab is for people with no website experience. Each student works at a computer and creates a simple page before leaving. Advanced Python includes several programming exercises, but students should already understand variables and functions. If your students need to actually try building something for the first time, choose carefully.",
        "situation": "You are choosing a Saturday workshop for students who have never made a website. They need hands-on practice, not just a talk. You hear the organizer.",
        "questionText": "Which workshop is best?",
        "text": "Which workshop is best?",
        "choices": [
          "Web Lab",
          "App Basics",
          "Career Talk",
          "Advanced Python"
        ],
        "correct": 1,
        "explanation": "解説：Web制作未経験者向けで、実際に手を動かす練習が必要。Web Labだけが初心者対応かつ実践型。\n各選択肢：\n1. 正答。未経験者向けで、実際にページを作る。\n2. 初心者向けだが、実演中心で実践が少ない。\n3. 職業紹介で、PCを使った実践ではない。\n4. 演習はあるが、既習者向け。"
      },
      {
        "id": 27,
        "section": "第3部",
        "part": "Part 3",
        "instruction": "SituationとQuestionを読んだ後、放送を聞き、条件に最も合う選択肢を選んでください。",
        "voice": "Narration",
        "audioFile": "",
        "script": "B: May I have your attention, please. Flight 286 to Lakeport will no longer board at Gate 14. Because another aircraft is still using that gate, boarding has been moved to Gate 22, near the end of the same concourse. Passengers who already checked in should go directly to Gate 22 and keep the boarding passes they have now. You do not need to visit the Baggage Office; checked bags will be moved automatically. The Transfer Desk is only for passengers changing from Flight 286 to a later connection. Boarding will begin about fifteen minutes later than printed.",
        "situation": "You have already checked in for a flight to Lakeport and are not changing flights. Your boarding pass says Gate 14, but you hear an airport announcement.",
        "questionText": "Where should you go?",
        "text": "Where should you go?",
        "choices": [
          "Gate 14",
          "Gate 22",
          "Transfer Desk",
          "Baggage Office"
        ],
        "correct": 2,
        "explanation": "解説：チェックイン済みで便変更なし。Lakeport行きはGate 14からGate 22に変更され、直接向かえばよい。\n各選択肢：\n1. 元のゲートだが、変更された。\n2. 正答。新しい搭乗ゲート。\n3. 乗り継ぎ便を変更する人向け。\n4. 預け荷物は自動移動なので不要。"
      },
      {
        "id": 28,
        "section": "第3部",
        "part": "Part 3",
        "instruction": "SituationとQuestionを読んだ後、放送を聞き、条件に最も合う選択肢を選んでください。",
        "voice": "Narration",
        "audioFile": "",
        "script": "A: From what you described, the paper feeder is probably damaged. A remote reset can be done in fifteen minutes, but it clears stored templates and color settings, so you would need to rebuild the posters. Ink-head cleaning helps when colors are faint, not when paper will not move. We can do a same-day swap by bringing a replacement printer at 3:30 and copying your saved layouts to it before leaving. Full service repair would keep all files on the original machine, but a technician would take it away and return it in two business days.",
        "situation": "Your school club printer is jammed before a fair. You need color posters today, and the saved layout files must not be erased. You call support.",
        "questionText": "Which option should you request?",
        "text": "Which option should you request?",
        "choices": [
          "Remote reset",
          "Ink-head cleaning",
          "Same-day swap",
          "Full service"
        ],
        "correct": 3,
        "explanation": "解説：今日中にカラー印刷でき、保存済みレイアウトを消さない必要がある。Same-day swapは代替機にレイアウトをコピーし、3:30に対応できる。\n各選択肢：\n1. 早いが、保存テンプレートと設定が消える。\n2. 色が薄い時の対応で、紙詰まりには合わない。\n3. 正答。今日代替機を持参し、保存レイアウトも移す。\n4. 保存はできるが、返却が2営業日後。"
      },
      {
        "id": 29,
        "section": "第3部",
        "part": "Part 3",
        "instruction": "SituationとQuestionを読んだ後、放送を聞き、条件に最も合う選択肢を選んでください。",
        "voice": "Narration",
        "audioFile": "",
        "script": "B: Welcome to Lakeside Sports Center. Players who have not reserved courts should begin at the Main Office on the second floor, where staff can check open times. If you already made an online court reservation, please do not line up there. Court Desk staff beside the courts will confirm your time, but they cannot lend equipment. Rackets and balls are available at the Equipment Window beside the ground-floor entrance, and the clerk there can also print your court slip. The Balcony Counter has a good view of the courts, but it is only for tournament guests and is reached by stairs.",
        "situation": "You reserved a tennis court online. You still need to borrow rackets, and one player cannot use stairs. You hear a sports center announcement.",
        "questionText": "Where should you go first?",
        "text": "Where should you go first?",
        "choices": [
          "Court Desk",
          "Main Office",
          "Balcony Counter",
          "Equipment Window"
        ],
        "correct": 4,
        "explanation": "解説：オンライン予約済みでラケットを借りる必要があり、階段も避けたい。Equipment Windowが入口階で用具貸出と予約票印刷に対応。\n各選択肢：\n1. 未予約者向けの2階窓口。\n2. 予約確認はできるが、用具貸出不可。\n3. 大会客向けで、階段が必要。\n4. 正答。入口階で用具貸出と予約票印刷ができる。"
      }
    ]
  },
  {
    "key": "set-03",
    "label": "第3回",
    "questions": [
      {
        "id": 1,
        "section": "第1部",
        "part": "Part 1",
        "instruction": "対話と最後の質問を聞き、最も適切な答えを4つから選んでください。",
        "voice": "Conversation",
        "audioFile": "",
        "script": "A: Naomi, have you had a chance to review my proposal for the training program?\nB: Yes. The overall plan is practical, but the first session includes too much information for new employees.\nA: I thought covering everything early would save time later.\nB: It might, but people could miss the most important procedures. I’d focus on safety and daily routines first.\nA: Then I can move the less urgent material to a follow-up session.\nB: That would make the program easier to absorb without removing anything essential.",
        "questionText": "What does the man advise the woman to do?",
        "text": "What does the man advise the woman to do?",
        "choices": [
          "Cancel the follow-up training session.",
          "Divide the material into separate sessions.",
          "Remove the safety procedures from the program.",
          "Ask experienced employees to lead the training."
        ],
        "correct": 2,
        "explanation": "男性は、初回に情報を詰め込みすぎず、安全や日常業務を先に扱い、緊急性の低い内容を後の回へ移すよう助言しています。"
      },
      {
        "id": 2,
        "section": "第1部",
        "part": "Part 1",
        "instruction": "対話と最後の質問を聞き、最も適切な答えを4つから選んでください。",
        "voice": "Conversation",
        "audioFile": "",
        "script": "B: The shelter called. The dog we liked is ready for adoption.\nA: That’s exciting, but what will happen when both of us work late?\nB: I could come home during lunch on most days.\nA: Most days isn’t every day. After months in the shelter, the dog may need a stable routine.\nB: So you think we should wait?\nA: Not necessarily. First, we should find a reliable dog walker for days when neither of us can return.\nB: Fair enough. I’ll ask the shelter whether they can recommend someone.",
        "questionText": "What is the woman’s main concern?",
        "text": "What is the woman’s main concern?",
        "choices": [
          "The dog may be difficult to train.",
          "The shelter may charge an adoption fee.",
          "The man may dislike walking the dog.",
          "The dog may not receive consistent care."
        ],
        "correct": 4,
        "explanation": "女性が心配しているのは、二人とも帰れない日に世話が不安定になることです。犬の訓練や費用が中心ではありません。"
      },
      {
        "id": 3,
        "section": "第1部",
        "part": "Part 1",
        "instruction": "対話と最後の質問を聞き、最も適切な答えを4つから選んでください。",
        "voice": "Conversation",
        "audioFile": "",
        "script": "A: Did the librarian help you find sources for your history paper?\nB: Yes, but she pointed out that most of the articles I chose discuss events from a modern perspective.\nA: Isn’t that useful for evaluating their long-term importance?\nB: It is, but the assignment also requires evidence from people who experienced the period directly.\nA: Then you need letters, newspapers, or other records from that time.\nB: Exactly. I’ll use the archive database before I begin collecting material for the final draft.",
        "questionText": "What will the man do?",
        "text": "What will the man do?",
        "choices": [
          "Look for primary sources in the archive database.",
          "Change the historical period of his paper.",
          "Remove modern articles from his research.",
          "Ask the librarian to write part of his draft."
        ],
        "correct": 1,
        "explanation": "課題には当時の人々による資料も必要なため、男性はアーカイブのデータベースで一次資料を探します。"
      },
      {
        "id": 4,
        "section": "第1部",
        "part": "Part 1",
        "instruction": "対話と最後の質問を聞き、最も適切な答えを4つから選んでください。",
        "voice": "Conversation",
        "audioFile": "",
        "script": "B: Excuse me. My suitcase didn’t arrive on the flight from Denver.\nA: I’m sorry. Could I see your baggage receipt?\nB: Here it is. I’m attending a conference tomorrow morning, and my formal clothes are packed in the suitcase.\nA: The bag was placed on a later flight and should arrive tonight.\nB: Can it be delivered to my hotel? I won’t be able to return to the airport.\nA: Yes. Give me the hotel address, and we’ll message you when the driver leaves.",
        "questionText": "What will the woman arrange?",
        "text": "What will the woman arrange?",
        "choices": [
          "A refund for the man’s flight.",
          "A new conference registration.",
          "Delivery of the suitcase to his hotel.",
          "Transportation from the hotel to the airport."
        ],
        "correct": 3,
        "explanation": "女性は、後の便で到着するスーツケースを男性のホテルへ届ける手配をします。"
      },
      {
        "id": 5,
        "section": "第1部",
        "part": "Part 1",
        "instruction": "対話と最後の質問を聞き、最も適切な答えを4つから選んでください。",
        "voice": "Conversation",
        "audioFile": "",
        "script": "A: The community garden’s water bill was unusually high last month.\nB: Do you think one of the underground pipes is leaking?\nA: I checked the meter overnight, and it didn’t move while the taps were off.\nB: Then people may be watering too long in the hot weather. Several members leave sprinklers running while they work elsewhere. We could install timers so they shut off automatically.\nA: Good idea. That should reduce waste without limiting anyone’s access.",
        "questionText": "What does the man suggest?",
        "text": "What does the man suggest?",
        "choices": [
          "Replacing the underground water pipes.",
          "Closing the garden during hot weather.",
          "Installing timers on the sprinklers.",
          "Charging members for individual water use."
        ],
        "correct": 3,
        "explanation": "配管の漏れではなく、散水のしすぎが原因と考えられるため、男性は自動で止まるタイマーの設置を提案しています。"
      },
      {
        "id": 6,
        "section": "第1部",
        "part": "Part 1",
        "instruction": "対話と最後の質問を聞き、最も適切な答えを4つから選んでください。",
        "voice": "Conversation",
        "audioFile": "",
        "script": "B: How is your shoulder after physical therapy?\nA: It’s less painful, but the therapist wants me to come twice a week.\nB: Can you fit that around your work schedule?\nA: The clinic closes before I finish on weekdays.\nB: They have Saturday appointments, don’t they?\nA: Only in the morning, and I can’t go every Saturday.\nB: Could your manager let you leave early once a week?\nA: I’d rather not ask regularly, especially if treatment continues for months. I’ll look for a clinic with evening sessions.",
        "questionText": "What has the woman decided to do?",
        "text": "What has the woman decided to do?",
        "choices": [
          "Reduce her therapy to once a week.",
          "Change her work schedule permanently.",
          "Attend only Saturday morning sessions.",
          "Look for a clinic with evening appointments."
        ],
        "correct": 4,
        "explanation": "現在の診療所では平日に間に合わないため、女性は夜間診療のある別の施設を探すことにしています。"
      },
      {
        "id": 7,
        "section": "第1部",
        "part": "Part 1",
        "instruction": "対話と最後の質問を聞き、最も適切な答えを4つから選んでください。",
        "voice": "Conversation",
        "audioFile": "",
        "script": "A: I’m here to collect the bookshelf I ordered last week.\nB: I’m afraid the manufacturer sent the wider model by mistake.\nA: That won’t fit between my desk and the window.\nB: We can reorder the correct one, but delivery will take another ten days.\nA: I need storage sooner. Is the display model the right width?\nB: Yes. It has a small mark on the back, where it won’t normally be seen, so we can discount it.\nA: Since the mark won’t be visible, I’ll take the display model.",
        "questionText": "What has the woman decided to do?",
        "text": "What has the woman decided to do?",
        "choices": [
          "Buy the discounted display bookshelf.",
          "Wait for the correct new bookshelf.",
          "Move her desk away from the window.",
          "Accept the wider model that was delivered."
        ],
        "correct": 1,
        "explanation": "女性は10日待つ代わりに、見えない場所に小さな傷がある割引の展示品を購入します。"
      },
      {
        "id": 8,
        "section": "第1部",
        "part": "Part 1",
        "instruction": "対話と最後の質問を聞き、最も適切な答えを4つから選んでください。",
        "voice": "Conversation",
        "audioFile": "",
        "script": "B: I heard you turned down the chance to supervise the evening shift, even though you wanted more responsibility.\nA: For now. The schedule would interfere with my accounting course.\nB: I thought the course ended next month.\nA: The classes do.\nB: Then why not accept the position afterward?\nA: I’ll still need several weeks to prepare for the final examination.\nB: Could the company hold the position until then?\nA: They need someone immediately, so I said I’d be interested if a similar opening comes up later.",
        "questionText": "Why did the woman decline the position?",
        "text": "Why did the woman decline the position?",
        "choices": [
          "She was not interested in supervising employees.",
          "It conflicted with her current study commitments.",
          "The company refused to delay the examination.",
          "She wanted to transfer to the accounting department."
        ],
        "correct": 2,
        "explanation": "女性は役職に興味がないのではなく、講座と試験準備に支障が出るため、今回は断っています。"
      },
      {
        "id": 9,
        "section": "第1部",
        "part": "Part 1",
        "instruction": "対話と最後の質問を聞き、最も適切な答えを4つから選んでください。",
        "voice": "Conversation",
        "audioFile": "",
        "script": "A: Are you submitting that photograph of the fishing boats to the contest?\nB: I was planning to, but the image looks darker on my computer than it did on the camera.\nA: Could the screen settings be affecting it?\nB: Maybe. I increased the brightness, but I’m worried about editing it too much.\nA: The library has calibrated monitors for photography students. Why not check the image there before changing it again?\nB: I hadn’t thought of that. I’ll compare it on one of those monitors tomorrow.",
        "questionText": "What will the man probably do?",
        "text": "What will the man probably do?",
        "choices": [
          "Take another photograph of the boats.",
          "Check the image on a calibrated monitor.",
          "Withdraw from the photography contest.",
          "Increase the brightness on his camera."
        ],
        "correct": 2,
        "explanation": "男性は画像をさらに編集する前に、図書館の調整済みモニターで見え方を確認する予定です。"
      },
      {
        "id": 10,
        "section": "第1部",
        "part": "Part 1",
        "instruction": "対話と最後の質問を聞き、最も適切な答えを4つから選んでください。",
        "voice": "Conversation",
        "audioFile": "",
        "script": "B: Our electricity bill increased again, although we’ve used less heating.\nA: The utility website shows normal daytime use. Most of the increase happens overnight.\nB: Could the refrigerator be using too much power?\nA: Possibly, but the old water heater also runs at night.\nB: Should we replace it?\nA: Not before we know the cause. The company lends energy monitors free of charge, so let’s borrow one and test both appliances separately.",
        "questionText": "What will the speakers probably do?",
        "text": "What will the speakers probably do?",
        "choices": [
          "Use a monitor to identify the inefficient appliance.",
          "Replace both appliances immediately.",
          "Stop heating water during the night.",
          "Ask the utility company to reduce the bill."
        ],
        "correct": 1,
        "explanation": "原因を決めつけず、無料の電力計を借りて冷蔵庫と給湯器を別々に測定することにしています。"
      },
      {
        "id": 11,
        "section": "第1部",
        "part": "Part 1",
        "instruction": "対話と最後の質問を聞き、最も適切な答えを4つから選んでください。",
        "voice": "Conversation",
        "audioFile": "",
        "script": "A: Did you complete the museum’s volunteer training yesterday?\nB: The general session, yes. But I can’t lead school groups until I observe two experienced guides.\nA: I thought your teaching background would let you skip that requirement.\nB: So did I, but everyone must learn the museum’s preferred way of explaining its exhibits to visitors.\nA: Then you’ll observe the Tuesday and Thursday tours before you begin guiding school groups next weekend?",
        "questionText": "What do we learn about the man?",
        "text": "What do we learn about the man?",
        "choices": [
          "He has already led two school tours.",
          "He must repeat the general training session.",
          "He can skip observation because he has taught before.",
          "He needs to observe experienced guides first."
        ],
        "correct": 4,
        "explanation": "男性は一般研修を終えていますが、案内役になる前に経験者のツアーを2回見学する必要があります。"
      },
      {
        "id": 12,
        "section": "第1部",
        "part": "Part 1",
        "instruction": "対話と最後の質問を聞き、最も適切な答えを4つから選んでください。",
        "voice": "Conversation",
        "audioFile": "",
        "script": "B: The mechanic says repairing the transmission will cost more than expected.\nA: Is the rest of the car still in good condition?\nB: Mostly.\nA: Will it need any other major work soon?\nB: Probably new brakes before winter.\nA: Then such an expensive repair may not be reasonable.\nB: But another car would use nearly all our savings.\nA: Let’s manage with one car for a few months while we save more. It’ll be inconvenient, but safer than rushing into another purchase.",
        "questionText": "What will the speakers probably do?",
        "text": "What will the speakers probably do?",
        "choices": [
          "Repair both the transmission and brakes.",
          "Buy another car with all their savings.",
          "Use one car temporarily and save more money.",
          "Continue driving the damaged car until winter."
        ],
        "correct": 3,
        "explanation": "高額な修理や急な買い替えを避け、しばらく車1台で生活しながら資金を貯める案に傾いています。"
      },
      {
        "id": 13,
        "section": "第2部",
        "part": "Part 2",
        "instruction": "英文と質問を聞き、内容に最も合う4つの選択肢から選んでください。",
        "voice": "Narration",
        "audioFile": "",
        "script": "The Great Smog\nIn December 1952, London experienced a disaster now called the Great Smog. Cold weather led many residents to burn large amounts of coal for heat. At the same time, calm air trapped smoke and other pollutants close to the ground. The fog became so thick that transportation slowed, outdoor events were canceled, and many people had trouble breathing. The pollution was especially dangerous for the elderly and for people with heart or lung disease across the city.\nAt first, officials treated the smog mainly as a weather problem, but the number of deaths made the event impossible to ignore. Public pressure helped push Britain toward stronger air-pollution laws, including restrictions on smoky fuels in cities. The Great Smog therefore became more than a local tragedy. It showed that everyday heating choices, industrial smoke, and weather conditions could combine to create a major public health crisis for days.",
        "questionText": "What helped cause the Great Smog?",
        "text": "What helped cause the Great Smog?",
        "choices": [
          "A sudden shortage of coal.",
          "Coal smoke trapped near the ground.",
          "Too much rain in central London.",
          "Factories closing during winter."
        ],
        "correct": 2,
        "explanation": "正答は2です。Paragraph 1: Coal smoke trapped near the ground."
      },
      {
        "id": 14,
        "section": "第2部",
        "part": "Part 2",
        "instruction": "英文と質問を聞き、内容に最も合う4つの選択肢から選んでください。",
        "voice": "Narration",
        "audioFile": "",
        "script": "The Great Smog\nIn December 1952, London experienced a disaster now called the Great Smog. Cold weather led many residents to burn large amounts of coal for heat. At the same time, calm air trapped smoke and other pollutants close to the ground. The fog became so thick that transportation slowed, outdoor events were canceled, and many people had trouble breathing. The pollution was especially dangerous for the elderly and for people with heart or lung disease across the city.\nAt first, officials treated the smog mainly as a weather problem, but the number of deaths made the event impossible to ignore. Public pressure helped push Britain toward stronger air-pollution laws, including restrictions on smoky fuels in cities. The Great Smog therefore became more than a local tragedy. It showed that everyday heating choices, industrial smoke, and weather conditions could combine to create a major public health crisis for days.",
        "questionText": "How did the event affect Britain?",
        "text": "How did the event affect Britain?",
        "choices": [
          "It ended the use of all factories.",
          "It made coal cheaper for homes.",
          "It was treated as harmless fog.",
          "It encouraged stronger pollution laws."
        ],
        "correct": 4,
        "explanation": "正答は4です。Paragraph 2: It encouraged stronger pollution laws."
      },
      {
        "id": 15,
        "section": "第2部",
        "part": "Part 2",
        "instruction": "英文と質問を聞き、内容に最も合う4つの選択肢から選んでください。",
        "voice": "Narration",
        "audioFile": "",
        "script": "Coral Bleaching\nCorals may look like rocks, but they are living animals that often depend on tiny algae inside their tissues. These algae provide much of the coral's food through photosynthesis and also give many corals their color. When ocean water becomes too warm, the relationship can break down. The coral expels the algae, and its pale skeleton shows through the clear animal tissue, creating the white appearance known as bleaching during heat stress.\nBleaching does not mean the coral is already dead. If stressful conditions end soon enough, some corals can regain algae and recover. If the stress continues, however, the coral loses an important food source and becomes more likely to die. This is why marine scientists watch temperature changes closely. A short warming event may cause temporary damage, while repeated or prolonged heat can threaten entire reef ecosystems. The process can also affect reef animals that need shelter.",
        "questionText": "What happens during coral bleaching?",
        "text": "What happens during coral bleaching?",
        "choices": [
          "Corals become hard rocks permanently.",
          "Algae stop needing sunlight.",
          "Skeletons change into living animals.",
          "Corals lose algae from their tissues."
        ],
        "correct": 4,
        "explanation": "正答は4です。Paragraph 1: Corals lose algae from their tissues."
      },
      {
        "id": 16,
        "section": "第2部",
        "part": "Part 2",
        "instruction": "英文と質問を聞き、内容に最も合う4つの選択肢から選んでください。",
        "voice": "Narration",
        "audioFile": "",
        "script": "Coral Bleaching\nCorals may look like rocks, but they are living animals that often depend on tiny algae inside their tissues. These algae provide much of the coral's food through photosynthesis and also give many corals their color. When ocean water becomes too warm, the relationship can break down. The coral expels the algae, and its pale skeleton shows through the clear animal tissue, creating the white appearance known as bleaching during heat stress.\nBleaching does not mean the coral is already dead. If stressful conditions end soon enough, some corals can regain algae and recover. If the stress continues, however, the coral loses an important food source and becomes more likely to die. This is why marine scientists watch temperature changes closely. A short warming event may cause temporary damage, while repeated or prolonged heat can threaten entire reef ecosystems. The process can also affect reef animals that need shelter.",
        "questionText": "Why is prolonged bleaching dangerous?",
        "text": "Why is prolonged bleaching dangerous?",
        "choices": [
          "It makes reefs grow too quickly.",
          "It blocks all ocean sunlight.",
          "It leaves corals without key food.",
          "It turns algae into predators."
        ],
        "correct": 3,
        "explanation": "正答は3です。Paragraph 2: It leaves corals without key food."
      },
      {
        "id": 17,
        "section": "第2部",
        "part": "Part 2",
        "instruction": "英文と質問を聞き、内容に最も合う4つの選択肢から選んでください。",
        "voice": "Narration",
        "audioFile": "",
        "script": "CRISPR Questions\nCRISPR has made genome editing faster and more flexible than many earlier methods. Scientists can use it to target a particular stretch of DNA and change, remove, or replace genetic material. This has created hope for treating some inherited diseases and for improving research on how genes work. However, the technology is not simply a pair of perfect molecular scissors. Edits can sometimes occur in the wrong place or affect only some cells.\nThe most difficult debates involve human embryos and reproductive uses. If an edit is made in the germline, the change could be passed to future generations. Many researchers argue that studies should continue to improve safety, but that clinical reproductive use should not proceed until the risks and social consequences are understood. Critics also worry that expensive genome editing could increase inequality if only wealthy families can access it, weakening public trust over time.",
        "questionText": "What is one concern about CRISPR?",
        "text": "What is one concern about CRISPR?",
        "choices": [
          "It may edit unintended cells or places.",
          "It cannot target DNA at all.",
          "It works only in plants.",
          "It prevents research on genes."
        ],
        "correct": 1,
        "explanation": "正答は1です。Paragraph 1: It may edit unintended cells or places."
      },
      {
        "id": 18,
        "section": "第2部",
        "part": "Part 2",
        "instruction": "英文と質問を聞き、内容に最も合う4つの選択肢から選んでください。",
        "voice": "Narration",
        "audioFile": "",
        "script": "CRISPR Questions\nCRISPR has made genome editing faster and more flexible than many earlier methods. Scientists can use it to target a particular stretch of DNA and change, remove, or replace genetic material. This has created hope for treating some inherited diseases and for improving research on how genes work. However, the technology is not simply a pair of perfect molecular scissors. Edits can sometimes occur in the wrong place or affect only some cells.\nThe most difficult debates involve human embryos and reproductive uses. If an edit is made in the germline, the change could be passed to future generations. Many researchers argue that studies should continue to improve safety, but that clinical reproductive use should not proceed until the risks and social consequences are understood. Critics also worry that expensive genome editing could increase inequality if only wealthy families can access it, weakening public trust over time.",
        "questionText": "Why is germline editing controversial?",
        "text": "Why is germline editing controversial?",
        "choices": [
          "It cannot affect future children.",
          "Its changes may be inherited.",
          "It is already risk-free.",
          "It is used only in bacteria."
        ],
        "correct": 2,
        "explanation": "正答は2です。Paragraph 2: Its changes may be inherited."
      },
      {
        "id": 19,
        "section": "第2部",
        "part": "Part 2",
        "instruction": "英文と質問を聞き、内容に最も合う4つの選択肢から選んでください。",
        "voice": "Narration",
        "audioFile": "",
        "script": "Earthquake Alerts\nEarthquake early warning systems do not predict earthquakes before they begin. Instead, they detect the first signals from an earthquake that has already started and quickly estimate its location and strength. The USGS ShakeAlert system uses this information to send warnings before strong shaking reaches some populated areas. Even a few seconds can matter, giving people time to drop, cover, and hold on, or allowing machines to slow trains and open firehouse doors.\nThe warning time depends on distance from the earthquake and on how quickly the system processes information. People very close to the center may feel shaking before an alert arrives. Alerts can also be unnecessary if the quake weakens or if the estimated shaking changes. For that reason, early warning is best understood as a tool for reducing harm, not as a promise that everyone will receive advance notice before shaking starts in time.",
        "questionText": "What does ShakeAlert do?",
        "text": "What does ShakeAlert do?",
        "choices": [
          "It stops earthquakes from starting.",
          "It predicts quakes months ahead.",
          "It detects quakes already underway.",
          "It replaces building safety codes."
        ],
        "correct": 3,
        "explanation": "正答は3です。Paragraph 1: It detects quakes already underway."
      },
      {
        "id": 20,
        "section": "第2部",
        "part": "Part 2",
        "instruction": "英文と質問を聞き、内容に最も合う4つの選択肢から選んでください。",
        "voice": "Narration",
        "audioFile": "",
        "script": "Earthquake Alerts\nEarthquake early warning systems do not predict earthquakes before they begin. Instead, they detect the first signals from an earthquake that has already started and quickly estimate its location and strength. The USGS ShakeAlert system uses this information to send warnings before strong shaking reaches some populated areas. Even a few seconds can matter, giving people time to drop, cover, and hold on, or allowing machines to slow trains and open firehouse doors.\nThe warning time depends on distance from the earthquake and on how quickly the system processes information. People very close to the center may feel shaking before an alert arrives. Alerts can also be unnecessary if the quake weakens or if the estimated shaking changes. For that reason, early warning is best understood as a tool for reducing harm, not as a promise that everyone will receive advance notice before shaking starts in time.",
        "questionText": "What is one limitation of early warning?",
        "text": "What is one limitation of early warning?",
        "choices": [
          "Alerts can only be sent by train.",
          "It works after all shaking ends.",
          "It ignores earthquake strength.",
          "Nearby people may not get warning first."
        ],
        "correct": 4,
        "explanation": "正答は4です。Paragraph 2: Nearby people may not get warning first."
      },
      {
        "id": 21,
        "section": "第2部",
        "part": "Part 2",
        "instruction": "英文と質問を聞き、内容に最も合う4つの選択肢から選んでください。",
        "voice": "Narration",
        "audioFile": "",
        "script": "The Erie Canal\nWhen the Erie Canal opened in 1825, it created a water route across New York State between the Hudson River and the Great Lakes. Before the canal, moving goods over land was slow and expensive. Canal boats allowed heavy products to travel more cheaply, and passengers could cross the state faster than by stagecoach. The route helped connect farms and towns in the interior with markets on the Atlantic coast, especially New York City. This made distant communities feel economically closer.\nThe canal also changed the places along its path. Towns grew around locks, warehouses, and repair services, while New York City strengthened its position as a major port. Later, railroads reduced the canal's importance for commercial transport. Still, the waterway did not simply disappear. Today, parts of the canal system are used for recreation, tourism, and local heritage, showing how old infrastructure can gain new roles.",
        "questionText": "What was one effect of the Erie Canal?",
        "text": "What was one effect of the Erie Canal?",
        "choices": [
          "It ended Atlantic trade.",
          "It made transport cheaper.",
          "It removed all farms.",
          "It blocked passenger travel."
        ],
        "correct": 2,
        "explanation": "正答は2です。Paragraph 1: It made transport cheaper."
      },
      {
        "id": 22,
        "section": "第2部",
        "part": "Part 2",
        "instruction": "英文と質問を聞き、内容に最も合う4つの選択肢から選んでください。",
        "voice": "Narration",
        "audioFile": "",
        "script": "The Erie Canal\nWhen the Erie Canal opened in 1825, it created a water route across New York State between the Hudson River and the Great Lakes. Before the canal, moving goods over land was slow and expensive. Canal boats allowed heavy products to travel more cheaply, and passengers could cross the state faster than by stagecoach. The route helped connect farms and towns in the interior with markets on the Atlantic coast, especially New York City. This made distant communities feel economically closer.\nThe canal also changed the places along its path. Towns grew around locks, warehouses, and repair services, while New York City strengthened its position as a major port. Later, railroads reduced the canal's importance for commercial transport. Still, the waterway did not simply disappear. Today, parts of the canal system are used for recreation, tourism, and local heritage, showing how old infrastructure can gain new roles.",
        "questionText": "What happened after railroads expanded?",
        "text": "What happened after railroads expanded?",
        "choices": [
          "The canal gained new recreational roles.",
          "Locks and warehouses disappeared instantly.",
          "New York City lost all importance.",
          "The canal became a mountain road."
        ],
        "correct": 1,
        "explanation": "正答は1です。Paragraph 2: The canal gained new recreational roles."
      },
      {
        "id": 23,
        "section": "第2部",
        "part": "Part 2",
        "instruction": "英文と質問を聞き、内容に最も合う4つの選択肢から選んでください。",
        "voice": "Narration",
        "audioFile": "",
        "script": "Peatlands\nPeatlands are wetlands where dead plant material builds up slowly in waterlogged conditions. Because the material does not fully decay, carbon remains stored in thick layers of peat for very long periods. Although peatlands cover only a small share of the world's land surface, they are among the largest natural carbon stores on Earth. They also support specialized plants and animals, help hold water, and can reduce flooding in some areas.\nProblems arise when peatlands are drained, burned, or converted for agriculture and development. Once exposed to air, the peat begins to break down and release stored carbon into the atmosphere. Restoring peatlands often means raising water levels again, but this can conflict with farming or building uses. Protecting them therefore requires both ecological planning and cooperation with people who depend on the land for income. In many regions, restoration also protects drinking water supplies over time.",
        "questionText": "Why are peatlands important for climate?",
        "text": "Why are peatlands important for climate?",
        "choices": [
          "They prevent all rainfall.",
          "They contain no plant material.",
          "They replace every forest.",
          "They store large amounts of carbon."
        ],
        "correct": 4,
        "explanation": "正答は4です。Paragraph 1: They store large amounts of carbon."
      },
      {
        "id": 24,
        "section": "第2部",
        "part": "Part 2",
        "instruction": "英文と質問を聞き、内容に最も合う4つの選択肢から選んでください。",
        "voice": "Narration",
        "audioFile": "",
        "script": "Peatlands\nPeatlands are wetlands where dead plant material builds up slowly in waterlogged conditions. Because the material does not fully decay, carbon remains stored in thick layers of peat for very long periods. Although peatlands cover only a small share of the world's land surface, they are among the largest natural carbon stores on Earth. They also support specialized plants and animals, help hold water, and can reduce flooding in some areas.\nProblems arise when peatlands are drained, burned, or converted for agriculture and development. Once exposed to air, the peat begins to break down and release stored carbon into the atmosphere. Restoring peatlands often means raising water levels again, but this can conflict with farming or building uses. Protecting them therefore requires both ecological planning and cooperation with people who depend on the land for income. In many regions, restoration also protects drinking water supplies over time.",
        "questionText": "What can happen when peatlands are drained?",
        "text": "What can happen when peatlands are drained?",
        "choices": [
          "Peat stops breaking down.",
          "Stored carbon can be released.",
          "Water levels always rise.",
          "Farming conflicts disappear."
        ],
        "correct": 2,
        "explanation": "正答は2です。Paragraph 2: Stored carbon can be released."
      },
      {
        "id": 25,
        "section": "第3部",
        "part": "Part 3",
        "instruction": "SituationとQuestionを読んだ後、放送を聞き、条件に最も合う選択肢を選んでください。",
        "voice": "Narration",
        "audioFile": "",
        "script": "B: Today's orientation continues this afternoon. Campus Walk leaves the central plaza at 1:15 and shows new students where the dining hall and classrooms are. Money Matters begins at 2:30 in Room B. Local bank staff will explain the documents needed to open an account, and students can ask questions afterward. Library Start begins at 3 and is helpful if you need a student card for borrowing books, but it does not cover banking. City Safety has moved to 4:00 because the police officer is delayed; however, it focuses on traffic rules and emergency numbers, not financial services.",
        "situation": "You are an exchange student free only after 2 p.m. today. You need help opening a bank account. You hear an orientation announcement.",
        "questionText": "Which session should you attend?",
        "text": "Which session should you attend?",
        "choices": [
          "Campus Walk",
          "Library Start",
          "City Safety",
          "Money Matters"
        ],
        "correct": 4,
        "explanation": "解説：2時以降しか空いておらず、銀行口座開設の助けが必要。Money Mattersは2:30開始で銀行口座に必要な書類を扱う。\n各選択肢：\n1. 1:15開始で時間が合わず、内容も学内案内。\n2. 時間は合うが、図書館利用の内容。\n3. 時間は合うが、交通安全・緊急連絡先の内容。\n4. 正答。2:30開始で銀行口座開設に必要な書類を説明。"
      },
      {
        "id": 26,
        "section": "第3部",
        "part": "Part 3",
        "instruction": "SituationとQuestionを読んだ後、放送を聞き、条件に最も合う選択肢を選んでください。",
        "voice": "Narration",
        "audioFile": "",
        "script": "A: Because of strong winds, the 1:00 ferry to West Island has been canceled. The later ferry from Pier A may run at 5:30 if conditions improve, but pets will not be accepted on that service today. A replacement coach will leave from Pier B at 2:15, cross the bridge, and arrive on West Island before 4. Small animals in carriers may travel on the coach. Marina taxis can take pets, but drivers are only going as far as the mainland beach this afternoon. The hotel shuttle is for guests returning from West Island, not passengers trying to get there.",
        "situation": "You are traveling with a small dog and must reach West Island today. Your ferry has been canceled. You hear a harbor announcement.",
        "questionText": "Which option should you take?",
        "text": "Which option should you take?",
        "choices": [
          "Pier B coach",
          "Pier A ferry",
          "Marina taxi",
          "Hotel shuttle"
        ],
        "correct": 1,
        "explanation": "解説：小型犬連れで今日中にWest Islandへ到着する必要がある。Pier B coachはペット可でWest Islandに4時前到着。\n各選択肢：\n1. 正答。ペット可でWest Islandへ行く。\n2. 運航する可能性はあるが、今日はペット不可。\n3. ペット可だが、本土のビーチまでしか行かない。\n4. West Islandから戻る宿泊客向け。"
      },
      {
        "id": 27,
        "section": "第3部",
        "part": "Part 3",
        "instruction": "SituationとQuestionを読んだ後、放送を聞き、条件に最も合う選択肢を選んでください。",
        "voice": "Narration",
        "audioFile": "",
        "script": "B: If water is dripping from the ceiling, please treat it as urgent. The online maintenance form is useful for problems like broken shelves or slow drains, but it may not be read for several hours. Do not leave a key with the lobby guard unless a repair time has already been confirmed. If you cannot be home while workers enter, call the emergency line now. The dispatcher will arrange the earliest time when you can be present, and a plumber can also advise you how to turn off the nearby valve. Waiting until evening could lead to damage in another apartment.",
        "situation": "You notice water dripping in your apartment before leaving for work. You cannot allow workers to enter when you are away. You call the building office.",
        "questionText": "What should you do?",
        "text": "What should you do?",
        "choices": [
          "Submit an online form",
          "Leave a key downstairs",
          "Call the emergency line",
          "Wait until evening"
        ],
        "correct": 3,
        "explanation": "解説：水漏れは緊急だが、不在時に入室させられない。emergency lineに電話し、在宅できる最短時間を調整するのが適切。\n各選択肢：\n1. 数時間読まれない可能性があり、緊急向きではない。\n2. 修理時間確定前に鍵を預けるべきではない。\n3. 正答。在宅できる時間で緊急対応を手配できる。\n4. 被害が広がる可能性がある。"
      },
      {
        "id": 28,
        "section": "第3部",
        "part": "Part 3",
        "instruction": "SituationとQuestionを読んだ後、放送を聞き、条件に最も合う選択肢を選んでください。",
        "voice": "Narration",
        "audioFile": "",
        "script": "A: Early Bird is our lowest-priced membership. It includes the pool, but only before 9 a.m. on weekdays, and guests are not included. Open Swim Flex costs more, yet it allows pool use on Saturdays and Sundays, and you can buy a guest pass whenever you need one. You pay month by month, so there is no yearly commitment. Annual Plus also includes weekend swimming and two free guest visits each month, but it must be paid for as a twelve-month plan. Guest Saver has cheap guest tickets, although pool access is limited to weekday afternoons.",
        "situation": "You want a gym membership for weekend swimming. You do not want to sign a long contract, and you may bring a guest sometimes. You hear a membership adviser.",
        "questionText": "Which membership fits you?",
        "text": "Which membership fits you?",
        "choices": [
          "Early Bird",
          "Open Swim Flex",
          "Annual Plus",
          "Guest Saver"
        ],
        "correct": 2,
        "explanation": "解説：週末のプール利用、長期契約なし、時々ゲスト同伴が条件。Open Swim Flexは週末利用可、月ごと支払い、ゲストパス購入可。\n各選択肢：\n1. 安いが、平日朝のみでゲスト不可。\n2. 正答。週末プール、月ごと、ゲストパス可。\n3. 週末とゲストはよいが、12か月契約。\n4. ゲスト券は安いが、プールは平日午後のみ。"
      },
      {
        "id": 29,
        "section": "第3部",
        "part": "Part 3",
        "instruction": "SituationとQuestionを読んだ後、放送を聞き、条件に最も合う選択肢を選んでください。",
        "voice": "Narration",
        "audioFile": "",
        "script": "B: Festival visitors, please choose your entrance carefully today. North Gate is open to the public from 10 to 2 and has a flat path to the meal pickup tents, including the vegetarian preorder table. River Gate is closer to the music stage, but the ramp there is closed while workers repair a broken rail. Market Gate is fully accessible and open all day, though it leads only to craft booths; visitors cannot reach the food pickup area from there until after 1:30. Staff Gate is for performers and delivery vehicles, even if you already paid for a meal.",
        "situation": "You preordered a vegetarian meal at a street festival. Your friend uses a wheelchair, and you need to enter before the lunch pickup ends. You hear an entrance announcement.",
        "questionText": "Which entrance should you use?",
        "text": "Which entrance should you use?",
        "choices": [
          "River Gate",
          "Market Gate",
          "North Gate",
          "Staff Gate"
        ],
        "correct": 3,
        "explanation": "解説：ベジタリアン食の事前注文、車椅子利用の友人、昼食受取時間内に入る必要がある。North Gateだけが一般入場可・段差なし・食事受取テントへ行ける。\n各選択肢：\n1. ステージに近いが、スロープが修理中。\n2. バリアフリーだが、1:30まで食事受取エリアへ行けない。\n3. 正答。一般入場可で平坦な道があり、ベジタリアン受取テントへ行ける。\n4. 出演者・搬入車両用で、一般客は不可。"
      }
    ]
  },
  {
    "key": "set-04",
    "label": "第4回",
    "questions": [
      {
        "id": 1,
        "section": "第1部",
        "part": "Part 1",
        "instruction": "対話と最後の質問を聞き、最も適切な答えを4つから選んでください。",
        "voice": "Conversation",
        "audioFile": "",
        "script": "B: Have you finished the article about the new recycling policy?\nA: The research is complete, but the draft is nearly twice the length the editor requested.\nB: Could you remove the comparison with other cities?\nA: That section shows why our city chose this approach.\nB: Then shorten the background on the old system. Most readers already know how it worked.\nA: You’re right. I can summarize that in one concise paragraph without weakening the main argument or removing essential context.",
        "questionText": "What does the man suggest the woman do?",
        "text": "What does the man suggest the woman do?",
        "choices": [
          "Eliminate the comparison with other cities.",
          "Request a longer article from the editor.",
          "Summarize the discussion of the old system.",
          "Collect additional information about recycling."
        ],
        "correct": 3,
        "explanation": "男性は重要な都市間比較を残し、読者がすでに知っている旧制度の説明を短くするよう提案しています。"
      },
      {
        "id": 2,
        "section": "第1部",
        "part": "Part 1",
        "instruction": "対話と最後の質問を聞き、最も適切な答えを4つから選んでください。",
        "voice": "Conversation",
        "audioFile": "",
        "script": "A: Dad, Grandma called me about a message saying her bank account would be frozen.\nB: Did the message ask her to click a link?\nA: Yes, but fortunately she called us before doing anything.\nB: Good. Banks don’t usually request account details through unexpected messages.\nA: Should we delete it for her?\nB: First, let’s help her contact the bank using the number on her card. They can check the account and report the message.\nA: All right. I’ll tell her not to respond while we’re on our way.",
        "questionText": "What will the speakers probably do first?",
        "text": "What will the speakers probably do first?",
        "choices": [
          "Reply to the message for their grandmother.",
          "Change all of their grandmother’s passwords.",
          "Ask the bank to send a new link.",
          "Help their grandmother contact her bank directly."
        ],
        "correct": 4,
        "explanation": "不審なメッセージのリンクは使わず、カード記載の番号から銀行へ直接連絡することにしています。"
      },
      {
        "id": 3,
        "section": "第1部",
        "part": "Part 1",
        "instruction": "対話と最後の質問を聞き、最も適切な答えを4つから選んでください。",
        "voice": "Conversation",
        "audioFile": "",
        "script": "B: The results from our plant experiment look inconsistent.\nA: The samples near the window grew much faster than the others.\nB: Could the extra sunlight explain the difference?\nA: Possibly, but we were supposed to rotate the trays every two days.\nB: I rotated them last week. Didn’t you do it while I was away?\nA: I misunderstood your note and only watered them. We can’t compare the groups fairly, so we’ll have to repeat the experiment.",
        "questionText": "Why must the students repeat the experiment?",
        "text": "Why must the students repeat the experiment?",
        "choices": [
          "The plants received unequal amounts of light.",
          "The students used the wrong type of plant.",
          "Several samples were not watered regularly.",
          "The experiment ended earlier than planned."
        ],
        "correct": 1,
        "explanation": "トレーを予定どおり回さなかったため、植物が受けた光の量が均等ではなく、公平な比較ができません。"
      },
      {
        "id": 4,
        "section": "第1部",
        "part": "Part 1",
        "instruction": "対話と最後の質問を聞き、最も適切な答えを4つから選んでください。",
        "voice": "Conversation",
        "audioFile": "",
        "script": "A: I’m confirming our dinner reservation for Saturday.\nB: Certainly. Is there anything we should know?\nA: One guest cannot eat dairy products.\nB: We can prepare several main dishes, but our standard dessert contains cream.\nA: Could the chef make the fruit tart without it?\nB: The pastry contains butter. We could serve fresh fruit with dairy-free sorbet instead.\nA: That would be fine.\nB: Please tell your guest that dairy products are still used elsewhere in the kitchen, in case her reaction is severe.",
        "questionText": "What will the restaurant provide for dessert?",
        "text": "What will the restaurant provide for dessert?",
        "choices": [
          "A fruit tart made without cream.",
          "A standard dessert containing butter.",
          "Fresh fruit served with dairy-free sorbet.",
          "A main dish prepared in a separate kitchen."
        ],
        "correct": 3,
        "explanation": "タルトは生地にバターを含むため使えず、代わりに果物と乳製品不使用のシャーベットが提供されます。"
      },
      {
        "id": 5,
        "section": "第1部",
        "part": "Part 1",
        "instruction": "対話と最後の質問を聞き、最も適切な答えを4つから選んでください。",
        "voice": "Conversation",
        "audioFile": "",
        "script": "B: You’ve been cycling to work every day. How is it going?\nA: The ride is fine, but carrying my laptop in a shoulder bag is uncomfortable.\nB: Why not attach a basket to the bicycle?\nA: The laptop could get wet when it rains.\nB: A waterproof bag that clips onto the rear rack would protect it and keep the weight off your shoulder.\nA: That sounds much better. I’ll check whether my rear rack can support one securely before I buy it.",
        "questionText": "What does the man recommend?",
        "text": "What does the man recommend?",
        "choices": [
          "Driving to work whenever it rains.",
          "Leaving the laptop at the office.",
          "Installing a basket on the bicycle.",
          "Using a waterproof bag on the rear rack."
        ],
        "correct": 4,
        "explanation": "男性は前かごではなく、後部ラックに固定できる防水バッグを勧めています。"
      },
      {
        "id": 6,
        "section": "第1部",
        "part": "Part 1",
        "instruction": "対話と最後の質問を聞き、最も適切な答えを4つから選んでください。",
        "voice": "Conversation",
        "audioFile": "",
        "script": "A: Evan, did you get a part in the community theater production?\nB: Yes, but it’s a larger role than I expected, with rehearsals four evenings a week.\nA: That sounds exciting. Why do you look uncertain?\nB: I already promised to help coach my son’s basketball team on Tuesdays and Thursdays.\nA: Could another parent replace you for the six weeks of rehearsals?\nB: Maybe on Tuesdays, but not both nights. I’m going to ask the director whether I can take a smaller role.\nA: That seems better than breaking your commitment to the team.",
        "questionText": "What will the man probably do?",
        "text": "What will the man probably do?",
        "choices": [
          "Quit coaching his son’s team completely.",
          "Ask to perform a less demanding role.",
          "Attend only the Tuesday rehearsals.",
          "Withdraw from the theater production immediately."
        ],
        "correct": 2,
        "explanation": "男性はバスケットボールの指導との約束を守るため、劇の監督に小さな役へ変更できるか尋ねる予定です。"
      },
      {
        "id": 7,
        "section": "第1部",
        "part": "Part 1",
        "instruction": "対話と最後の質問を聞き、最も適切な答えを4つから選んでください。",
        "voice": "Conversation",
        "audioFile": "",
        "script": "B: I tried to refill my allergy medicine online, but the request was rejected.\nA: The prescription may have expired. When did you last see the doctor?\nB: About a year ago, although I still have enough medicine for another week.\nA: The clinic requires an annual review before renewing that prescription.\nB: Could I complete the review by video? My work schedule is crowded this week.\nA: Yes. I can arrange a video appointment for Thursday evening, before your remaining medicine runs out.",
        "questionText": "Why was the man’s refill request rejected?",
        "text": "Why was the man’s refill request rejected?",
        "choices": [
          "He requested the wrong allergy medicine.",
          "His prescription requires an annual review.",
          "The pharmacy has stopped accepting online orders.",
          "He has already received too much medicine."
        ],
        "correct": 2,
        "explanation": "処方の更新には年1回の診察が必要ですが、男性は約1年間受診していないため、申請が認められませんでした。"
      },
      {
        "id": 8,
        "section": "第1部",
        "part": "Part 1",
        "instruction": "対話と最後の質問を聞き、最も適切な答えを4つから選んでください。",
        "voice": "Conversation",
        "audioFile": "",
        "script": "A: I lost my monthly bus pass somewhere this morning.\nB: Have you checked with the lost-property office?\nA: Yes, but nothing has been turned in. I need the bus for work every day.\nB: You can request a replacement if the pass was registered in your name.\nA: It was. Will the remaining balance transfer to the new one?\nB: Yes, although there is a replacement fee. We’ll deactivate the old pass immediately.\nA: That’s fine. I’d rather pay the fee than buy individual tickets all month.",
        "questionText": "What will the woman probably do?",
        "text": "What will the woman probably do?",
        "choices": [
          "Wait until the old pass is returned.",
          "Buy individual tickets for the entire month.",
          "Ask her employer to pay for transportation.",
          "Pay a fee to receive a replacement pass."
        ],
        "correct": 4,
        "explanation": "女性は定期券が見つかるのを待つのではなく、手数料を支払って残高を引き継いだ代替券を受け取る予定です。"
      },
      {
        "id": 9,
        "section": "第1部",
        "part": "Part 1",
        "instruction": "対話と最後の質問を聞き、最も適切な答えを4つから選んでください。",
        "voice": "Conversation",
        "audioFile": "",
        "script": "B: The branches from your oak tree are hanging over our garage roof.\nA: I hadn’t realized they had grown that far.\nB: They scrape the roof whenever there’s a strong wind.\nA: I can trim the smaller branches this weekend.\nB: Some larger ones are quite high.\nA: Then I should hire a professional for those.\nB: I’d appreciate that. I’m mainly worried about preventing roof damage during the storm season.\nA: I’ll remove what I can safely reach and get an estimate for the rest.",
        "questionText": "What is the man’s main concern?",
        "text": "What is the man’s main concern?",
        "choices": [
          "The tree may damage his garage roof.",
          "The woman plans to remove the entire tree.",
          "The branches block sunlight from his garden.",
          "The trimming company may charge too much."
        ],
        "correct": 1,
        "explanation": "男性は、風で枝が屋根をこすり、嵐の時期に損傷が生じることを心配しています。"
      },
      {
        "id": 10,
        "section": "第1部",
        "part": "Part 1",
        "instruction": "対話と最後の質問を聞き、最も適切な答えを4つから選んでください。",
        "voice": "Conversation",
        "audioFile": "",
        "script": "A: My client wants me to add product photographs to the website I’m designing.\nB: Weren’t those included in the original agreement?\nA: No. I agreed to design the pages using images the client supplied.\nB: Taking the photographs yourself would require extra equipment and time.\nA: I don’t want to damage the long-term relationship by simply refusing.\nB: Explain that it’s outside the original project and offer a clearly separate price for the extra photography work involved.",
        "questionText": "What does the man advise the woman to do?",
        "text": "What does the man advise the woman to do?",
        "choices": [
          "Include the photography without charging extra.",
          "Cancel the website project completely.",
          "Ask another client to supply the photographs.",
          "Offer to do the additional work for a separate fee."
        ],
        "correct": 4,
        "explanation": "男性は写真撮影が当初の契約外であることを説明し、追加料金の別作業として提案するよう助言しています。"
      },
      {
        "id": 11,
        "section": "第1部",
        "part": "Part 1",
        "instruction": "対話と最後の質問を聞き、最も適切な答えを4つから選んでください。",
        "voice": "Conversation",
        "audioFile": "",
        "script": "B: How was the language-exchange meeting last night?\nA: Everyone was friendly, but I hardly spoke during the group discussion.\nB: Were the topics too difficult?\nA: No. By the time I had organized my thoughts, someone else had already answered.\nB: Perhaps smaller conversations would give you more time to respond.\nA: The organizer said participants can arrive early for one-to-one practice.\nB: That sounds ideal. You could build confidence before the larger discussion begins.\nA: I’ll try that next week instead of giving up after one meeting.",
        "questionText": "What has the woman decided to do?",
        "text": "What has the woman decided to do?",
        "choices": [
          "Prepare more difficult discussion topics.",
          "Attend early for individual conversation practice.",
          "Leave the exchange group after one meeting.",
          "Ask the organizer to cancel group discussions."
        ],
        "correct": 2,
        "explanation": "女性は活動をやめず、次回は早く到着して一対一の会話練習へ参加することにしています。"
      },
      {
        "id": 12,
        "section": "第1部",
        "part": "Part 1",
        "instruction": "対話と最後の質問を聞き、最も適切な答えを4つから選んでください。",
        "voice": "Conversation",
        "audioFile": "",
        "script": "A: The family tent we reserved was damaged by the previous customer.\nB: Does the store have another one?\nA: Only a larger tent, which costs more. My sister has two smaller ones, but they aren’t reliable in heavy rain.\nB: The forecast is dry, although mountain weather can change quickly.\nA: Then I’d rather pay more for the larger rental tent than risk getting soaked far from the campsite facilities during the night.",
        "questionText": "What will the speakers probably do?",
        "text": "What will the speakers probably do?",
        "choices": [
          "Cancel their camping trip.",
          "Borrow two tents from the woman’s sister.",
          "Rent the more expensive larger tent.",
          "Wait for the damaged tent to be repaired."
        ],
        "correct": 3,
        "explanation": "小型テントは雨に弱いため、二人は費用が高くても信頼できる大型のレンタルテントを選びます。"
      },
      {
        "id": 13,
        "section": "第2部",
        "part": "Part 2",
        "instruction": "英文と質問を聞き、内容に最も合う4つの選択肢から選んでください。",
        "voice": "Narration",
        "audioFile": "",
        "script": "Blue LEDs\nRed and green light-emitting diodes existed for many years before scientists created a bright blue LED. That missing color mattered because white LED light can be produced by combining blue light with other materials or colors. In the early 1990s, researchers in Japan succeeded in making efficient blue LEDs, solving a problem that had challenged industry for decades. Their work later received the Nobel Prize in Physics and transformed lighting research.\nThe invention changed lighting technology. LED lamps last much longer and use far less electricity than traditional incandescent bulbs, so they can reduce energy demand and waste. They are also useful in places where electricity is limited because small solar systems can power them. This helped homes, clinics, and schools. The breakthrough was not simply a new color of light. It made practical white LED lighting possible on a global scale and changed many electronic displays.",
        "questionText": "Why was the blue LED important?",
        "text": "Why was the blue LED important?",
        "choices": [
          "It replaced all red light.",
          "It made green LEDs impossible.",
          "It helped create white LED light.",
          "It used more electricity than bulbs."
        ],
        "correct": 3,
        "explanation": "正答は3です。Paragraph 1: It helped create white LED light."
      },
      {
        "id": 14,
        "section": "第2部",
        "part": "Part 2",
        "instruction": "英文と質問を聞き、内容に最も合う4つの選択肢から選んでください。",
        "voice": "Narration",
        "audioFile": "",
        "script": "Blue LEDs\nRed and green light-emitting diodes existed for many years before scientists created a bright blue LED. That missing color mattered because white LED light can be produced by combining blue light with other materials or colors. In the early 1990s, researchers in Japan succeeded in making efficient blue LEDs, solving a problem that had challenged industry for decades. Their work later received the Nobel Prize in Physics and transformed lighting research.\nThe invention changed lighting technology. LED lamps last much longer and use far less electricity than traditional incandescent bulbs, so they can reduce energy demand and waste. They are also useful in places where electricity is limited because small solar systems can power them. This helped homes, clinics, and schools. The breakthrough was not simply a new color of light. It made practical white LED lighting possible on a global scale and changed many electronic displays.",
        "questionText": "What is one advantage of LED lamps?",
        "text": "What is one advantage of LED lamps?",
        "choices": [
          "They use less electricity.",
          "They burn out immediately.",
          "They need no materials.",
          "They work only in cities."
        ],
        "correct": 1,
        "explanation": "正答は1です。Paragraph 2: They use less electricity."
      },
      {
        "id": 15,
        "section": "第2部",
        "part": "Part 2",
        "instruction": "英文と質問を聞き、内容に最も合う4つの選択肢から選んでください。",
        "voice": "Narration",
        "audioFile": "",
        "script": "Food Date Labels\nDates printed on food packages can be confusing because they often refer to quality rather than safety. A label such as best if used by usually tells consumers when a product is expected to taste or look its best. It does not automatically mean the food becomes dangerous the next day. However, many shoppers read these dates as strict expiration dates and throw away food that may still be usable, especially unopened packaged food.\nGovernments and food-safety agencies have tried to reduce this confusion by encouraging clearer language. Standard labels can help consumers separate quality advice from safety warnings, especially for shelf-stable foods. There are exceptions, such as infant formula, where dates have stricter meaning. Still, clearer date labels are seen as one practical way to reduce household food waste without asking people to ignore real food-safety risks. The goal is better judgment, not careless storage at home.",
        "questionText": "Why do date labels cause waste?",
        "text": "Why do date labels cause waste?",
        "choices": [
          "They are printed only on spoiled food.",
          "They force stores to sell unsafe food.",
          "They remove all quality information.",
          "People may mistake quality dates for safety dates."
        ],
        "correct": 4,
        "explanation": "正答は4です。Paragraph 1: People may mistake quality dates for safety dates."
      },
      {
        "id": 16,
        "section": "第2部",
        "part": "Part 2",
        "instruction": "英文と質問を聞き、内容に最も合う4つの選択肢から選んでください。",
        "voice": "Narration",
        "audioFile": "",
        "script": "Food Date Labels\nDates printed on food packages can be confusing because they often refer to quality rather than safety. A label such as best if used by usually tells consumers when a product is expected to taste or look its best. It does not automatically mean the food becomes dangerous the next day. However, many shoppers read these dates as strict expiration dates and throw away food that may still be usable, especially unopened packaged food.\nGovernments and food-safety agencies have tried to reduce this confusion by encouraging clearer language. Standard labels can help consumers separate quality advice from safety warnings, especially for shelf-stable foods. There are exceptions, such as infant formula, where dates have stricter meaning. Still, clearer date labels are seen as one practical way to reduce household food waste without asking people to ignore real food-safety risks. The goal is better judgment, not careless storage at home.",
        "questionText": "What is the purpose of clearer labels?",
        "text": "What is the purpose of clearer labels?",
        "choices": [
          "To eliminate all food-safety warnings.",
          "To help consumers judge dates better.",
          "To make infant formula last forever.",
          "To stop stores from selling packaged food."
        ],
        "correct": 2,
        "explanation": "正答は2です。Paragraph 2: To help consumers judge dates better."
      },
      {
        "id": 17,
        "section": "第2部",
        "part": "Part 2",
        "instruction": "英文と質問を聞き、内容に最も合う4つの選択肢から選んでください。",
        "voice": "Narration",
        "audioFile": "",
        "script": "The Placebo Effect\nThe placebo effect occurs when a person experiences improvement after receiving an inactive treatment, partly because they expect relief. It is not simply proof that symptoms were imaginary. Studies of pain have shown that expectation can involve real activity in brain systems related to pain control. In clinical trials, placebos help researchers judge whether a new treatment works better than the improvement that may come from attention, hope, or the treatment setting itself.\nPlacebos have limits. They may change how strongly someone feels pain, fatigue, or anxiety, but they do not remove an infection or repair a broken bone. Using them dishonestly also raises ethical problems because patients deserve accurate information. Some researchers are studying open-label placebos, where people know the treatment is inactive. Even then, the effect seems to depend on context, trust, and the body's own response systems during care, especially for subjective symptoms like pain.",
        "questionText": "What do pain studies suggest about placebos?",
        "text": "What do pain studies suggest about placebos?",
        "choices": [
          "They prove all pain is imaginary.",
          "They replace every active medicine.",
          "They can involve real brain activity.",
          "They work without any expectation."
        ],
        "correct": 3,
        "explanation": "正答は3です。Paragraph 1: They can involve real brain activity."
      },
      {
        "id": 18,
        "section": "第2部",
        "part": "Part 2",
        "instruction": "英文と質問を聞き、内容に最も合う4つの選択肢から選んでください。",
        "voice": "Narration",
        "audioFile": "",
        "script": "The Placebo Effect\nThe placebo effect occurs when a person experiences improvement after receiving an inactive treatment, partly because they expect relief. It is not simply proof that symptoms were imaginary. Studies of pain have shown that expectation can involve real activity in brain systems related to pain control. In clinical trials, placebos help researchers judge whether a new treatment works better than the improvement that may come from attention, hope, or the treatment setting itself.\nPlacebos have limits. They may change how strongly someone feels pain, fatigue, or anxiety, but they do not remove an infection or repair a broken bone. Using them dishonestly also raises ethical problems because patients deserve accurate information. Some researchers are studying open-label placebos, where people know the treatment is inactive. Even then, the effect seems to depend on context, trust, and the body's own response systems during care, especially for subjective symptoms like pain.",
        "questionText": "What is one limitation of placebos?",
        "text": "What is one limitation of placebos?",
        "choices": [
          "They cannot remove infections.",
          "They never affect pain.",
          "They are not used in trials.",
          "They require no patient trust."
        ],
        "correct": 1,
        "explanation": "正答は1です。Paragraph 2: They cannot remove infections."
      },
      {
        "id": 19,
        "section": "第2部",
        "part": "Part 2",
        "instruction": "英文と質問を聞き、内容に最も合う4つの選択肢から選んでください。",
        "voice": "Narration",
        "audioFile": "",
        "script": "Bat Echolocation\nMany bats hunt at night using echolocation. They produce high-frequency sounds, often above the range of human hearing, and listen for echoes that bounce back from insects, trees, or cave walls. The returning sound helps a bat judge an object's distance, size, and sometimes movement. This ability allows bats to fly and feed in darkness, where vision alone would not be enough, even in crowded forests or caves.\nEcholocation is flexible rather than automatic in one fixed form. Bats can change their calls depending on whether they are searching, approaching prey, or communicating with other bats. Scientists can record these calls with special microphones and display them as visual patterns called spectrograms. Because different species have different call patterns, researchers can use recordings to study which bats live in an area without always seeing them directly. This often helps conservationists monitor rare species more efficiently over time.",
        "questionText": "How does echolocation help bats?",
        "text": "How does echolocation help bats?",
        "choices": [
          "It makes insects unable to move.",
          "It replaces their hearing completely.",
          "It turns caves into daylight.",
          "It helps them locate objects in darkness."
        ],
        "correct": 4,
        "explanation": "正答は4です。Paragraph 1: It helps them locate objects in darkness."
      },
      {
        "id": 20,
        "section": "第2部",
        "part": "Part 2",
        "instruction": "英文と質問を聞き、内容に最も合う4つの選択肢から選んでください。",
        "voice": "Narration",
        "audioFile": "",
        "script": "Bat Echolocation\nMany bats hunt at night using echolocation. They produce high-frequency sounds, often above the range of human hearing, and listen for echoes that bounce back from insects, trees, or cave walls. The returning sound helps a bat judge an object's distance, size, and sometimes movement. This ability allows bats to fly and feed in darkness, where vision alone would not be enough, even in crowded forests or caves.\nEcholocation is flexible rather than automatic in one fixed form. Bats can change their calls depending on whether they are searching, approaching prey, or communicating with other bats. Scientists can record these calls with special microphones and display them as visual patterns called spectrograms. Because different species have different call patterns, researchers can use recordings to study which bats live in an area without always seeing them directly. This often helps conservationists monitor rare species more efficiently over time.",
        "questionText": "How can scientists study bats with sound?",
        "text": "How can scientists study bats with sound?",
        "choices": [
          "By removing their call patterns.",
          "By blocking all ultrasonic sounds.",
          "By forcing bats to fly in daylight.",
          "By recording species-specific calls."
        ],
        "correct": 4,
        "explanation": "正答は4です。Paragraph 2: By recording species-specific calls."
      },
      {
        "id": 21,
        "section": "第2部",
        "part": "Part 2",
        "instruction": "英文と質問を聞き、内容に最も合う4つの選択肢から選んでください。",
        "voice": "Narration",
        "audioFile": "",
        "script": "Microfinance\nMicrofinance became famous through Muhammad Yunus and Grameen Bank in Bangladesh. Traditional banks often refused to lend to very poor people because they lacked collateral or steady income. Grameen's approach offered small loans on easier terms, especially to women, so borrowers could start or expand tiny businesses. The idea was that poor people could manage money responsibly if financial services were designed around their situation and social networks. Group lending and peer support were also important parts of the model.\nMicrofinance has inspired programs in many countries, but it is not a simple cure for poverty. Loans can help people invest, manage risk, or build income, yet borrowers can also be harmed if lenders charge too much or encourage debt they cannot repay. For this reason, many development organizations now emphasize responsible finance, including transparent terms, consumer protection, and careful checks on whether a loan is affordable.",
        "questionText": "Why did Grameen Bank lend to poor borrowers?",
        "text": "Why did Grameen Bank lend to poor borrowers?",
        "choices": [
          "They all had large collateral.",
          "They could succeed under suitable conditions.",
          "Traditional banks already served them well.",
          "They needed loans only for luxury goods."
        ],
        "correct": 2,
        "explanation": "正答は2です。Paragraph 1: They could succeed under suitable conditions."
      },
      {
        "id": 22,
        "section": "第2部",
        "part": "Part 2",
        "instruction": "英文と質問を聞き、内容に最も合う4つの選択肢から選んでください。",
        "voice": "Narration",
        "audioFile": "",
        "script": "Microfinance\nMicrofinance became famous through Muhammad Yunus and Grameen Bank in Bangladesh. Traditional banks often refused to lend to very poor people because they lacked collateral or steady income. Grameen's approach offered small loans on easier terms, especially to women, so borrowers could start or expand tiny businesses. The idea was that poor people could manage money responsibly if financial services were designed around their situation and social networks. Group lending and peer support were also important parts of the model.\nMicrofinance has inspired programs in many countries, but it is not a simple cure for poverty. Loans can help people invest, manage risk, or build income, yet borrowers can also be harmed if lenders charge too much or encourage debt they cannot repay. For this reason, many development organizations now emphasize responsible finance, including transparent terms, consumer protection, and careful checks on whether a loan is affordable.",
        "questionText": "What is one risk of microfinance?",
        "text": "What is one risk of microfinance?",
        "choices": [
          "It prevents all business activity.",
          "It cannot be used by women.",
          "Borrowers may take unaffordable debt.",
          "It removes the need for transparency."
        ],
        "correct": 3,
        "explanation": "正答は3です。Paragraph 2: Borrowers may take unaffordable debt."
      },
      {
        "id": 23,
        "section": "第2部",
        "part": "Part 2",
        "instruction": "英文と質問を聞き、内容に最も合う4つの選択肢から選んでください。",
        "voice": "Narration",
        "audioFile": "",
        "script": "Weather Radar\nWeather radar sends out pulses of energy and measures what returns after the energy hits raindrops, snow, or other particles in the air. Doppler radar adds another layer of information by detecting whether precipitation is moving toward or away from the radar. This helps forecasters see not only where storms are located but also how winds inside them are moving, including early signs of rotation inside severe storms.\nModern radar networks help warn the public about dangerous weather. They can show heavy rain, storm rotation, and patterns that may indicate a developing tornado. However, radar is not a perfect picture of the atmosphere. Mountains, distance from the radar, and the height of the beam can limit what is detected near the ground. Forecasters therefore combine radar with satellites, surface observations, and reports from people in the affected area. This combination is essential because storms can change quickly.",
        "questionText": "What extra information does Doppler radar provide?",
        "text": "What extra information does Doppler radar provide?",
        "choices": [
          "The age of every cloud.",
          "The chemical makeup of rain.",
          "Whether precipitation is moving toward or away.",
          "The exact number of lightning strikes."
        ],
        "correct": 3,
        "explanation": "正答は3です。Paragraph 1: Whether precipitation is moving toward or away."
      },
      {
        "id": 24,
        "section": "第2部",
        "part": "Part 2",
        "instruction": "英文と質問を聞き、内容に最も合う4つの選択肢から選んでください。",
        "voice": "Narration",
        "audioFile": "",
        "script": "Weather Radar\nWeather radar sends out pulses of energy and measures what returns after the energy hits raindrops, snow, or other particles in the air. Doppler radar adds another layer of information by detecting whether precipitation is moving toward or away from the radar. This helps forecasters see not only where storms are located but also how winds inside them are moving, including early signs of rotation inside severe storms.\nModern radar networks help warn the public about dangerous weather. They can show heavy rain, storm rotation, and patterns that may indicate a developing tornado. However, radar is not a perfect picture of the atmosphere. Mountains, distance from the radar, and the height of the beam can limit what is detected near the ground. Forecasters therefore combine radar with satellites, surface observations, and reports from people in the affected area. This combination is essential because storms can change quickly.",
        "questionText": "Why use other observations with radar?",
        "text": "Why use other observations with radar?",
        "choices": [
          "Radar has detection limits.",
          "Satellites cannot see clouds.",
          "Storms never change quickly.",
          "Surface reports are always wrong."
        ],
        "correct": 1,
        "explanation": "正答は1です。Paragraph 2: Radar has detection limits."
      },
      {
        "id": 25,
        "section": "第3部",
        "part": "Part 3",
        "instruction": "SituationとQuestionを読んだ後、放送を聞き、条件に最も合う選択肢を選んでください。",
        "voice": "Narration",
        "audioFile": "",
        "script": "B: For interviews, the best kit depends on where you will record. Studio Pro has excellent image quality and two microphones, but the case is heavy, and we usually lend it to groups working indoors. Field Lite was made for one-person outdoor recording. It includes a clip-on microphone, a small tripod, and a shoulder bag that most users can carry easily. Action Pack is light and waterproof, so it is good for sports, but it does not include an external microphone. Lecture Set has a strong microphone and works well in classrooms, though it needs a power outlet and cannot be used outdoors.",
        "situation": "You are filming an outdoor interview alone. The camera kit must be light enough to carry and include a microphone. You hear an equipment clerk.",
        "questionText": "Which kit should you borrow?",
        "text": "Which kit should you borrow?",
        "choices": [
          "Field Lite",
          "Studio Pro",
          "Action Pack",
          "Lecture Set"
        ],
        "correct": 1,
        "explanation": "解説：一人で屋外インタビューを撮影し、軽くてマイク付きのキットが必要。Field Liteが全条件を満たす。\n各選択肢：\n1. 正答。一人用の屋外撮影向けで、マイク付き、軽い。\n2. マイクはあるが重く、屋内グループ向け。\n3. 軽く屋外向けだが、外部マイクなし。\n4. マイクはあるが、電源が必要で屋外不可。"
      },
      {
        "id": 26,
        "section": "第3部",
        "part": "Part 3",
        "instruction": "SituationとQuestionを読んだ後、放送を聞き、条件に最も合う選択肢を選んでください。",
        "voice": "Narration",
        "audioFile": "",
        "script": "A: Good evening, and welcome to the hall. If you bought your ticket online, you can enter by showing the QR code at any door, so there is no need to line up at the Ticket Window unless you need to buy a ticket tonight. Caption display devices are available at the Access Desk beside Door C. Please go there before entering the seating area, because staff must check the device number with your ticket. The Merchandise Booth opens after the performance starts. Balcony Stairs lead to upper seats only and have no staff members handling accessibility equipment.",
        "situation": "You bought a concert ticket online and need a caption display device. You hear instructions at the concert hall.",
        "questionText": "Where should you go first?",
        "text": "Where should you go first?",
        "choices": [
          "Ticket Window",
          "Merchandise Booth",
          "Access Desk",
          "Balcony Stairs"
        ],
        "correct": 3,
        "explanation": "解説：オンライン購入済みなのでチケット窓口は不要。caption display deviceが必要なのでAccess Deskへ先に行く。\n各選択肢：\n1. 当日券購入者向け。オンライン購入済みなら不要。\n2. グッズ売場で、開演後に開く。\n3. 正答。字幕表示機器を受け取る場所。\n4. 上階席への階段で、機器対応スタッフはいない。"
      },
      {
        "id": 27,
        "section": "第3部",
        "part": "Part 3",
        "instruction": "SituationとQuestionを読んだ後、放送を聞き、条件に最も合う選択肢を選んでください。",
        "voice": "Narration",
        "audioFile": "",
        "script": "B: The weekend rail pass you bought starts tomorrow, so it will not open the gates today. We can exchange unused passes at Window 6 before your first ride. The new same-day pass costs the same and includes bicycle cars on local trains. The mobile pass would also work today, but it requires downloading our app and showing a phone screen at the gate. A bus ticket is cheaper; however, bicycles are accepted only if packed in a bag. Waiting until tomorrow would make your current pass valid, but it would not help with today's trip.",
        "situation": "You bought the wrong rail pass. You need to travel today with a bicycle, but you do not have a smartphone. You hear a ticket agent.",
        "questionText": "What should you do?",
        "text": "What should you do?",
        "choices": [
          "Use the mobile pass",
          "Buy a bus ticket",
          "Wait for tomorrow",
          "Exchange at Window 6"
        ],
        "correct": 4,
        "explanation": "解説：今日移動する必要があり、自転車あり、スマホなし。Window 6で未使用パスを同額の当日パスに交換すれば、自転車車両も使える。\n各選択肢：\n1. 今日使えるが、スマホアプリが必要。\n2. 安いが、自転車を袋に入れる必要がある。\n3. 明日なら有効だが、今日の移動に合わない。\n4. 正答。窓口で今日用に交換でき、自転車車両も利用可。"
      },
      {
        "id": 28,
        "section": "第3部",
        "part": "Part 3",
        "instruction": "SituationとQuestionを読んだ後、放送を聞き、条件に最も合う選択肢を選んでください。",
        "voice": "Narration",
        "audioFile": "",
        "script": "A: For lost property, the fastest method depends on the route and time. Items found before 6 p.m. are sent to the downtown office the same day, and the web form is enough for umbrellas, bags, or clothing. Valuable documents from evening buses are handled differently. If the item was lost after 6 on Route 7 or Route 9, call the evening line so staff can check the secure box at the depot before offices open. Drivers cannot answer lost-property questions while they are working. Visiting the downtown office tomorrow is possible, but it may delay the search.",
        "situation": "You lost a folder on Bus 7 after 6 p.m. yesterday. It contains personal documents. You hear the bus company's recorded guide.",
        "questionText": "Which action should you take?",
        "text": "Which action should you take?",
        "choices": [
          "Fill out the web form",
          "Call the evening line",
          "Visit the downtown office",
          "Contact the driver"
        ],
        "correct": 2,
        "explanation": "解説：Bus 7で午後6時以降に個人書類入りフォルダーを紛失。evening lineに電話して、営業開始前に保管箱を確認してもらう。\n各選択肢：\n1. 一般的な物ならよいが、個人書類・夕方便には不十分。\n2. 正答。Route 7の夕方以降の貴重書類に対応。\n3. 翌日訪問は可能だが、捜索が遅れる。\n4. 運転中の運転手には問い合わせ不可。"
      },
      {
        "id": 29,
        "section": "第3部",
        "part": "Part 3",
        "instruction": "SituationとQuestionを読んだ後、放送を聞き、条件に最も合う選択肢を選んでください。",
        "voice": "Narration",
        "audioFile": "",
        "script": "B: Since rain is expected this afternoon, some activities have changed. The Forest Zip Tour is exciting, but it is outdoors and is limited to children eight and older. Indoor Discovery Lab is open without reservations from 10 to 2:30. It has simple science stations designed for children aged five to seven, and families can leave whenever they finish. Pottery Studio is indoors and accepts six-year-olds, but every seat today was reserved by school groups. Sunset Boat Ride does not require reservations, yet it begins at 4 and may be canceled if the wind becomes stronger.",
        "situation": "You are planning a rainy-day activity for a six-year-old child. You have not made a reservation and need to finish before 3 p.m. You hear a visitor guide.",
        "questionText": "Which activity should you choose?",
        "text": "Which activity should you choose?",
        "choices": [
          "Indoor Discovery Lab",
          "Forest Zip Tour",
          "Pottery Studio",
          "Sunset Boat Ride"
        ],
        "correct": 1,
        "explanation": "解説：雨の日向け、6歳、予約なし、3時前終了。Indoor Discovery Labは屋内、5-7歳向け、予約不要、2:30まで。\n各選択肢：\n1. 正答。屋内、6歳向け、予約不要、2:30まで。\n2. 屋外で、8歳以上限定。\n3. 屋内で年齢は合うが、本日は予約で満席。\n4. 予約不要だが、4時開始で3時前に終わらない。"
      }
    ]
  },
  {
    "key": "set-05",
    "label": "第5回",
    "questions": [
      {
        "id": 1,
        "section": "第1部",
        "part": "Part 1",
        "instruction": "対話と最後の質問を聞き、最も適切な答えを4つから選んでください。",
        "voice": "Conversation",
        "audioFile": "",
        "script": "A: The supplier has offered us compostable containers for the bakery’s lunch boxes.\nB: That fits our environmental goals. Are they much more expensive?\nA: Only slightly, but we would have to order twice as many at once.\nB: We don’t have storage space for that quantity.\nA: Perhaps the café next door would share an order, since it uses containers of a similar size for its takeout meals.\nB: It might. Ask the owner before we reject the supplier’s offer.",
        "questionText": "What will the woman probably do?",
        "text": "What will the woman probably do?",
        "choices": [
          "Rent additional storage for the bakery.",
          "Ask another business about sharing an order.",
          "Continue using the current supplier permanently.",
          "Buy smaller lunch boxes from the café."
        ],
        "correct": 2,
        "explanation": "問題は価格ではなく最低注文数と保管場所です。女性は隣のカフェに共同注文が可能か尋ねます。"
      },
      {
        "id": 2,
        "section": "第1部",
        "part": "Part 1",
        "instruction": "対話と最後の質問を聞き、最も適切な答えを4つから選んでください。",
        "voice": "Conversation",
        "audioFile": "",
        "script": "B: Could I borrow your laptop for my online interview tomorrow?\nA: I need it for work until noon. What time is your interview?\nB: One o’clock, but I’d like to test the camera and microphone beforehand.\nA: You could use it after twelve, though that wouldn’t leave much time.\nB: The public library lends laptops, but I’m not sure their rooms are private enough.\nA: Why don’t you reserve one of the library’s small meeting rooms and use my laptop there?\nB: Good idea. I can collect it from you at noon and set up immediately.",
        "questionText": "What will the man probably do?",
        "text": "What will the man probably do?",
        "choices": [
          "Postpone his interview until another day.",
          "Use the woman’s workplace for the interview.",
          "Buy a new camera and microphone.",
          "Reserve a library room and borrow the laptop."
        ],
        "correct": 4,
        "explanation": "男性は正午に女性のパソコンを借り、図書館の個室を予約して面接を受ける予定です。"
      },
      {
        "id": 3,
        "section": "第1部",
        "part": "Part 1",
        "instruction": "対話と最後の質問を聞き、最も適切な答えを4つから選んでください。",
        "voice": "Conversation",
        "audioFile": "",
        "script": "A: The geology department changed the location of Saturday’s field trip.\nB: Is the new site farther away?\nA: No, but the path is steep and rocky, so ordinary sneakers aren’t appropriate.\nB: I don’t own hiking boots, and buying them for one trip seems wasteful.\nA: The outdoor club lends equipment for a small deposit, and its website shows several pairs are still available.\nB: Then I’ll reserve a pair today before someone else takes my size.",
        "questionText": "What will the man do?",
        "text": "What will the man do?",
        "choices": [
          "Reserve hiking boots from the outdoor club.",
          "Ask the professor to choose an easier path.",
          "Wear ordinary sneakers on the field trip.",
          "Buy new boots from the geology department."
        ],
        "correct": 1,
        "explanation": "新しい場所では登山靴が必要なため、男性は大学のアウトドアクラブから借りられる靴を予約します。"
      },
      {
        "id": 4,
        "section": "第1部",
        "part": "Part 1",
        "instruction": "対話と最後の質問を聞き、最も適切な答えを4つから選んでください。",
        "voice": "Conversation",
        "audioFile": "",
        "script": "B: I’m trying to book a train to Westport for the wedding.\nA: Is the direct service available?\nB: No, and the alternative allows only eight minutes to change at Lakeside.\nA: The platforms are close together.\nB: I’ll have a suit bag and a large suitcase, so eight minutes feels risky.\nA: Then take an earlier train to Lakeside.\nB: I’ll have to wait longer there.\nA: True, but you’ll have enough time to manage your luggage and won’t risk missing the connection.",
        "questionText": "What does the woman advise the man to do?",
        "text": "What does the woman advise the man to do?",
        "choices": [
          "Travel without his large suitcase.",
          "Wait for seats on the direct service.",
          "Take an earlier train to the connection station.",
          "Change trains within the eight-minute period."
        ],
        "correct": 3,
        "explanation": "女性は乗り換え時間を確保するため、Lakesideまで一本早い列車で行くよう勧めています。"
      },
      {
        "id": 5,
        "section": "第1部",
        "part": "Part 1",
        "instruction": "対話と最後の質問を聞き、最も適切な答えを4つから選んでください。",
        "voice": "Conversation",
        "audioFile": "",
        "script": "A: The night guard you made for me now presses painfully against one tooth on the left side.\nB: Was it uncomfortable when you first started wearing it?\nA: No. The problem began after I rinsed it with very warm water yesterday.\nB: The heat may have changed its shape.\nA: Should I try to reshape it?\nB: No. Stop wearing it tonight and bring it in tomorrow so I can adjust it.",
        "questionText": "What does the man tell the woman to do?",
        "text": "What does the man tell the woman to do?",
        "choices": [
          "Continue wearing the guard for several nights.",
          "Reshape the guard with hotter water.",
          "Bring the guard in for an adjustment.",
          "Order a guard for only one tooth."
        ],
        "correct": 3,
        "explanation": "男性は女性に、その夜は装着せず、翌日持参して調整を受けるよう伝えています。"
      },
      {
        "id": 6,
        "section": "第1部",
        "part": "Part 1",
        "instruction": "対話と最後の質問を聞き、最も適切な答えを4つから選んでください。",
        "voice": "Conversation",
        "audioFile": "",
        "script": "B: My uncle found boxes of old photographs while clearing my grandfather’s house.\nA: Are they all family pictures?\nB: No. Many show local shops and public events from the 1950s, but relatives want copies before we donate anything.\nA: The town archive may be able to scan the historically valuable photographs and return every original to your family.\nB: Good idea. I’ll check with the archive before dividing the collection among my relatives.",
        "questionText": "What will the man probably do first?",
        "text": "What will the man probably do first?",
        "choices": [
          "Give all the original photographs to his relatives.",
          "Throw away the photographs of local shops.",
          "Ask the archive whether it can scan the photographs.",
          "Separate the collection without consulting anyone."
        ],
        "correct": 3,
        "explanation": "原本を手放す前に、男性は町の資料館が写真をスキャンして返却できるか確認します。"
      },
      {
        "id": 7,
        "section": "第1部",
        "part": "Part 1",
        "instruction": "対話と最後の質問を聞き、最も適切な答えを4つから選んでください。",
        "voice": "Conversation",
        "audioFile": "",
        "script": "A: The furniture company says they can deliver the sofa on Friday morning.\nB: Did you tell them our building’s elevator is too small for it?\nA: Yes. They’ll carry it up the stairs, but only if the hallway is clear.\nB: The neighbor across from us keeps two bicycles outside his door.\nA: I’ll ask him to move them temporarily. We should also measure the turn near the third floor.\nB: Why?\nA: The salesperson said the sofa fits the stairs, but she didn’t know about that narrow corner.\nB: Good point. We need to confirm it can actually reach the apartment.",
        "questionText": "Why does the woman want to measure the stairway?",
        "text": "Why does the woman want to measure the stairway?",
        "choices": [
          "To determine whether the sofa can pass a narrow turn.",
          "To calculate the delivery company’s additional fee.",
          "To decide where the neighbor should store his bicycles.",
          "To check whether the elevator can carry the sofa."
        ],
        "correct": 1,
        "explanation": "販売員は階段の幅しか把握しておらず、3階付近の狭い曲がり角をソファが通れるか確認する必要があります。"
      },
      {
        "id": 8,
        "section": "第1部",
        "part": "Part 1",
        "instruction": "対話と最後の質問を聞き、最も適切な答えを4つから選んでください。",
        "voice": "Conversation",
        "audioFile": "",
        "script": "B: The volleyball team voted for me to remain captain next season.\nA: Congratulations. You don’t sound very pleased, though.\nB: I’m honored, but I spent so much time organizing practices this year that my own performance suffered.\nA: Could some of the administrative duties be delegated?\nB: The assistant captain offered to manage equipment and travel arrangements.\nA: Then you could focus more on training while still leading the team.\nB: That’s true. I’ll accept the role if the coach agrees to divide the responsibilities.",
        "questionText": "How does the man feel about remaining captain?",
        "text": "How does the man feel about remaining captain?",
        "choices": [
          "He is willing if some duties are shared.",
          "He believes another player deserves the position.",
          "He is eager to manage every responsibility himself.",
          "He intends to leave the team next season."
        ],
        "correct": 1,
        "explanation": "男性は主将を続けること自体を拒んでいません。一部の事務的な仕事を分担できるなら引き受ける考えです。"
      },
      {
        "id": 9,
        "section": "第1部",
        "part": "Part 1",
        "instruction": "対話と最後の質問を聞き、最も適切な答えを4つから選んでください。",
        "voice": "Conversation",
        "audioFile": "",
        "script": "A: The manager asked me to train the restaurant’s new servers next week.\nB: That shows she trusts your experience.\nA: I’m pleased, but the manual describes an ordering system we stopped using months ago.\nB: That could confuse the new employees.\nA: I’ll teach the current procedure, but the manual needs updating too.\nB: Mark the outdated sections and give the manager your revisions, so future training matches the system actually being used.",
        "questionText": "What problem has the woman identified?",
        "text": "What problem has the woman identified?",
        "choices": [
          "The new servers have refused to attend training.",
          "The restaurant lacks an electronic ordering system.",
          "The training manual contains outdated instructions.",
          "The manager has chosen an inexperienced trainer."
        ],
        "correct": 3,
        "explanation": "女性が見つけた問題は、研修用マニュアルが現在は使われていない注文システムを説明していることです。"
      },
      {
        "id": 10,
        "section": "第1部",
        "part": "Part 1",
        "instruction": "対話と最後の質問を聞き、最も適切な答えを4つから選んでください。",
        "voice": "Conversation",
        "audioFile": "",
        "script": "B: The wildlife center accepted my volunteer application, but they assigned me to the visitor desk.\nA: Weren’t you hoping to help feed the injured animals?\nB: Yes. I’ve cared for pets for years, so I thought I was qualified.\nA: Wild animals require specialized training. New volunteers may have to begin with other duties.\nB: The coordinator said I could take an animal-care course after three months.\nA: Then the visitor desk may be a first step rather than a permanent assignment.\nB: I suppose so. I’ll accept it and learn how the center operates.",
        "questionText": "What does the man imply?",
        "text": "What does the man imply?",
        "choices": [
          "He will reject all duties involving visitors.",
          "He already has professional wildlife training.",
          "He plans to leave after three months.",
          "He is willing to begin with a different role."
        ],
        "correct": 4,
        "explanation": "男性は希望していた動物の世話ではありませんが、将来の研修につながる第一歩として受付業務を受け入れます。"
      },
      {
        "id": 11,
        "section": "第1部",
        "part": "Part 1",
        "instruction": "対話と最後の質問を聞き、最も適切な答えを4つから選んでください。",
        "voice": "Conversation",
        "audioFile": "",
        "script": "A: I found a used copy of the economics textbook for half the regular price.\nB: Is it the edition required for our course?\nA: It’s one edition older, but the seller says most chapters are the same.\nB: Professor Lin mentioned that the new edition includes revised data sets for our assignments.\nA: Could I borrow those pages from someone else?\nB: The assignments use an online code that comes only with a new book.\nA: Then the cheaper copy may cost me more trouble than it saves.\nB: I’d check whether the campus store sells the code separately before deciding.",
        "questionText": "What does the man suggest the woman do?",
        "text": "What does the man suggest the woman do?",
        "choices": [
          "Buy the older textbook immediately.",
          "Share an online code with another student.",
          "Ask the professor to change the assignments.",
          "Find out whether the code is sold separately."
        ],
        "correct": 4,
        "explanation": "男性は古い本をすぐ買うのではなく、必要なオンラインコードを単独購入できるか確認するよう勧めています。"
      },
      {
        "id": 12,
        "section": "第1部",
        "part": "Part 1",
        "instruction": "対話と最後の質問を聞き、最も適切な答えを4つから選んでください。",
        "voice": "Conversation",
        "audioFile": "",
        "script": "B: The contractor says replacing the kitchen floor will take four days instead of two.\nA: Why has the schedule changed?\nB: He found moisture under the boards. He doesn’t know the source yet, so he wants to inspect the pipes before installing the new floor.\nA: That seems necessary. Covering the area without finding the source could cause more damage.\nB: I agree. I’ll request a revised estimate before approving the inspection.",
        "questionText": "What will the man probably do?",
        "text": "What will the man probably do?",
        "choices": [
          "Install the new floor without further inspection.",
          "Ask a different contractor to finish in two days.",
          "Approve an inspection after receiving a new estimate.",
          "Assume the moisture came from the plumbing."
        ],
        "correct": 3,
        "explanation": "男性は原因調査の必要性を認めていますが、まず変更後の見積もりを確認してから検査を承認します。"
      },
      {
        "id": 13,
        "section": "第2部",
        "part": "Part 2",
        "instruction": "英文と質問を聞き、内容に最も合う4つの選択肢から選んでください。",
        "voice": "Narration",
        "audioFile": "",
        "script": "The Marshall Plan\nAfter World War II, many European economies were damaged, and shortages created political instability. In 1947, U.S. Secretary of State George Marshall called for a broad recovery program at a speech at Harvard University. Congress approved the plan the following year. The aid was intended to rebuild Western Europe, restore production and trade, and reduce the appeal of communist movements during the early Cold War.\nThe Marshall Plan did not act alone; European recovery had already begun in some places. Still, the program provided money, materials, and confidence at a critical moment. It also encouraged cooperation among participating countries, because they had to discuss needs and coordinate parts of the recovery. Historians continue to debate exactly how much growth it caused, but it remains an important example of economic aid used for both humanitarian and strategic purposes. The plan also strengthened America's long-term influence in Europe.",
        "questionText": "Why did the United States support the plan?",
        "text": "Why did the United States support the plan?",
        "choices": [
          "To rebuild and stabilize Western Europe.",
          "To end all European trade.",
          "To move factories to Asia.",
          "To avoid political influence abroad."
        ],
        "correct": 2,
        "explanation": "正答は2です。第1段落。焼失後、Jeffersonの蔵書が議会図書館の再建に役立った。"
      },
      {
        "id": 14,
        "section": "第2部",
        "part": "Part 2",
        "instruction": "英文と質問を聞き、内容に最も合う4つの選択肢から選んでください。",
        "voice": "Narration",
        "audioFile": "",
        "script": "The Marshall Plan\nAfter World War II, many European economies were damaged, and shortages created political instability. In 1947, U.S. Secretary of State George Marshall called for a broad recovery program at a speech at Harvard University. Congress approved the plan the following year. The aid was intended to rebuild Western Europe, restore production and trade, and reduce the appeal of communist movements during the early Cold War.\nThe Marshall Plan did not act alone; European recovery had already begun in some places. Still, the program provided money, materials, and confidence at a critical moment. It also encouraged cooperation among participating countries, because they had to discuss needs and coordinate parts of the recovery. Historians continue to debate exactly how much growth it caused, but it remains an important example of economic aid used for both humanitarian and strategic purposes. The plan also strengthened America's long-term influence in Europe.",
        "questionText": "What do historians still debate?",
        "text": "What do historians still debate?",
        "choices": [
          "Whether Marshall gave a speech.",
          "Whether Europe had any shortages.",
          "How much growth the plan caused.",
          "Whether aid reached Western Europe."
        ],
        "correct": 3,
        "explanation": "正答は3です。第2段落。文化的記憶を守る役割がある。"
      },
      {
        "id": 15,
        "section": "第2部",
        "part": "Part 2",
        "instruction": "英文と質問を聞き、内容に最も合う4つの選択肢から選んでください。",
        "voice": "Narration",
        "audioFile": "",
        "script": "Beaver Wetlands\nBeavers are often called ecosystem engineers because their dams can reshape streams and valleys. By slowing moving water, a dam can create ponds and wetlands that store water, trap sediment, and provide habitat for fish, birds, insects, and plants. In dry periods, these wet areas may help keep water on the landscape longer than a straight, fast-flowing stream would, supporting nearby vegetation. They can also raise groundwater levels and reconnect streams with floodplains.\nThe same behavior can also cause problems for people. Beaver dams may flood roads, fields, or buildings, and beavers sometimes cut trees that landowners want to protect. Wildlife managers increasingly try nonlethal tools, such as pond levelers or fencing around culverts and trees, to reduce conflicts. These methods recognize that beavers can bring ecological benefits, but they also require practical management where human property is at risk. This makes compromise important rather than simple removal.",
        "questionText": "Why are beavers called ecosystem engineers?",
        "text": "Why are beavers called ecosystem engineers?",
        "choices": [
          "They avoid changing streams.",
          "They reshape habitats with dams.",
          "They live only in dry deserts.",
          "They remove all wetlands."
        ],
        "correct": 2,
        "explanation": "正答は2です。第1段落。雪不足でも斜面を使えるようにするため。"
      },
      {
        "id": 16,
        "section": "第2部",
        "part": "Part 2",
        "instruction": "英文と質問を聞き、内容に最も合う4つの選択肢から選んでください。",
        "voice": "Narration",
        "audioFile": "",
        "script": "Beaver Wetlands\nBeavers are often called ecosystem engineers because their dams can reshape streams and valleys. By slowing moving water, a dam can create ponds and wetlands that store water, trap sediment, and provide habitat for fish, birds, insects, and plants. In dry periods, these wet areas may help keep water on the landscape longer than a straight, fast-flowing stream would, supporting nearby vegetation. They can also raise groundwater levels and reconnect streams with floodplains.\nThe same behavior can also cause problems for people. Beaver dams may flood roads, fields, or buildings, and beavers sometimes cut trees that landowners want to protect. Wildlife managers increasingly try nonlethal tools, such as pond levelers or fencing around culverts and trees, to reduce conflicts. These methods recognize that beavers can bring ecological benefits, but they also require practical management where human property is at risk. This makes compromise important rather than simple removal.",
        "questionText": "Why do managers use nonlethal tools?",
        "text": "Why do managers use nonlethal tools?",
        "choices": [
          "To stop all wetland creation.",
          "To make beavers cut more trees.",
          "To dry every stream completely.",
          "To reduce conflicts with people."
        ],
        "correct": 1,
        "explanation": "正答は1です。第2段落。十分に寒くないと人工雪は作りにくい。"
      },
      {
        "id": 17,
        "section": "第2部",
        "part": "Part 2",
        "instruction": "英文と質問を聞き、内容に最も合う4つの選択肢から選んでください。",
        "voice": "Narration",
        "audioFile": "",
        "script": "The Barcode\nThe barcode became common because grocery stores needed a faster and more reliable way to identify products. Before scanning systems, cashiers often typed prices by hand, and stores had to update price labels on individual items. In 1974, a pack of chewing gum became the first purchase scanned with the new Universal Product Code at a supermarket in Ohio. The scanner read reflected laser light from the printed pattern.\nThe real power of the barcode was the database behind it. Once a code was read, the cash register could match it with product and price information stored in a computer. This made checkout faster and helped stores track inventory more accurately. The technology did not remove every retail problem, but it changed ordinary shopping by turning each product package into a machine-readable piece of information for stores and suppliers. It also reduced errors caused by repeated manual entry.",
        "questionText": "Why did stores adopt barcodes?",
        "text": "Why did stores adopt barcodes?",
        "choices": [
          "To make cashiers type more prices.",
          "To remove computers from stores.",
          "To identify products more efficiently.",
          "To stop using product packages."
        ],
        "correct": 3,
        "explanation": "正答は3です。第1段落。複数地域を結ぶ交易路ネットワークだった。"
      },
      {
        "id": 18,
        "section": "第2部",
        "part": "Part 2",
        "instruction": "英文と質問を聞き、内容に最も合う4つの選択肢から選んでください。",
        "voice": "Narration",
        "audioFile": "",
        "script": "The Barcode\nThe barcode became common because grocery stores needed a faster and more reliable way to identify products. Before scanning systems, cashiers often typed prices by hand, and stores had to update price labels on individual items. In 1974, a pack of chewing gum became the first purchase scanned with the new Universal Product Code at a supermarket in Ohio. The scanner read reflected laser light from the printed pattern.\nThe real power of the barcode was the database behind it. Once a code was read, the cash register could match it with product and price information stored in a computer. This made checkout faster and helped stores track inventory more accurately. The technology did not remove every retail problem, but it changed ordinary shopping by turning each product package into a machine-readable piece of information for stores and suppliers. It also reduced errors caused by repeated manual entry.",
        "questionText": "What made barcodes especially powerful?",
        "text": "What made barcodes especially powerful?",
        "choices": [
          "The database connected to them.",
          "The color of chewing gum.",
          "The absence of product information.",
          "The need to scan by hand twice."
        ],
        "correct": 2,
        "explanation": "正答は2です。第2段落。宗教・技術・芸術・科学知識なども広がった。"
      },
      {
        "id": 19,
        "section": "第2部",
        "part": "Part 2",
        "instruction": "英文と質問を聞き、内容に最も合う4つの選択肢から選んでください。",
        "voice": "Narration",
        "audioFile": "",
        "script": "Antimicrobial Resistance\nAntimicrobial resistance occurs when bacteria, fungi, or other germs no longer respond to medicines designed to kill them. It is a natural process, but human behavior can speed it up. When antibiotics are used too often, used when they are not needed, or stopped too early, resistant germs have more chances to survive and spread. The problem affects hospitals, farms, and communities, so it cannot be solved by doctors alone or by one country.\nResistance makes ordinary infections harder and sometimes impossible to treat. It can also make surgery, cancer treatment, and care for premature babies more dangerous, because these depend on effective infection control. Public health agencies therefore stress prevention, accurate diagnosis, vaccination, clean water, and careful use of medicines. Developing new drugs is important, but protecting the usefulness of existing ones is just as urgent. Resistant infections may require longer treatment and more expensive medicines.",
        "questionText": "What can speed antimicrobial resistance?",
        "text": "What can speed antimicrobial resistance?",
        "choices": [
          "Careful use of antibiotics only.",
          "Using antibiotics when unnecessary.",
          "Keeping germs away from farms.",
          "Stopping all medical research."
        ],
        "correct": 1,
        "explanation": "正答は1です。第1段落。 pollinators や食料生産について学べる。"
      },
      {
        "id": 20,
        "section": "第2部",
        "part": "Part 2",
        "instruction": "英文と質問を聞き、内容に最も合う4つの選択肢から選んでください。",
        "voice": "Narration",
        "audioFile": "",
        "script": "Antimicrobial Resistance\nAntimicrobial resistance occurs when bacteria, fungi, or other germs no longer respond to medicines designed to kill them. It is a natural process, but human behavior can speed it up. When antibiotics are used too often, used when they are not needed, or stopped too early, resistant germs have more chances to survive and spread. The problem affects hospitals, farms, and communities, so it cannot be solved by doctors alone or by one country.\nResistance makes ordinary infections harder and sometimes impossible to treat. It can also make surgery, cancer treatment, and care for premature babies more dangerous, because these depend on effective infection control. Public health agencies therefore stress prevention, accurate diagnosis, vaccination, clean water, and careful use of medicines. Developing new drugs is important, but protecting the usefulness of existing ones is just as urgent. Resistant infections may require longer treatment and more expensive medicines.",
        "questionText": "Why is resistance dangerous for medicine?",
        "text": "Why is resistance dangerous for medicine?",
        "choices": [
          "It makes all vaccines useless.",
          "It affects only minor illnesses.",
          "It can make procedures riskier.",
          "It prevents clean water from working."
        ],
        "correct": 2,
        "explanation": "正答は2です。第2段落。多すぎる蜂群は野生昆虫と花を奪い合う可能性がある。"
      },
      {
        "id": 21,
        "section": "第2部",
        "part": "Part 2",
        "instruction": "英文と質問を聞き、内容に最も合う4つの選択肢から選んでください。",
        "voice": "Narration",
        "audioFile": "",
        "script": "The Montreal Protocol\nThe Montreal Protocol is an international agreement created to protect the ozone layer. Scientists had found that chemicals such as chlorofluorocarbons, once widely used in products like refrigerants and aerosol sprays, could break down ozone high in the atmosphere. That ozone layer matters because it reduces the amount of harmful ultraviolet radiation reaching Earth's surface. More ultraviolet radiation would increase risks such as skin cancer and damage to crops and ecosystems.\nThe agreement worked by limiting and then phasing out many ozone-depleting chemicals. Its success depended on scientific monitoring, international cooperation, and industries shifting to substitute chemicals. The ozone layer has not recovered immediately, because these chemicals can remain in the atmosphere for a very long time. However, measurements show signs of improvement, and the agreement is often cited as evidence that coordinated environmental policy can solve a global problem when countries keep participating over many decades.",
        "questionText": "Why is the ozone layer important?",
        "text": "Why is the ozone layer important?",
        "choices": [
          "It creates refrigerants for factories.",
          "It blocks all sunlight from Earth.",
          "It increases crop damage directly.",
          "It reduces harmful ultraviolet radiation."
        ],
        "correct": 2,
        "explanation": "正答は2です。第1段落。文字を並べ替え、再利用できた。"
      },
      {
        "id": 22,
        "section": "第2部",
        "part": "Part 2",
        "instruction": "英文と質問を聞き、内容に最も合う4つの選択肢から選んでください。",
        "voice": "Narration",
        "audioFile": "",
        "script": "The Montreal Protocol\nThe Montreal Protocol is an international agreement created to protect the ozone layer. Scientists had found that chemicals such as chlorofluorocarbons, once widely used in products like refrigerants and aerosol sprays, could break down ozone high in the atmosphere. That ozone layer matters because it reduces the amount of harmful ultraviolet radiation reaching Earth's surface. More ultraviolet radiation would increase risks such as skin cancer and damage to crops and ecosystems.\nThe agreement worked by limiting and then phasing out many ozone-depleting chemicals. Its success depended on scientific monitoring, international cooperation, and industries shifting to substitute chemicals. The ozone layer has not recovered immediately, because these chemicals can remain in the atmosphere for a very long time. However, measurements show signs of improvement, and the agreement is often cited as evidence that coordinated environmental policy can solve a global problem when countries keep participating over many decades.",
        "questionText": "Why was recovery not immediate?",
        "text": "Why was recovery not immediate?",
        "choices": [
          "Ozone-depleting chemicals can persist.",
          "Countries refused to cooperate at all.",
          "Scientists stopped monitoring the atmosphere.",
          "Aerosol sprays create ozone instantly."
        ],
        "correct": 3,
        "explanation": "正答は3です。第2段落。印刷術後も読めない人は多く残った。"
      },
      {
        "id": 23,
        "section": "第2部",
        "part": "Part 2",
        "instruction": "英文と質問を聞き、内容に最も合う4つの選択肢から選んでください。",
        "voice": "Narration",
        "audioFile": "",
        "script": "LiDAR Archaeology\nLiDAR, short for light detection and ranging, is changing how archaeologists study landscapes. A LiDAR system sends out laser pulses from an aircraft or drone and measures how long the light takes to return. With enough measurements, researchers can create detailed three-dimensional maps of the ground. In forested areas, computer processing can remove much of the tree canopy from the image, revealing shapes that are hard to see from the surface.\nThis has helped archaeologists identify roads, terraces, walls, and settlement patterns in places such as tropical forests. The technology is useful because it can survey large areas quickly without digging, even in difficult terrain. However, LiDAR does not replace fieldwork. Researchers still need to visit sites, check what the shapes actually are, and protect sensitive locations from looting or damage once new discoveries become known to the public. It can guide excavation rather than merely replace it.",
        "questionText": "How does LiDAR help archaeologists?",
        "text": "How does LiDAR help archaeologists?",
        "choices": [
          "It makes forests grow faster.",
          "It replaces all historical interpretation.",
          "It hides roads and walls underground.",
          "It maps ground features through vegetation."
        ],
        "correct": 2,
        "explanation": "正答は2です。第1段落。人口や地域の変化を把握するため。"
      },
      {
        "id": 24,
        "section": "第2部",
        "part": "Part 2",
        "instruction": "英文と質問を聞き、内容に最も合う4つの選択肢から選んでください。",
        "voice": "Narration",
        "audioFile": "",
        "script": "LiDAR Archaeology\nLiDAR, short for light detection and ranging, is changing how archaeologists study landscapes. A LiDAR system sends out laser pulses from an aircraft or drone and measures how long the light takes to return. With enough measurements, researchers can create detailed three-dimensional maps of the ground. In forested areas, computer processing can remove much of the tree canopy from the image, revealing shapes that are hard to see from the surface.\nThis has helped archaeologists identify roads, terraces, walls, and settlement patterns in places such as tropical forests. The technology is useful because it can survey large areas quickly without digging, even in difficult terrain. However, LiDAR does not replace fieldwork. Researchers still need to visit sites, check what the shapes actually are, and protect sensitive locations from looting or damage once new discoveries become known to the public. It can guide excavation rather than merely replace it.",
        "questionText": "Why is fieldwork still necessary?",
        "text": "Why is fieldwork still necessary?",
        "choices": [
          "LiDAR cannot survey large areas.",
          "Laser pulses destroy every site.",
          "Forests prevent any mapping.",
          "Researchers must verify the shapes."
        ],
        "correct": 2,
        "explanation": "正答は2です。第2段落。未回答や調査漏れが正確性を下げる。"
      },
      {
        "id": 25,
        "section": "第3部",
        "part": "Part 3",
        "instruction": "SituationとQuestionを読んだ後、放送を聞き、条件に最も合う選択肢を選んでください。",
        "voice": "Narration",
        "audioFile": "",
        "script": "B: Students arriving for move-in should check the time first. The Main Housing Office handles room keys and housing contracts, but it closes at 6. International students arriving after that time should go to the Night Arrival Desk beside the east entrance. Staff there can issue temporary room keys and check the list of delivered boxes. The Mailroom Window will reopen tomorrow morning for regular package pickup, but it cannot give out keys. The Student Lounge is open all night, and volunteers are serving snacks there; however, they cannot access housing records or storage rooms.",
        "situation": "You arrive at university housing after 6 p.m. as an international student. You need your room key and have boxes already delivered. You hear move-in instructions.",
        "questionText": "Where should you go?",
        "text": "Where should you go?",
        "choices": [
          "Main Housing Office",
          "Mailroom Window",
          "Student Lounge",
          "Night Arrival Desk"
        ],
        "correct": 4,
        "explanation": "解説：6時以降に到着した留学生で、部屋の鍵と配送済み箱の確認が必要。Night Arrival Deskが両方に対応。\n各選択肢：\n1. 鍵と契約対応だが、6時に閉まる。\n2. 荷物受取だが翌朝再開で、鍵は渡せない。\n3. 夜通し開いているが、記録や倉庫にアクセスできない。\n4. 正答。時間外の留学生向けで、一時鍵発行と配送箱確認ができる。"
      },
      {
        "id": 26,
        "section": "第3部",
        "part": "Part 3",
        "instruction": "SituationとQuestionを読んだ後、放送を聞き、条件に最も合う選択肢を選んでください。",
        "voice": "Narration",
        "audioFile": "",
        "script": "A: For unopened online orders, you have several return choices. The printed mail label is free, but you must attach the label yourself before mailing the box. If you cannot print, use label-free store drop-off. Bring the item and the QR code from your email, and the clerk will scan it and process a refund to your original payment method. Exchange pickup is convenient if you want a different size or color, but it gives store credit instead of a refund. Repair requests are only for used items that have stopped working, not unopened returns.",
        "situation": "You want to return an unopened online order for a refund. You do not have a printer. You hear the store's return options.",
        "questionText": "Which return method is best?",
        "text": "Which return method is best?",
        "choices": [
          "Printed mail label",
          "Label-free store drop-off",
          "Exchange pickup",
          "Repair request"
        ],
        "correct": 2,
        "explanation": "解説：未開封品を返金希望で、プリンターがない。label-free store drop-offならQRコードだけで返金処理できる。\n各選択肢：\n1. 無料だが、自分でラベル印刷が必要。\n2. 正答。印刷不要で、元の支払い方法へ返金。\n3. 交換向けで、返金ではなくストアクレジット。\n4. 使用済み故障品向けで、未開封返品ではない。"
      },
      {
        "id": 27,
        "section": "第3部",
        "part": "Part 3",
        "instruction": "SituationとQuestionを読んだ後、放送を聞き、条件に最も合う選択肢を選んでください。",
        "voice": "Narration",
        "audioFile": "",
        "script": "B: Conference participants who need assistance should choose the correct line. The Registration Line is for people who have not received a badge yet, and the wait is about thirty minutes. If you already have a badge but cannot open the event app, go to the App Help Corner near Hall B. Staff there can reset passwords in a few minutes and print a temporary schedule if necessary. The Badge Reprint Desk is only for lost or damaged badges. The Speaker Room is for presenters checking microphones before their talks, and staff there cannot solve app problems.",
        "situation": "You are at a conference. You have your badge, but you cannot log in to the event app, and your session starts in 20 minutes. You hear an announcement.",
        "questionText": "Where should you go?",
        "text": "Where should you go?",
        "choices": [
          "Registration Line",
          "Badge Reprint Desk",
          "App Help Corner",
          "Speaker Room"
        ],
        "correct": 3,
        "explanation": "解説：バッジはあり、アプリにログインできず、20分後にセッション開始。App Help Cornerなら数分でパスワード対応・仮スケジュール印刷が可能。\n各選択肢：\n1. バッジ未受取者向けで、待ち時間も長い。\n2. 紛失・破損バッジ向け。\n3. 正答。アプリログイン問題に対応し、短時間で処理できる。\n4. 発表者のマイク確認用で、アプリ問題は不可。"
      },
      {
        "id": 28,
        "section": "第3部",
        "part": "Part 3",
        "instruction": "SituationとQuestionを読んだ後、放送を聞き、条件に最も合う選択肢を選んでください。",
        "voice": "Narration",
        "audioFile": "",
        "script": "A: The garden has four volunteer groups this season. Herb Team is friendly to beginners, but members meet on Wednesday mornings and bring their own small tools. Starter Plot meets on Saturdays. It is designed for people with little gardening experience, and tools are stored in a shared shed beside the plots. Compost Crew also works on weekends and provides gloves and forks, but the work is mostly moving heavy bins and is recommended for experienced volunteers. Greenhouse Club lends tools and teaches plant care, although meetings are on Tuesday evenings because the greenhouse is used by school groups on weekends.",
        "situation": "You want to join a community garden. You are a beginner, can help only on weekends, and need shared tools. You hear the coordinator.",
        "questionText": "Which group should you join?",
        "text": "Which group should you join?",
        "choices": [
          "Starter Plot",
          "Herb Team",
          "Compost Crew",
          "Greenhouse Club"
        ],
        "correct": 1,
        "explanation": "解説：初心者、週末のみ、共有道具が必要。Starter Plotは土曜日、初心者向け、共用道具あり。\n各選択肢：\n1. 正答。週末、初心者向け、共有道具あり。\n2. 初心者向けだが、水曜朝で道具持参。\n3. 週末で道具ありだが、経験者向けで重作業中心。\n4. 道具と指導はあるが、火曜夜のみ。"
      },
      {
        "id": 29,
        "section": "第3部",
        "part": "Part 3",
        "instruction": "SituationとQuestionを読んだ後、放送を聞き、条件に最も合う選択肢を選んでください。",
        "voice": "Narration",
        "audioFile": "",
        "script": "B: For groups of four, please consider both safety rules and return times. Family Rowboat seats two adults and two children, includes four life jackets, and can be rented for two hours starting now, so you would be back by 3:45. Lake Cruiser is comfortable and also seats four, but it has a small motor, which some visitors do not want. Twin Kayaks are non-motorized and available immediately; however, each kayak holds only one adult and one child, and children must be over ten. Sunset Canoe is non-motorized and seats four, but the next rental period begins at 3:30 and ends after 5.",
        "situation": "You are renting a boat for two adults and two children. You do not want a motor, and you must return before 4 p.m. You hear the rental clerk.",
        "questionText": "Which boat should you rent?",
        "text": "Which boat should you rent?",
        "choices": [
          "Lake Cruiser",
          "Twin Kayaks",
          "Sunset Canoe",
          "Family Rowboat"
        ],
        "correct": 4,
        "explanation": "解説：大人2人・子ども2人、モーターなし、4時前返却。Family Rowboatは4人分のライフジャケット付きで3:45返却。\n各選択肢：\n1. 4人乗りだが、モーター付き。\n2. モーターなしだが、年齢条件があり、各艇の人数も合いにくい。\n3. モーターなしで4人乗りだが、返却が5時以降。\n4. 正答。4人乗り、モーターなし、3:45返却。"
      }
    ]
  }
];

  window.scbtPre1ListeningSets = pre1ListeningSets;
})();
