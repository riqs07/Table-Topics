// Scenario questions: choose the best reply, see why each works or doesn't, then say the move in your own words (decision 54; items 1 to 8 from documents/research/charisma-connection-deep-dive-2026-10.md)

// How good a reply is: not right and wrong, but four tiers
export type Tier = "best" | "good" | "flat" | "misstep";

// The tiers' names, as shown
export const TIER_NAMES: Readonly<Record<Tier, string>> = { best: "Best", good: "Also good", flat: "Flat", misstep: "Misstep" };

// One reply to choose from
export interface ScenarioOption {
  // What you would say (or do)
  text: string;
  // How good it is
  tier: Tier;
  // The named pattern behind it, such as "Shift to yourself"
  pattern: string;
  // Why it works, or why it is weaker, in a line or two
  why: string;
}

// One scenario
export interface Scenario {
  // Stable id
  id: string;
  // The move it teaches (scenarios that share a move are reviewed in place of each other)
  move: string;
  // A short name
  title: string;
  // The situation, two or three lines
  situation: string;
  // The replies, in the order shown (the best one's place varies)
  options: ReadonlyArray<ScenarioOption>;
  // The move, in one line: a rule, never a line to memorise
  principle: string;
  // What to say aloud afterwards
  sayIt: string;
  // A note on context or culture, when it matters
  note?: string;
}

