// The tough question (decision 155): a second course for thinking on your feet, for someone who gets flustered by a hard or hostile question after a talk, in a meeting or at an interview. Built on the quick scenarios "The pricing question" (say it back, then answer), "The budget ask" (name the objection, then answer it), "The launch date" (acknowledge, then disagree) and "The forgotten name" (a small admission) in src/content/scenarios.ts; on documents/research/charisma-connection-deep-dive-2026-10.md (others judge our admissions more kindly than we do) and charisma-conversation-duolingo-2026-10.md (nerves show far less than they feel); and on the Learn cards behind them (saying the question back, two-sided messages, disagreeing well, hedges and hesitations lowering authority, looking away to think, owning a mistake)

// Load the course type
import type { Course } from "@/content/courses";

// The course
export const THE_TOUGH_QUESTION: Course = {
  id: "the-tough-question",
  focus: "spot",
  title: "The tough question",
  blurb: "Stay calm and answer well when the question has an edge.",
  outcomes: ["Say a sharp question back in calm words, then answer it", "Hear the worry behind a question, and answer that", "Agree with what’s fair, then disagree calmly", "Say “I don’t know” without bluffing, and own a slip", "Answer briefly, then stop, without a long defence"],
  draft: false,
  lessons: [
    // Lesson 1
    {
      id: "back",
      title: "Say it back",
      blurb: "Buy a beat, and take the edge off.",
      parts: [
        // Saying a sharp question back without its sting
        { id: "tq-back-1", title: "Take the edge off", learn: { headline: "Say it back in calm words.", body: "A sharp question pulls you towards a sharp answer. Before you reply, say the question back in your own plain words, without the jab. It gives you a moment, checks you heard it right, and helps everyone else follow.", instead: "“Why would anyone pay for this? Well, um, I mean, obviously…”", tryThis: "“So: why pay when there’s a free version? (a breath) Because it saves about five hours a week.”", card: "point-repeat-question" }, practice: { mode: "talk", promptId: "t034", goal: "Picture it asked with an edge. Say it back in calm words, pause, then answer.", tries: 2, measure: "fillers" } },
        // Answering the question that was asked, not an easier one
        { id: "tq-back-2", title: "Answer the one they asked", learn: { headline: "Then answer that question, first.", body: "Under pressure, it’s tempting to answer an easier question instead. Most of the room won’t notice the swap, but the person who asked will, and it costs their trust. Put your answer to their question in your first sentence." }, see: { model: { question: "“Why would anyone pay for this when the free version exists?”", answer: "So the question is: why pay when there’s a free version? Because the paid one saves about five hours a week. For a team, that’s a day back each week.", highlight: "Because the paid one saves about five hours a week.", notice: "It says the question back, then answers it in the very next sentence." } }, practice: { mode: "talk", promptId: "t015", goal: "Answer the question in your first sentence, with no warm-up.", tries: 1, measure: "fillers" } },
        // Looking away to think is fine
        { id: "tq-back-3", title: "Look away to think", learn: { headline: "It’s fine to look away and think.", body: "People look away more as a question gets harder, and it helps them answer: looking at a face while thinking made answers worse. So when a hard one lands, glance away, think in silence, then come back with your answer.", card: "body-look-away" }, practice: { mode: "talk", promptId: "t013", goal: "Look away and think in silence before you answer, with no “um” while you do.", tries: 1, measure: "fillers" } },
      ],
    },
    // Lesson 2
    {
      id: "doubt",
      title: "Find the doubt",
      blurb: "Answer the worry behind the question.",
      parts: [
        // The worry under a tough question
        { id: "tq-doubt-1", title: "Hear the worry", learn: { headline: "A tough question is often a worry in disguise.", body: "“Why would anyone pay for this?” usually means “Is it worth the money?” Listen for the worry under the words, say it back in fair words, then answer the worry, not just the words.", instead: "“It’s not that expensive, really.”", tryThis: "“You’re wondering if it’s worth it. Here’s what it saves you…”", card: "minds-two-sided" }, practice: { mode: "response", promptId: "p043", goal: "Name the worry people will have about your change, in fair words, then answer it.", tries: 2, measure: "length" } },
        // A doubt raised must be answered
        { id: "tq-doubt-2", title: "Never leave it hanging", learn: { headline: "Name a doubt only if you answer it.", body: "Messages that raised the other side’s best point and then answered it persuaded most. Raising a doubt and leaving it hanging did worst, worse than not raising it at all. So every “You might worry that…” needs a “Here’s why it still works.”", link: { href: "/learn/scenarios", label: "Quick scenarios: choose a reply, then say it" } }, see: { model: { question: "“Isn’t a course like that a waste of money in a tight year?”", answer: "I know money’s tight this year. Here’s why I think it pays back: the course covers the reporting tool we struggle with, which costs us hours every week.", highlight: "Here’s why I think it pays back", notice: "It names the worry fairly, then answers it straight away." } }, practice: { mode: "response", promptId: "p041", goal: "Name the worry your friend will have, then answer it with one reason.", tries: 1, measure: "length" } },
      ],
    },
    // Lesson 3
    {
      id: "agree",
      title: "Agree with what’s true",
      blurb: "Give them the fair part, then disagree calmly.",
      parts: [
        // The fair part first, then the difference
        { id: "tq-agree-1", title: "Give them the fair part", learn: { headline: "Agree with what’s true, then say where you differ.", body: "When someone pushes back, there’s often something fair in what they say. Say that part first, then give your view with one reason. People who disagree this way are heard more, seem better to work with, and keep the talk from turning hostile.", instead: "“No, that’s just wrong.”", tryThis: "“You’re right that it takes longer. I still think it’s worth it, because…”", card: "hard-disagree" }, practice: { mode: "talk", promptId: "t018", goal: "Pick a side. Then answer someone who says the other: what’s fair in their view, then why you still disagree.", tries: 2, measure: "fillers" } },
        // Hedges on the facts make you sound unsure
        { id: "tq-agree-2", title: "Drop the hedges", learn: { headline: "Hedge your opinion, not your facts.", body: "Under pressure, hedges pile up: “I mean, I could be wrong, it’s sort of…”. In studies, hedges and hesitations made speakers seem less authoritative. Say what you know plainly, and keep one “I think” for the part that really is your opinion.", instead: "“I mean, maybe, I could be wrong, but it’s sort of cheaper?”", tryThis: "“It’s cheaper. And I think it tastes better too.”", card: "words-hedges" }, practice: { mode: "talk", promptId: "t002", goal: "Defend it plainly: no hedges on the facts, and one “I think” at most.", tries: 1, measure: "fillers" } },
        // The other side's best point, then yours
        { id: "tq-agree-3", title: "Their side, then yours", learn: { headline: "Give the other side its best line.", body: "Now a longer answer, with a little time to think. Pick your side, then say the other side’s best point in fair words before you answer it. It shows you’ve thought it through, and makes your view easier to hear." }, practice: { mode: "response", promptId: "p054", goal: "Say the other side’s best point fairly, then your view with one reason.", tries: 1, measure: "length" } },
      ],
    },
    // Lesson 4
    {
      id: "unknown",
      title: "Say “I don’t know” well",
      blurb: "No bluffing: what you know, and how you’ll find out.",
      parts: [
        // A guess under pressure
        { id: "tq-unknown-1", title: "Don’t bluff", learn: { headline: "Someone testing you will spot a guess.", body: "When a question is meant to test you, a confident guess is the riskiest answer. Say plainly what you don’t know, give the part you do, and say how you’ll find out. Others judge a small admission more kindly than you judge yourself.", instead: "“Er, yes, about thirty per cent, roughly, I think.”", tryThis: "“I don’t have that figure. What I do know is it’s rising. I’ll send it to you tomorrow.”" }, practice: { mode: "response", promptId: "p038", goal: "Picture them asking something you don’t know. Say so plainly, give what you do know, and say how you’ll find out.", tries: 2, measure: "fillers" } },
        // Owning a slip someone catches
        { id: "tq-unknown-2", title: "Caught out? Own it", learn: { headline: "If they catch a mistake, own it, then fix it.", body: "Sometimes the tough question is right: your figure was wrong. Don’t defend it. Say “You’re right”, give the right one, and carry on. Owning it and putting it right matter most when you’ve slipped.", card: "hard-apology" }, see: { model: { question: "“That can’t be right. Didn’t you say it took two weeks?”", answer: "You’re right, I said two weeks. It was three. The extra week was testing, and it’s why the launch went smoothly.", highlight: "You’re right, I said two weeks. It was three.", notice: "It owns the slip in one line, corrects it, and moves on." } }, practice: { mode: "response", promptId: "p021", goal: "Halfway through, correct one detail out loud (“Actually, it’s twenty minutes, not ten”), then carry on calmly.", tries: 1, measure: "fillers" } },
      ],
    },
    // Lesson 5
    {
      id: "short",
      title: "Short, then stop",
      blurb: "Answer it, hand it back, and let the silence be.",
      parts: [
        // A short answer instead of a long defence
        { id: "tq-short-1", title: "Answer, then stop", learn: { headline: "A short answer sounds sure. A long defence doesn’t.", body: "When a question stings, the urge is to keep explaining until it feels safe. A long defence fills up with the hedges and hesitations that make a speaker sound less sure. Your nerves show far less than you think, so answer in two or three sentences, then stop.", instead: "“Well, it’s complicated, because, I mean, there were lots of reasons, and also…”", tryThis: "“It took longer because we added testing. It was worth it: the launch went smoothly.”", card: "nerves-show" }, practice: { mode: "talk", promptId: "t001", goal: "Answer in two or three sentences, then stop.", tries: 2, measure: "length" } },
        // Handing the turn back
        { id: "tq-short-2", title: "Hand it back", learn: { headline: "Stop, and let the silence work.", body: "After your answer, hand it back: “Does that answer it?”, or a nod to the next person. The pause after your last line feels long to you and sounds like a full stop to them. You don’t need to fill it.", card: "nerves-silence" }, practice: { mode: "talk", promptId: "t029", goal: "Answer briefly, then hand it back with “Does that answer it?” and stop.", tries: 1, measure: "length" } },
        // Everything on one question with an edge
        { id: "tq-short-3", title: "The run", learn: { headline: "Say it back, answer the doubt, then stop.", body: "Now everything on one question with an edge. Say it back calmly, answer the worry under it, agree with anything fair, then stop. Then do it again: the second go is usually calmer." }, practice: { mode: "response", promptId: "p032", goal: "Picture someone asking “Wouldn’t that just annoy people?” Say it back, answer the worry, then stop.", tries: 2, measure: "length" } },
      ],
    },
  ],
};
