(() => {
  function makeSpeakingSteps(config) {
    return [
      {
        label: "Warm-up",
        seconds: 10,
        prompt: "面接官の質問を聞いて、マイクに向かって答えます。",
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
        prompt: "イラストの展開を説明します。",
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
        answerEvidence: "such libraries -> libraries that have started lending simple tools",
      },
      no2: {
        pictureStory: {
          imageSrc: "assets/grade2-speaking-picture-story-sample-v2.png",
          imageAlt: "Three-panel story about exchanging an old racket for a basketball at a community sports center.",
          openingSentence: "One day, Emi and her older brother visited a community sports center.",
          firstSpeech: "Let's exchange this old racket for something we can use.",
          firstSpeechSpeaker: "Emi's brother",
          firstSpeechTail: "center",
          firstTimeLabel: "A few minutes later",
          secondTimeLabel: "Later at a nearby park",
        },
        modelAnswer:
          "One day, Emi and her older brother visited a community sports center. Emi's brother said, “Let's exchange this old racket for something we can use.” A few minutes later, a staff member was giving them a basketball, and Emi was handing him the racket. Later at a nearby park, Emi was playing basketball with her brother when the ball rolled toward a puddle.",
      },
      no3: {
        question: "Some people say that more libraries should lend useful items besides books. What do you think about that?",
        modelAnswer:
          "I agree. People can borrow things they only need for a short time. It can also help communities reduce waste.",
      },
      no4: {
        question: "Do you think children should help with simple repairs at home?",
        modelAnswer:
          "Yes. They can learn practical skills from their families. They will also become more responsible at home.",
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
        answerEvidence: "these stations -> refill stations for soap and shampoo",
      },
      no2: {
        pictureStory: {
          imageSrc: "assets/grade2-speaking-picture-story-set-01-v2.png",
          imageAlt: "Three-panel story about using a reusable produce bag while shopping for apples.",
          openingSentence: "One day, Maya and her father were shopping for fruit at a supermarket.",
          firstSpeech: "Let's use these reusable bags for the apples.",
          firstSpeechSpeaker: "Maya's father",
          firstSpeechTail: "center",
          firstTimeLabel: "A few minutes later",
          secondTimeLabel: "That evening at home",
        },
        modelAnswer:
          "One day, Maya and her father were shopping for fruit at a supermarket. Maya's father said, “Let's use these reusable bags for the apples.” A few minutes later, Maya was putting apples into a reusable bag while a clerk was helping her weigh them. That evening at home, the bag tore, and the apples rolled across the floor while Maya and her father looked surprised.",
      },
      no3: {
        question: "Some people say that more stores should offer refill stations. What do you think about that?",
        modelAnswer:
          "I agree. Refill stations can reduce plastic waste. They can also make people think more carefully about what they buy.",
      },
      no4: {
        question: "Do you think people should bring their own bags when they go shopping?",
        modelAnswer:
          "Yes. Reusable bags can reduce the number of plastic bags people use. They are also stronger and easier to carry.",
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
        answerEvidence: "these tickets -> digital tickets offered on museum websites",
      },
      no2: {
        pictureStory: {
          imageSrc: "assets/grade2-speaking-picture-story-set-02-v2.png",
          imageAlt: "Three-panel story about using a phone audio guide at a science museum.",
          openingSentence: "One day, Rina and her mother visited a science museum.",
          firstSpeech: "Let's use the audio guide on my phone.",
          firstSpeechSpeaker: "Rina",
          firstSpeechTail: "center",
          firstTimeLabel: "Later at the dinosaur exhibit",
          secondTimeLabel: "A few minutes later",
        },
        modelAnswer:
          "One day, Rina and her mother visited a science museum. Rina said, “Let's use the audio guide on my phone.” Later at the dinosaur exhibit, they were listening to the guide while looking at a dinosaur skeleton. A few minutes later, Rina's phone battery was empty, so her mother offered her a portable charger.",
      },
      no3: {
        question: "Some people say that museums should use more digital services. What do you think about that?",
        modelAnswer:
          "I agree. Digital services can make visits more convenient. Museums can also give visitors information in several languages.",
      },
      no4: {
        question: "Do you think students should visit museums more often?",
        modelAnswer:
          "Yes. Students can learn things that are difficult to understand from textbooks alone. Museum visits can also make them more interested in history and science.",
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
        answerEvidence: "such services -> supermarkets delivering food directly to customers' homes",
      },
      no2: {
        pictureStory: {
          imageSrc: "assets/grade2-speaking-picture-story-set-03-v2.png",
          imageAlt: "Three-panel story about making supermarket shelf labels easier to read.",
          openingSentence: "One day, Kenta and his grandmother were shopping at a supermarket.",
          firstSpeech: "I can't read these small labels.",
          firstSpeechSpeaker: "Kenta's grandmother",
          firstSpeechTail: "center",
          firstTimeLabel: "A few minutes later",
          secondTimeLabel: "One week later",
        },
        modelAnswer:
          "One day, Kenta and his grandmother were shopping at a supermarket. Kenta's grandmother said, “I can't read these small labels.” A few minutes later, Kenta was asking the manager to make the labels larger, and the manager was taking notes. One week later, his grandmother was reading the new large labels, and Kenta was giving her a thumbs-up.",
      },
      no3: {
        question:
          "Some people say that supermarkets should provide more support for older customers who shop online. What do you think about that?",
        modelAnswer:
          "I agree. Some older customers are not used to shopping online. Clear support can help them buy what they need safely.",
      },
      no4: {
        question: "Do you think families should eat dinner together more often?",
        modelAnswer:
          "Yes. Family members can talk about their day and understand each other better. Eating together can also help people develop healthier habits.",
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
        answerEvidence: "these sizes -> several portion sizes offered to students",
      },
      no2: {
        pictureStory: {
          imageSrc: "assets/grade2-speaking-picture-story-set-04-anime.png",
          imageAlt: "Three-panel story about choosing lunch portions at school.",
          openingSentence: "One day, Aoi and her classmates were having lunch at school.",
          firstSpeech: "I'll choose a smaller portion today.",
          firstSpeechSpeaker: "Aoi",
          firstSpeechTail: "center",
          firstTimeLabel: "A few minutes later",
          secondTimeLabel: "After lunch",
        },
        modelAnswer:
          "One day, Aoi and her classmates were having lunch at school. Aoi said, “I'll choose a smaller portion today.” A few minutes later, Aoi had finished all of her lunch, but her friend still had a large amount of food on his tray. After lunch, Aoi was returning an empty tray, and her friend was throwing away some food.",
      },
      no3: {
        question: "Some people say that schools should let students choose their lunch portion sizes. What do you think about that?",
        modelAnswer:
          "I agree. Students know how much food they can eat. Choosing portion sizes can reduce waste and help students make responsible decisions.",
      },
      no4: {
        question: "Do you think students should learn how to cook at school?",
        modelAnswer:
          "Yes. Cooking is an important skill for daily life. Students can also learn how to choose healthy food.",
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
          imageSrc: "assets/grade2-speaking-picture-story-set-05-anime.png",
          imageAlt: "Three-panel story about making a neighborhood park easier to use.",
          openingSentence: "One day, Yuki and her grandfather visited a neighborhood park.",
          firstSpeech: "This narrow path is difficult for me to use.",
          firstSpeechSpeaker: "Yuki's grandfather",
          firstSpeechTail: "center",
          firstTimeLabel: "One month later",
          secondTimeLabel: "Later that afternoon",
        },
        modelAnswer:
          "One day, Yuki and her grandfather visited a neighborhood park. Yuki's grandfather said, “This narrow path is difficult for me to use.” One month later, city workers were making the path wider, and Yuki was watching the work with her grandfather. Later that afternoon, her grandfather was using the wider path while Yuki was sitting on a new bench and offering him some water.",
      },
      no3: {
        question:
          "Some people say that cities should spend more money making public parks easier for everyone to use. What do you think about that?",
        modelAnswer:
          "I agree. Public parks should be safe and comfortable for everyone. Better paths and benches can help older people and people with disabilities.",
      },
      no4: {
        question: "Do you think people should exercise outside more often?",
        modelAnswer:
          "Yes. Outdoor exercise is a good way to stay healthy and reduce stress. People can also enjoy nature while they exercise.",
      },
    },
  ];

  window.scbtGrade2SpeakingSets = speakingSetConfigs.map((config) => ({
    key: config.key,
    speakingSteps: makeSpeakingSteps(config),
  }));
})();
