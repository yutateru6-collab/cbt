(() => {
  const listeningAudioBase =
    "https://pub-6e10f4d8b90b42c79b09bec4ee876a01.r2.dev/scbt/grade2/releases/20260724-simba32";
  const set02GeminiApprovedAudioBase =
    "https://pub-6e10f4d8b90b42c79b09bec4ee876a01.r2.dev/scbt/grade2/releases/20260807-gemini-approved-v2";
  const geminiListeningAudioBase =
    "https://pub-6e10f4d8b90b42c79b09bec4ee876a01.r2.dev/scbt/grade2/releases/20260729-gemini31";
  const testCompleteListeningAudioBase =
    "https://pub-6e10f4d8b90b42c79b09bec4ee876a01.r2.dev/scbt/grade2/test/20260729-complete";
  const listeningPart2Sets = [
  {
    "key": "sample",
    "label": "サンプル問題",
    "questions": [
      {
        "id": 1,
        "section": "第1部",
        "part": "Part 1",
        "instruction": "対話を聞き、最後の質問に対する答えとして最も適切なものを選んでください。",
        "voice": "Conversation",
        "audioFile": "assets/audio/grade2/sample/part1/simba-3.2-final/No01.wav",
        "script": "B: Did you finish the poster for tomorrow's science fair? A: Almost, but the printer in the library stopped working. Could you print the final page at home tonight? B: I can, but send me the file before seven. I have basketball practice after that. A: Thanks. I'll email it during lunch and bring the other pages tomorrow.",
        "questionText": "What does the girl ask the boy to do?",
        "text": "What does the girl ask the boy to do?",
        "choices": [
          "Email her the poster file.",
          "Print one page at his house.",
          "Bring the other pages tomorrow.",
          "Repair the library printer."
        ],
        "correct": 2,
        "explanation": "正答は2です。対話の内容と最後の質問を聞き取り、選択肢「Print one page at his house.」に当たる内容を選びます。"
      },
      {
        "id": 2,
        "section": "第1部",
        "part": "Part 1",
        "instruction": "対話を聞き、最後の質問に対する答えとして最も適切なものを選んでください。",
        "voice": "Conversation",
        "audioFile": "assets/audio/grade2/sample/part1/simba-3.2-final/No02.wav",
        "script": "A: Good afternoon. I reserved a quiet room for two nights under the name Laura Green. B: I found your reservation, Ms. Green. The quiet room won't be ready until six, but a room near the elevator is available now. A: I'd rather wait. Can I leave my suitcase here while I get something to eat? B: Certainly. We'll keep it behind the front desk and call you when your room is ready.",
        "questionText": "What does the man say about the quiet room?",
        "text": "What does the man say about the quiet room?",
        "choices": [
          "It is near the elevator.",
          "It is available immediately.",
          "It is reserved for one night.",
          "It will be ready at six."
        ],
        "correct": 4,
        "explanation": "正答は4です。対話の内容と最後の質問を聞き取り、選択肢「It will be ready at six.」に当たる内容を選びます。"
      },
      {
        "id": 3,
        "section": "第1部",
        "part": "Part 1",
        "instruction": "対話を聞き、最後の質問に対する答えとして最も適切なものを選んでください。",
        "voice": "Conversation",
        "audioFile": "assets/audio/grade2/sample/part1/simba-3.2-final/No03.wav",
        "script": "B: I'm starting dinner now. We have an unexpected guest tonight. A: Really? I thought we were going to eat at the new Thai restaurant. B: Dad is bringing Grandma over, and she doesn't like spicy food. Could you set the table? A: Sure. I'll make a salad too. The soup and chicken should be enough for the main dishes.",
        "questionText": "Why is the man preparing dinner at home?",
        "text": "Why is the man preparing dinner at home?",
        "choices": [
          "His grandmother does not like spicy food.",
          "The Thai restaurant is closed tonight.",
          "His father asked him to prepare dinner.",
          "He wants to try a new chicken recipe."
        ],
        "correct": 1,
        "explanation": "正答は1です。対話の内容と最後の質問を聞き取り、選択肢「His grandmother does not like spicy food.」に当たる内容を選びます。"
      },
      {
        "id": 4,
        "section": "第1部",
        "part": "Part 1",
        "instruction": "対話を聞き、最後の質問に対する答えとして最も適切なものを選んでください。",
        "voice": "Conversation",
        "audioFile": "assets/audio/grade2/sample/part1/simba-3.2-final/No04.wav",
        "script": "B: The monthly sales report is due tomorrow, and I'm still checking the figures from our Osaka office. A: I finished my section early. I can review those figures after lunch if that would help. B: That would be great. I'll send you the spreadsheet and mark the numbers that look unusual. A: Perfect. I have a meeting at two, so I'll look at it before then.",
        "questionText": "What does the woman offer to do?",
        "text": "What does the woman offer to do?",
        "choices": [
          "Finish the entire sales report.",
          "Send the spreadsheet to Osaka.",
          "Check some figures for the man.",
          "Move her afternoon meeting."
        ],
        "correct": 3,
        "explanation": "正答は3です。対話の内容と最後の質問を聞き取り、選択肢「Check some figures for the man.」に当たる内容を選びます。"
      },
      {
        "id": 5,
        "section": "第1部",
        "part": "Part 1",
        "instruction": "対話を聞き、最後の質問に対する答えとして最も適切なものを選んでください。",
        "voice": "Conversation",
        "audioFile": "assets/audio/grade2/sample/part1/simba-3.2-final/No05.wav",
        "script": "A: Excuse me, does this bus stop at the city art museum? B: Not today. The road in front of the museum is closed, so this bus only goes as far as Central Station. A: I see. Is there another way to get there from the station? B: Take the Green Line train one stop, then walk two blocks north. The museum entrance is across from the post office.",
        "questionText": "Where will the woman probably go first?",
        "text": "Where will the woman probably go first?",
        "choices": [
          "The post office near the museum",
          "Central Station at the end of the route",
          "The main entrance of the museum",
          "The platform for the Green Line"
        ],
        "correct": 2,
        "explanation": "正答は2です。対話の内容と最後の質問を聞き取り、選択肢「Central Station at the end of the route」に当たる内容を選びます。"
      },
      {
        "id": 6,
        "section": "第1部",
        "part": "Part 1",
        "instruction": "対話を聞き、最後の質問に対する答えとして最も適切なものを選んでください。",
        "voice": "Conversation",
        "audioFile": "assets/audio/grade2/sample/part1/simba-3.2-final/No06.wav",
        "script": "A: Are you still going to the outdoor movie Friday? We first planned to bring folding chairs. B: I was, but rain is likely, and I don't own an umbrella. I may watch at home. A: I have an extra one. The chairs may sink into wet ground, so a blanket would be better. B: Great. I'll meet you at the park gate and bring a large blanket.",
        "questionText": "What will the man bring to the movie?",
        "text": "What will the man bring to the movie?",
        "choices": [
          "A large blanket for sitting",
          "A folding chair for the movie",
          "An extra umbrella for the rain",
          "A small television from home"
        ],
        "correct": 1,
        "explanation": "正答は1です。対話の内容と最後の質問を聞き取り、選択肢「A large blanket for sitting」に当たる内容を選びます。"
      },
      {
        "id": 7,
        "section": "第1部",
        "part": "Part 1",
        "instruction": "対話を聞き、最後の質問に対する答えとして最も適切なものを選んでください。",
        "voice": "Conversation",
        "audioFile": "assets/audio/grade2/sample/part1/simba-3.2-final/No07.wav",
        "script": "B: I'd like to renew this travel guide, but the machine says I can't. A: Let me check. Another reader has requested it, so it must be returned today. B: That's unfortunate. I'm leaving for Italy next week and hoped to take it with me. A: We have an electronic copy you can borrow for two weeks. I can show you how to download it.",
        "questionText": "What do we learn about returning the printed travel guide?",
        "text": "What do we learn about returning the printed travel guide?",
        "choices": [
          "It can be returned after his trip.",
          "It should be returned in two weeks.",
          "It was returned earlier that day.",
          "It must be returned that day."
        ],
        "correct": 4,
        "explanation": "正答は4です。対話の内容と最後の質問を聞き取り、選択肢「It must be returned that day.」に当たる内容を選びます。"
      },
      {
        "id": 8,
        "section": "第1部",
        "part": "Part 1",
        "instruction": "対話を聞き、最後の質問に対する答えとして最も適切なものを選んでください。",
        "voice": "Conversation",
        "audioFile": "assets/audio/grade2/sample/part1/simba-3.2-final/No08.wav",
        "script": "A: I ordered the vegetable pasta, but this plate has chicken in it. B: I'm sorry. I must have picked up another table's order. A: Could you bring the vegetable pasta instead? Please leave the bread, though; we haven't touched it yet. B: Of course. I'll replace the pasta right away, and you can keep the bread.",
        "questionText": "What does the woman ask the man to bring?",
        "text": "What does the woman ask the man to bring?",
        "choices": [
          "Another basket of bread",
          "The plate with chicken pasta",
          "A serving of vegetable pasta",
          "A menu showing the desserts"
        ],
        "correct": 3,
        "explanation": "正答は3です。対話の内容と最後の質問を聞き取り、選択肢「A serving of vegetable pasta」に当たる内容を選びます。"
      },
      {
        "id": 9,
        "section": "第1部",
        "part": "Part 1",
        "instruction": "対話を聞き、最後の質問に対する答えとして最も適切なものを選んでください。",
        "voice": "Conversation",
        "audioFile": "assets/audio/grade2/sample/part1/simba-3.2-final/No09.wav",
        "script": "B: Hello. I have an appointment at ten tomorrow, but my train has been canceled. A: I can move your appointment to two thirty, or you can come Thursday morning. B: Two thirty tomorrow would work. Do I need to arrive early for any forms? A: Just ten minutes early. Your information from last year is still in our system.",
        "questionText": "Why did the man call the woman?",
        "text": "Why did the man call the woman?",
        "choices": [
          "To change his appointment time.",
          "To ask for new patient forms.",
          "To confirm a Thursday appointment.",
          "To report a problem with the doctor."
        ],
        "correct": 1,
        "explanation": "正答は1です。対話の内容と最後の質問を聞き取り、選択肢「To change his appointment time.」に当たる内容を選びます。"
      },
      {
        "id": 10,
        "section": "第1部",
        "part": "Part 1",
        "instruction": "対話を聞き、最後の質問に対する答えとして最も適切なものを選んでください。",
        "voice": "Conversation",
        "audioFile": "assets/audio/grade2/sample/part1/simba-3.2-final/No10.wav",
        "script": "A: The neighborhood clean-up is this Saturday, but I heard you have a tennis match that morning. B: That's right. I can't help in the park, but I could collect the filled trash bags after my match. A: That would solve our transportation problem. I'll ask volunteers to leave the bags beside the east gate. B: Good. My brother has a small truck, and he said I could borrow it.",
        "questionText": "What will the man do after his tennis match?",
        "text": "What will the man do after his tennis match?",
        "choices": [
          "Clean the park with volunteers.",
          "Play another tennis match.",
          "Ask his brother to join the clean-up.",
          "Collect the filled trash bags."
        ],
        "correct": 4,
        "explanation": "正答は4です。対話の内容と最後の質問を聞き取り、選択肢「Collect the filled trash bags.」に当たる内容を選びます。"
      },
      {
        "id": 11,
        "section": "第1部",
        "part": "Part 1",
        "instruction": "対話を聞き、最後の質問に対する答えとして最も適切なものを選んでください。",
        "voice": "Conversation",
        "audioFile": "assets/audio/grade2/sample/part1/simba-3.2-final/No11.wav",
        "script": "A: Hi. I bought this jacket yesterday, but the zipper gets stuck halfway up. B: I'm sorry about that. We can exchange it, or I can give you a full refund. A: I'd like the same jacket in a larger size, if you have one. B: We have blue ones today. Gray jackets arrive Friday, and black ones won't be here until next Tuesday.",
        "questionText": "When will the black jackets be available?",
        "text": "When will the black jackets be available?",
        "choices": [
          "Later in the same day",
          "On the following Tuesday",
          "On Friday of that week",
          "On the day before"
        ],
        "correct": 2,
        "explanation": "正答は2です。対話の内容と最後の質問を聞き取り、選択肢「On the following Tuesday」に当たる内容を選びます。"
      },
      {
        "id": 12,
        "section": "第1部",
        "part": "Part 1",
        "instruction": "対話を聞き、最後の質問に対する答えとして最も適切なものを選んでください。",
        "voice": "Conversation",
        "audioFile": "assets/audio/grade2/sample/part1/simba-3.2-final/No12.wav",
        "script": "B: Our flight leaves at six tomorrow morning. Should we book a taxi to the airport? A: Taxis are expensive that early. The hotel shuttle begins at five, but it takes forty minutes. B: That would be too late. The night bus reaches the airport at four thirty and stops across the street. A: Then let's take the night bus. We can walk from the stop to the terminal.",
        "questionText": "How will they travel to the airport?",
        "text": "How will they travel to the airport?",
        "choices": [
          "By taking an early taxi",
          "On the hotel's first shuttle",
          "On the overnight airport bus",
          "By taking the morning train"
        ],
        "correct": 3,
        "explanation": "正答は3です。対話の内容と最後の質問を聞き取り、選択肢「On the overnight airport bus」に当たる内容を選びます。"
      },
      {
        "id": 13,
        "section": "第1部",
        "part": "Part 1",
        "instruction": "対話を聞き、最後の質問に対する答えとして最も適切なものを選んでください。",
        "voice": "Conversation",
        "audioFile": "assets/audio/grade2/sample/part1/simba-3.2-final/No13.wav",
        "script": "A: Mr. Clark, I finished my history presentation, but it's almost twelve minutes long. B: The limit is eight minutes, so you'll need to shorten it before Monday. A: I could remove the section about early trade routes. It has the most detailed map. B: Keep the map. Instead, cut the two examples at the end; they repeat points you already made.",
        "questionText": "What does the man suggest removing?",
        "text": "What does the man suggest removing?",
        "choices": [
          "The entire history presentation",
          "The map of early trade routes",
          "The section about early trade routes",
          "The two examples at the end"
        ],
        "correct": 4,
        "explanation": "正答は4です。対話の内容と最後の質問を聞き取り、選択肢「The two examples at the end」に当たる内容を選びます。"
      },
      {
        "id": 14,
        "section": "第1部",
        "part": "Part 1",
        "instruction": "対話を聞き、最後の質問に対する答えとして最も適切なものを選んでください。",
        "voice": "Conversation",
        "audioFile": "assets/audio/grade2/sample/part1/simba-3.2-final/No14.wav",
        "script": "B: Could you cover the early shift tomorrow? I need to take my son to the dentist. A: I wish I could, but I have a video meeting with our Singapore office at eight. B: Then I'll ask someone else. Would you be able to take my Friday afternoon shift instead? A: Yes, that works. My meeting on Friday ends before noon.",
        "questionText": "Why can't the woman cover the early shift?",
        "text": "Why can't the woman cover the early shift?",
        "choices": [
          "She must take her son to the dentist.",
          "She has an international video meeting.",
          "She is working Friday afternoon.",
          "She has to ask someone else for help."
        ],
        "correct": 2,
        "explanation": "正答は2です。対話の内容と最後の質問を聞き取り、選択肢「She has an international video meeting.」に当たる内容を選びます。"
      },
      {
        "id": 15,
        "section": "第1部",
        "part": "Part 1",
        "instruction": "対話を聞き、最後の質問に対する答えとして最も適切なものを選んでください。",
        "voice": "Conversation",
        "audioFile": "assets/audio/grade2/sample/part1/simba-3.2-final/No15.wav",
        "script": "A: This package was left outside my apartment, but the label has your unit number. B: Oh, it's the coffee maker I ordered. I thought it would arrive tomorrow. A: The box is wet from the rain, though. You should check whether anything inside was damaged. B: Thanks for bringing it over. I'll open it now and contact the store if there's a problem.",
        "questionText": "What surprised the man about the package?",
        "text": "What surprised the man about the package?",
        "choices": [
          "It arrived earlier than expected.",
          "It was delivered to his apartment.",
          "The coffee maker was damaged.",
          "The store had already contacted him."
        ],
        "correct": 1,
        "explanation": "正答は1です。対話の内容と最後の質問を聞き取り、選択肢「It arrived earlier than expected.」に当たる内容を選びます。"
      },
      {
        "id": 16,
        "section": "第2部",
        "part": "Part 2",
        "instruction": "英文の内容に関する質問に答えてください。",
        "voice": "Female",
        "audioFile": "assets/audio/grade2/sample/part2/simba-3.2-final/No16.wav",
        "script": "During her first month as a volunteer at a local museum, Nina had trouble answering visitors’ questions about an old bridge. She knew the basic facts, but she often forgot important dates during busy tours. Instead of memorizing a long guidebook, she made a small timeline and reviewed it before each shift. She can now explain the bridge’s history more clearly.",
        "questionText": "What helped Nina explain the bridge’s history better?",
        "text": "What helped Nina explain the bridge’s history better?",
        "choices": [
          "Reading the entire guidebook during tours.",
          "Asking visitors to supply important dates.",
          "Reviewing a timeline before each shift.",
          "Giving shorter explanations about the bridge."
        ],
        "correct": 3,
        "explanation": "正答は3です。設問は「What helped Nina explain the bridge’s history better?」について尋ねており、本文では「Reviewing a timeline before each shift.」に当たる内容が説明されています。"
      },
      {
        "id": 17,
        "section": "第2部",
        "part": "Part 2",
        "instruction": "英文の内容に関する質問に答えてください。",
        "voice": "Male",
        "audioFile": "assets/audio/grade2/sample/part2/simba-3.2-final/No17.wav",
        "script": "The Westside Sports Center will replace the lockers in its main changing rooms next Tuesday. Those rooms will be unavailable from 9 a.m. until 3 p.m., but the swimming pool will remain open as usual. Visitors should use the smaller changing area beside Court Two. Please bring your own lock, since the temporary lockers do not have built-in keys.",
        "questionText": "What should visitors bring to the sports center?",
        "text": "What should visitors bring to the sports center?",
        "choices": [
          "A lock for the temporary locker.",
          "A key from the main changing room.",
          "A ticket for the swimming pool.",
          "Equipment for activities on Court Two."
        ],
        "correct": 1,
        "explanation": "正答は1です。設問は「What should visitors bring to the sports center?」について尋ねており、本文では「A lock for the temporary locker.」に当たる内容が説明されています。"
      },
      {
        "id": 18,
        "section": "第2部",
        "part": "Part 2",
        "instruction": "英文の内容に関する質問に答えてください。",
        "voice": "Male",
        "audioFile": "assets/audio/grade2/sample/part2/simba-3.2-final/No18.wav",
        "script": "A customer asked Leo to prepare a birthday cake without nuts. He carefully checked the ingredients, but the chocolate decorations he usually buys were made in a factory that also handles almonds. Leo called the customer and suggested using fresh fruit instead. The customer agreed, so he changed the design while keeping the same price and delivery time for Saturday.",
        "questionText": "Why did Leo replace the chocolate decorations?",
        "text": "Why did Leo replace the chocolate decorations?",
        "choices": [
          "Fresh fruit was cheaper than chocolate.",
          "The customer changed the delivery time.",
          "The chocolate decorations were sold out.",
          "The chocolate might have come into contact with nuts."
        ],
        "correct": 4,
        "explanation": "正答は4です。設問は「Why did Leo replace the chocolate decorations?」について尋ねており、本文では「The chocolate might have come into contact with nuts.」に当たる内容が説明されています。"
      },
      {
        "id": 19,
        "section": "第2部",
        "part": "Part 2",
        "instruction": "英文の内容に関する質問に答えてください。",
        "voice": "Female",
        "audioFile": "assets/audio/grade2/sample/part2/simba-3.2-final/No19.wav",
        "script": "Some desert plants open their flowers only at night. This helps them avoid losing too much water in the daytime heat. Night-flying insects, including certain moths, carry pollen between the flowers as they feed after sunset. Many of these flowers are pale and have a strong smell, making them easier for insects to find when there is little light.",
        "questionText": "What makes many night-opening flowers easy to find?",
        "text": "What makes many night-opening flowers easy to find?",
        "choices": [
          "They grow beside sources of water.",
          "They are pale and have a strong smell.",
          "They produce warmth after the sun goes down.",
          "They remain closed while insects are feeding."
        ],
        "correct": 2,
        "explanation": "正答は2です。設問は「What makes many night-opening flowers easy to find?」について尋ねており、本文では「They are pale and have a strong smell.」に当たる内容が説明されています。"
      },
      {
        "id": 20,
        "section": "第2部",
        "part": "Part 2",
        "instruction": "英文の内容に関する質問に答えてください。",
        "voice": "Female",
        "audioFile": "assets/audio/grade2/sample/part2/simba-3.2-final/No20.wav",
        "script": "Maya planned to take a large suitcase on her weekend train trip. Then she learned that the station near her hotel had no elevator and many stairs to climb. She considered sending the suitcase ahead, but the delivery would arrive too late. In the end, she packed fewer clothes in a backpack and decided to wash one outfit at the hotel.",
        "questionText": "What did Maya finally decide to do?",
        "text": "What did Maya finally decide to do?",
        "choices": [
          "Take fewer clothes and wash one outfit.",
          "Send her large suitcase to the hotel.",
          "Use the station elevator with her luggage.",
          "Cancel the weekend trip by train."
        ],
        "correct": 1,
        "explanation": "正答は1です。設問は「What did Maya finally decide to do?」について尋ねており、本文では「Take fewer clothes and wash one outfit.」に当たる内容が説明されています。"
      },
      {
        "id": 21,
        "section": "第2部",
        "part": "Part 2",
        "instruction": "英文の内容に関する質問に答えてください。",
        "voice": "Male",
        "audioFile": "assets/audio/grade2/sample/part2/simba-3.2-final/No21.wav",
        "script": "Green Street Books is holding a travel-writing workshop this Saturday afternoon. The event is free, but space is limited to twenty people in total. Customers who registered online should collect a numbered ticket at the front desk by 1:45 before the workshop begins. Any tickets not collected by then will be offered to people waiting in the store.",
        "questionText": "What will happen to uncollected workshop tickets?",
        "text": "What will happen to uncollected workshop tickets?",
        "choices": [
          "They will be moved to the front desk.",
          "They will be sold to online customers.",
          "They will be saved for a later workshop.",
          "They will be offered to people waiting in the store."
        ],
        "correct": 4,
        "explanation": "正答は4です。設問は「What will happen to uncollected workshop tickets?」について尋ねており、本文では「They will be offered to people waiting in the store.」に当たる内容が説明されています。"
      },
      {
        "id": 22,
        "section": "第2部",
        "part": "Part 2",
        "instruction": "英文の内容に関する質問に答えてください。",
        "voice": "Male",
        "audioFile": "assets/audio/grade2/sample/part2/simba-3.2-final/No22.wav",
        "script": "After a dry summer, Omar’s community garden was using more tap water than expected. He noticed that rain from the tool shed roof simply flowed onto the path. With permission from the garden manager, he connected a barrel to the roof’s drainpipe. The stored water is now used for flowers, while vegetables are still watered from the regular supply for safety.",
        "questionText": "How did Omar reduce the garden’s tap-water use?",
        "text": "How did Omar reduce the garden’s tap-water use?",
        "choices": [
          "By watering every plant less often.",
          "By collecting roof water for the flowers.",
          "By replacing the vegetables with flowers.",
          "By moving the tool shed beside the garden."
        ],
        "correct": 2,
        "explanation": "正答は2です。設問は「How did Omar reduce the garden’s tap-water use?」について尋ねており、本文では「By collecting roof water for the flowers.」に当たる内容が説明されています。"
      },
      {
        "id": 23,
        "section": "第2部",
        "part": "Part 2",
        "instruction": "英文の内容に関する質問に答えてください。",
        "voice": "Female",
        "audioFile": "assets/audio/grade2/sample/part2/simba-3.2-final/No23.wav",
        "script": "As a child, Elena enjoyed recording the sounds of birds and trains on her phone. In college, she discovered that sound designers create background noise for films and games. She visited a small studio, where a designer showed her how ordinary objects can produce unusual effects. That experience led Elena to apply for a summer internship in professional audio production.",
        "questionText": "Why did Elena apply for the internship?",
        "text": "Why did Elena apply for the internship?",
        "choices": [
          "She wanted to record more trains and birds.",
          "She needed college credit for visiting a studio.",
          "She became interested in professional sound production.",
          "She hoped to design ordinary objects for games."
        ],
        "correct": 3,
        "explanation": "正答は3です。設問は「Why did Elena apply for the internship?」について尋ねており、本文では「She became interested in professional sound production.」に当たる内容が説明されています。"
      },
      {
        "id": 24,
        "section": "第2部",
        "part": "Part 2",
        "instruction": "英文の内容に関する質問に答えてください。",
        "voice": "Male",
        "audioFile": "assets/audio/grade2/sample/part2/simba-3.2-final/No24.wav",
        "script": "Passengers traveling on the 6:20 train to Lakeside should note a platform change. The train will leave from Platform 7 instead of Platform 4 because repair work is being done near the usual track. The departure time has not changed. Passengers with bicycles should use the elevator at the north end of the station to reach the new platform.",
        "questionText": "What change has been made to the train?",
        "text": "What change has been made to the train?",
        "choices": [
          "It will depart at a later time.",
          "It will leave from a different platform.",
          "It will no longer carry bicycles.",
          "It will stop at the north end of the station."
        ],
        "correct": 2,
        "explanation": "正答は2です。設問は「What change has been made to the train?」について尋ねており、本文では「It will leave from a different platform.」に当たる内容が説明されています。"
      },
      {
        "id": 25,
        "section": "第2部",
        "part": "Part 2",
        "instruction": "英文の内容に関する質問に答えてください。",
        "voice": "Male",
        "audioFile": "assets/audio/grade2/sample/part2/simba-3.2-final/No25.wav",
        "script": "Noise from the street had begun to wake Daniel before his alarm. He first tried wearing earplugs, but they made it hard for him to hear his baby at night. He then moved a tall bookshelf against the outside wall and added thick curtains. The room became quieter, although he still wakes early when garbage trucks stop nearby on Fridays.",
        "questionText": "What made Daniel’s room quieter?",
        "text": "What made Daniel’s room quieter?",
        "choices": [
          "A bookshelf and thick curtains.",
          "An earlier alarm on Fridays.",
          "New windows facing the street.",
          "Earplugs that allowed him to hear the baby."
        ],
        "correct": 1,
        "explanation": "正答は1です。設問は「What made Daniel’s room quieter?」について尋ねており、本文では「A bookshelf and thick curtains.」に当たる内容が説明されています。"
      },
      {
        "id": 26,
        "section": "第2部",
        "part": "Part 2",
        "instruction": "英文の内容に関する質問に答えてください。",
        "voice": "Female",
        "audioFile": "assets/audio/grade2/sample/part2/simba-3.2-final/No26.wav",
        "script": "A thermos bottle slows the movement of heat between a drink and the air around it. Many bottles have two walls with very little air between them. This space reduces heat transfer, so hot drinks stay hot and cold drinks stay cold longer. A tight lid also limits the amount of warm or cool air that can escape from the bottle.",
        "questionText": "Why can a thermos keep drinks hot or cold?",
        "text": "Why can a thermos keep drinks hot or cold?",
        "choices": [
          "It warms the air inside the bottle.",
          "It prevents the lid from becoming loose.",
          "It reduces the movement of heat.",
          "It adds extra heat to the drink."
        ],
        "correct": 3,
        "explanation": "正答は3です。設問は「Why can a thermos keep drinks hot or cold?」について尋ねており、本文では「It reduces the movement of heat.」に当たる内容が説明されています。"
      },
      {
        "id": 27,
        "section": "第2部",
        "part": "Part 2",
        "instruction": "英文の内容に関する質問に答えてください。",
        "voice": "Female",
        "audioFile": "assets/audio/grade2/sample/part2/simba-3.2-final/No27.wav",
        "script": "Priya ordered hiking shoes from an online store before a school trip. The shoes fit well, but one lace hook was loose. The store offered either a refund or a replacement, though a replacement would not arrive before her departure. Priya kept the shoes, had the hook repaired locally, and sent the receipt to the store for repayment afterward.",
        "questionText": "Why did Priya keep the hiking shoes?",
        "text": "Why did Priya keep the hiking shoes?",
        "choices": [
          "The store would not give her a refund.",
          "The loose hook did not need repair.",
          "A replacement would arrive after her trip began.",
          "The shoes were no longer available online."
        ],
        "correct": 3,
        "explanation": "正答は3です。設問は「Why did Priya keep the hiking shoes?」について尋ねており、本文では「A replacement would arrive after her trip began.」に当たる内容が説明されています。"
      },
      {
        "id": 28,
        "section": "第2部",
        "part": "Part 2",
        "instruction": "英文の内容に関する質問に答えてください。",
        "voice": "Male",
        "audioFile": "assets/audio/grade2/sample/part2/simba-3.2-final/No28.wav",
        "script": "Before his parents’ anniversary dinner, Marcus promised to collect a special dessert from a bakery. On the day of the dinner, his work meeting was moved to a later time. His sister could visit the bakery, but she did not know which order to collect. Marcus forwarded her the confirmation message and asked her to pick it up on his behalf.",
        "questionText": "What did Marcus ask his sister to do?",
        "text": "What did Marcus ask his sister to do?",
        "choices": [
          "Move his work meeting to another day.",
          "Tell the bakery to change the dessert.",
          "Send him the bakery’s confirmation message.",
          "Collect the dessert using his order information."
        ],
        "correct": 4,
        "explanation": "正答は4です。設問は「What did Marcus ask his sister to do?」について尋ねており、本文では「Collect the dessert using his order information.」に当たる内容が説明されています。"
      },
      {
        "id": 29,
        "section": "第2部",
        "part": "Part 2",
        "instruction": "英文の内容に関する質問に答えてください。",
        "voice": "Female",
        "audioFile": "assets/audio/grade2/sample/part2/simba-3.2-final/No29.wav",
        "script": "The City Library’s second floor will be closed for painting from Monday through Thursday. Books from that floor can still be requested at the information desk, although they may take up to twenty minutes to arrive. Study tables have been moved to the meeting room downstairs. The children’s area and computer room will operate normally throughout the painting work.",
        "questionText": "Where have the library’s study tables been moved?",
        "text": "Where have the library’s study tables been moved?",
        "choices": [
          "At the information desk on the second floor.",
          "In the downstairs meeting room.",
          "Inside the children’s area.",
          "In the computer room."
        ],
        "correct": 2,
        "explanation": "正答は2です。設問は「Where have the library’s study tables been moved?」について尋ねており、本文では「In the downstairs meeting room.」に当たる内容が説明されています。"
      },
      {
        "id": 30,
        "section": "第2部",
        "part": "Part 2",
        "instruction": "英文の内容に関する質問に答えてください。",
        "voice": "Female",
        "audioFile": "assets/audio/grade2/sample/part2/simba-3.2-final/No30.wav",
        "script": "Recently, Hana discovered that several photos from a school event were missing from her laptop. She had copied them from her camera, but she had not checked whether the transfer was complete before deleting the originals. A technician recovered most of the files. Since then, Hana has kept two copies and checks both carefully before clearing her camera’s memory card.",
        "questionText": "What new habit has Hana adopted?",
        "text": "What new habit has Hana adopted?",
        "choices": [
          "Keeping and checking two copies of her photos.",
          "Deleting pictures immediately after each event.",
          "Leaving all photographs on her camera.",
          "Asking a technician to transfer every file."
        ],
        "correct": 1,
        "explanation": "正答は1です。設問は「What new habit has Hana adopted?」について尋ねており、本文では「Keeping and checking two copies of her photos.」に当たる内容が説明されています。"
      }
    ]
  },
  {
    "key": "set-01",
    "label": "第1回",
    "questions": [
      {
        "id": 1,
        "section": "第1部",
        "part": "Part 1",
        "instruction": "対話を聞き、最後の質問に対する答えとして最も適切なものを選んでください。",
        "voice": "Conversation",
        "audioFile": "",
        "script": "B: The recording for our school radio show still isn't in the shared folder. A: I finished editing it, but the file is too large to send by email. Could you upload it from the media room? B: Sure, but I need the final title before lunch because the teacher checks everything at one. A: I'll message you the title now. The interview section doesn't need any more changes.",
        "questionText": "What does the girl ask the boy to do?",
        "text": "What does the girl ask the boy to do?",
        "choices": [
          "Edit the interview section again.",
          "Email the recording to the teacher.",
          "Upload the recording from the media room.",
          "Choose a new title for the show."
        ],
        "correct": 3,
        "explanation": "正答は3です。対話の内容と最後の質問を聞き取り、選択肢「Upload the recording from the media room.」に当たる内容を選びます。"
      },
      {
        "id": 2,
        "section": "第1部",
        "part": "Part 1",
        "instruction": "対話を聞き、最後の質問に対する答えとして最も適切なものを選んでください。",
        "voice": "Conversation",
        "audioFile": "",
        "script": "A: I signed up for the beginner yoga class that meets on Wednesday evenings. B: That class has moved to Thursday because the instructor is attending a training course. The starting time is still seven. A: Thursday works for me. Do I need to register again at the front desk? B: No, your name is already on the new list. Just bring the same membership card.",
        "questionText": "What is true about the yoga class?",
        "text": "What is true about the yoga class?",
        "choices": [
          "It will be held on Thursday.",
          "It will begin earlier than planned.",
          "It needs a different instructor.",
          "It requires another registration."
        ],
        "correct": 1,
        "explanation": "正答は1です。対話の内容と最後の質問を聞き取り、選択肢「It will be held on Thursday.」に当たる内容を選びます。"
      },
      {
        "id": 3,
        "section": "第1部",
        "part": "Part 1",
        "instruction": "対話を聞き、最後の質問に対する答えとして最も適切なものを選んでください。",
        "voice": "Conversation",
        "audioFile": "",
        "script": "A: I can't meet you at the café this afternoon. A repair worker is coming to look at our washing machine. B: Didn't your brother say he would stay home for that? A: He was supposed to, but his manager asked him to work an extra shift. The worker may arrive anytime between two and five. B: No problem. We can meet tomorrow after my class instead.",
        "questionText": "Why will the woman stay home this afternoon?",
        "text": "Why will the woman stay home this afternoon?",
        "choices": [
          "She has to finish some housework.",
          "Her brother is visiting after work.",
          "She is waiting for a café delivery.",
          "She must meet a repair worker."
        ],
        "correct": 4,
        "explanation": "正答は4です。対話の内容と最後の質問を聞き取り、選択肢「She must meet a repair worker.」に当たる内容を選びます。"
      },
      {
        "id": 4,
        "section": "第1部",
        "part": "Part 1",
        "instruction": "対話を聞き、最後の質問に対する答えとして最も適切なものを選んでください。",
        "voice": "Conversation",
        "audioFile": "",
        "script": "B: These boxes for the Sendai branch are ready, but I haven't printed the shipping labels. A: The printer beside my desk is working again. I can print the labels while you check the addresses. B: Thanks. Please use the express service for the two boxes marked urgent. A: All right. I'll separate those labels and bring everything to the mailroom before three.",
        "questionText": "What does the woman offer to do?",
        "text": "What does the woman offer to do?",
        "choices": [
          "Check the branch addresses.",
          "Print the shipping labels.",
          "Carry the boxes to Sendai.",
          "Repair the office printer."
        ],
        "correct": 2,
        "explanation": "正答は2です。対話の内容と最後の質問を聞き取り、選択肢「Print the shipping labels.」に当たる内容を選びます。"
      },
      {
        "id": 5,
        "section": "第1部",
        "part": "Part 1",
        "instruction": "対話を聞き、最後の質問に対する答えとして最も適切なものを選んでください。",
        "voice": "Conversation",
        "audioFile": "",
        "script": "B: Excuse me, I left a black backpack on the train from Riverside this morning. A: Was it the train that arrived here at nine forty? Its lost items were taken to the service office downstairs. B: Yes, that was the one. I already checked the platform, but nobody had found it there. A: Then go to the service office and describe the key chain attached to the bag.",
        "questionText": "Where should the man go?",
        "text": "Where should the man go?",
        "choices": [
          "The Riverside ticket counter",
          "The arrival platform upstairs",
          "The service office downstairs",
          "The police station near the train line"
        ],
        "correct": 3,
        "explanation": "正答は3です。対話の内容と最後の質問を聞き取り、選択肢「The service office downstairs」に当たる内容を選びます。"
      },
      {
        "id": 6,
        "section": "第1部",
        "part": "Part 1",
        "instruction": "対話を聞き、最後の質問に対する答えとして最も適切なものを選んでください。",
        "voice": "Conversation",
        "audioFile": "",
        "script": "A: Are you ready for the hiking trip on Sunday? The weather report says it may get cold near the top. B: I packed a light jacket and some gloves. I was going to bring sandwiches, too. A: Mina is making lunch for everyone, but we still need something for hot drinks. B: Then I'll bring my small camping stove. We can use it to heat water during the break.",
        "questionText": "What will the man bring for the group?",
        "text": "What will the man bring for the group?",
        "choices": [
          "A small camping stove",
          "Several pairs of gloves",
          "Sandwiches for lunch",
          "A detailed weather report"
        ],
        "correct": 1,
        "explanation": "正答は1です。対話の内容と最後の質問を聞き取り、選択肢「A small camping stove」に当たる内容を選びます。"
      },
      {
        "id": 7,
        "section": "第1部",
        "part": "Part 1",
        "instruction": "対話を聞き、最後の質問に対する答えとして最も適切なものを選んでください。",
        "voice": "Conversation",
        "audioFile": "",
        "script": "B: I'm here to pick up the medicine my doctor ordered yesterday. A: Let me check. The tablets are ready, but the liquid medicine won't arrive until tomorrow morning. B: I need both before I leave town tonight. Can another pharmacy fill the rest of the order? A: Yes. The pharmacy inside West Mall has it in stock, and I'll send your prescription there.",
        "questionText": "Where can the man get the liquid medicine today?",
        "text": "Where can the man get the liquid medicine today?",
        "choices": [
          "At the pharmacy inside West Mall",
          "At his doctor's office",
          "At the current pharmacy",
          "At a pharmacy near the station"
        ],
        "correct": 1,
        "explanation": "正答は1です。対話の内容と最後の質問を聞き取り、選択肢「At the pharmacy inside West Mall」に当たる内容を選びます。"
      },
      {
        "id": 8,
        "section": "第1部",
        "part": "Part 1",
        "instruction": "対話を聞き、最後の質問に対する答えとして最も適切なものを選んでください。",
        "voice": "Conversation",
        "audioFile": "",
        "script": "A: I ordered the mushroom soup, but I think this one contains shrimp. I'm allergic to shellfish. B: I'm very sorry. The bowls look similar, and I brought the seafood soup by mistake. A: Could you replace it with the mushroom soup? I haven't touched the salad, so please leave that here. B: Certainly. I'll bring the correct soup and check the ingredients with the chef first.",
        "questionText": "What does the woman ask the man to bring?",
        "text": "What does the woman ask the man to bring?",
        "choices": [
          "A different salad",
          "The mushroom soup",
          "A list of seafood dishes",
          "Another bowl of shrimp soup"
        ],
        "correct": 2,
        "explanation": "正答は2です。対話の内容と最後の質問を聞き取り、選択肢「The mushroom soup」に当たる内容を選びます。"
      },
      {
        "id": 9,
        "section": "第1部",
        "part": "Part 1",
        "instruction": "対話を聞き、最後の質問に対する答えとして最も適切なものを選んでください。",
        "voice": "Conversation",
        "audioFile": "",
        "script": "B: Hello. I have a dental cleaning scheduled for Friday morning, but my company has added an important meeting. A: We have an opening at four Friday afternoon, or you could come at eleven next Monday. B: Four on Friday is best. Will the same dentist be available then? A: Yes, Dr. Allen will see you. Please arrive five minutes early to update your address.",
        "questionText": "Why did the man call the woman?",
        "text": "Why did the man call the woman?",
        "choices": [
          "To request a different dentist",
          "To report a change of address",
          "To ask how long a cleaning takes",
          "To change the time of his appointment"
        ],
        "correct": 4,
        "explanation": "正答は4です。対話の内容と最後の質問を聞き取り、選択肢「To change the time of his appointment」に当たる内容を選びます。"
      },
      {
        "id": 10,
        "section": "第1部",
        "part": "Part 1",
        "instruction": "対話を聞き、最後の質問に対する答えとして最も適切なものを選んでください。",
        "voice": "Conversation",
        "audioFile": "",
        "script": "A: The community garden needs volunteers Saturday morning. I can water the new plants, but I can't lift the soil bags. B: I can move the bags after I finish setting up the tables for the plant sale. A: Great. Please leave four bags beside each flower bed, not near the gate. B: Got it. I'll borrow the garden cart so I can carry several at once.",
        "questionText": "What will the man do at the garden?",
        "text": "What will the man do at the garden?",
        "choices": [
          "Water the new plants.",
          "Sell flowers at the gate.",
          "Move bags of soil.",
          "Repair the garden cart."
        ],
        "correct": 3,
        "explanation": "正答は3です。対話の内容と最後の質問を聞き取り、選択肢「Move bags of soil.」に当たる内容を選びます。"
      },
      {
        "id": 11,
        "section": "第1部",
        "part": "Part 1",
        "instruction": "対話を聞き、最後の質問に対する答えとして最も適切なものを選んでください。",
        "voice": "Conversation",
        "audioFile": "",
        "script": "A: I ordered these running shoes online, but they feel too tight around the toes. B: We can exchange them here. This model is available in a larger size in gray today. A: I was hoping for the same blue color. When will the larger blue ones arrive? B: Our delivery is expected next Wednesday. I can reserve a pair under your name.",
        "questionText": "When will the larger blue shoes arrive?",
        "text": "When will the larger blue shoes arrive?",
        "choices": [
          "Later today",
          "Next Wednesday",
          "This weekend",
          "At the end of the month"
        ],
        "correct": 2,
        "explanation": "正答は2です。対話の内容と最後の質問を聞き取り、選択肢「Next Wednesday」に当たる内容を選びます。"
      },
      {
        "id": 12,
        "section": "第1部",
        "part": "Part 1",
        "instruction": "対話を聞き、最後の質問に対する答えとして最も適切なものを選んでください。",
        "voice": "Conversation",
        "audioFile": "",
        "script": "B: Our hotel is fifteen kilometers from the concert hall. Should we rent a car for tomorrow night? A: Parking near the hall costs a lot, and the last subway leaves before the concert ends. B: The hotel runs a concert shuttle at six thirty and brings guests back afterward. A: That sounds easiest. Let's reserve two seats at the front desk before dinner.",
        "questionText": "How will they probably travel to the concert?",
        "text": "How will they probably travel to the concert?",
        "choices": [
          "On the hotel shuttle",
          "By the last subway",
          "In a rented car",
          "By walking from the hotel"
        ],
        "correct": 1,
        "explanation": "正答は1です。対話の内容と最後の質問を聞き取り、選択肢「On the hotel shuttle」に当たる内容を選びます。"
      },
      {
        "id": 13,
        "section": "第1部",
        "part": "Part 1",
        "instruction": "対話を聞き、最後の質問に対する答えとして最も適切なものを選んでください。",
        "voice": "Conversation",
        "audioFile": "",
        "script": "B: Ms. Lee, my speech about space travel is nearly ten minutes, but the class limit is seven. A: Your explanation of the first moon landing is clear, so keep that part. B: Should I remove the section about future hotels in space? It has several examples. A: Keep one example, but cut the long description of the hotel's rooms and restaurants.",
        "questionText": "What does the woman suggest removing?",
        "text": "What does the woman suggest removing?",
        "choices": [
          "The first moon landing explanation",
          "Every example of space hotels",
          "The detailed hotel description",
          "The speech introduction"
        ],
        "correct": 3,
        "explanation": "正答は3です。対話の内容と最後の質問を聞き取り、選択肢「The detailed hotel description」に当たる内容を選びます。"
      },
      {
        "id": 14,
        "section": "第1部",
        "part": "Part 1",
        "instruction": "対話を聞き、最後の質問に対する答えとして最も適切なものを選んでください。",
        "voice": "Conversation",
        "audioFile": "",
        "script": "A: Could you open the shop tomorrow morning? My daughter has a school ceremony at eight thirty. B: I would, but the supplier is delivering new shelves to my apartment at that time. A: I see. Could you take my evening closing shift instead? I can ask Carlos about the morning. B: Yes, I can close tomorrow. My delivery should be finished before noon.",
        "questionText": "Why can't the man open the shop?",
        "text": "Why can't the man open the shop?",
        "choices": [
          "He is attending a school ceremony.",
          "He is expecting a delivery.",
          "He has to close another store.",
          "He is meeting Carlos at home."
        ],
        "correct": 2,
        "explanation": "正答は2です。対話の内容と最後の質問を聞き取り、選択肢「He is expecting a delivery.」に当たる内容を選びます。"
      },
      {
        "id": 15,
        "section": "第1部",
        "part": "Part 1",
        "instruction": "対話を聞き、最後の質問に対する答えとして最も適切なものを選んでください。",
        "voice": "Conversation",
        "audioFile": "",
        "script": "A: This envelope was delivered to my office, but your company name is printed on it. B: That's the contract I sent to our lawyer. I used your floor number by mistake. A: I noticed it was marked urgent, so I brought it upstairs right away. B: Thanks. I expected it back next week, so I'm surprised the lawyer returned it so quickly.",
        "questionText": "What surprised the man about the envelope?",
        "text": "What surprised the man about the envelope?",
        "choices": [
          "It was addressed to another company.",
          "It was marked as urgent.",
          "It was sent to a lawyer.",
          "It came back earlier than expected."
        ],
        "correct": 4,
        "explanation": "正答は4です。対話の内容と最後の質問を聞き取り、選択肢「It came back earlier than expected.」に当たる内容を選びます。"
      },
      {
        "id": 16,
        "section": "第2部",
        "part": "Part 2",
        "instruction": "英文の内容に関する質問に答えてください。",
        "voice": "Female",
        "audioFile": "",
        "script": "During her first weeks at a design company, Nina tried to write down every comment made during team meetings. She often missed later points because she was still writing. A colleague showed her how to divide a page into decisions and tasks. Nina used the new format at the next meeting and found it easier to follow the discussion.",
        "questionText": "Why did Nina change how she took notes?",
        "text": "Why did Nina change how she took notes?",
        "choices": [
          "To share her notes with a colleague",
          "To avoid missing later information",
          "To record every comment accurately",
          "To prepare tasks before each meeting"
        ],
        "correct": 2,
        "explanation": "Ninaはすべてを書こうとしている間に、会議の後半の情報を聞き逃していました。そこで、決定事項と作業だけを分けて書く方法に変えました。"
      },
      {
        "id": 17,
        "section": "第2部",
        "part": "Part 2",
        "instruction": "英文の内容に関する質問に答えてください。",
        "voice": "Male",
        "audioFile": "",
        "script": "The Riverside Science Center will open its space exhibition this Saturday. The main hall will be available from nine, but the planetarium will remain closed until one because new equipment is being tested. Visitors with morning planetarium tickets may use them for any afternoon show. The café and gift shop will operate on their normal schedule.",
        "questionText": "What can morning planetarium ticket holders do?",
        "text": "What can morning planetarium ticket holders do?",
        "choices": [
          "Enter the main hall before nine",
          "Test the new planetarium equipment",
          "Attend a planetarium show in the afternoon",
          "Receive discounts at the café and gift shop"
        ],
        "correct": 3,
        "explanation": "午前のプラネタリウムのチケットは、午後のどの上映にも使用できます。プラネタリウムは午後1時まで閉まっています。"
      },
      {
        "id": 18,
        "section": "第2部",
        "part": "Part 2",
        "instruction": "英文の内容に関する質問に答えてください。",
        "voice": "Male",
        "audioFile": "",
        "script": "For several years, Omar grew vegetables on his apartment balcony. Last spring, nearby construction blocked most of the sunlight. He considered moving the plants indoors, but there was not enough space. Instead, he rented a small garden plot near his office. He now checks the plants during his lunch break, though carrying tools there is sometimes inconvenient.",
        "questionText": "How did Omar deal with the lack of sunlight?",
        "text": "How did Omar deal with the lack of sunlight?",
        "choices": [
          "He rented land near his workplace.",
          "He moved his vegetables indoors.",
          "He stopped growing vegetables temporarily.",
          "He carried the plants to work daily."
        ],
        "correct": 1,
        "explanation": "工事で日光が遮られたため、Omarは職場近くの小さな区画を借りました。室内への移動は検討しただけで、実行していません。"
      },
      {
        "id": 19,
        "section": "第2部",
        "part": "Part 2",
        "instruction": "英文の内容に関する質問に答えてください。",
        "voice": "Female",
        "audioFile": "",
        "script": "Attention, passengers. Because of repair work, trains will not stop at Lake Street Station after eight this evening. Passengers traveling there should leave the train at Central Station and use the free bus outside the north exit. The final bus will depart at eleven thirty. Regular train service at Lake Street will begin again tomorrow morning.",
        "questionText": "How should passengers reach Lake Street tonight?",
        "text": "How should passengers reach Lake Street tonight?",
        "choices": [
          "By walking from the north exit",
          "By waiting for tomorrow’s first train",
          "By changing trains at Central Station",
          "By taking a free bus from Central Station"
        ],
        "correct": 4,
        "explanation": "Lake Street駅には列車が停車しないため、Central Stationで降り、北口の外から無料バスを利用します。"
      },
      {
        "id": 20,
        "section": "第2部",
        "part": "Part 2",
        "instruction": "英文の内容に関する質問に答えてください。",
        "voice": "Female",
        "audioFile": "",
        "script": "When Elena joined a weekend running club, she expected every member to train at the same speed. During her first session, however, the coach placed runners in three groups based on experience. Elena chose the middle group, but after two weeks she moved to the slower one. She wanted to improve her breathing technique before trying to run faster.",
        "questionText": "Why did Elena change running groups?",
        "text": "Why did Elena change running groups?",
        "choices": [
          "The coach ended the middle group.",
          "She wanted to work on her breathing.",
          "She preferred training without experienced runners.",
          "The slower group met at a better time."
        ],
        "correct": 2,
        "explanation": "Elenaは速く走る前に呼吸法を改善したかったため、より遅いグループへ移りました。"
      },
      {
        "id": 21,
        "section": "第2部",
        "part": "Part 2",
        "instruction": "英文の内容に関する質問に答えてください。",
        "voice": "Male",
        "audioFile": "",
        "script": "Some birds place ants among their feathers. Scientists call this unusual behavior anting. The ants release chemicals that may help remove tiny insects living on the birds’ bodies. Birds sometimes use other insects in a similar way. Researchers are still studying the behavior, so they cannot say that cleaning is its only purpose.",
        "questionText": "What is one possible benefit of anting?",
        "text": "What is one possible benefit of anting?",
        "choices": [
          "It may remove insects from birds’ bodies.",
          "It may help birds find more food.",
          "It may protect ants from other insects.",
          "It may make birds’ feathers grow faster."
        ],
        "correct": 1,
        "explanation": "アリが出す化学物質によって、鳥の体にいる小さな虫が取り除かれる可能性があります。ただし、それが唯一の目的とは断定されていません。"
      },
      {
        "id": 22,
        "section": "第2部",
        "part": "Part 2",
        "instruction": "英文の内容に関する質問に答えてください。",
        "voice": "Male",
        "audioFile": "",
        "script": "Before starting college, Marcus planned to buy a new laptop. He found one with excellent performance, but it was heavier than he expected. Another model was lighter and had a longer battery life, although its screen was smaller. Since he would carry it across campus every day, Marcus chose the lighter model instead of the more powerful one.",
        "questionText": "Why did Marcus select the lighter laptop?",
        "text": "Why did Marcus select the lighter laptop?",
        "choices": [
          "It had the largest screen available.",
          "It offered the best performance.",
          "It was more suitable for carrying around.",
          "It cost less than the powerful model."
        ],
        "correct": 3,
        "explanation": "Marcusは毎日キャンパス内を持ち運ぶため、性能の高い重い機種ではなく、軽い機種を選びました。"
      },
      {
        "id": 23,
        "section": "第2部",
        "part": "Part 2",
        "instruction": "英文の内容に関する質問に答えてください。",
        "voice": "Female",
        "audioFile": "",
        "script": "Students who plan to use the school art room during summer vacation must register by Friday. The room will be open on Tuesdays and Thursdays from ten to three. Paint and brushes will be provided, but students must bring their own paper or canvas. A teacher will be present, although regular art lessons will not be offered.",
        "questionText": "What must students bring to the art room?",
        "text": "What must students bring to the art room?",
        "choices": [
          "Their own paint and brushes",
          "A completed art project",
          "Written permission from a teacher",
          "Their own paper or canvas"
        ],
        "correct": 4,
        "explanation": "絵の具と筆は学校が用意しますが、紙またはキャンバスは生徒自身が持参する必要があります。"
      },
      {
        "id": 24,
        "section": "第2部",
        "part": "Part 2",
        "instruction": "英文の内容に関する質問に答えてください。",
        "voice": "Female",
        "audioFile": "",
        "script": "Recently, noise from the street had made it difficult for Priya to sleep. She first thought the problem came from a nearby restaurant, but the noise continued after the restaurant closed. One night, she noticed delivery trucks stopping beside her building before sunrise. Priya contacted the building manager, who arranged for the trucks to use another entrance.",
        "questionText": "What was actually causing the noise?",
        "text": "What was actually causing the noise?",
        "choices": [
          "Delivery trucks arriving early",
          "Customers leaving the restaurant",
          "Workers repairing the building",
          "The manager opening another entrance"
        ],
        "correct": 1,
        "explanation": "Priyaは最初レストランを疑いましたが、実際の原因は夜明け前に建物のそばへ来る配送トラックでした。"
      },
      {
        "id": 25,
        "section": "第2部",
        "part": "Part 2",
        "instruction": "英文の内容に関する質問に答えてください。",
        "voice": "Male",
        "audioFile": "",
        "script": "A local theater planned to perform an outdoor play in the town square on Sunday. The weather report now says heavy rain is likely. The performance will therefore take place in the community hall at the same starting time. Tickets remain valid, but seating in the hall is limited. People without tickets will not be admitted.",
        "questionText": "What change has been made to the play?",
        "text": "What change has been made to the play?",
        "choices": [
          "It will begin later than planned.",
          "It will be held inside.",
          "It will be performed on another day.",
          "It will be open to people without tickets."
        ],
        "correct": 2,
        "explanation": "大雨が予想されるため、会場が屋外の広場から屋内のコミュニティーホールへ変更されました。開始時刻は変わりません。"
      },
      {
        "id": 26,
        "section": "第2部",
        "part": "Part 2",
        "instruction": "英文の内容に関する質問に答えてください。",
        "voice": "Male",
        "audioFile": "",
        "script": "After Daniel began working from home, he often forgot to take breaks. By late afternoon, he found it hard to concentrate. Rather than setting several phone alarms, he started using a kitchen timer that rings every fifty minutes. When it rings, he stands up and walks around for five minutes. The timer helps him separate work periods from short breaks.",
        "questionText": "How does Daniel remember to take breaks?",
        "text": "How does Daniel remember to take breaks?",
        "choices": [
          "He stops working every afternoon.",
          "He follows reminders from his phone.",
          "He uses a timer while working.",
          "He walks whenever concentration becomes difficult."
        ],
        "correct": 3,
        "explanation": "Danielは50分ごとに鳴るキッチンタイマーを使い、休憩の時間を思い出すようにしています。"
      },
      {
        "id": 27,
        "section": "第2部",
        "part": "Part 2",
        "instruction": "英文の内容に関する質問に答えてください。",
        "voice": "Female",
        "audioFile": "",
        "script": "At the Green Market, customers can earn extra points this month by returning clean glass jars from products sold there. Each jar must still have the store’s label, and customers must show the receipt from the original purchase. Jars from other stores will be accepted for recycling, but they will not earn points. The offer ends on the last day of the month.",
        "questionText": "Which jars can earn customers extra points?",
        "text": "Which jars can earn customers extra points?",
        "choices": [
          "Any jars brought before month’s end",
          "Clean jars purchased from other stores",
          "Jars returned without their original labels",
          "Labeled store jars with proof of purchase"
        ],
        "correct": 4,
        "explanation": "ポイントを得るには、その店の商品が入っていた清潔な瓶で、店のラベルが残っており、購入時のレシートも提示する必要があります。"
      },
      {
        "id": 28,
        "section": "第2部",
        "part": "Part 2",
        "instruction": "英文の内容に関する質問に答えてください。",
        "voice": "Female",
        "audioFile": "",
        "script": "For her history project, Mei planned to interview her grandfather about the neighborhood where he grew up. He became ill on the day of their meeting, so she did not visit him. Instead, he sent her several voice messages describing local shops and festivals. Mei used those recordings in her presentation and postponed the interview until he recovered.",
        "questionText": "How did Mei complete her presentation?",
        "text": "How did Mei complete her presentation?",
        "choices": [
          "By interviewing local shop owners",
          "By using her grandfather’s recordings",
          "By visiting her grandfather later that day",
          "By researching festivals at the library"
        ],
        "correct": 2,
        "explanation": "祖父への対面インタビューは延期されましたが、祖父が送った音声メッセージを発表に利用しました。"
      },
      {
        "id": 29,
        "section": "第2部",
        "part": "Part 2",
        "instruction": "英文の内容に関する質問に答えてください。",
        "voice": "Male",
        "audioFile": "",
        "script": "Visitors to West Hill Park may notice that several walking paths are covered with natural wood chips. The chips help keep the ground from becoming muddy after rain. They also reduce damage to tree roots by guiding visitors along marked routes. Park workers replace the chips each spring because they slowly break down over time.",
        "questionText": "What is one purpose of the wood chips?",
        "text": "What is one purpose of the wood chips?",
        "choices": [
          "To protect the ground from becoming muddy",
          "To help tree roots grow across paths",
          "To mark areas where workers plant trees",
          "To prevent the paths from breaking down"
        ],
        "correct": 1,
        "explanation": "ウッドチップには、雨の後に地面が泥だらけになるのを防ぐ働きがあります。また、木の根を守る効果も説明されています。"
      },
      {
        "id": 30,
        "section": "第2部",
        "part": "Part 2",
        "instruction": "英文の内容に関する質問に答えてください。",
        "voice": "Male",
        "audioFile": "",
        "script": "Last month, Theo volunteered to help at an animal shelter. He expected to walk dogs, but new volunteers were first asked to prepare food and clean bowls. After completing two training sessions, he was allowed to work with the dogs. Theo now helps on Saturday mornings, although he still spends part of each visit preparing meals.",
        "questionText": "What happened after Theo completed his training?",
        "text": "What happened after Theo completed his training?",
        "choices": [
          "He began training other new volunteers.",
          "He stopped preparing food for the animals.",
          "He changed his volunteer day to Saturday.",
          "He was permitted to work with the dogs."
        ],
        "correct": 4,
        "explanation": "Theoは2回の研修を終えた後、犬の世話をすることを許可されました。食事の準備も現在引き続き行っています。"
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
        "instruction": "対話を聞き、最後の質問に対する答えとして最も適切なものを選んでください。",
        "voice": "Conversation",
        "audioFile": "",
        "script": "A: The biology lab is missing two pairs of safety goggles after yesterday's experiment. B: I borrowed one pair for the science club demonstration and left it in my locker. A: Could you return it to the lab office before third period? Mr. Evans needs to count the equipment. B: Of course. I'll take it there on my way to math class and check whether Maya has the other pair.",
        "questionText": "What does the girl ask the boy to do?",
        "text": "What does the girl ask the boy to do?",
        "choices": [
          "Count all the lab equipment.",
          "Return the goggles before third period.",
          "Prepare a science club demonstration.",
          "Look for the goggles in her locker."
        ],
        "correct": 2,
        "explanation": "正答は2です。対話の内容と最後の質問を聞き取り、選択肢「Return the goggles before third period.」に当たる内容を選びます。"
      },
      {
        "id": 2,
        "section": "第1部",
        "part": "Part 1",
        "instruction": "対話を聞き、最後の質問に対する答えとして最も適切なものを選んでください。",
        "voice": "Conversation",
        "audioFile": "",
        "script": "B: I booked a room here for Saturday night. Is breakfast included in the price? A: Yes. On weekends, breakfast is served from seven thirty until ten in the garden restaurant. B: I have to leave for a cycling tour at eight. Can I get something before the restaurant opens? A: The front desk can prepare a breakfast box if you order it by nine this evening.",
        "questionText": "What does the woman say about breakfast?",
        "text": "What does the woman say about breakfast?",
        "choices": [
          "It costs extra on weekends.",
          "It begins at eight on Saturday.",
          "It is served beside the front desk.",
          "It can be prepared as a box."
        ],
        "correct": 4,
        "explanation": "正答は4です。対話の内容と最後の質問を聞き取り、選択肢「It can be prepared as a box.」に当たる内容を選びます。"
      },
      {
        "id": 3,
        "section": "第1部",
        "part": "Part 1",
        "instruction": "対話を聞き、最後の質問に対する答えとして最も適切なものを選んでください。",
        "voice": "Conversation",
        "audioFile": "",
        "script": "A: I'm going downtown after work to pick up Mom's birthday cake. B: Didn't the bakery say it could deliver the cake to our house? A: It could, but nobody will be home before six, and the bakery closes at five thirty. B: Then I'll buy the candles. We still have enough plates and napkins from the last party.",
        "questionText": "Why will the woman pick up the cake?",
        "text": "Why will the woman pick up the cake?",
        "choices": [
          "No one can receive the delivery in time.",
          "The bakery made the wrong kind of cake.",
          "Her mother wants to see the bakery.",
          "The man forgot to order the cake."
        ],
        "correct": 1,
        "explanation": "正答は1です。対話の内容と最後の質問を聞き取り、選択肢「No one can receive the delivery in time.」に当たる内容を選びます。"
      },
      {
        "id": 4,
        "section": "第1部",
        "part": "Part 1",
        "instruction": "対話を聞き、最後の質問に対する答えとして最も適切なものを選んでください。",
        "voice": "Conversation",
        "audioFile": "",
        "script": "A: The projector in Conference Room B won't connect to my laptop, and the client arrives in forty minutes. B: The cable in that room is old. I have a newer one in my desk drawer. A: Could I borrow it for the presentation? I already tested the slides on another screen. B: I'll bring the cable and help you connect it before I go to lunch.",
        "questionText": "What does the man offer to do?",
        "text": "What does the man offer to do?",
        "choices": [
          "Move the meeting to another room.",
          "Test all of the presentation slides.",
          "Bring a cable and connect the laptop.",
          "Call the client before lunch."
        ],
        "correct": 3,
        "explanation": "正答は3です。対話の内容と最後の質問を聞き取り、選択肢「Bring a cable and connect the laptop.」に当たる内容を選びます。"
      },
      {
        "id": 5,
        "section": "第1部",
        "part": "Part 1",
        "instruction": "対話を聞き、最後の質問に対する答えとして最も適切なものを選んでください。",
        "voice": "Conversation",
        "audioFile": "",
        "script": "B: My boarding pass says Gate Twelve, but the screen now shows Gate Eighteen. A: The gate was changed because the plane arrived late. Boarding will still begin at four twenty. B: I was waiting near Gate Twelve and didn't hear an announcement. A: Go to Gate Eighteen now. It's at the end of this hall, past the bookstore.",
        "questionText": "Where should the man go?",
        "text": "Where should the man go?",
        "choices": [
          "The information counter",
          "Gate Eighteen",
          "The airport bookstore",
          "Gate Twelve"
        ],
        "correct": 2,
        "explanation": "正答は2です。対話の内容と最後の質問を聞き取り、選択肢「Gate Eighteen」に当たる内容を選びます。"
      },
      {
        "id": 6,
        "section": "第1部",
        "part": "Part 1",
        "instruction": "対話を聞き、最後の質問に対する答えとして最も適切なものを選んでください。",
        "voice": "Conversation",
        "audioFile": "",
        "script": "B: For tomorrow's beach picnic, I packed paper cups and a large bottle of water. A: Good. I'll bring the sandwiches, and Nora is bringing fruit. We may need protection from the sun. B: I have a beach umbrella in my garage. It's wide enough for four people. A: Perfect. Bring that instead of the small blanket you mentioned yesterday.",
        "questionText": "What will the man bring to the picnic?",
        "text": "What will the man bring to the picnic?",
        "choices": [
          "A beach umbrella",
          "A small blanket",
          "Several fruit baskets",
          "Sandwiches for everyone"
        ],
        "correct": 1,
        "explanation": "正答は1です。対話の内容と最後の質問を聞き取り、選択肢「A beach umbrella」に当たる内容を選びます。"
      },
      {
        "id": 7,
        "section": "第1部",
        "part": "Part 1",
        "instruction": "対話を聞き、最後の質問に対する答えとして最も適切なものを選んでください。",
        "voice": "Conversation",
        "audioFile": "",
        "script": "A: I'd like to rent an audio guide for the modern art exhibit. B: The exhibit closes at five, but audio guides must be returned to this desk by four forty-five. A: That's fine. Does the guide include the special photography room on the second floor? B: Yes, but that room closes at four thirty, so you should visit it before the main gallery.",
        "questionText": "What do we learn about the audio guide?",
        "text": "What do we learn about the audio guide?",
        "choices": [
          "It is only for the photography room.",
          "It can be kept until the museum closes.",
          "It is collected on the second floor.",
          "It must be returned before five."
        ],
        "correct": 4,
        "explanation": "正答は4です。対話の内容と最後の質問を聞き取り、選択肢「It must be returned before five.」に当たる内容を選びます。"
      },
      {
        "id": 8,
        "section": "第1部",
        "part": "Part 1",
        "instruction": "対話を聞き、最後の質問に対する答えとして最も適切なものを選んでください。",
        "voice": "Conversation",
        "audioFile": "",
        "script": "B: Excuse me, I ordered an iced coffee with oat milk, but this tastes like regular milk. A: I'm sorry. I wrote your order correctly, but another drink may have been placed on the tray. B: Could you make a new one with oat milk? Please use the same size and no sugar. A: Certainly. I'll prepare it now and mark the cup clearly this time.",
        "questionText": "What does the man ask the woman to make?",
        "text": "What does the man ask the woman to make?",
        "choices": [
          "A smaller coffee without milk",
          "A hot drink with regular milk",
          "Another iced coffee with oat milk",
          "A sweet coffee in the same cup"
        ],
        "correct": 3,
        "explanation": "正答は3です。対話の内容と最後の質問を聞き取り、選択肢「Another iced coffee with oat milk」に当たる内容を選びます。"
      },
      {
        "id": 9,
        "section": "第1部",
        "part": "Part 1",
        "instruction": "対話を聞き、最後の質問に対する答えとして最も適切なものを選んでください。",
        "voice": "Conversation",
        "audioFile": "",
        "script": "A: Hello. My cat has an appointment tomorrow afternoon, but she has stopped eating since this morning. B: The veterinarian can see her at eleven today if you can come then. A: Yes, I can. Should I bring the medicine she took last month? B: Please do, along with the package it came in. That will help the doctor check the amount.",
        "questionText": "Why did the woman call the man?",
        "text": "Why did the woman call the man?",
        "choices": [
          "Her cat needs to be seen sooner.",
          "She lost her cat's medicine.",
          "She wants to cancel tomorrow's visit.",
          "She needs another package for the medicine."
        ],
        "correct": 1,
        "explanation": "正答は1です。対話の内容と最後の質問を聞き取り、選択肢「Her cat needs to be seen sooner.」に当たる内容を選びます。"
      },
      {
        "id": 10,
        "section": "第1部",
        "part": "Part 1",
        "instruction": "対話を聞き、最後の質問に対する答えとして最も適切なものを選んでください。",
        "voice": "Conversation",
        "audioFile": "",
        "script": "B: The charity book sale ends at four, and there will be twenty boxes left afterward. A: I can help pack them, but my car is too small to carry everything to the storage room. B: My uncle's van is available. I'll collect the boxes once the tables are folded. A: Great. The storage room key will be at the community center desk.",
        "questionText": "What will the man do after the sale?",
        "text": "What will the man do after the sale?",
        "choices": [
          "Fold all the sale tables.",
          "Lend his car to the woman.",
          "Leave the boxes at the center desk.",
          "Transport the books to storage."
        ],
        "correct": 4,
        "explanation": "正答は4です。対話の内容と最後の質問を聞き取り、選択肢「Transport the books to storage.」に当たる内容を選びます。"
      },
      {
        "id": 11,
        "section": "第1部",
        "part": "Part 1",
        "instruction": "対話を聞き、最後の質問に対する答えとして最も適切なものを選んでください。",
        "voice": "Conversation",
        "audioFile": "",
        "script": "B: I need a replacement battery for this camera before my trip on Friday. A: We sold the last one this morning, but our East Street store has three in stock. B: Can one be sent here, or should I go there myself? A: A transfer would take two days. If you visit East Street today, they'll hold one until closing.",
        "questionText": "Where can the man get the battery today?",
        "text": "Where can the man get the battery today?",
        "choices": [
          "At the camera repair center",
          "At the East Street store",
          "At this store after closing",
          "From a delivery service"
        ],
        "correct": 2,
        "explanation": "正答は2です。対話の内容と最後の質問を聞き取り、選択肢「At the East Street store」に当たる内容を選びます。"
      },
      {
        "id": 12,
        "section": "第1部",
        "part": "Part 1",
        "instruction": "対話を聞き、最後の質問に対する答えとして最も適切なものを選んでください。",
        "voice": "Conversation",
        "audioFile": "",
        "script": "A: The island museum opens at ten, but the first tour begins only fifteen minutes later. B: The early ferry reaches the island at nine thirty. The later one doesn't arrive until ten forty. A: Then we should take the early ferry and have coffee near the harbor while we wait. B: Agreed. I'll buy the tickets online tonight so we can board quickly in the morning.",
        "questionText": "How will they travel to the island?",
        "text": "How will they travel to the island?",
        "choices": [
          "On a sightseeing boat",
          "By a harbor bus",
          "On the early ferry",
          "By the later train"
        ],
        "correct": 3,
        "explanation": "正答は3です。対話の内容と最後の質問を聞き取り、選択肢「On the early ferry」に当たる内容を選びます。"
      },
      {
        "id": 13,
        "section": "第1部",
        "part": "Part 1",
        "instruction": "対話を聞き、最後の質問に対する答えとして最も適切なものを選んでください。",
        "voice": "Conversation",
        "audioFile": "",
        "script": "A: Coach Martin, our team introduction is six minutes, but the event organizer allows only four. B: Keep the part about this season's results because the audience will expect that. A: What about the interviews with former players? There are three short clips. B: Use only the first clip. The other two give almost the same advice and take too much time.",
        "questionText": "What does the man suggest removing?",
        "text": "What does the man suggest removing?",
        "choices": [
          "All information about the season",
          "The first former player interview",
          "The team introduction",
          "Two of the interview clips"
        ],
        "correct": 4,
        "explanation": "正答は4です。対話の内容と最後の質問を聞き取り、選択肢「Two of the interview clips」に当たる内容を選びます。"
      },
      {
        "id": 14,
        "section": "第1部",
        "part": "Part 1",
        "instruction": "対話を聞き、最後の質問に対する答えとして最も適切なものを選んでください。",
        "voice": "Conversation",
        "audioFile": "",
        "script": "B: Could you take my volunteer shift at the library tomorrow morning? My car needs an emergency repair. A: I can't. I'm leading a reading activity for children at another branch until noon. B: I understand. Could you cover Saturday afternoon instead? I can ask Daniel about tomorrow. A: Saturday is fine. The children's program doesn't meet on weekends.",
        "questionText": "Why can't the woman work tomorrow morning?",
        "text": "Why can't the woman work tomorrow morning?",
        "choices": [
          "She is leading a children's activity.",
          "Her car is being repaired.",
          "She is visiting Daniel.",
          "She has a Saturday program."
        ],
        "correct": 1,
        "explanation": "正答は1です。対話の内容と最後の質問を聞き取り、選択肢「She is leading a children's activity.」に当たる内容を選びます。"
      },
      {
        "id": 15,
        "section": "第1部",
        "part": "Part 1",
        "instruction": "対話を聞き、最後の質問に対する答えとして最も適切なものを選んでください。",
        "voice": "Conversation",
        "audioFile": "",
        "script": "B: The headphones I ordered were supposed to arrive Monday, but this box came today. A: The label says express delivery. Maybe the store upgraded the shipping without charging you. B: That's possible. I only chose standard shipping because I don't need them until next week. A: At least the package looks dry and undamaged. You should check that the correct model is inside.",
        "questionText": "What surprised the man about the delivery?",
        "text": "What surprised the man about the delivery?",
        "choices": [
          "The store charged for express shipping.",
          "The headphones arrived earlier than expected.",
          "The box was damaged by rain.",
          "The wrong model was sent."
        ],
        "correct": 2,
        "explanation": "正答は2です。対話の内容と最後の質問を聞き取り、選択肢「The headphones arrived earlier than expected.」に当たる内容を選びます。"
      },
      {
        "id": 16,
        "section": "第2部",
        "part": "Part 2",
        "instruction": "英文の内容に関する質問に答えてください。",
        "voice": "Male",
        "audioFile": "",
        "script": "After joining the school newspaper, Leo was asked to photograph a basketball game. He took many pictures, but most of them were unclear because the players were moving quickly. A teacher explained that he should use a faster camera setting. At the next game, Leo changed the setting and produced several sharp photographs for the newspaper.",
        "questionText": "What helped Leo take clearer photographs?",
        "text": "What helped Leo take clearer photographs?",
        "choices": [
          "Standing closer to the players",
          "Taking fewer pictures during games",
          "Using a faster camera setting",
          "Asking another student to photograph the game"
        ],
        "correct": 3,
        "explanation": "選手の動きが速く、写真がぼやけていたため、Leoはカメラの設定を速くしました。その結果、鮮明な写真を撮れるようになりました。"
      },
      {
        "id": 17,
        "section": "第2部",
        "part": "Part 2",
        "instruction": "英文の内容に関する質問に答えてください。",
        "voice": "Female",
        "audioFile": "",
        "script": "The City History Museum is offering free guided tours this weekend. Tours begin every hour from ten in the morning until three in the afternoon. Visitors do not need to pay, but they must collect a tour ticket at the information desk. Since each group is limited to fifteen people, tickets cannot be reserved by telephone.",
        "questionText": "What must visitors do to join a tour?",
        "text": "What must visitors do to join a tour?",
        "choices": [
          "Get a ticket at the information desk",
          "Reserve a place by telephone",
          "Pay before entering the museum",
          "Arrive before ten in the morning"
        ],
        "correct": 1,
        "explanation": "ツアーは無料ですが、参加するには案内所でチケットを受け取る必要があります。電話予約はできません。"
      },
      {
        "id": 18,
        "section": "第2部",
        "part": "Part 2",
        "instruction": "英文の内容に関する質問に答えてください。",
        "voice": "Female",
        "audioFile": "",
        "script": "When Sofia moved into her new apartment, she planned to put a desk beside the window. However, the afternoon sunlight made her computer screen difficult to see. She considered buying thicker curtains, but they would make the room too dark. In the end, she placed the desk against another wall and kept the window area open for plants.",
        "questionText": "What did Sofia finally decide to do?",
        "text": "What did Sofia finally decide to do?",
        "choices": [
          "Buy curtains for the window",
          "Stop using her computer in the afternoon",
          "Move her plants away from the window",
          "Put her desk against a different wall"
        ],
        "correct": 4,
        "explanation": "日光で画面が見にくかったため、Sofiaは最終的に机を別の壁際へ移しました。厚いカーテンは検討しただけです。"
      },
      {
        "id": 19,
        "section": "第2部",
        "part": "Part 2",
        "instruction": "英文の内容に関する質問に答えてください。",
        "voice": "Male",
        "audioFile": "",
        "script": "Some people wash fruit as soon as they bring it home. However, certain kinds of fruit may stay fresh longer if they are washed just before they are eaten. Extra moisture can help mold grow during storage. For this reason, people should usually keep such fruit dry in the refrigerator and wash it only when they are ready to use it.",
        "questionText": "Why should some fruit be stored without washing?",
        "text": "Why should some fruit be stored without washing?",
        "choices": [
          "Cold water can damage its taste.",
          "Moisture may cause mold to grow.",
          "Washing can remove useful vitamins.",
          "Dry fruit is easier to prepare."
        ],
        "correct": 2,
        "explanation": "洗った後の水分によって、保存中にカビが生えやすくなる場合があります。そのため、食べる直前まで洗わないほうがよいと説明されています。"
      },
      {
        "id": 20,
        "section": "第2部",
        "part": "Part 2",
        "instruction": "英文の内容に関する質問に答えてください。",
        "voice": "Female",
        "audioFile": "",
        "script": "For months, Grace had been saving money for a concert ticket. When tickets went on sale, she discovered that the cheapest seats had already sold out. She could afford a more expensive ticket, but doing so would use nearly all her savings. Grace decided to watch the online broadcast instead and keep the money for a summer trip.",
        "questionText": "Why did Grace not attend the concert?",
        "text": "Why did Grace not attend the concert?",
        "choices": [
          "She did not want to spend most of her savings.",
          "She had already planned another event that evening.",
          "The concert was not available online.",
          "All the concert tickets had sold out."
        ],
        "correct": 1,
        "explanation": "高いチケットを買うことは可能でしたが、貯金のほとんどを使うことになるため、Graceは参加しませんでした。"
      },
      {
        "id": 21,
        "section": "第2部",
        "part": "Part 2",
        "instruction": "英文の内容に関する質問に答えてください。",
        "voice": "Male",
        "audioFile": "",
        "script": "Thank you for using the Northside Library. Beginning next Monday, the second-floor study area will close for two weeks while new lights are installed. Books on that floor will still be available, and staff members can collect them for visitors. Additional desks have been placed in the meeting room on the first floor for anyone who needs a quiet place to study.",
        "questionText": "Where can visitors study during the work?",
        "text": "Where can visitors study during the work?",
        "choices": [
          "In the second-floor book area",
          "Beside the information desk",
          "In the first-floor meeting room",
          "In the room where lights are installed"
        ],
        "correct": 3,
        "explanation": "2階の学習スペースは閉鎖されますが、1階の会議室に追加の机が用意されます。"
      },
      {
        "id": 22,
        "section": "第2部",
        "part": "Part 2",
        "instruction": "英文の内容に関する質問に答えてください。",
        "voice": "Male",
        "audioFile": "",
        "script": "Recently, Aaron noticed that his electricity bill was higher than usual. He first blamed the air conditioner, but he had used it less than the previous month. Later, he found that an old refrigerator in the garage was running continuously because its door did not close properly. Aaron repaired the door, and the refrigerator began turning off normally again.",
        "questionText": "What caused Aaron’s higher electricity bill?",
        "text": "What caused Aaron’s higher electricity bill?",
        "choices": [
          "His air conditioner needed repairs.",
          "A refrigerator door was not closing properly.",
          "He added another refrigerator to the garage.",
          "The weather was hotter than usual."
        ],
        "correct": 2,
        "explanation": "ガレージの古い冷蔵庫のドアが正しく閉まらず、冷蔵庫が動き続けていたことが、電気代上昇の原因でした。"
      },
      {
        "id": 23,
        "section": "第2部",
        "part": "Part 2",
        "instruction": "英文の内容に関する質問に答えてください。",
        "voice": "Female",
        "audioFile": "",
        "script": "Maya hoped to volunteer at a food festival on Saturday morning. The organizers needed help at that time, but volunteers had to attend a training session on Friday evening. Maya had a school event then and could not attend. She therefore signed up for the Sunday afternoon shift, which had a separate training session early that same day.",
        "questionText": "How did Maya change her volunteer plan?",
        "text": "How did Maya change her volunteer plan?",
        "choices": [
          "She attended the Friday training session.",
          "She volunteered without receiving training.",
          "She chose a different festival.",
          "She changed to the Sunday afternoon shift."
        ],
        "correct": 4,
        "explanation": "金曜夜の研修に出られなかったため、Mayaは土曜午前ではなく日曜午後の担当に変更しました。"
      },
      {
        "id": 24,
        "section": "第2部",
        "part": "Part 2",
        "instruction": "英文の内容に関する質問に答えてください。",
        "voice": "Female",
        "audioFile": "",
        "script": "A small bookstore near Olivia’s home began selling used books last year. Customers can bring in books, but the store does not pay cash for them. Instead, it gives store credit based on each book’s condition and popularity. Olivia brought in five novels, and the credit she received covered part of the cost of a new dictionary.",
        "questionText": "What did Olivia receive for her used books?",
        "text": "What did Olivia receive for her used books?",
        "choices": [
          "Cash equal to their original price",
          "A free dictionary from the store",
          "Credit toward another purchase",
          "Five different used novels"
        ],
        "correct": 3,
        "explanation": "店は現金ではなく、状態や人気に応じた店内クレジットを渡します。Oliviaはそのクレジットを辞書の購入に使いました。"
      },
      {
        "id": 25,
        "section": "第2部",
        "part": "Part 2",
        "instruction": "英文の内容に関する質問に答えてください。",
        "voice": "Male",
        "audioFile": "",
        "script": "Passengers traveling on bus route 18 should be aware of a temporary change. Because the road beside Central Park is being repaired, buses will not use the Park Gate stop until Friday. Passengers should use the stop in front of the post office instead. The timetable will remain the same, and no other stops on the route will be affected.",
        "questionText": "What should passengers on route 18 do?",
        "text": "What should passengers on route 18 do?",
        "choices": [
          "Use the stop near the post office",
          "Take a different bus until Friday",
          "Expect every bus to arrive later",
          "Get off before reaching Central Park"
        ],
        "correct": 1,
        "explanation": "Park Gate停留所は一時的に使えないため、乗客は郵便局前の停留所を利用する必要があります。"
      },
      {
        "id": 26,
        "section": "第2部",
        "part": "Part 2",
        "instruction": "英文の内容に関する質問に答えてください。",
        "voice": "Male",
        "audioFile": "",
        "script": "During a family trip, Ben was responsible for choosing a restaurant for dinner. He found a popular seafood place, but his sister could not eat seafood. A nearby Italian restaurant had suitable dishes, although it did not accept reservations. Ben suggested arriving there before the usual dinner rush, and the family agreed to eat earlier than originally planned.",
        "questionText": "What did Ben’s family decide to do?",
        "text": "What did Ben’s family decide to do?",
        "choices": [
          "Reserve a table at the seafood restaurant",
          "Let Ben’s sister eat at another place",
          "Wait until the Italian restaurant became less busy",
          "Eat early at the Italian restaurant"
        ],
        "correct": 4,
        "explanation": "妹が魚介類を食べられないため、家族はイタリア料理店へ行き、混雑前の早い時間に食事をすることにしました。"
      },
      {
        "id": 27,
        "section": "第2部",
        "part": "Part 2",
        "instruction": "英文の内容に関する質問に答えてください。",
        "voice": "Female",
        "audioFile": "",
        "script": "Trees in cities can make streets more comfortable during hot weather. Their leaves block some sunlight, while water released from the leaves can cool the surrounding air. However, not every tree is suitable for every street. City planners must consider available space, local weather, and the amount of water a tree will need before choosing which kind to plant.",
        "questionText": "What is one benefit of city trees?",
        "text": "What is one benefit of city trees?",
        "choices": [
          "They require very little water.",
          "They make all streets equally cool.",
          "They can reduce heat around streets.",
          "They grow well in any available space."
        ],
        "correct": 3,
        "explanation": "木は日光を遮り、葉から水分を出すことで、周囲の空気を涼しくすることがあります。"
      },
      {
        "id": 28,
        "section": "第2部",
        "part": "Part 2",
        "instruction": "英文の内容に関する質問に答えてください。",
        "voice": "Female",
        "audioFile": "",
        "script": "Before giving a class presentation, Hannah practiced several times at home. Her speech was within the time limit, but she kept looking down at her notes. Rather than removing the notes completely, she wrote only key words on small cards. During the presentation, the cards helped her remember the main points while allowing her to look at the audience more often.",
        "questionText": "How did Hannah improve her presentation?",
        "text": "How did Hannah improve her presentation?",
        "choices": [
          "She made her speech much shorter.",
          "She memorized every sentence.",
          "She stopped practicing at home.",
          "She used cards containing key words."
        ],
        "correct": 4,
        "explanation": "Hannahは全文を書いたメモではなく、キーワードだけを書いたカードを使いました。その結果、聴衆を見る回数を増やせました。"
      },
      {
        "id": 29,
        "section": "第2部",
        "part": "Part 2",
        "instruction": "英文の内容に関する質問に答えてください。",
        "voice": "Male",
        "audioFile": "",
        "script": "The Lakeside Hotel will serve breakfast in the conference room tomorrow because the main dining room is being painted. Breakfast hours will not change. Guests should take the elevator to the third floor and follow the signs from there. Room service will also be available, but guests must order it before ten o’clock this evening.",
        "questionText": "Where will breakfast be served tomorrow?",
        "text": "Where will breakfast be served tomorrow?",
        "choices": [
          "In the conference room",
          "In each guest’s room",
          "In the main dining room",
          "Beside the third-floor elevator"
        ],
        "correct": 1,
        "explanation": "メインダイニングルームが塗装中のため、朝食は会議室で提供されます。時間の変更はありません。"
      },
      {
        "id": 30,
        "section": "第2部",
        "part": "Part 2",
        "instruction": "英文の内容に関する質問に答えてください。",
        "voice": "Male",
        "audioFile": "",
        "script": "When Isaac began learning to cook, he often chose recipes with many ingredients. He spent so much time preparing them that he sometimes lost interest before the food was ready. He then began choosing simpler meals that used only one pan. This reduced the preparation and cleaning time, so he now cooks at home more often.",
        "questionText": "Why does Isaac cook at home more often now?",
        "text": "Why does Isaac cook at home more often now?",
        "choices": [
          "His meals require less time and cleaning.",
          "He has learned to use more ingredients.",
          "Someone else prepares the food for him.",
          "His kitchen has more cooking equipment."
        ],
        "correct": 1,
        "explanation": "材料が少なく、フライパン一つで作れる料理を選ぶことで、準備と後片付けの時間が短くなりました。"
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
        "instruction": "対話を聞き、最後の質問に対する答えとして最も適切なものを選んでください。",
        "voice": "Conversation",
        "audioFile": "",
        "script": "B: We need twelve copies of the new song for tomorrow's school festival rehearsal. A: The music room printer is out of paper, and the office closes in twenty minutes. B: I can buy paper after soccer practice, but that may be too late. A: Could you print the copies at the public library now? I'll wait here and organize the music stands.",
        "questionText": "What does the girl ask the boy to do?",
        "text": "What does the girl ask the boy to do?",
        "choices": [
          "Buy paper after soccer practice.",
          "Organize the music stands.",
          "Wait in the school music room.",
          "Print the music at the library."
        ],
        "correct": 4,
        "explanation": "正答は4です。対話の内容と最後の質問を聞き取り、選択肢「Print the music at the library.」に当たる内容を選びます。"
      },
      {
        "id": 2,
        "section": "第1部",
        "part": "Part 1",
        "instruction": "対話を聞き、最後の質問に対する答えとして最も適切なものを選んでください。",
        "voice": "Conversation",
        "audioFile": "",
        "script": "A: I came for the noon swimming class, but the pool doors are locked. B: A pipe broke this morning, so the pool area will remain closed until Friday. A: Can I use my class ticket for a different activity today? B: Yes. The water exercise class has moved to the small gym and will start at twelve thirty.",
        "questionText": "What is true about the swimming pool?",
        "text": "What is true about the swimming pool?",
        "choices": [
          "It will reopen this afternoon.",
          "It is closed because of a broken pipe.",
          "It is being used for another class.",
          "It will be used for a class at twelve thirty."
        ],
        "correct": 2,
        "explanation": "正答は2です。対話の内容と最後の質問を聞き取り、選択肢「It is closed because of a broken pipe.」に当たる内容を選びます。"
      },
      {
        "id": 3,
        "section": "第1部",
        "part": "Part 1",
        "instruction": "対話を聞き、最後の質問に対する答えとして最も適切なものを選んでください。",
        "voice": "Conversation",
        "audioFile": "",
        "script": "B: I have to leave work early today to take our dog to the groomer. A: I thought your sister was taking him after her college class. B: She planned to, but her professor added a laboratory session this afternoon. The groomer has no openings next week. A: All right. I'll feed the dog before you get home so you can leave right away.",
        "questionText": "Why is the man taking the dog to the groomer?",
        "text": "Why is the man taking the dog to the groomer?",
        "choices": [
          "The dog needs to be fed early.",
          "The groomer changed the appointment.",
          "His sister is no longer available.",
          "His college class ends late."
        ],
        "correct": 3,
        "explanation": "正答は3です。対話の内容と最後の質問を聞き取り、選択肢「His sister is no longer available.」に当たる内容を選びます。"
      },
      {
        "id": 4,
        "section": "第1部",
        "part": "Part 1",
        "instruction": "対話を聞き、最後の質問に対する答えとして最も適切なものを選んでください。",
        "voice": "Conversation",
        "audioFile": "",
        "script": "B: The client presentation is ready, but the chart on slide eight is difficult to read. A: I can redesign that chart before the meeting. The rest of the slides only need a spelling check. B: That would help. Please use the sales numbers from the updated file, not yesterday's version. A: Understood. I'll send you the revised slide by ten so you can review it.",
        "questionText": "What does the woman offer to do?",
        "text": "What does the woman offer to do?",
        "choices": [
          "Redesign a chart for the meeting.",
          "Present the sales numbers herself.",
          "Check every slide with the client.",
          "Replace the updated file."
        ],
        "correct": 1,
        "explanation": "正答は1です。対話の内容と最後の質問を聞き取り、選択肢「Redesign a chart for the meeting.」に当たる内容を選びます。"
      },
      {
        "id": 5,
        "section": "第1部",
        "part": "Part 1",
        "instruction": "対話を聞き、最後の質問に対する答えとして最も適切なものを選んでください。",
        "voice": "Conversation",
        "audioFile": "",
        "script": "A: I think I dropped my wallet on the ferry from Harbor Point this morning. B: The crew found several items after the passengers left. They're being kept at the terminal office beside the ticket machines. A: My wallet is brown and has a small silver button. Should I call the ferry company first? B: You can go directly to the terminal office. Bring some identification if you have any.",
        "questionText": "Where should the woman go?",
        "text": "Where should the woman go?",
        "choices": [
          "The ferry company headquarters",
          "The Harbor Point dock",
          "The ticket machine area",
          "The terminal office"
        ],
        "correct": 4,
        "explanation": "正答は4です。対話の内容と最後の質問を聞き取り、選択肢「The terminal office」に当たる内容を選びます。"
      },
      {
        "id": 6,
        "section": "第1部",
        "part": "Part 1",
        "instruction": "対話を聞き、最後の質問に対する答えとして最も適切なものを選んでください。",
        "voice": "Conversation",
        "audioFile": "",
        "script": "A: We should check our camping supplies before we leave Friday. I have the tent and cooking pot. B: I packed sleeping bags and matches, but my old flashlight stopped working last night. A: I have a lantern for the campsite. We still need something small for walking to the restroom. B: I'll buy a new flashlight after work and bring extra batteries for it.",
        "questionText": "What will the man bring?",
        "text": "What will the man bring?",
        "choices": [
          "A new cooking pot",
          "A large campsite lantern",
          "A flashlight with extra batteries",
          "Another sleeping bag"
        ],
        "correct": 3,
        "explanation": "正答は3です。対話の内容と最後の質問を聞き取り、選択肢「A flashlight with extra batteries」に当たる内容を選びます。"
      },
      {
        "id": 7,
        "section": "第1部",
        "part": "Part 1",
        "instruction": "対話を聞き、最後の質問に対する答えとして最も適切なものを選んでください。",
        "voice": "Conversation",
        "audioFile": "",
        "script": "B: I had a blood test here on Monday and was told the results would be ready today. A: The doctor has reviewed them, but she wants to discuss one number with you by phone. B: I'm at work until six. Could she call during my lunch break around twelve thirty? A: Yes. I'll add that request to your record, and the doctor will call then.",
        "questionText": "What does the woman tell the man?",
        "text": "What does the woman tell the man?",
        "choices": [
          "He must repeat the blood test.",
          "The doctor wants to speak with him.",
          "His results will not be ready today.",
          "He should visit the clinic at six."
        ],
        "correct": 2,
        "explanation": "正答は2です。対話の内容と最後の質問を聞き取り、選択肢「The doctor wants to speak with him.」に当たる内容を選びます。"
      },
      {
        "id": 8,
        "section": "第1部",
        "part": "Part 1",
        "instruction": "対話を聞き、最後の質問に対する答えとして最も適切なものを選んでください。",
        "voice": "Conversation",
        "audioFile": "",
        "script": "A: I ordered a chocolate cake with strawberries, but this box contains a lemon cake. B: I'm sorry. Another customer has a similar name, and the boxes were probably switched. A: Could you bring the correct cake before my party starts at three? I can't return to the bakery. B: Yes. Our driver can deliver it by two thirty and collect the lemon cake.",
        "questionText": "What does the woman ask the man to bring?",
        "text": "What does the woman ask the man to bring?",
        "choices": [
          "The chocolate cake she ordered",
          "A box for the lemon cake",
          "Another customer's receipt",
          "Strawberries for the party"
        ],
        "correct": 1,
        "explanation": "正答は1です。対話の内容と最後の質問を聞き取り、選択肢「The chocolate cake she ordered」に当たる内容を選びます。"
      },
      {
        "id": 9,
        "section": "第1部",
        "part": "Part 1",
        "instruction": "対話を聞き、最後の質問に対する答えとして最も適切なものを選んでください。",
        "voice": "Conversation",
        "audioFile": "",
        "script": "B: Hello. My car is booked for an oil change Thursday morning, but the engine made a strange noise today. A: We can inspect it at two this afternoon, though the oil change may have to wait. B: That's fine. Is it safe to drive there, or should I arrange a tow truck? A: If the warning light is on, don't drive it. I can give you the number of our towing service.",
        "questionText": "Why did the man call the woman?",
        "text": "Why did the man call the woman?",
        "choices": [
          "To ask when the oil change was completed",
          "To cancel his Thursday appointment",
          "To report a new problem with his car",
          "To request a cheaper towing service"
        ],
        "correct": 3,
        "explanation": "正答は3です。対話の内容と最後の質問を聞き取り、選択肢「To report a new problem with his car」に当たる内容を選びます。"
      },
      {
        "id": 10,
        "section": "第1部",
        "part": "Part 1",
        "instruction": "対話を聞き、最後の質問に対する答えとして最も適切なものを選んでください。",
        "voice": "Conversation",
        "audioFile": "",
        "script": "A: The neighborhood recycling event starts at nine. I'll help people separate glass from plastic. B: I can load the full containers onto the city truck when it arrives at noon. A: Good. The paper containers should stay under the tent in case it rains. B: I'll also bring work gloves because some of the glass boxes may be heavy.",
        "questionText": "What will the man do at the event?",
        "text": "What will the man do at the event?",
        "choices": [
          "Separate all the plastic items.",
          "Set up a tent for the paper.",
          "Drive the city recycling truck.",
          "Load full containers onto the truck."
        ],
        "correct": 4,
        "explanation": "正答は4です。対話の内容と最後の質問を聞き取り、選択肢「Load full containers onto the truck.」に当たる内容を選びます。"
      },
      {
        "id": 11,
        "section": "第1部",
        "part": "Part 1",
        "instruction": "対話を聞き、最後の質問に対する答えとして最も適切なものを選んでください。",
        "voice": "Conversation",
        "audioFile": "",
        "script": "A: I'm looking for the new travel guide to northern Spain, but I don't see it on the shelf. B: We haven't received our regular copies yet. One copy is arriving with tomorrow morning's delivery. A: Could you hold it for me? I can come after my language class at four. B: Certainly. I'll put your name on the order and keep it behind the counter until closing.",
        "questionText": "When will the travel guide arrive?",
        "text": "When will the travel guide arrive?",
        "choices": [
          "Tomorrow morning",
          "After four tomorrow",
          "At closing time today",
          "Next week"
        ],
        "correct": 1,
        "explanation": "正答は1です。対話の内容と最後の質問を聞き取り、選択肢「Tomorrow morning」に当たる内容を選びます。"
      },
      {
        "id": 12,
        "section": "第1部",
        "part": "Part 1",
        "instruction": "対話を聞き、最後の質問に対する答えとして最も適切なものを選んでください。",
        "voice": "Conversation",
        "audioFile": "",
        "script": "B: The old town is too large to see on foot in one afternoon. Should we take the sightseeing bus? A: The bus follows a fixed route, and I want to stop at several small markets. B: The hotel rents bicycles, and there are bike paths along the river and through the old town. A: Let's use those. We can return them before dinner and take the bus tomorrow if it rains.",
        "questionText": "How will they probably explore the old town?",
        "text": "How will they probably explore the old town?",
        "choices": [
          "On the sightseeing bus",
          "By bicycle",
          "On foot from the hotel",
          "By river boat"
        ],
        "correct": 2,
        "explanation": "正答は2です。対話の内容と最後の質問を聞き取り、選択肢「By bicycle」に当たる内容を選びます。"
      },
      {
        "id": 13,
        "section": "第1部",
        "part": "Part 1",
        "instruction": "対話を聞き、最後の質問に対する答えとして最も適切なものを選んでください。",
        "voice": "Conversation",
        "audioFile": "",
        "script": "B: Ms. Patel, my essay about school uniforms is almost nine hundred words, but the limit is seven hundred. A: Your opening example is effective, and the survey results support your main point. B: The final paragraph includes three opinions from students who dislike uniforms. A: Keep one opinion, but remove the other two. They repeat the same reason in different words.",
        "questionText": "What does the woman suggest removing?",
        "text": "What does the woman suggest removing?",
        "choices": [
          "The opening example",
          "All of the survey results",
          "The essay's main point",
          "Two student opinions"
        ],
        "correct": 4,
        "explanation": "正答は4です。対話の内容と最後の質問を聞き取り、選択肢「Two student opinions」に当たる内容を選びます。"
      },
      {
        "id": 14,
        "section": "第1部",
        "part": "Part 1",
        "instruction": "対話を聞き、最後の質問に対する答えとして最も適切なものを選んでください。",
        "voice": "Conversation",
        "audioFile": "",
        "script": "A: Could you prepare the restaurant before we open tomorrow? I need to meet the health inspector at city hall. B: I can't come early because an electrician is inspecting the fire alarm inside my apartment at eight. A: All right. Can you stay late tonight and refill the drink station instead? B: Yes. The alarm test should be over before my normal shift starts tomorrow.",
        "questionText": "Why can't the man come to work early?",
        "text": "Why can't the man come to work early?",
        "choices": [
          "He must meet a health inspector.",
          "He has to refill the drink station.",
          "An electrician is inspecting his fire alarm.",
          "His regular shift starts tonight."
        ],
        "correct": 3,
        "explanation": "正答は3です。対話の内容と最後の質問を聞き取り、選択肢「An electrician is inspecting his fire alarm.」に当たる内容を選びます。"
      },
      {
        "id": 15,
        "section": "第1部",
        "part": "Part 1",
        "instruction": "対話を聞き、最後の質問に対する答えとして最も適切なものを選んでください。",
        "voice": "Conversation",
        "audioFile": "",
        "script": "A: A package for you was left at my door. The label says it contains a kitchen scale. B: That's strange. I ordered the scale yesterday and selected delivery for next Monday. A: The box has today's date, and it doesn't look damaged. Maybe the warehouse was nearby. B: I suppose so. I didn't expect the store to send it only one day after I ordered it.",
        "questionText": "What surprised the man about the package?",
        "text": "What surprised the man about the package?",
        "choices": [
          "It was delivered to the wrong building.",
          "It arrived much sooner than expected.",
          "The kitchen scale was damaged.",
          "The label showed the wrong product."
        ],
        "correct": 2,
        "explanation": "正答は2です。対話の内容と最後の質問を聞き取り、選択肢「It arrived much sooner than expected.」に当たる内容を選びます。"
      },
      {
        "id": 16,
        "section": "第2部",
        "part": "Part 2",
        "instruction": "英文の内容に関する質問に答えてください。",
        "voice": "Female",
        "audioFile": "",
        "script": "During a school orchestra rehearsal, Nadia noticed that two keys on her flute were sticking badly. The repair shop could fix them, but not before Friday’s concert. Buying another instrument was too expensive, and the school’s spare flute was already being used by another student. Nadia contacted her former music teacher, who agreed to lend her a flute for the performance.",
        "questionText": "How did Nadia prepare for Friday’s concert?",
        "text": "How did Nadia prepare for Friday’s concert?",
        "choices": [
          "She bought a less expensive new flute.",
          "She borrowed a flute from a former teacher.",
          "She reserved the school’s spare instrument.",
          "She asked the repair shop to work overnight."
        ],
        "correct": 2,
        "explanation": "正答は2です。設問は「How did Nadia prepare for Friday’s concert?」について尋ねており、本文では「She borrowed a flute from a former teacher.」に当たる内容が説明されています。"
      },
      {
        "id": 17,
        "section": "第2部",
        "part": "Part 2",
        "instruction": "英文の内容に関する質問に答えてください。",
        "voice": "Male",
        "audioFile": "",
        "script": "Visitors to Harbor Aquarium must enter during the thirty-minute period printed on their tickets. Arriving early does not guarantee earlier admission, because each group is limited in size for visitor safety and comfort. Guests who miss their entry period should speak to staff at the ticket desk. They may be moved to a later period if space is available that day.",
        "questionText": "What should guests do after missing their entry period?",
        "text": "What should guests do after missing their entry period?",
        "choices": [
          "Enter immediately with the next group.",
          "Return on another day with the same ticket.",
          "Wait beside the aquarium entrance.",
          "Speak to staff at the ticket desk."
        ],
        "correct": 4,
        "explanation": "正答は4です。設問は「What should guests do after missing their entry period?」について尋ねており、本文では「Speak to staff at the ticket desk.」に当たる内容が説明されています。"
      },
      {
        "id": 18,
        "section": "第2部",
        "part": "Part 2",
        "instruction": "英文の内容に関する質問に答えてください。",
        "voice": "Male",
        "audioFile": "",
        "script": "Ethan planned to make a short cooking video for his history class using his grandmother’s soup recipe. While interviewing her, he learned that she had adapted the recipe after moving to a new country. Her story was more interesting than the cooking process itself. Ethan therefore changed his project into an audio report about how family recipes change over time.",
        "questionText": "Why did Ethan change the form of his project?",
        "text": "Why did Ethan change the form of his project?",
        "choices": [
          "His grandmother’s story became the main focus.",
          "His teacher required an audio assignment.",
          "The soup recipe was too difficult to cook.",
          "His grandmother refused to appear in a video."
        ],
        "correct": 1,
        "explanation": "正答は1です。設問は「Why did Ethan change the form of his project?」について尋ねており、本文では「His grandmother’s story became the main focus.」に当たる内容が説明されています。"
      },
      {
        "id": 19,
        "section": "第2部",
        "part": "Part 2",
        "instruction": "英文の内容に関する質問に答えてください。",
        "voice": "Female",
        "audioFile": "",
        "script": "Long bridges often contain small gaps between sections of the road. Materials such as steel and concrete expand when they become warm and shrink when they cool. The gaps allow the bridge sections to move slightly without pushing hard against one another. Without this extra space, repeated temperature changes could gradually damage important parts of the bridge over many years.",
        "questionText": "Why do long bridges contain small gaps?",
        "text": "Why do long bridges contain small gaps?",
        "choices": [
          "To collect rainwater from the road.",
          "To make the bridge easier to repair.",
          "To let bridge sections move as temperatures change.",
          "To separate steel sections from concrete ones."
        ],
        "correct": 3,
        "explanation": "正答は3です。設問は「Why do long bridges contain small gaps?」について尋ねており、本文では「To let bridge sections move as temperatures change.」に当たる内容が説明されています。"
      },
      {
        "id": 20,
        "section": "第2部",
        "part": "Part 2",
        "instruction": "英文の内容に関する質問に答えてください。",
        "voice": "Female",
        "audioFile": "",
        "script": "Lila ordered wall shelves for her home office, but the installer found water pipes behind the place where she wanted them. Moving the pipes would be costly and time-consuming. He suggested a freestanding bookcase, although the first model was too wide for the room. Lila selected a narrower one and used the remaining wall space for a small desk lamp.",
        "questionText": "What did Lila finally choose for her office?",
        "text": "What did Lila finally choose for her office?",
        "choices": [
          "Wall shelves in a different location.",
          "A larger desk with built-in storage.",
          "A wider model of the original shelves.",
          "A narrower freestanding bookcase."
        ],
        "correct": 4,
        "explanation": "正答は4です。設問は「What did Lila finally choose for her office?」について尋ねており、本文では「A narrower freestanding bookcase.」に当たる内容が説明されています。"
      },
      {
        "id": 21,
        "section": "第2部",
        "part": "Part 2",
        "instruction": "英文の内容に関する質問に答えてください。",
        "voice": "Male",
        "audioFile": "",
        "script": "Because of road construction, Route 18 buses will not stop at Central Market from Wednesday through Friday this week. Passengers should use the temporary stop outside the post office, about two blocks east. Buses will follow the usual schedule, but journeys may take ten minutes longer than normal. The market stop will reopen on Saturday morning after the work is completed.",
        "questionText": "Where should Route 18 passengers board temporarily?",
        "text": "Where should Route 18 passengers board temporarily?",
        "choices": [
          "Outside the post office.",
          "At the market’s eastern entrance.",
          "Two blocks west of Central Market.",
          "Beside the road-construction office."
        ],
        "correct": 1,
        "explanation": "正答は1です。設問は「Where should Route 18 passengers board temporarily?」について尋ねており、本文では「Outside the post office.」に当たる内容が説明されています。"
      },
      {
        "id": 22,
        "section": "第2部",
        "part": "Part 2",
        "instruction": "英文の内容に関する質問に答えてください。",
        "voice": "Male",
        "audioFile": "",
        "script": "Arturo had been training for a charity run when pain developed in his ankle. A doctor told him to stop running for several weeks, so he could not take part as planned. He had already collected donations from friends and relatives. Rather than withdraw completely, Arturo asked the organizers if he could help at a water station on race day.",
        "questionText": "What did Arturo ask the organizers to let him do?",
        "text": "What did Arturo ask the organizers to let him do?",
        "choices": [
          "Run a shorter part of the race.",
          "Collect more donations from spectators.",
          "Help runners at a water station.",
          "Drive the organizers around the course."
        ],
        "correct": 3,
        "explanation": "正答は3です。設問は「What did Arturo ask the organizers to let him do?」について尋ねており、本文では「Help runners at a water station.」に当たる内容が説明されています。"
      },
      {
        "id": 23,
        "section": "第2部",
        "part": "Part 2",
        "instruction": "英文の内容に関する質問に答えてください。",
        "voice": "Female",
        "audioFile": "",
        "script": "Members of Keiko’s English conversation club often became silent when the leader announced a broad topic. Keiko began placing everyday objects in a bag, and each person picked one without looking inside. Members then told a short story connected to the object. The activity gave them a clear starting point, and more members began speaking during each weekly meeting.",
        "questionText": "What helped more club members begin speaking?",
        "text": "What helped more club members begin speaking?",
        "choices": [
          "They received a new topic every week.",
          "Objects gave them clear ideas for stories.",
          "They practiced alone before each meeting.",
          "The leader corrected fewer language mistakes."
        ],
        "correct": 2,
        "explanation": "正答は2です。設問は「What helped more club members begin speaking?」について尋ねており、本文では「Objects gave them clear ideas for stories.」に当たる内容が説明されています。"
      },
      {
        "id": 24,
        "section": "第2部",
        "part": "Part 2",
        "instruction": "英文の内容に関する質問に答えてください。",
        "voice": "Male",
        "audioFile": "",
        "script": "Riverside Park will host an outdoor concert on Sunday evening. The picnic area beside the lake has been reserved for concert staff from noon onward, so regular visitors cannot use its tables that day. Other picnic areas across the park will remain open to the public. Guests attending the concert may bring folding chairs, but large tents are not permitted.",
        "questionText": "What area will regular park visitors be unable to use?",
        "text": "What area will regular park visitors be unable to use?",
        "choices": [
          "The picnic area beside the lake.",
          "Every picnic area in Riverside Park.",
          "The paths around the concert area.",
          "The lake after noon on Sunday."
        ],
        "correct": 1,
        "explanation": "正答は1です。設問は「What area will regular park visitors be unable to use?」について尋ねており、本文では「The picnic area beside the lake.」に当たる内容が説明されています。"
      },
      {
        "id": 25,
        "section": "第2部",
        "part": "Part 2",
        "instruction": "英文の内容に関する質問に答えてください。",
        "voice": "Male",
        "audioFile": "",
        "script": "Noah completed a design project for a local company and sent an invoice. The company’s accountant replied that its official business name had recently changed, so the document could not be processed. The amount and payment date were correct. Noah replaced only the company name, sent the invoice again, and soon received an email confirming that it had been accepted.",
        "questionText": "What information did Noah correct on the invoice?",
        "text": "What information did Noah correct on the invoice?",
        "choices": [
          "The total amount requested.",
          "The date when payment was due.",
          "The description of his design work.",
          "The company’s official business name."
        ],
        "correct": 4,
        "explanation": "正答は4です。設問は「What information did Noah correct on the invoice?」について尋ねており、本文では「The company’s official business name.」に当たる内容が説明されています。"
      },
      {
        "id": 26,
        "section": "第2部",
        "part": "Part 2",
        "instruction": "英文の内容に関する質問に答えてください。",
        "voice": "Female",
        "audioFile": "",
        "script": "Compost is made when small living organisms break down food scraps and plant material. These organisms need both moisture and air to work well. If a compost pile is packed too tightly, not enough air can move through it. Turning the material regularly mixes in air and can help the contents break down more evenly and quickly over time.",
        "questionText": "Why can turning compost help it break down?",
        "text": "Why can turning compost help it break down?",
        "choices": [
          "It removes extra water from the pile.",
          "It adds air needed by small organisms.",
          "It keeps food scraps packed tightly.",
          "It lowers the temperature of plant material."
        ],
        "correct": 2,
        "explanation": "正答は2です。設問は「Why can turning compost help it break down?」について尋ねており、本文では「It adds air needed by small organisms.」に当たる内容が説明されています。"
      },
      {
        "id": 27,
        "section": "第2部",
        "part": "Part 2",
        "instruction": "英文の内容に関する質問に答えてください。",
        "voice": "Female",
        "audioFile": "",
        "script": "Sophie wanted an alternative to her crowded morning bus, so she tried cycling to work. The direct route was fast, but it had heavy traffic and left her feeling stressed. A coworker showed her a longer path beside the river. It takes ten extra minutes, but Sophie now uses it twice a week because it feels safer and much quieter.",
        "questionText": "Why does Sophie use the riverside route?",
        "text": "Why does Sophie use the riverside route?",
        "choices": [
          "It is shorter than the direct route.",
          "It has more buses during the morning.",
          "It feels safer and quieter.",
          "It ends closer to her workplace."
        ],
        "correct": 3,
        "explanation": "正答は3です。設問は「Why does Sophie use the riverside route?」について尋ねており、本文では「It feels safer and quieter.」に当たる内容が説明されています。"
      },
      {
        "id": 28,
        "section": "第2部",
        "part": "Part 2",
        "instruction": "英文の内容に関する質問に答えてください。",
        "voice": "Male",
        "audioFile": "",
        "script": "On the first day of a family camping trip, Ravi’s phone battery died while he was driving through an area with little mobile service. He could no longer use the map application on his phone. Fortunately, he had printed the campground’s directions from the booking email. His sister read them aloud, and the family reached the site before dark.",
        "questionText": "How did Ravi’s family find the campground?",
        "text": "How did Ravi’s family find the campground?",
        "choices": [
          "They charged the phone in the car.",
          "They asked local people for directions.",
          "They used a road map from the campsite.",
          "They followed directions printed from an email."
        ],
        "correct": 4,
        "explanation": "正答は4です。設問は「How did Ravi’s family find the campground?」について尋ねており、本文では「They followed directions printed from an email.」に当たる内容が説明されています。"
      },
      {
        "id": 29,
        "section": "第2部",
        "part": "Part 2",
        "instruction": "英文の内容に関する質問に答えてください。",
        "voice": "Female",
        "audioFile": "",
        "script": "For one day next week, the college cafeteria will test a cashless payment system at all food counters. Students may pay by card or phone. Anyone who only has cash can buy a prepaid cafeteria card at the student services office before lunchtime. The vending machines in the lobby will continue to accept coins as usual throughout the test day.",
        "questionText": "How can cash-only students pay at the food counters?",
        "text": "How can cash-only students pay at the food counters?",
        "choices": [
          "Pay with coins at the food counters.",
          "Buy a prepaid card at student services.",
          "Use the lobby vending machines for meals.",
          "Borrow a phone from cafeteria staff."
        ],
        "correct": 2,
        "explanation": "正答は2です。設問は「How can cash-only students pay at the food counters?」について尋ねており、本文では「Buy a prepaid card at student services.」に当たる内容が説明されています。"
      },
      {
        "id": 30,
        "section": "第2部",
        "part": "Part 2",
        "instruction": "英文の内容に関する質問に答えてください。",
        "voice": "Female",
        "audioFile": "",
        "script": "Isabel took a jacket to a tailor because the sleeves were too long for her graduation ceremony. Two days before the event, the tailor called to say a machine problem had delayed the work. Isabel’s cousin offered her a similar jacket that fit well. She borrowed it for the ceremony and collected her own jacket from the tailor the following week.",
        "questionText": "What did Isabel do for the graduation ceremony?",
        "text": "What did Isabel do for the graduation ceremony?",
        "choices": [
          "She borrowed a jacket from her cousin.",
          "She wore her jacket with long sleeves.",
          "She changed the date of the ceremony.",
          "She collected her repaired jacket early."
        ],
        "correct": 1,
        "explanation": "正答は1です。設問は「What did Isabel do for the graduation ceremony?」について尋ねており、本文では「She borrowed a jacket from her cousin.」に当たる内容が説明されています。"
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
        "instruction": "対話を聞き、最後の質問に対する答えとして最も適切なものを選んでください。",
        "voice": "Conversation",
        "audioFile": "",
        "script": "A: The art club's photographs are ready for Friday's exhibition, but the display boards are still in the storage room. B: I can carry them after lunch, although I'll need someone to unlock the room. A: Could you meet me there at one? I have the key, and we can take the boards to the hall together. B: Sure. I'll bring the cart from the science building so we don't have to carry them by hand.",
        "questionText": "What does the girl ask the boy to do?",
        "text": "What does the girl ask the boy to do?",
        "choices": [
          "Meet her at the storage room.",
          "Print photographs for the exhibition.",
          "Unlock the science building.",
          "Move the exhibition to another hall."
        ],
        "correct": 1,
        "explanation": "正答は1です。対話の内容と最後の質問を聞き取り、選択肢「Meet her at the storage room.」に当たる内容を選びます。"
      },
      {
        "id": 2,
        "section": "第1部",
        "part": "Part 1",
        "instruction": "対話を聞き、最後の質問に対する答えとして最も適切なものを選んでください。",
        "voice": "Conversation",
        "audioFile": "",
        "script": "A: My monthly train pass expires tomorrow. Do I need to buy a completely new card? B: No. You can renew the same card at the ticket machine or at this counter. A: The machine didn't accept my credit card earlier. Can I pay in cash here? B: Yes, and the renewed pass will be ready immediately. You won't need a temporary ticket.",
        "questionText": "What is true about the train pass?",
        "text": "What is true about the train pass?",
        "choices": [
          "It can only be renewed by machine.",
          "It requires a temporary ticket.",
          "The same card can be used again.",
          "It cannot be paid for in cash."
        ],
        "correct": 3,
        "explanation": "正答は3です。対話の内容と最後の質問を聞き取り、選択肢「The same card can be used again.」に当たる内容を選びます。"
      },
      {
        "id": 3,
        "section": "第1部",
        "part": "Part 1",
        "instruction": "対話を聞き、最後の質問に対する答えとして最も適切なものを選んでください。",
        "voice": "Conversation",
        "audioFile": "",
        "script": "B: I'm going to the supermarket before dinner. We don't have enough tomatoes for the pasta sauce. A: I thought you bought some yesterday when you picked up the cheese. B: Those were used in the salad at lunch. I'll get tomatoes and some bread, but we still have plenty of cheese. A: All right. I'll start boiling the water while you're gone so dinner won't be late.",
        "questionText": "Why is the man going to the supermarket?",
        "text": "Why is the man going to the supermarket?",
        "choices": [
          "To buy more cheese",
          "To get tomatoes for dinner",
          "To return yesterday's bread",
          "To pick up a prepared salad"
        ],
        "correct": 2,
        "explanation": "正答は2です。対話の内容と最後の質問を聞き取り、選択肢「To get tomatoes for dinner」に当たる内容を選びます。"
      },
      {
        "id": 4,
        "section": "第1部",
        "part": "Part 1",
        "instruction": "対話を聞き、最後の質問に対する答えとして最も適切なものを選んでください。",
        "voice": "Conversation",
        "audioFile": "",
        "script": "A: The conference hotel says our meeting room reservation is missing from its system. B: I have the confirmation email, but the manager who arranged it is away today. A: The event starts tomorrow, so we need an answer soon. I can call the hotel and send them the email. B: Please do. I'll contact the speakers and tell them not to change their travel plans yet.",
        "questionText": "What does the woman offer to do?",
        "text": "What does the woman offer to do?",
        "choices": [
          "Arrange new travel plans.",
          "Find another conference hotel.",
          "Contact all of the speakers.",
          "Call the hotel about the reservation."
        ],
        "correct": 4,
        "explanation": "正答は4です。対話の内容と最後の質問を聞き取り、選択肢「Call the hotel about the reservation.」に当たる内容を選びます。"
      },
      {
        "id": 5,
        "section": "第1部",
        "part": "Part 1",
        "instruction": "対話を聞き、最後の質問に対する答えとして最も適切なものを選んでください。",
        "voice": "Conversation",
        "audioFile": "",
        "script": "B: I'm here for an X-ray appointment, but I may have entered through the wrong door. A: The imaging department is in the east wing. Take this hallway past the gift shop, then use the elevator to the second floor. B: Should I check in at the main reception desk first? A: No. Go directly to the imaging desk and show them the appointment card your doctor gave you.",
        "questionText": "Where should the man check in?",
        "text": "Where should the man check in?",
        "choices": [
          "At the imaging desk",
          "At the main reception desk",
          "Inside the hospital gift shop",
          "At his doctor's office"
        ],
        "correct": 1,
        "explanation": "正答は1です。対話の内容と最後の質問を聞き取り、選択肢「At the imaging desk」に当たる内容を選びます。"
      },
      {
        "id": 6,
        "section": "第1部",
        "part": "Part 1",
        "instruction": "対話を聞き、最後の質問に対する答えとして最も適切なものを選んでください。",
        "voice": "Conversation",
        "audioFile": "",
        "script": "A: For Saturday's cycling trip, I packed a first-aid kit and two bottles of water. B: Good. I'll bring a map and some snacks. My bicycle pump is broken, though. A: I bought a small pump last month that fits easily in my bag. I'll bring it in case anyone gets a flat tire. B: Perfect. Then we have everything except the train tickets, which I'll buy tonight.",
        "questionText": "What will the woman bring on the trip?",
        "text": "What will the woman bring on the trip?",
        "choices": [
          "The train tickets",
          "A small bicycle pump",
          "A new map",
          "Extra bags for snacks"
        ],
        "correct": 2,
        "explanation": "正答は2です。対話の内容と最後の質問を聞き取り、選択肢「A small bicycle pump」に当たる内容を選びます。"
      },
      {
        "id": 7,
        "section": "第1部",
        "part": "Part 1",
        "instruction": "対話を聞き、最後の質問に対する答えとして最も適切なものを選んでください。",
        "voice": "Conversation",
        "audioFile": "",
        "script": "B: The repair technician was supposed to fix my refrigerator this afternoon, but nobody has arrived. A: Let me check the schedule. The technician's previous job took longer, so your visit has been moved to six thirty. B: I have to leave at six. Can someone come tomorrow morning instead? A: Yes. We have an opening between nine and eleven, and there will be no extra charge.",
        "questionText": "What does the woman say about the repair?",
        "text": "What does the woman say about the repair?",
        "choices": [
          "It was canceled by the man.",
          "It requires an additional charge.",
          "It was completed at another home.",
          "It can be moved to tomorrow morning."
        ],
        "correct": 4,
        "explanation": "正答は4です。対話の内容と最後の質問を聞き取り、選択肢「It can be moved to tomorrow morning.」に当たる内容を選びます。"
      },
      {
        "id": 8,
        "section": "第1部",
        "part": "Part 1",
        "instruction": "対話を聞き、最後の質問に対する答えとして最も適切なものを選んでください。",
        "voice": "Conversation",
        "audioFile": "",
        "script": "B: How is your lunch? I noticed you haven't touched the potatoes. A: I ordered steamed vegetables instead, but the kitchen sent the potatoes by mistake. B: I'm sorry. Would you like me to replace the whole plate? A: The fish is fine. Could you just bring the steamed vegetables and take the potatoes away?",
        "questionText": "What does the woman ask the man to bring?",
        "text": "What does the woman ask the man to bring?",
        "choices": [
          "A new plate of fish",
          "Another order of potatoes",
          "The steamed vegetables",
          "A menu with different lunches"
        ],
        "correct": 3,
        "explanation": "正答は3です。対話の内容と最後の質問を聞き取り、選択肢「The steamed vegetables」に当たる内容を選びます。"
      },
      {
        "id": 9,
        "section": "第1部",
        "part": "Part 1",
        "instruction": "対話を聞き、最後の質問に対する答えとして最も適切なものを選んでください。",
        "voice": "Conversation",
        "audioFile": "",
        "script": "A: Hello. My piano lesson is at five tomorrow, but the school has scheduled a parent meeting at the same time. B: I could teach you at seven tomorrow, or we could move the lesson to Saturday morning. A: Seven tomorrow is fine. Will the lesson still be in Studio Three? B: Yes. The studio is free then, and your lesson will remain forty-five minutes long.",
        "questionText": "Why did the woman call the man?",
        "text": "Why did the woman call the man?",
        "choices": [
          "To ask for a longer piano lesson",
          "To change the time of her lesson",
          "To reserve Studio Three for Saturday",
          "To discuss a parent meeting"
        ],
        "correct": 2,
        "explanation": "正答は2です。対話の内容と最後の質問を聞き取り、選択肢「To change the time of her lesson」に当たる内容を選びます。"
      },
      {
        "id": 10,
        "section": "第1部",
        "part": "Part 1",
        "instruction": "対話を聞き、最後の質問に対する答えとして最も適切なものを選んでください。",
        "voice": "Conversation",
        "audioFile": "",
        "script": "B: The park wildlife survey begins at sunrise. I'll record the birds near the lake. A: I'll count the rabbits in the open field, but we need someone to check the wooded trail. B: I can do that after I finish at the lake. The trail section shouldn't take more than thirty minutes. A: Great. I'll leave the extra survey sheets in the box beside the visitor center.",
        "questionText": "What will the man do after checking the lake?",
        "text": "What will the man do after checking the lake?",
        "choices": [
          "Survey the wooded trail.",
          "Count rabbits in the field.",
          "Open the visitor center.",
          "Prepare new survey sheets."
        ],
        "correct": 1,
        "explanation": "正答は1です。対話の内容と最後の質問を聞き取り、選択肢「Survey the wooded trail.」に当たる内容を選びます。"
      },
      {
        "id": 11,
        "section": "第1部",
        "part": "Part 1",
        "instruction": "対話を聞き、最後の質問に対する答えとして最も適切なものを選んでください。",
        "voice": "Conversation",
        "audioFile": "",
        "script": "A: I like this green sofa, but I need it delivered before my parents visit next weekend. B: The green model is in our warehouse, but the earliest delivery date is next Tuesday. A: That's too late. Is the same sofa available in another color sooner? B: The brown one can be delivered Friday morning, and the blue one is available Saturday afternoon.",
        "questionText": "When can the brown sofa be delivered?",
        "text": "When can the brown sofa be delivered?",
        "choices": [
          "Next Tuesday",
          "Saturday afternoon",
          "This afternoon",
          "Friday morning"
        ],
        "correct": 4,
        "explanation": "正答は4です。対話の内容と最後の質問を聞き取り、選択肢「Friday morning」に当たる内容を選びます。"
      },
      {
        "id": 12,
        "section": "第1部",
        "part": "Part 1",
        "instruction": "対話を聞き、最後の質問に対する答えとして最も適切なものを選んでください。",
        "voice": "Conversation",
        "audioFile": "",
        "script": "B: Our flight lands at the international airport at five. How should we get to the city center? A: The airport bus is cheap, but evening traffic can make the trip nearly two hours. B: The express train takes thirty-five minutes and stops beside our hotel. A: Let's take the train. We can buy tickets at the machine after collecting our luggage.",
        "questionText": "How will they probably reach the city center?",
        "text": "How will they probably reach the city center?",
        "choices": [
          "By airport bus",
          "In a hotel taxi",
          "On the express train",
          "By walking from the airport"
        ],
        "correct": 3,
        "explanation": "正答は3です。対話の内容と最後の質問を聞き取り、選択肢「On the express train」に当たる内容を選びます。"
      },
      {
        "id": 13,
        "section": "第1部",
        "part": "Part 1",
        "instruction": "対話を聞き、最後の質問に対する答えとして最も適切なものを選んでください。",
        "voice": "Conversation",
        "audioFile": "",
        "script": "A: Coach Rivera, our team podcast is twelve minutes, but the school website allows only eight. B: The interview with the captain is important, and the match summary is clear. A: The opening includes a long story about how the team chose its name. B: Remove that story and begin with the captain's interview. Listeners can read the team history elsewhere.",
        "questionText": "What does the man suggest removing?",
        "text": "What does the man suggest removing?",
        "choices": [
          "The story about the team name",
          "The captain's interview",
          "The match summary",
          "The podcast's music introduction"
        ],
        "correct": 1,
        "explanation": "正答は1です。対話の内容と最後の質問を聞き取り、選択肢「The story about the team name」に当たる内容を選びます。"
      },
      {
        "id": 14,
        "section": "第1部",
        "part": "Part 1",
        "instruction": "対話を聞き、最後の質問に対する答えとして最も適切なものを選んでください。",
        "voice": "Conversation",
        "audioFile": "",
        "script": "B: Could you cover my evening shift on Thursday? I need to meet a contractor about my kitchen. A: I can't that night. My department is giving an online presentation to our London office at seven. B: Then could you take Saturday afternoon? I can ask Leo to work Thursday. A: Saturday is possible. The presentation will be finished, and I have no other meetings.",
        "questionText": "Why can't the woman work Thursday evening?",
        "text": "Why can't the woman work Thursday evening?",
        "choices": [
          "She is meeting a contractor.",
          "She has already promised Leo.",
          "She is working Saturday afternoon.",
          "She has an international presentation."
        ],
        "correct": 4,
        "explanation": "正答は4です。対話の内容と最後の質問を聞き取り、選択肢「She has an international presentation.」に当たる内容を選びます。"
      },
      {
        "id": 15,
        "section": "第1部",
        "part": "Part 1",
        "instruction": "対話を聞き、最後の質問に対する答えとして最も適切なものを選んでください。",
        "voice": "Conversation",
        "audioFile": "",
        "script": "A: This parcel came to my apartment, but your name and office address are both on the label. B: It's a birthday gift from my cousin in Canada. I thought she was sending it to my office. A: The delivery driver probably noticed that our company is closed today and used your contact number. B: Maybe. I'm surprised my cousin sent it by express mail because my birthday isn't for another two weeks.",
        "questionText": "What surprised the man about the parcel?",
        "text": "What surprised the man about the parcel?",
        "choices": [
          "It was sent from Canada.",
          "It was mailed unusually early.",
          "It had his office address.",
          "It was delivered on a workday."
        ],
        "correct": 2,
        "explanation": "正答は2です。対話の内容と最後の質問を聞き取り、選択肢「It was mailed unusually early.」に当たる内容を選びます。"
      },
      {
        "id": 16,
        "section": "第2部",
        "part": "Part 2",
        "instruction": "英文の内容に関する質問に答えてください。",
        "voice": "Male",
        "audioFile": "",
        "script": "The drama club planned to build a large painted wall for its new play, but the stage door was too narrow to bring it inside. Cutting the wall into pieces would make it unstable. After testing several ideas, the students borrowed a projector from the media room. They created digital backgrounds that could change quickly between scenes during the performance.",
        "questionText": "What did the drama club use for its backgrounds?",
        "text": "What did the drama club use for its backgrounds?",
        "choices": [
          "A wall cut into several pieces.",
          "Painted curtains from the media room.",
          "A smaller background built backstage.",
          "Digital images shown with a projector."
        ],
        "correct": 4,
        "explanation": "正答は4です。設問は「What did the drama club use for its backgrounds?」について尋ねており、本文では「Digital images shown with a projector.」に当たる内容が説明されています。"
      },
      {
        "id": 17,
        "section": "第2部",
        "part": "Part 2",
        "instruction": "英文の内容に関する質問に答えてください。",
        "voice": "Female",
        "audioFile": "",
        "script": "Last month, Keiko joined a weekend photography class. She expected to learn how to use an expensive camera, but the teacher first asked students to take pictures with their phones. By comparing light and shadow in several photos, Keiko learned that good pictures depend more on careful observation than costly equipment. She now practices during her walk home.",
        "questionText": "What did Keiko learn in the class?",
        "text": "What did Keiko learn in the class?",
        "choices": [
          "Expensive cameras always take better pictures.",
          "Careful observation is important in photography.",
          "Phone cameras cannot show light and shadow.",
          "Photography classes should be held outdoors."
        ],
        "correct": 2,
        "explanation": "正答は2です。高価な機材よりも、光や影を注意深く観察することが良い写真につながるとKeikoは学びました。"
      },
      {
        "id": 18,
        "section": "第2部",
        "part": "Part 2",
        "instruction": "英文の内容に関する質問に答えてください。",
        "voice": "Female",
        "audioFile": "",
        "script": "Camila prepared fifty packages of handmade soap for a busy weekend market. After printing the labels, she noticed that the date showed the previous month. The ingredient list and contact information were correct, so throwing away every label seemed wasteful. She printed small stickers with the correct date and placed one neatly over the mistake on each package before the market opened.",
        "questionText": "How did Camila correct the package labels?",
        "text": "How did Camila correct the package labels?",
        "choices": [
          "She replaced every label completely.",
          "She changed only the ingredient list.",
          "She covered the wrong date with a correct sticker.",
          "She removed the dates from all packages."
        ],
        "correct": 3,
        "explanation": "正答は3です。設問は「How did Camila correct the package labels?」について尋ねており、本文では「She covered the wrong date with a correct sticker.」に当たる内容が説明されています。"
      },
      {
        "id": 19,
        "section": "第2部",
        "part": "Part 2",
        "instruction": "英文の内容に関する質問に答えてください。",
        "voice": "Male",
        "audioFile": "",
        "script": "The Westside Swimming Pool will open one hour later than usual this Saturday because staff members will be practicing emergency procedures. Morning swimming lessons will begin at ten instead of nine. Members who booked the nine o'clock class may attend the later class or receive a free pass for another day. The pool will close at its normal time.",
        "questionText": "Why will the Westside Swimming Pool open later this Saturday?",
        "text": "Why will the Westside Swimming Pool open later this Saturday?",
        "choices": [
          "Staff members will practice emergency procedures.",
          "New swimming instructors need more training.",
          "Repair work will continue through the weekend.",
          "A private race will use the pool in the morning."
        ],
        "correct": 1,
        "explanation": "正答は1です。職員が緊急時の手順を練習するため、土曜日は通常より1時間遅く開館します。"
      },
      {
        "id": 20,
        "section": "第2部",
        "part": "Part 2",
        "instruction": "英文の内容に関する質問に答えてください。",
        "voice": "Male",
        "audioFile": "",
        "script": "Jonas planned a full-day mountain hike with two friends, but the forecast later showed possible storms in the afternoon. Canceling the trip was unnecessary because the morning was expected to remain clear and calm. The group chose a shorter trail and arranged to begin at sunrise. This would allow them to return to the visitor center before the weather changed.",
        "questionText": "What did Jonas and his friends decide to do?",
        "text": "What did Jonas and his friends decide to do?",
        "choices": [
          "Cancel the hike until another week.",
          "Take a shorter trail early in the morning.",
          "Begin the full-day hike after the storm.",
          "Stay near the mountain’s visitor center."
        ],
        "correct": 2,
        "explanation": "正答は2です。設問は「What did Jonas and his friends decide to do?」について尋ねており、本文では「Take a shorter trail early in the morning.」に当たる内容が説明されています。"
      },
      {
        "id": 21,
        "section": "第2部",
        "part": "Part 2",
        "instruction": "英文の内容に関する質問に答えてください。",
        "voice": "Female",
        "audioFile": "",
        "script": "Items found during the City Arts Festival are being kept at the information tent until 8 p.m. tonight. After that time, they will be taken to the community center on Pine Street. To claim an item, visitors should describe it clearly and provide a name and phone number. Valuable items such as wallets will require additional identification from the person claiming them.",
        "questionText": "What must all visitors do to claim a found item?",
        "text": "What must all visitors do to claim a found item?",
        "choices": [
          "Return to the festival before 8 p.m.",
          "Pay a fee at the community center.",
          "Show a photograph of the lost item.",
          "Describe the item and provide contact information."
        ],
        "correct": 4,
        "explanation": "正答は4です。設問は「What must all visitors do to claim a found item?」について尋ねており、本文では「Describe the item and provide contact information.」に当たる内容が説明されています。"
      },
      {
        "id": 22,
        "section": "第2部",
        "part": "Part 2",
        "instruction": "英文の内容に関する質問に答えてください。",
        "voice": "Male",
        "audioFile": "",
        "script": "Squirrels repeatedly climbed the wooden post supporting Jordan’s bird feeder and ate most of the seeds. Moving the feeder farther from the fence did not solve the problem at all. Jordan replaced the post with a smooth metal pole and added a wide guard below the feeder. The squirrels could no longer climb past it, while small birds continued to visit.",
        "questionText": "How did Jordan prevent squirrels from reaching the seeds?",
        "text": "How did Jordan prevent squirrels from reaching the seeds?",
        "choices": [
          "He placed the feeder beside the fence.",
          "He used seeds that squirrels dislike.",
          "He moved the feeder into a tree.",
          "He used a smooth pole with a guard."
        ],
        "correct": 4,
        "explanation": "正答は4です。設問は「How did Jordan prevent squirrels from reaching the seeds?」について尋ねており、本文では「He used a smooth pole with a guard.」に当たる内容が説明されています。"
      },
      {
        "id": 23,
        "section": "第2部",
        "part": "Part 2",
        "instruction": "英文の内容に関する質問に答えてください。",
        "voice": "Female",
        "audioFile": "",
        "script": "Rosa’s science-fair poster was wider than the space available on the school bus. Carrying it outside the bus was not allowed, and her family car was unavailable that morning. She separated the poster into three connected panels that folded inward. At the fair, she opened the panels on the display table, and the complete poster could be viewed normally by the judges.",
        "questionText": "How did Rosa transport her large poster?",
        "text": "How did Rosa transport her large poster?",
        "choices": [
          "She carried it outside the school bus.",
          "She asked her family to drive it.",
          "She folded it into three connected panels.",
          "She displayed only one section at the fair."
        ],
        "correct": 3,
        "explanation": "正答は3です。設問は「How did Rosa transport her large poster?」について尋ねており、本文では「She folded it into three connected panels.」に当たる内容が説明されています。"
      },
      {
        "id": 24,
        "section": "第2部",
        "part": "Part 2",
        "instruction": "英文の内容に関する質問に答えてください。",
        "voice": "Male",
        "audioFile": "",
        "script": "Passengers taking the island ferry must attach a destination tag to every large bag before boarding the vessel. Tags are available beside the ticket machines and at the luggage desk near the entrance. Small bags that remain with passengers do not need tags. Staff may refuse to load untagged luggage, even when the owner has a valid ferry ticket for that trip.",
        "questionText": "What must passengers do with large bags?",
        "text": "What must passengers do with large bags?",
        "choices": [
          "Keep them beside their seats.",
          "Buy tags from the ferry staff.",
          "Show the bags at the ticket machines.",
          "Attach destination tags before boarding."
        ],
        "correct": 4,
        "explanation": "正答は4です。設問は「What must passengers do with large bags?」について尋ねており、本文では「Attach destination tags before boarding.」に当たる内容が説明されています。"
      },
      {
        "id": 25,
        "section": "第2部",
        "part": "Part 2",
        "instruction": "英文の内容に関する質問に答えてください。",
        "voice": "Female",
        "audioFile": "",
        "script": "During a cooking course, Felicia learned that the main dish contained chicken, which she does not eat. The instructor had listed the ingredients before the course, but Felicia had overlooked the message. Instead of leaving, she used mushrooms provided for another recipe. The instructor showed her how to adjust the cooking time so the dish would not become too dry.",
        "questionText": "What did Felicia use instead of chicken?",
        "text": "What did Felicia use instead of chicken?",
        "choices": [
          "Mushrooms from another recipe.",
          "Extra vegetables from her own bag.",
          "A different kind of chicken.",
          "Bread provided for the main dish."
        ],
        "correct": 1,
        "explanation": "正答は1です。設問は「What did Felicia use instead of chicken?」について尋ねており、本文では「Mushrooms from another recipe.」に当たる内容が説明されています。"
      },
      {
        "id": 26,
        "section": "第2部",
        "part": "Part 2",
        "instruction": "英文の内容に関する質問に答えてください。",
        "voice": "Male",
        "audioFile": "",
        "script": "Leo wanted to improve his English speaking, but he felt nervous in large classes. A friend invited him to a small international cooking group. Members prepared meals together and used English to explain recipes. Because Leo was concentrating on the cooking, he worried less about making mistakes. He now attends the group twice a month.",
        "questionText": "Why did the cooking group help Leo practice English?",
        "text": "Why did the cooking group help Leo practice English?",
        "choices": [
          "It trained him to work as a professional chef.",
          "Members translated every recipe into his first language.",
          "The group was larger than his regular English class.",
          "He could use English while concentrating on another activity."
        ],
        "correct": 4,
        "explanation": "正答は4です。料理に集中しながら英語を使えたため、Leoは間違いをあまり気にせず会話を練習できました。"
      },
      {
        "id": 27,
        "section": "第2部",
        "part": "Part 2",
        "instruction": "英文の内容に関する質問に答えてください。",
        "voice": "Male",
        "audioFile": "",
        "script": "While visiting another country, Taro arrived at a museum whose entrance required a digital ticket. His phone had no mobile signal, so he could not open the ticket website. Before leaving his hotel, however, he had saved a clear picture of the ticket’s QR code. Museum staff scanned the picture, and Taro entered without connecting to the Internet at the entrance.",
        "questionText": "What allowed Taro to enter the museum?",
        "text": "What allowed Taro to enter the museum?",
        "choices": [
          "A printed copy of the museum website.",
          "A picture of the ticket’s QR code.",
          "A public Internet connection near the entrance.",
          "A message sent by the hotel staff."
        ],
        "correct": 2,
        "explanation": "正答は2です。設問は「What allowed Taro to enter the museum?」について尋ねており、本文では「A picture of the ticket’s QR code.」に当たる内容が説明されています。"
      },
      {
        "id": 28,
        "section": "第2部",
        "part": "Part 2",
        "instruction": "英文の内容に関する質問に答えてください。",
        "voice": "Female",
        "audioFile": "",
        "script": "The school gardening club ordered eighty T-shirts for a fundraiser, expecting most students to buy one. Only forty-seven were sold, leaving the club with many shirts and very little profit. Members decided that next year they would collect orders and payments before printing anything. They will also display one sample shirt so students can check the size before ordering.",
        "questionText": "What will the gardening club do next year?",
        "text": "What will the gardening club do next year?",
        "choices": [
          "Order more shirts in several sizes.",
          "Sell the remaining shirts at a lower price.",
          "Collect orders and payments before printing.",
          "Choose a different product for fundraising."
        ],
        "correct": 3,
        "explanation": "正答は3です。設問は「What will the gardening club do next year?」について尋ねており、本文では「Collect orders and payments before printing.」に当たる内容が説明されています。"
      },
      {
        "id": 29,
        "section": "第2部",
        "part": "Part 2",
        "instruction": "英文の内容に関する質問に答えてください。",
        "voice": "Male",
        "audioFile": "",
        "script": "Today’s live chemistry show at the North Science Center has been canceled because one of the demonstration machines is not working properly. The theater itself will remain open. Visitors with show tickets may attend a documentary about space exploration there at the original time. Those who prefer a refund should visit the service counter before leaving the center later today.",
        "questionText": "What will replace today’s live chemistry show?",
        "text": "What will replace today’s live chemistry show?",
        "choices": [
          "A documentary about space exploration.",
          "A shorter chemistry demonstration.",
          "A tour of the broken machine.",
          "A film shown at a later time."
        ],
        "correct": 1,
        "explanation": "正答は1です。設問は「What will replace today’s live chemistry show?」について尋ねており、本文では「A documentary about space exploration.」に当たる内容が説明されています。"
      },
      {
        "id": 30,
        "section": "第2部",
        "part": "Part 2",
        "instruction": "英文の内容に関する質問に答えてください。",
        "voice": "Female",
        "audioFile": "",
        "script": "Mei was scanning old family letters so relatives could read them online. After finishing the first box, her uncle pointed out that some writers had added short notes on the backs of the pages. Mei had scanned only the front sides at first. She checked the letters again and rescanned any page that contained writing on both sides of the paper.",
        "questionText": "What did Mei do after discovering the missing notes?",
        "text": "What did Mei do after discovering the missing notes?",
        "choices": [
          "She asked her uncle to type the notes.",
          "She rescanned pages that had writing on both sides.",
          "She uploaded only the backs of the letters.",
          "She stopped after checking the first box."
        ],
        "correct": 2,
        "explanation": "正答は2です。設問は「What did Mei do after discovering the missing notes?」について尋ねており、本文では「She rescanned pages that had writing on both sides.」に当たる内容が説明されています。"
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
        "instruction": "対話を聞き、最後の質問に対する答えとして最も適切なものを選んでください。",
        "voice": "Conversation",
        "audioFile": "",
        "script": "B: The school newspaper page is finished except for the soccer team's group photo. A: I took the photo after yesterday's game, but the copy on my phone is too small for printing. B: Do you still have the original file on your camera? A: Yes. Could you upload it in the computer room during lunch? I'll write the caption and check the players' names.",
        "questionText": "What does the girl ask the boy to do?",
        "text": "What does the girl ask the boy to do?",
        "choices": [
          "Take another team photograph.",
          "Write the names under the photo.",
          "Upload the original photo file.",
          "Finish the newspaper page alone."
        ],
        "correct": 3,
        "explanation": "正答は3です。対話の内容と最後の質問を聞き取り、選択肢「Upload the original photo file.」に当たる内容を選びます。"
      },
      {
        "id": 2,
        "section": "第1部",
        "part": "Part 1",
        "instruction": "対話を聞き、最後の質問に対する答えとして最も適切なものを選んでください。",
        "voice": "Conversation",
        "audioFile": "",
        "script": "B: I registered for the pottery class that starts next Monday in Room Four. A: The teacher needs a larger sink, so the class has been moved to the art studio upstairs. B: Will it still begin at six thirty? I work until six. A: Yes. Only the room has changed. You can pick up your clay and tools from the front desk.",
        "questionText": "What is true about the pottery class?",
        "text": "What is true about the pottery class?",
        "choices": [
          "It will start later than planned.",
          "It requires students to bring clay.",
          "It has been moved to Monday morning.",
          "It will meet in the art studio."
        ],
        "correct": 4,
        "explanation": "正答は4です。対話の内容と最後の質問を聞き取り、選択肢「It will meet in the art studio.」に当たる内容を選びます。"
      },
      {
        "id": 3,
        "section": "第1部",
        "part": "Part 1",
        "instruction": "対話を聞き、最後の質問に対する答えとして最も適切なものを選んでください。",
        "voice": "Conversation",
        "audioFile": "",
        "script": "A: I'm leaving early to pick up Grandpa at North Station this afternoon. B: Wasn't Uncle Ken going to drive him home after his medical appointment? A: He was, but his car won't start, and the repair shop can't look at it until tomorrow. B: Then I'll prepare dinner. Grandpa usually likes to eat as soon as he arrives.",
        "questionText": "Why will the woman go to North Station?",
        "text": "Why will the woman go to North Station?",
        "choices": [
          "Her uncle cannot drive her grandfather.",
          "Her grandfather missed his appointment.",
          "The repair shop is near the station.",
          "She needs to take her car for repairs."
        ],
        "correct": 1,
        "explanation": "正答は1です。対話の内容と最後の質問を聞き取り、選択肢「Her uncle cannot drive her grandfather.」に当たる内容を選びます。"
      },
      {
        "id": 4,
        "section": "第1部",
        "part": "Part 1",
        "instruction": "対話を聞き、最後の質問に対する答えとして最も適切なものを選んでください。",
        "voice": "Conversation",
        "audioFile": "",
        "script": "B: The monthly expense report is due today, but several receipts are still attached to paper forms. A: I can scan the receipts and add them to the digital report while you enter the final amounts. B: Thanks. Please name each file with the date and department so accounting can find it easily. A: No problem. I'll upload everything to the finance folder before the afternoon meeting.",
        "questionText": "What does the woman offer to do?",
        "text": "What does the woman offer to do?",
        "choices": [
          "Calculate the final expenses.",
          "Scan the receipts for the report.",
          "Deliver the report to accounting.",
          "Enter receipts on paper forms."
        ],
        "correct": 2,
        "explanation": "正答は2です。対話の内容と最後の質問を聞き取り、選択肢「Scan the receipts for the report.」に当たる内容を選びます。"
      },
      {
        "id": 5,
        "section": "第1部",
        "part": "Part 1",
        "instruction": "対話を聞き、最後の質問に対する答えとして最も適切なものを選んでください。",
        "voice": "Conversation",
        "audioFile": "",
        "script": "A: Excuse me, my suitcase wasn't under the bus when we arrived from Lake City. B: The driver found one suitcase after the bus left this platform. It was taken to the baggage office beside Exit Two. A: Mine is dark red with a white ribbon on the handle. Should I wait for the driver to return? B: No. Go to the baggage office now and show the clerk your ticket receipt.",
        "questionText": "Where should the woman go?",
        "text": "Where should the woman go?",
        "choices": [
          "The Lake City bus stop",
          "The driver's waiting room",
          "The platform beside Exit Two",
          "The baggage office"
        ],
        "correct": 4,
        "explanation": "正答は4です。対話の内容と最後の質問を聞き取り、選択肢「The baggage office」に当たる内容を選びます。"
      },
      {
        "id": 6,
        "section": "第1部",
        "part": "Part 1",
        "instruction": "対話を聞き、最後の質問に対する答えとして最も適切なものを選んでください。",
        "voice": "Conversation",
        "audioFile": "",
        "script": "B: For Sunday's birdwatching trip, I packed water, a notebook, and a rain jacket. A: I'll bring the field guide. Naomi has a camera with a long lens, but we only have one pair of binoculars. B: My father has an extra pair in his car. I'll ask to borrow them tonight. A: Great. Then everyone can take turns looking at birds across the lake.",
        "questionText": "What will the man bring on the trip?",
        "text": "What will the man bring on the trip?",
        "choices": [
          "A camera with a long lens",
          "A field guide to birds",
          "An extra pair of binoculars",
          "A notebook for Naomi"
        ],
        "correct": 3,
        "explanation": "正答は3です。対話の内容と最後の質問を聞き取り、選択肢「An extra pair of binoculars」に当たる内容を選びます。"
      },
      {
        "id": 7,
        "section": "第1部",
        "part": "Part 1",
        "instruction": "対話を聞き、最後の質問に対する答えとして最も適切なものを選んでください。",
        "voice": "Conversation",
        "audioFile": "",
        "script": "A: I'm here for my travel vaccination. My appointment is at two fifteen. B: You're on the list. After the injection, you'll need to remain in the waiting area for fifteen minutes. A: That's fine. Can I complete the health form while I wait? B: Please complete it before the injection. I'll give you the form and a pen now.",
        "questionText": "What must the woman do after the injection?",
        "text": "What must the woman do after the injection?",
        "choices": [
          "Wait in the waiting area for fifteen minutes.",
          "Complete the health form in the lobby.",
          "Return for another injection that afternoon.",
          "Show her appointment card to a doctor."
        ],
        "correct": 1,
        "explanation": "正答は1です。対話の内容と最後の質問を聞き取り、選択肢「Wait in the waiting area for fifteen minutes.」に当たる内容を選びます。"
      },
      {
        "id": 8,
        "section": "第1部",
        "part": "Part 1",
        "instruction": "対話を聞き、最後の質問に対する答えとして最も適切なものを選んでください。",
        "voice": "Conversation",
        "audioFile": "",
        "script": "A: I ordered the apple dessert because the menu says it contains no nuts. B: You're right, but the kitchen added almond sauce to this plate by mistake. A: I have a nut allergy. Could you bring another serving without the sauce and use a clean plate? B: Certainly. I'll speak directly to the chef and make sure it is prepared separately.",
        "questionText": "What does the woman ask the man to bring?",
        "text": "What does the woman ask the man to bring?",
        "choices": [
          "A different dessert with almonds",
          "A nut-free serving on a clean plate",
          "The menu showing the ingredients",
          "Another plate of almond sauce"
        ],
        "correct": 2,
        "explanation": "正答は2です。対話の内容と最後の質問を聞き取り、選択肢「A nut-free serving on a clean plate」に当たる内容を選びます。"
      },
      {
        "id": 9,
        "section": "第1部",
        "part": "Part 1",
        "instruction": "対話を聞き、最後の質問に対する答えとして最も適切なものを選んでください。",
        "voice": "Conversation",
        "audioFile": "",
        "script": "B: Hello, this is Room Five Twenty. My key card suddenly stopped opening the door. A: I'm sorry. Cards sometimes stop working when they are kept near a phone. B: I'm in the lobby now. Can I get a replacement, or does someone need to check the lock? A: Bring your identification to the front desk. We'll make a new card first and send a worker only if that fails.",
        "questionText": "Why did the man call the woman?",
        "text": "Why did the man call the woman?",
        "choices": [
          "To report a missing phone",
          "To request a different room",
          "To get help with his key card",
          "To ask when a worker will arrive"
        ],
        "correct": 3,
        "explanation": "正答は3です。対話の内容と最後の質問を聞き取り、選択肢「To get help with his key card」に当たる内容を選びます。"
      },
      {
        "id": 10,
        "section": "第1部",
        "part": "Part 1",
        "instruction": "対話を聞き、最後の質問に対する答えとして最も適切なものを選んでください。",
        "voice": "Conversation",
        "audioFile": "",
        "script": "A: The food drive received more canned goods than expected. I'll check the expiration dates at the front table. B: I can sort the cans into vegetables, soup, and fruit before we pack the boxes. A: Good. Put damaged cans in the separate basket so the coordinator can inspect them. B: Understood. I'll label the three sorting areas before the other volunteers arrive.",
        "questionText": "What will the man do at the food drive?",
        "text": "What will the man do at the food drive?",
        "choices": [
          "Sort the cans by type.",
          "Deliver boxes to families.",
          "Check every expiration date.",
          "Repair damaged cans."
        ],
        "correct": 1,
        "explanation": "正答は1です。対話の内容と最後の質問を聞き取り、選択肢「Sort the cans by type.」に当たる内容を選びます。"
      },
      {
        "id": 11,
        "section": "第1部",
        "part": "Part 1",
        "instruction": "対話を聞き、最後の質問に対する答えとして最も適切なものを選んでください。",
        "voice": "Conversation",
        "audioFile": "",
        "script": "B: I'm looking for the wireless keyboard advertised in your weekend sale. A: The black keyboards sold out this morning, but we still have white ones at the sale price. B: I need a black one for my office. Will more arrive before the sale ends Sunday? A: A shipment is scheduled for Saturday afternoon. I can call you when it has been unpacked.",
        "questionText": "When will more black keyboards arrive?",
        "text": "When will more black keyboards arrive?",
        "choices": [
          "Sunday evening",
          "This morning",
          "After the sale ends",
          "Saturday afternoon"
        ],
        "correct": 4,
        "explanation": "正答は4です。対話の内容と最後の質問を聞き取り、選択肢「Saturday afternoon」に当たる内容を選びます。"
      },
      {
        "id": 12,
        "section": "第1部",
        "part": "Part 1",
        "instruction": "対話を聞き、最後の質問に対する答えとして最も適切なものを選んでください。",
        "voice": "Conversation",
        "audioFile": "",
        "script": "A: The mountain village is twenty kilometers from the nearest station. Should we rent a car there? B: The road is narrow, and neither of us has driven in the mountains before. A: The guesthouse offers a shuttle that meets the eleven ten train if guests reserve by Friday. B: Let's use the shuttle. I'll email the guesthouse tonight with our train number.",
        "questionText": "How will they probably reach the village?",
        "text": "How will they probably reach the village?",
        "choices": [
          "In a rental car",
          "On the guesthouse shuttle",
          "By a local mountain train",
          "On foot from the station"
        ],
        "correct": 2,
        "explanation": "正答は2です。対話の内容と最後の質問を聞き取り、選択肢「On the guesthouse shuttle」に当たる内容を選びます。"
      },
      {
        "id": 13,
        "section": "第1部",
        "part": "Part 1",
        "instruction": "対話を聞き、最後の質問に対する答えとして最も適切なものを選んでください。",
        "voice": "Conversation",
        "audioFile": "",
        "script": "B: Mrs. Stone, my book report is almost five pages, but you asked us to write only three. A: Your comparison of the two main characters is thoughtful, so keep that section. B: I also described every event in the final chapter in a full page. A: Shorten that plot summary to two or three sentences. Readers only need the events connected to your comparison.",
        "questionText": "What does the woman suggest shortening?",
        "text": "What does the woman suggest shortening?",
        "choices": [
          "The summary of the final chapter",
          "The comparison of the characters",
          "The entire book report",
          "The teacher's assignment instructions"
        ],
        "correct": 1,
        "explanation": "正答は1です。対話の内容と最後の質問を聞き取り、選択肢「The summary of the final chapter」に当たる内容を選びます。"
      },
      {
        "id": 14,
        "section": "第1部",
        "part": "Part 1",
        "instruction": "対話を聞き、最後の質問に対する答えとして最も適切なものを選んでください。",
        "voice": "Conversation",
        "audioFile": "",
        "script": "B: Could you attend the safety training for me Tuesday afternoon? I have to visit a construction site. A: I can't. I'm interviewing two applicants for the assistant position at that time. B: Then could you go to the Thursday session? I can ask Priya to attend Tuesday. A: Thursday works. The interviews will be finished, and I haven't scheduled any client meetings.",
        "questionText": "Why can't the woman attend Tuesday's training?",
        "text": "Why can't the woman attend Tuesday's training?",
        "choices": [
          "She is visiting a construction site.",
          "She is meeting a client.",
          "She is interviewing job applicants.",
          "She is attending another safety session."
        ],
        "correct": 3,
        "explanation": "正答は3です。対話の内容と最後の質問を聞き取り、選択肢「She is interviewing job applicants.」に当たる内容を選びます。"
      },
      {
        "id": 15,
        "section": "第1部",
        "part": "Part 1",
        "instruction": "対話を聞き、最後の質問に対する答えとして最も適切なものを選んでください。",
        "voice": "Conversation",
        "audioFile": "",
        "script": "A: This guitar case was delivered with the used guitar you bought online. B: Really? The seller's description said the guitar would come without a case. A: There isn't an extra charge on the receipt, and the case looks almost new. B: That's a pleasant surprise. I was planning to buy a case before taking the guitar to practice tomorrow.",
        "questionText": "What surprised the man about the delivery?",
        "text": "What surprised the man about the delivery?",
        "choices": [
          "The guitar was used.",
          "The receipt included an extra charge.",
          "The case looked old.",
          "A guitar case was included for free."
        ],
        "correct": 4,
        "explanation": "正答は4です。対話の内容と最後の質問を聞き取り、選択肢「A guitar case was included for free.」に当たる内容を選びます。"
      },
      {
        "id": 16,
        "section": "第2部",
        "part": "Part 2",
        "instruction": "英文の内容に関する質問に答えてください。",
        "voice": "Male",
        "audioFile": "",
        "script": "Caleb built a small electric train display and painted scenery beside the tracks. Soon afterward, the train began slowing down in the same section. He replaced the battery, but that did not help. Looking closely, Caleb found dried paint on the metal rails, which prevented good electrical contact. He cleaned the rails carefully, and the train returned to its normal speed.",
        "questionText": "What caused Caleb's train to slow down?",
        "text": "What caused Caleb's train to slow down?",
        "choices": [
          "A weak battery",
          "Heavy scenery beside the tracks",
          "A damaged electric motor",
          "Dried paint on the rails"
        ],
        "correct": 4,
        "explanation": "線路上で乾いた塗料が電気の流れを妨げていました。電池を交換しても改善せず、線路を掃除すると元の速度に戻りました。"
      },
      {
        "id": 17,
        "section": "第2部",
        "part": "Part 2",
        "instruction": "英文の内容に関する質問に答えてください。",
        "voice": "Female",
        "audioFile": "",
        "script": "Guests arriving at Forest Edge Campground after six in the evening should use the late check-in box beside the office. Enter the reservation code sent by email, and the box will open to provide a campsite map and gate card. Campers who have not made a reservation must arrive before the office closes. The office opens again at eight each morning. Quiet hours begin at ten.",
        "questionText": "What should reserved guests arriving after six do?",
        "text": "What should reserved guests arriving after six do?",
        "choices": [
          "Wait until the office opens",
          "Use the late check-in box",
          "Make another reservation",
          "Enter without a gate card"
        ],
        "correct": 2,
        "explanation": "予約済みで午後6時以降に到着する利用者は、事務所横の遅着者用チェックインボックスを使います。"
      },
      {
        "id": 18,
        "section": "第2部",
        "part": "Part 2",
        "instruction": "英文の内容に関する質問に答えてください。",
        "voice": "Male",
        "audioFile": "",
        "script": "Ravi was applying for an animation internship and needed to submit examples of his work. The video file he created was too large to attach to an email. He considered reducing its quality, but important details became unclear. The company allowed applicants to send a cloud-storage link, so Ravi uploaded the original file and included the link in his application.",
        "questionText": "How did Ravi submit his full-quality video?",
        "text": "How did Ravi submit his full-quality video?",
        "choices": [
          "He included a cloud-storage link.",
          "He attached a reduced-quality version.",
          "He emailed the original file directly.",
          "He linked to a reduced-quality copy."
        ],
        "correct": 1,
        "explanation": "動画をメールに添付できなかったため、元の高画質ファイルを保存場所へアップロードし、そのリンクを送りました。"
      },
      {
        "id": 19,
        "section": "第2部",
        "part": "Part 2",
        "instruction": "英文の内容に関する質問に答えてください。",
        "voice": "Female",
        "audioFile": "",
        "script": "When salt is spread on an icy walkway, it mixes with a thin layer of water on the ice. This mixture freezes at a lower temperature than plain water. As a result, some ice can melt even when the air is slightly below the usual freezing point. People should still clear thick ice before applying it. Salt becomes less effective, however, when temperatures are extremely low.",
        "questionText": "How does salt help melt ice?",
        "text": "How does salt help melt ice?",
        "choices": [
          "It warms the air above the walkway.",
          "It removes the water on the ice.",
          "It lowers the temperature at which water freezes.",
          "It works best at extremely low temperatures."
        ],
        "correct": 3,
        "explanation": "塩は水が凍る温度を下げるため、気温が通常の氷点より少し低くても、氷の一部が溶けることがあります。"
      },
      {
        "id": 20,
        "section": "第2部",
        "part": "Part 2",
        "instruction": "英文の内容に関する質問に答えてください。",
        "voice": "Female",
        "audioFile": "",
        "script": "Before a weekend market, Yasmin planned to make forty scented candles in glass jars. Her supplier then reported that the jars would not arrive in time. Yasmin had enough metal tins for twenty-five candles, but no safe containers for the rest. Rather than canceling her booth, she told the organizer that she would bring a smaller number of candles. She also reduced the number of scents she offered.",
        "questionText": "How did Yasmin handle the shortage of containers?",
        "text": "How did Yasmin handle the shortage of containers?",
        "choices": [
          "She brought fewer candles in metal tins.",
          "She made forty candles in glass jars.",
          "She canceled her market booth.",
          "She brought candles without safe containers."
        ],
        "correct": 1,
        "explanation": "ガラス瓶が届かなかったため、手元にある金属缶を使い、販売するろうそくの数を減らしました。"
      },
      {
        "id": 21,
        "section": "第2部",
        "part": "Part 2",
        "instruction": "英文の内容に関する質問に答えてください。",
        "voice": "Male",
        "audioFile": "",
        "script": "The author talk at Oak Bookshop will begin at six tomorrow evening instead of seven because the speaker must catch an earlier train home. Doors will open at five thirty. Existing reservations remain valid, and customers who cannot attend at the new time may request a refund at the counter. The book-signing session will take place immediately after the talk.",
        "questionText": "What change was made to the author talk?",
        "text": "What change was made to the author talk?",
        "choices": [
          "It was moved to another date.",
          "The book-signing session was canceled.",
          "The doors will open at seven.",
          "It will start one hour earlier."
        ],
        "correct": 4,
        "explanation": "講演開始時刻が午後7時から午後6時へ変更され、1時間早くなりました。"
      },
      {
        "id": 22,
        "section": "第2部",
        "part": "Part 2",
        "instruction": "英文の内容に関する質問に答えてください。",
        "voice": "Female",
        "audioFile": "",
        "script": "On her way home from a student exchange, Chloe discovered that her suitcase was over the airline's weight limit. Most of the extra weight came from books she had bought. Paying the luggage charge would cost more than mailing them. Chloe sent several books from the airport post office and carried the remaining items in her suitcase. The books would arrive several days after her.",
        "questionText": "How did Chloe reduce her suitcase's weight?",
        "text": "How did Chloe reduce her suitcase's weight?",
        "choices": [
          "She left her clothes at the school.",
          "She mailed several books separately.",
          "She paid the extra luggage charge.",
          "She carried all the books onto the plane."
        ],
        "correct": 2,
        "explanation": "追加料金より郵送費のほうが安かったため、重さの原因となっていた本を数冊、空港から別送しました。"
      },
      {
        "id": 23,
        "section": "第2部",
        "part": "Part 2",
        "instruction": "英文の内容に関する質問に答えてください。",
        "voice": "Male",
        "audioFile": "",
        "script": "At a community farm, Felix volunteered to attach labels to packets of vegetable seeds. The labels kept peeling off, even after he used stronger glue. He then noticed that fine dust covered the outside of the packets. Felix wiped each packet with a dry cloth before adding a new label. After that, the labels stayed in place. He finished all the packets before noon.",
        "questionText": "What made the seed labels stay in place?",
        "text": "What made the seed labels stay in place?",
        "choices": [
          "Using stronger glue alone",
          "Putting the labels inside the packets",
          "Cleaning dust from the packets first",
          "Attaching labels after the sale"
        ],
        "correct": 3,
        "explanation": "強い接着剤だけでは改善せず、袋の表面に付いた細かいほこりを拭き取ったことで、ラベルがはがれなくなりました。"
      },
      {
        "id": 24,
        "section": "第2部",
        "part": "Part 2",
        "instruction": "英文の内容に関する質問に答えてください。",
        "voice": "Female",
        "audioFile": "",
        "script": "Saturday's dance workshop at the Eastside Sports Hall will be held in Studio Three rather than the main gym because a tournament is taking place there. Participants should check in at the east entrance and bring clean indoor shoes. Outdoor shoes may not be worn in the studio. Drinking water will be provided beside the registration desk. The workshop itself will still begin at two.",
        "questionText": "What must workshop participants bring?",
        "text": "What must workshop participants bring?",
        "choices": [
          "A tournament ticket",
          "Outdoor sports shoes",
          "Their own drinking water",
          "Clean indoor shoes"
        ],
        "correct": 4,
        "explanation": "参加者が持参する必要があるのは、清潔な室内用の靴です。飲料水は会場で用意されます。"
      },
      {
        "id": 25,
        "section": "第2部",
        "part": "Part 2",
        "instruction": "英文の内容に関する質問に答えてください。",
        "voice": "Male",
        "audioFile": "",
        "script": "Many bats find their way in darkness by using echolocation. They produce sounds that are too high for people to hear and listen as the sounds return from nearby surfaces. The time and direction of these echoes help bats judge where objects are. This allows them to avoid obstacles and locate flying insects while moving quickly. Different species produce sounds at different frequencies.",
        "questionText": "What do the echoes help bats judge?",
        "text": "What do the echoes help bats judge?",
        "choices": [
          "The locations of nearby objects",
          "The direction from which sunlight comes",
          "The time when insects begin flying",
          "The colors of nearby surfaces"
        ],
        "correct": 1,
        "explanation": "音が戻ってくる時間と方向から、コウモリは周囲の物体の位置を判断します。"
      },
      {
        "id": 26,
        "section": "第2部",
        "part": "Part 2",
        "instruction": "英文の内容に関する質問に答えてください。",
        "voice": "Male",
        "audioFile": "",
        "script": "Harvey inherited an old wristwatch from his grandfather. A repair shop explained that fully restoring it would be expensive because some original parts were rare. Harvey considered replacing the watch with a modern one, but its family history mattered to him. He chose a basic repair that made the watch run again, although scratches on its face remained.",
        "questionText": "What did Harvey choose to do?",
        "text": "What did Harvey choose to do?",
        "choices": [
          "Replace the watch with a modern one",
          "Restore every original part",
          "Repair its movement but leave the scratches",
          "Sell the watch's rare parts"
        ],
        "correct": 3,
        "explanation": "完全修復は高額だったため、時計が再び動くための基本的な修理だけを行い、表面の傷は残しました。"
      },
      {
        "id": 27,
        "section": "第2部",
        "part": "Part 2",
        "instruction": "英文の内容に関する質問に答えてください。",
        "voice": "Female",
        "audioFile": "",
        "script": "During rehearsals for a school play, an actor repeatedly stepped on the long cape Sara had designed. Shortening it would change the appearance of the costume. Sara therefore sewed small hidden loops inside the cape near the actor's hands. By holding the loops while walking, the actor could lift the fabric without making the loops visible to the audience.",
        "questionText": "How did Sara make the cape safer?",
        "text": "How did Sara make the cape safer?",
        "choices": [
          "She shortened the cape.",
          "She added hidden loops for the actor.",
          "She made the actor remain still.",
          "She changed the costume completely."
        ],
        "correct": 2,
        "explanation": "マントを短くせず、俳優が持ち上げられる隠し輪を内側に縫い付けました。"
      },
      {
        "id": 28,
        "section": "第2部",
        "part": "Part 2",
        "instruction": "英文の内容に関する質問に答えてください。",
        "voice": "Male",
        "audioFile": "",
        "script": "The Riverbend ferry accepts bicycles on weekend trips, but space is limited to ten bicycles per crossing. Cyclists must reserve at the ticket office no later than the day before traveling. Foot passengers do not need reservations. Because of lifting limits on the ferry, electric bicycles and bicycles carrying heavy bags cannot be accepted. Standard bicycles without bags can be loaded by staff.",
        "questionText": "What must cyclists do to take the ferry?",
        "text": "What must cyclists do to take the ferry?",
        "choices": [
          "Reserve space by the previous day",
          "Buy tickets after boarding",
          "Travel only on weekdays",
          "Use an electric bicycle"
        ],
        "correct": 1,
        "explanation": "自転車を載せる利用者は、遅くとも乗船日の前日までに窓口で予約する必要があります。"
      },
      {
        "id": 29,
        "section": "第2部",
        "part": "Part 2",
        "instruction": "英文の内容に関する質問に答えてください。",
        "voice": "Female",
        "audioFile": "",
        "script": "A compost bin in Lina's apartment garden began producing a strong smell. She first checked the lid, but it was closing correctly. Lina then found cooked meat scraps mixed with the fruit and vegetable waste. The building's compost system was not designed for meat. She removed the scraps and posted a clearer list of acceptable materials beside the bin. Other residents agreed to follow the new list.",
        "questionText": "What caused the compost bin's strong smell?",
        "text": "What caused the compost bin's strong smell?",
        "choices": [
          "A broken lid",
          "Fruit and vegetable waste",
          "The new list of materials",
          "Cooked meat scraps"
        ],
        "correct": 4,
        "explanation": "コンポスト設備が処理できない調理済みの肉が混入していたことが、強い臭いの原因でした。"
      },
      {
        "id": 30,
        "section": "第2部",
        "part": "Part 2",
        "instruction": "英文の内容に関する質問に答えてください。",
        "voice": "Male",
        "audioFile": "",
        "script": "Martin was researching an old neighborhood cinema for a magazine article. He hoped to interview its former manager, but she had moved abroad. The local archive contained building plans and opening dates but little about everyday activity. Martin contacted a retired ticket seller, who described regular customers and special events. He used those memories to complete the human side of his article.",
        "questionText": "How did Martin learn about the cinema's daily life?",
        "text": "How did Martin learn about the cinema's daily life?",
        "choices": [
          "He studied the building plans.",
          "He contacted a retired ticket seller.",
          "He interviewed the former manager abroad.",
          "He used the opening dates only."
        ],
        "correct": 2,
        "explanation": "建築図面や開業日だけでは日常の様子が分からなかったため、元チケット販売員から当時の客や行事について聞きました。"
      }
    ]
  }
];

  const existingSets = Array.isArray(window.scbtGrade2VocabSets) ? window.scbtGrade2VocabSets : [];
  const byKey = Object.fromEntries(listeningPart2Sets.map((set) => [set.key, set]));

  ["set-01", "set-03"].forEach((setKey) => {
    const listeningSet = byKey[setKey];
    if (!listeningSet) return;

    listeningSet.questions.forEach((question) => {
      const partFolder = question.part === "Part 1" ? "part1" : "part2";
      const number = String(question.id).padStart(2, "0");
      question.audioFile = `${testCompleteListeningAudioBase}/${setKey}/listening/${partFolder}/No${number}.wav`;
    });
  });

  const round2Set = byKey["set-02"];
  if (round2Set) {
    round2Set.questions.forEach((question) => {
      const partFolder = question.part === "Part 1" ? "part1" : "part2";
      const number = String(question.id).padStart(2, "0");
      question.audioFile = `${set02GeminiApprovedAudioBase}/set-02/listening/${partFolder}/No${number}.wav`;
    });
  }

  ["set-04", "set-05"].forEach((setKey) => {
    const listeningSet = byKey[setKey];
    if (!listeningSet) return;

    listeningSet.questions.forEach((question) => {
      const partFolder = question.part === "Part 1" ? "part1" : "part2";
      const number = String(question.id).padStart(2, "0");
      question.audioFile = `${geminiListeningAudioBase}/${setKey}/listening/${partFolder}/No${number}.wav`;
    });
  });

  const sampleSet = byKey.sample;
  if (sampleSet) {
    sampleSet.questions.forEach((question) => {
      const partFolder = question.part === "Part 1" ? "part1" : "part2";
      const number = String(question.id).padStart(2, "0");
      question.audioFile = `${listeningAudioBase}/sample/listening/${partFolder}/No${number}.wav`;
    });

    window.scbtGrade2Set01 = {
      ...(window.scbtGrade2Set01 || {}),
      listeningQuestions: sampleSet.questions,
    };
  }

  window.scbtGrade2VocabSets = existingSets.map((set) => {
    const listeningSet = byKey[set.key];
    if (!listeningSet) return set;

    const modules = new Set([...(Array.isArray(set.availableModules) ? set.availableModules : []), "reading", "listening"]);
    return {
      ...set,
      availableModules: Array.from(modules),
      description: set.description ? `${set.description} / リスニングPart 1・2収録` : "リスニングPart 1・2収録",
      listeningQuestions: listeningSet.questions,
    };
  });
})();
