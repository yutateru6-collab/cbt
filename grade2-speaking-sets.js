(() => {
  function makeSpeakingSteps(config) {
    return [
      {
        label: "Warm-up",
        seconds: 10,
        prompt: "面接官の質問を聞いて、マイクに向かって英語で答えます。",
        visual: "面接官",
        recording: true,
        questionText: config.warmupQuestion,
      },
      {
        label: "Silent Reading",
        seconds: 20,
        prompt: "カードの英文を黙読します。録音はまだ始まりません。",
        visual: "カード",
        recording: false,
        cardTitle: config.cardTitle,
        cardText: config.cardText,
      },
      {
        label: "Read Aloud",
        seconds: 45,
        prompt: "カードの英文を声に出して読みます。",
        visual: "カード",
        recording: true,
        cardTitle: config.cardTitle,
        cardText: config.cardText,
      },
      {
        label: "No.1",
        seconds: 30,
        prompt: "カードの内容についての質問に答えます。",
        visual: "カード",
        recording: true,
        cardTitle: config.cardTitle,
        cardText: config.cardText,
        questionText: config.no1.question,
        modelAnswer: config.no1.modelAnswer,
        answerEvidence: config.no1.answerEvidence,
      },
      {
        label: "No.2",
        seconds: 60,
        prompt: "3コマのイラストの展開を説明します。",
        visual: "カード",
        recording: true,
        pictureStory: config.no2.pictureStory,
        modelAnswer: config.no2.modelAnswer,
      },
      {
        label: "No.3",
        seconds: 35,
        prompt: "カードのトピックに関連した質問に答えます。",
        visual: "面接官",
        recording: true,
        questionText: config.no3.question,
        modelAnswer: config.no3.modelAnswer,
      },
      {
        label: "No.4",
        seconds: 35,
        prompt: "日常的な話題について、自分の意見を答えます。",
        visual: "面接官",
        recording: true,
        questionText: config.no4.question,
        modelAnswer: config.no4.modelAnswer,
      },
    ];
  }

  const speakingSetConfigs = [
    {
      key: "sample",
      cardTitle: "Borrowing Tools from Libraries",
      cardText:
        "Some people need tools for small repairs at home, but they do not want to buy tools they will rarely use. To help these people, some libraries have started lending simple tools. Residents borrow hammers and other equipment from such libraries. In this way, they can finish repairs without buying new tools. These services also help communities reduce waste and share resources.",
      warmupQuestion: "What kind of books do you like to read?",
      no1: {
        question: "According to the passage, how can residents finish repairs without buying new tools?",
        modelAnswer: "By borrowing hammers and other equipment from libraries that lend simple tools.",
        answerEvidence: "such libraries → libraries that have started lending simple tools",
      },
      no2: {
        pictureStory: {
          imageSrc: "assets/grade2-speaking-picture-story-sample-v3.png",
          imageAlt: "Three-panel story about borrowing a ladder, painting a room, and spilling paint.",
          openingSentence: "One day, Leo and his mother visited a community tool library.",
          firstSpeech: "Let's borrow this ladder to paint your room.",
          firstSpeechSpeaker: "Leo's mother",
          firstSpeechTail: "center",
          firstTimeLabel: "The next afternoon at home",
          secondTimeLabel: "A few minutes later",
        },
        modelAnswer:
          "One day, Leo and his mother visited a community tool library. Leo's mother said, ‘Let's borrow this ladder to paint your room.’ The next afternoon at home, Leo was painting the wall while his mother held the paint tray. A few minutes later, a paint can fell over and paint spread across the floor. Leo thought that they should have covered the floor first.",
      },
      no3: {
        question:
          "Some people say that borrowing tools from libraries is better than buying tools for small home repairs. What do you think about that?",
        modelAnswer:
          "I agree. People can save money by borrowing tools that they rarely need. Sharing tools can also reduce waste.",
      },
      no4: {
        question:
          "Today, some restaurants let customers order meals with tablet computers. Do you think more restaurants will use this system in the future?",
        modelAnswer:
          "Yes. Tablet ordering can reduce waiting time and make orders clearer. It can also show menus in several languages.",
      },
    },
    {
      key: "set-01",
      cardTitle: "Using Refill Stations",
      cardText:
        "Many stores want to reduce the plastic containers they throw away. To do this, some stores have installed refill stations for soap and shampoo. Customers bring empty bottles and fill them at these stations. By doing so, they can buy daily products without using new plastic containers. Such stations are becoming more common, but stores must keep them clean and easy to use.",
      warmupQuestion: "Where do you usually go shopping?",
      no1: {
        question: "According to the passage, how can customers buy daily products without using new plastic containers?",
        modelAnswer: "By bringing empty bottles and filling them at refill stations.",
        answerEvidence: "these stations → refill stations for soap and shampoo",
      },
      no2: {
        pictureStory: {
          imageSrc: "assets/grade2-speaking-picture-story-set-01-v3.png",
          imageAlt: "Three-panel story about filling a large shampoo bottle and discovering a leak on the way home.",
          openingSentence: "One day, Maya and her father visited a store with a refill station.",
          firstSpeech: "Let's fill this large bottle with shampoo.",
          firstSpeechSpeaker: "Maya's father",
          firstSpeechTail: "center",
          firstTimeLabel: "A few minutes later",
          secondTimeLabel: "On the way home",
        },
        modelAnswer:
          "One day, Maya and her father visited a store with a refill station. Maya's father said, ‘Let's fill this large bottle with shampoo.’ A few minutes later, a clerk was helping them fill the bottle. On the way home, shampoo leaked from the loose cap into their bag. Maya thought that they should have closed the cap tightly.",
      },
      no3: {
        question:
          "Some people say that local governments should help stores install refill stations. What do you think about that?",
        modelAnswer:
          "I agree. The equipment may be too expensive for small stores. Government support could help reduce plastic waste in more communities.",
      },
      no4: {
        question:
          "These days, many people post photographs of their daily lives online. Do you think people are careful enough about their personal information when they do this?",
        modelAnswer:
          "No. Photos can reveal a person's home, school, or location without them noticing. People should check every photo carefully before posting it.",
      },
    },
    {
      key: "set-02",
      cardTitle: "Digital Tickets at Museums",
      cardText:
        "Many museums want visitors to spend less time waiting at entrances. To solve this problem, some museums offer digital tickets on their websites. Visitors save these tickets on their phones before they arrive. By doing so, they can enter museums without standing in long ticket lines. Such tickets can also reduce the amount of paper used by museums.",
      warmupQuestion: "When did you last visit a museum?",
      no1: {
        question: "According to the passage, how can visitors enter museums without standing in long ticket lines?",
        modelAnswer: "By saving digital tickets on their phones before they arrive.",
        answerEvidence: "these tickets → digital tickets offered on museum websites",
      },
      no2: {
        pictureStory: {
          imageSrc: "assets/grade2-speaking-picture-story-set-02-v3.png",
          imageAlt: "Three-panel story about buying museum tickets online and discovering the date is wrong.",
          openingSentence: "One day, Rina and her uncle were planning a visit to a museum.",
          firstSpeech: "Let's buy our tickets online tonight.",
          firstSpeechSpeaker: "Rina",
          firstSpeechTail: "center",
          firstTimeLabel: "That evening at home",
          secondTimeLabel: "The next morning at the museum",
        },
        modelAnswer:
          "One day, Rina and her uncle were planning a visit to a museum. Rina said, ‘Let's buy our tickets online tonight.’ That evening at home, Rina bought two tickets on her phone. The next morning at the museum, a staff member told them that the tickets were for another date. Rina realized that she had chosen the wrong date.",
      },
      no3: {
        question:
          "Some people say that more museums will offer digital tickets and guides in the future. What do you think about that?",
        modelAnswer:
          "I agree. Digital services make visits more convenient. They can also give visitors information in several languages.",
      },
      no4: {
        question:
          "Today, some schools allow students to wear casual clothes instead of uniforms on special days. Do you think this is a good idea?",
        modelAnswer:
          "Yes. Students can learn to choose suitable clothes by themselves. Special casual-clothes days can also make school more enjoyable.",
      },
    },
    {
      key: "set-03",
      cardTitle: "Ordering Groceries from Home",
      cardText:
        "More people are ordering groceries online, including older people who have difficulty carrying heavy bags. Some supermarkets now deliver food directly to customers' homes. However, many older customers are not familiar with such services, so supermarkets provide simple guides and telephone support. These forms of help allow customers to place orders more confidently and choose convenient delivery times.",
      warmupQuestion: "Who usually buys groceries in your family?",
      no1: {
        question: "According to the passage, why do supermarkets provide simple guides and telephone support?",
        modelAnswer: "Because many older customers are not familiar with grocery delivery services.",
        answerEvidence: "such services → supermarkets delivering food directly to customers' homes",
      },
      no2: {
        pictureStory: {
          imageSrc: "assets/grade2-speaking-picture-story-set-03-v3.png",
          imageAlt: "Three-panel story about ordering frozen groceries and finding that the freezer is full.",
          openingSentence: "One day, Kenta and his grandmother were ordering groceries online.",
          firstSpeech: "Let's order the heavy frozen food, too.",
          firstSpeechSpeaker: "Kenta",
          firstSpeechTail: "center",
          firstTimeLabel: "That afternoon",
          secondTimeLabel: "A few minutes later",
        },
        modelAnswer:
          "One day, Kenta and his grandmother were ordering groceries online. Kenta said, ‘Let's order the heavy frozen food, too.’ That afternoon, a delivery worker brought several bags to their home. A few minutes later, the frozen food would not fit in the full freezer. Kenta thought that they should have organized the freezer first.",
      },
      no3: {
        question:
          "Some people say that supermarkets should provide more support for older customers who shop online. What do you think about that?",
        modelAnswer:
          "I agree. Some older customers are not used to shopping online. Clear support can help them buy what they need safely.",
      },
      no4: {
        question:
          "Nowadays, some people use their smartphones while walking on busy streets. Do you think people should stop doing this?",
        modelAnswer:
          "Yes. They may not notice cars, bicycles, or other people. Stopping in a safe place before using a phone can prevent accidents.",
      },
    },
    {
      key: "set-04",
      cardTitle: "Reducing Food Waste at School",
      cardText:
        "Some schools are trying to reduce the amount of food thrown away at lunchtime. They now offer several portion sizes to students. Before eating, students choose one of these sizes carefully. In this way, they can leave less food on their plates. Such programs also teach students to think about the environment and value the food they receive.",
      warmupQuestion: "What do you usually eat for lunch?",
      no1: {
        question: "According to the passage, how can students leave less food on their plates?",
        modelAnswer: "By choosing one of the portion sizes carefully.",
        answerEvidence: "these sizes → several portion sizes offered to students",
      },
      no2: {
        pictureStory: {
          imageSrc: "assets/grade2-speaking-picture-story-set-04-v3.png",
          imageAlt: "Three-panel story about choosing the smallest lunch portion and becoming hungry during practice.",
          openingSentence: "One day, Aoi and her classmate were choosing their school lunch portions.",
          firstSpeech: "I'll take the smallest portion today.",
          firstSpeechSpeaker: "Aoi",
          firstSpeechTail: "center",
          firstTimeLabel: "After lunch",
          secondTimeLabel: "During afternoon practice",
        },
        modelAnswer:
          "One day, Aoi and her classmate were choosing their school lunch portions. Aoi said, ‘I'll take the smallest portion today.’ After lunch, Aoi had finished everything on her tray. During afternoon practice, however, she became very hungry and thought that she should have chosen a larger portion.",
      },
      no3: {
        question:
          "Some people say that letting students choose from several lunch sizes is better than asking everyone to finish the same amount. What do you think about that?",
        modelAnswer:
          "I agree. Students need different amounts of food. Several portion sizes can reduce waste without forcing students to eat too much.",
      },
      no4: {
        question:
          "Today, many people work or study at cafés. Do you think more people will do this in the future?",
        modelAnswer:
          "Yes. Many cafés provide comfortable seats and internet access. People who work remotely may want a place outside their homes.",
      },
    },
    {
      key: "set-05",
      cardTitle: "Making Parks Easier to Use",
      cardText:
        "Local parks are important places for exercise and relaxation, but some people cannot use them easily. In many parks, old paths are too narrow for wheelchairs, and there are too few benches for people who need to rest. Residents are concerned, so city workers are widening paths and adding benches. These improvements help everyone enjoy parks more safely.",
      warmupQuestion: "Is there a park near your home?",
      no1: {
        question: "According to the passage, why are city workers making paths wider and adding more benches?",
        modelAnswer: "Because residents are concerned about narrow paths and the lack of places to rest.",
        answerEvidence: "old paths are too narrow for wheelchairs / too few benches for people who need to rest",
      },
      no2: {
        pictureStory: {
          imageSrc: "assets/grade2-speaking-picture-story-set-05-v3.png",
          imageAlt: "Three-panel story about a picnic in a renovated park where all benches are occupied.",
          openingSentence: "One day, Yuki and her grandfather were planning a picnic at a city park.",
          firstSpeech: "Let's meet near the new benches at noon.",
          firstSpeechSpeaker: "Yuki",
          firstSpeechTail: "center",
          firstTimeLabel: "The next day at the park",
          secondTimeLabel: "At noon",
        },
        modelAnswer:
          "One day, Yuki and her grandfather were planning a picnic at a city park. Yuki said, ‘Let's meet near the new benches at noon.’ The next day at the park, they walked comfortably along a wide new path. At noon, all the benches were occupied, so Yuki thought that they should have brought folding chairs.",
      },
      no3: {
        question:
          "Some people say that cities should spend more money on wide paths and benches than on new playground equipment. What do you think about that?",
        modelAnswer:
          "I agree. Wide paths and benches make parks usable for people of many ages and abilities. Cities can improve playground equipment after basic access is provided.",
      },
      no4: {
        question:
          "These days, many people buy things online after reading customer reviews. Do you think people are careful enough when they trust these reviews?",
        modelAnswer:
          "No. Some reviews may be false or written without enough experience. People should compare many reviews and other information before buying something.",
      },
    },
  ];

  window.scbtGrade2SpeakingSets = speakingSetConfigs.map((config) => ({
    key: config.key,
    speakingSteps: makeSpeakingSteps(config),
  }));
})();