// The scenarios
export const SCENARIOS: ReadonlyArray<Scenario> = [
  // 1. Good news
  {
    id: "sc-job-offer", move: "good-news", title: "The job offer",
    situation: "At lunch, your coworker Priya puts her phone down, grinning. “I just got the offer. The Lisbon job. I start in March!”",
    options: [
      { text: "“No way, Lisbon! When did you hear? What did you do when you read it?”", tier: "best", pattern: "Real reaction, then about the moment", why: "Real enthusiasm, and it asks her to relive the moment. That is the reply linked to more trust and closeness." },
      { text: "“Congrats! I moved abroad for work once. Honestly the first year was brutal…”", tier: "misstep", pattern: "Shift to yourself", why: "It takes the spotlight just as she steps into it." },
      { text: "“Nice one, well done.”", tier: "flat", pattern: "Quiet acknowledgement", why: "Kind, but it ends the moment. She has nothing to say next." },
      { text: "“Big move. Have you thought about how you'll find a flat?”", tier: "misstep", pattern: "Pointing out the downside", why: "It answers joy with a problem. It reads as doubt, even when meant as help." },
    ],
    principle: "React for real, then ask about the moment.", sayIt: "React to her news in your own words, and ask one thing about the moment.", note: "Norms vary: in some places a quieter warm reply is ideal. The core is engaged and specific, not loud.",
  },
  // 2. Free information
  {
    id: "sc-half-marathon", move: "follow-up", title: "The half marathon",
    situation: "At a friend's party, you ask Tom how his weekend was. “Mostly recovering. I ran my first half marathon on Saturday.”",
    options: [
      { text: "“Cool. So how do you know Hannah?”", tier: "misstep", pattern: "Topic switch", why: "It drops the most interesting thing he said." },
      { text: "“Your first one! How did the last few miles feel?”", tier: "best", pattern: "Follow-up on their detail", why: "It picks up “first” and asks about his experience, not the facts. Follow-ups like this are what made people more liked." },
      { text: "“Congrats! Was it as hard as you expected?”", tier: "good", pattern: "Follow-up, closed", why: "It works, but invites a shorter answer than an open question." },
      { text: "“What was your time? Did you follow a plan? How long did you train?”", tier: "flat", pattern: "Question pile-up", why: "Three questions at once feels like a form, and he can only answer one." },
    ],
    principle: "Ask about their detail, and about the experience, not the facts.", sayIt: "Ask one follow-up about his experience.",
  },
  // 3. Boomerasking
  {
    id: "sc-monday-coffee", move: "share-hand-back", title: "Monday coffee",
    situation: "Monday morning at the coffee machine with Dan from another team. You had a great weekend hiking and would like to mention it.",
    options: [
      { text: "“How was your weekend? Mine was amazing, we hiked up…”", tier: "misstep", pattern: "Boomerask", why: "It dresses your story up as interest in his, and people notice." },
      { text: "“I had the best weekend. Went hiking in the Peaks. How was yours?”", tier: "best", pattern: "Share, then hand it back", why: "It shares openly, which builds closeness, then really hands him the turn." },
      { text: "“How was your weekend?” and then listen", tier: "good", pattern: "Open question", why: "Good. But if you want to share too, sharing first is more honest." },
      { text: "“Fine, thanks.” when he asks you", tier: "flat", pattern: "Dead end", why: "It gives him nothing to follow up on." },
    ],
    principle: "Share honestly, then hand it back. Don't ask just to tell your own.", sayIt: "Share one detail from your weekend, then ask about his.",
  },
  // 4. Listening before fixing
  {
    id: "sc-brutal-week", move: "listen-first", title: "The brutal week",
    situation: "Your friend Sam sighs. “Work's been brutal. My manager moved the deadline up again, and I'm the only one on the project.”",
    options: [
      { text: "“You should push back. Or honestly, start looking for something else.”", tier: "flat", pattern: "Advice nobody asked for", why: "It may be right, but too soon. Sam hasn't asked." },
      { text: "“Ugh, same. My boss does that constantly.”", tier: "misstep", pattern: "Shift to yourself", why: "It turns their bad week into yours." },
      { text: "“So you're carrying it alone and the goalposts keep moving. That sounds exhausting. What's the hardest part right now?”", tier: "best", pattern: "Understood, makes sense, cares", why: "It shows you understood (a specific summary), that it makes sense (“exhausting”), and that you care (a question about them)." },
      { text: "“That sucks.”", tier: "flat", pattern: "Generic reaction", why: "Kind, but generic, so Sam has to work to keep going." },
    ],
    principle: "Show you understood, that it makes sense, and that you care, before any advice.", sayIt: "Say back what's hard for Sam, then ask one question.",
  },
  // 5. Matching depth
  {
    id: "sc-why-moved", move: "share-hand-back", title: "Why they moved",
    situation: "At a dinner, someone you've just met says, “Honestly, I moved here because my dad got sick and I wanted to be closer.”",
    options: [
      { text: "“Oh. So what do you do for work?”", tier: "misstep", pattern: "Retreat to safe talk", why: "It signals their honesty made you uncomfortable." },
      { text: "“That's a big thing to do. How is he doing now?”", tier: "best", pattern: "Match their depth, stay with them", why: "They took a step deeper; this meets them there and keeps it on them." },
      { text: "“I'm sorry. My mum's been unwell too, so I get some of that. How's he doing?”", tier: "good", pattern: "Small matching share, hand back", why: "Good: a short share that matches theirs, then straight back to them." },
      { text: "“I know how that is. My grandmother was ill for years, and the hospital was…” (two minutes)", tier: "flat", pattern: "Over-sharing", why: "It starts like a match, then becomes your story. One-sided sharing is the bigger risk." },
    ],
    principle: "Match their depth, share a little if it fits, and hand it back.", sayIt: "Acknowledge what they shared, and ask one caring question.",
  },
  // 6. Ending well
  {
    id: "sc-shorter-answers", move: "end-well", title: "Shorter answers",
    situation: "You've talked with Mei for fifteen minutes at a work event. It went well. Now her answers are getting shorter and she keeps glancing at the bar.",
    options: [
      { text: "Ask another question to keep it going", tier: "misstep", pattern: "Staying past the peak", why: "It keeps her in a conversation she may want to leave." },
      { text: "“Anyway, I should go.”", tier: "flat", pattern: "Abrupt exit", why: "Fine, but cold after a good chat." },
      { text: "“I've really enjoyed this, especially your bike trip story. I'll let you grab a drink. Good luck with the launch!”", tier: "best", pattern: "Warm exit with a callback", why: "It ends on a high, names a detail (so she knows you listened), and wishes her well." },
      { text: "“Sorry, am I boring you?”", tier: "misstep", pattern: "Asking for reassurance", why: "It puts her on the spot to reassure you." },
    ],
    principle: "Leave on a high point, with one detail they said.", sayIt: "End the conversation warmly, mentioning one thing she said.",
  },
  // 7. Compliments
  {
    id: "sc-after-her-talk", move: "compliment", title: "After her talk",
    situation: "Your colleague Ana just gave a presentation. Someone asked a hard budget question, and she handled it well. You're both at the coffee machine.",
    options: [
      { text: "Say nothing; it might seem awkward", tier: "misstep", pattern: "Holding back a compliment", why: "The most common choice, and the one the research argues against: it lands better than you think." },
      { text: "“Good talk.”", tier: "flat", pattern: "Generic praise", why: "Pleasant, but forgettable." },
      { text: "“The way you handled the budget question was great. Calm, and you actually answered it.”", tier: "best", pattern: "Specific compliment", why: "Specific, about her work, and true." },
      { text: "“Great talk! Mine next week will be a disaster compared to that.”", tier: "flat", pattern: "Turning it to yourself", why: "It starts well, then she has to reassure you." },
    ],
    principle: "Give the specific compliment you'd usually keep to yourself.", sayIt: "Compliment one specific thing she did.", note: "Keep work compliments about work, not appearance.",
  },
  // 8. A small admission
  {
    id: "sc-forgotten-name", move: "admit-it", title: "The forgotten name",
    situation: "At the gym you meet Raj again. He says, “Hey, good to see you!” using your name. You've forgotten his. You remember he cycled to Brighton for charity.",
    options: [
      { text: "Chat without using his name and hope it comes back", tier: "flat", pattern: "Bluffing", why: "It keeps you anxious and distracted for the whole chat. Hiding tends to backfire." },
      { text: "“Good to see you! I'm sorry, I've blanked on your name. I do remember the Brighton ride, though. How did it go?”", tier: "best", pattern: "Small admission, then a detail you remember", why: "Others judge small slips more kindly than we do, and the detail shows he mattered." },
      { text: "“Hey… you! How's it going?”", tier: "misstep", pattern: "Obvious cover-up", why: "It fools no one." },
      { text: "“Hi! Sorry, remind me of your name?”", tier: "good", pattern: "Honest admission", why: "Honest and fine. The best one also shows you remember him." },
    ],
    principle: "Admit the small slip, and show what you do remember.", sayIt: "Admit you've forgotten, and mention something you remember about him.",
  },
  // 9. Thanks with a reason
  {
    id: "sc-the-favour", move: "thanks", title: "The favour",
    situation: "Your neighbour Lena fed your cat all week while you were away, and left a note saying he'd been extra cuddly.",
    options: [
      { text: "“Thanks so much!”", tier: "flat", pattern: "Thanks without a reason", why: "Warm, but it could be for anything." },
      { text: "“Thank you. It meant I could actually relax on the trip, and the note made me laugh. He clearly loved having you.”", tier: "best", pattern: "Thanks with a reason", why: "It says what her help made possible. Specific thanks made people seem warmer to the person they thanked." },
      { text: "“Thanks, I owe you one. Let me know what I can pay you.”", tier: "misstep", pattern: "Turning it into a trade", why: "It treats a kindness as a bill to settle." },
      { text: "“You're a star, thank you. Was he any trouble?”", tier: "good", pattern: "Thanks, then about her", why: "Good: warm, and it asks about her week with him. Saying what it meant would land even better." },
    ],
    principle: "Thank people with a reason: what it made possible for you.", sayIt: "Thank Lena for something specific, and say what it meant.",
  },
  // 10. Bad news
  {
    id: "sc-interview", move: "listen-first", title: "The interview",
    situation: "Your friend Jo texts, then calls. “I didn't get the job. I was so sure after the second interview.”",
    options: [
      { text: "“Their loss. Something better will come along.”", tier: "flat", pattern: "Quick cheer-up", why: "Meant kindly, but it skips past how Jo feels right now." },
      { text: "“Oh Jo, after you felt so sure. That's a real blow. How are you doing with it?”", tier: "best", pattern: "Understood, makes sense, cares", why: "It shows you understood (“after you felt so sure”), that the feeling makes sense, and that you care how Jo is." },
      { text: "“Did they say why? Maybe ask for feedback.”", tier: "flat", pattern: "Straight to fixing", why: "A good idea later. Right now Jo hasn't asked for a plan." },
      { text: "“I know exactly how you feel. I didn't get three jobs last year.”", tier: "misstep", pattern: "Shift to yourself", why: "It turns Jo's disappointment into your story." },
    ],
    principle: "Show you understood, that it makes sense, and that you care, before any advice.", sayIt: "Respond to Jo's news in your own words, and ask how Jo is doing.",
  },
];

// A scenario by id
export function findScenario(id: string): Scenario | undefined {
  // Looked up
  return SCENARIOS.find((scenario) => scenario.id === id);
}
