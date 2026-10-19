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
  // 11. Disagreeing (decision 72: scenarios 11 to 25 go with the cards added in decision 71)
  {
    id: "sc-launch-date", move: "disagree", title: "The launch date",
    situation: "In a team meeting, Marcus says: “We should push the launch back a month. We're not ready.” You think waiting would cost you the busy season.",
    options: [
      { text: "“No, that's way too cautious. Obviously we launch now.”", tier: "misstep", pattern: "Flat contradiction", why: "“Obviously” tells Marcus his view isn't worth thinking about. People dig in when they feel dismissed." },
      { text: "“I see why you'd want more time, the bugs list is long. I think launching now still works, because the busy season starts in three weeks.”", tier: "best", pattern: "Acknowledge, hedge, then your view", why: "It shows you heard his reason, says “I think” instead of “obviously”, and gives yours. Receptive language like this kept disagreements from turning hostile." },
      { text: "“Sure, whatever the team thinks.”", tier: "flat", pattern: "Going along", why: "It avoids the fight but hides a real concern the team needs to hear." },
    ],
    principle: "Show you understood their view before giving yours.", sayIt: "Reply to Marcus in your own words: what you understand of his view, then yours.",
  },
  // 12. Apologising
  {
    id: "sc-missed-deadline", move: "apology", title: "The missed deadline",
    situation: "You promised your colleague Aisha the figures by Tuesday. It's Thursday, and she had to stall her client. She says: “I really needed those.”",
    options: [
      { text: "“Sorry, it's been a crazy week, everything landed at once.”", tier: "flat", pattern: "Sorry plus excuse", why: "The reason may be true, but it takes the focus off what it cost her." },
      { text: "“I'm sorry if that caused problems.”", tier: "misstep", pattern: "Conditional apology", why: "“If” makes it sound like you're not sure there was a problem. It doesn't own anything." },
      { text: "“You're right, I said Tuesday and didn't deliver. That's on me. I'll have them to you by noon, and I'll call your client with you if it helps.”", tier: "best", pattern: "Own it, then fix it", why: "Taking responsibility and offering to repair were the two parts of an apology that mattered most." },
    ],
    principle: "Own what you did, then offer to make it right.", sayIt: "Apologise to Aisha in your own words: what you did, that it's on you, and how you'll fix it.",
  },
  // 13. Asking for help
  {
    id: "sc-moving-day", move: "ask-directly", title: "Moving day",
    situation: "You're moving flat on Saturday and need one more pair of hands for two hours. Your neighbour Ben is friendly but you don't know him well.",
    options: [
      { text: "Don't ask. He'll probably say no, and it would be awkward.", tier: "misstep", pattern: "Assuming no", why: "People underestimate how often others say yes to a direct request; in one study, about every other stranger agreed." },
      { text: "“Ben, could you help me carry a sofa down on Saturday, around ten? It'd take about an hour. Totally fine if you can't.”", tier: "best", pattern: "Direct, specific, easy to refuse", why: "It says exactly what, when and how long, and leaves an easy way out. Specific requests are easier to say yes to." },
      { text: "“If you're ever free at some point, I might need a hand with something.”", tier: "flat", pattern: "Vague hint", why: "Too vague to answer. He can't say yes to something he doesn't know." },
    ],
    principle: "Ask directly and specifically; people say yes more than you expect.", sayIt: "Ask Ben for help in your own words: what, when, and how long.",
  },
  // 14. Asking for advice
  {
    id: "sc-new-role", move: "ask-advice", title: "The new role",
    situation: "You've just been asked to run your first team meeting. Your colleague Rosa has run them for years and is great at keeping them short.",
    options: [
      { text: "“Rosa, your meetings always finish on time. How do you stop them running over?”", tier: "best", pattern: "Specific advice from the right person", why: "Asking advice on a hard task from someone skilled made the asker seem more competent, not less." },
      { text: "Figure it out alone so she doesn't think you're out of your depth.", tier: "flat", pattern: "Going it alone", why: "The fear of looking weak is mostly in your head, and you miss what she knows." },
      { text: "“Any tips? I have no idea what I'm doing, honestly.”", tier: "good", pattern: "Open ask", why: "Asking is good. A specific question gets a more useful answer, and you don't need to run yourself down." },
    ],
    principle: "Ask a skilled person a specific question; it makes you look more capable.", sayIt: "Ask Rosa for advice in your own words, with one specific question.",
  },
  // 15. Sharing a win
  {
    id: "sc-promotion", move: "share-win", title: "The promotion",
    situation: "You just got promoted. At dinner, your friend Kai asks: “So what's new with you?”",
    options: [
      { text: "“Ugh, so exhausted, they've promoted me again and now I have to manage people.”", tier: "misstep", pattern: "Humblebrag", why: "Bragging hidden in a complaint was liked less than plain bragging, and less than plain complaining." },
      { text: "“Not much, same old.”", tier: "flat", pattern: "Hiding it", why: "It closes the door on good news a friend would want to share." },
      { text: "“Actually, I got promoted! I'm really pleased. My manager pushed for it, which meant a lot.”", tier: "best", pattern: "Plain good news, with thanks", why: "Say it plainly and give credit. People respect honesty more than fake modesty." },
    ],
    principle: "Share good news plainly, and thank anyone who helped.", sayIt: "Tell Kai your news in your own words, plainly.",
  },
  // 16. A question in Q&A
  {
    id: "sc-qa-pricing", move: "repeat-question", title: "The pricing question",
    situation: "After your talk, someone at the back asks a long question that ends: “…so basically, why would anyone pay for this when the free version exists?”",
    options: [
      { text: "“Great question. So, our roadmap for next year includes…”", tier: "misstep", pattern: "Answering a different question", why: "Most listeners wouldn't notice the dodge, but the person who asked will, and it costs trust." },
      { text: "“So the question is: why pay when there's a free version? Because the paid one saves about five hours a week. For a team, that's a day back each week.”", tier: "best", pattern: "Repeat it, then answer it", why: "Repeating helps the room, who may not have heard, and answering in the first sentence shows you're not dodging." },
      { text: "“Good point. There are lots of reasons, it depends really.”", tier: "flat", pattern: "Vague answer", why: "It sounds like you don't have an answer." },
    ],
    principle: "Say the question back, then answer it in your first sentence.", sayIt: "Repeat the question in a few words, then answer it.",
  },
  // 17. Answering the objection
  {
    id: "sc-budget-ask", move: "answer-objection", title: "The budget ask",
    situation: "You're asking your manager for budget for a training course. You know her first worry will be the cost in a tight year.",
    options: [
      { text: "List every benefit of the course and leave cost out.", tier: "flat", pattern: "One side only", why: "She'll think of the cost anyway, and wonder why you didn't." },
      { text: "“I know money's tight this year. Here's why I think it pays back: the course covers the reporting tool we're struggling with, which costs us hours every week.”", tier: "best", pattern: "Name the objection, then answer it", why: "Messages that raised the main objection and answered it persuaded most." },
      { text: "“I know it's expensive and the timing's bad, but I'd really like to go.”", tier: "misstep", pattern: "Objection with no answer", why: "Raising a doubt without answering it did worse than not raising it at all." },
    ],
    principle: "Name their main worry, then answer it.", sayIt: "Make your case in your own words: name her worry, then answer it.",
  },
  // 18. Their values
  {
    id: "sc-walking-meetings", move: "their-values", title: "Walking meetings",
    situation: "You want your team to try walking meetings. Your manager Dev cares most about getting decisions made quickly; wellbeing talk leaves him cold.",
    options: [
      { text: "“It's so much better for our health and stress levels.”", tier: "flat", pattern: "Your values", why: "True, but it's your reason, not his. People rarely argue from the other side's values." },
      { text: "“Walking meetings tend to be shorter and end with a decision. Could we try it for our weekly check-in?”", tier: "best", pattern: "Framed in their values", why: "The same idea, framed in what Dev cares about, is far more likely to land." },
      { text: "“Everyone's doing it now, we're behind.”", tier: "flat", pattern: "Pressure", why: "Pressure invites pushback, and it doesn't speak to what he cares about." },
    ],
    principle: "Make your case in what they care about, not what you do.", sayIt: "Pitch the idea to Dev in your own words, in his terms.",
  },
  // 19. A charged topic
  {
    id: "sc-charged-topic", move: "swap-stories", title: "The charged topic",
    situation: "At a family dinner, your uncle says something sharp about a topic you see very differently. Everyone goes quiet.",
    options: [
      { text: "Lay out the facts that prove him wrong.", tier: "misstep", pattern: "Win the argument", why: "People rarely change their minds by losing an argument. They dig in." },
      { text: "“That's interesting. Has something happened to you that made you feel that way?”", tier: "best", pattern: "Ask for their story, then listen", why: "Listening without judging and swapping personal stories changed views for months in field experiments." },
      { text: "Change the subject quickly.", tier: "flat", pattern: "Avoid it", why: "Keeps the peace for now, but nothing moves." },
    ],
    principle: "Ask about their experience and listen, before sharing yours.", sayIt: "Ask your uncle about his experience, in your own words.",
  },
  // 20. Reading the room
  {
    id: "sc-losing-room", move: "read-room", title: "Losing the room",
    situation: "Ten minutes into your update, people start shifting in their seats and two have their phones out.",
    options: [
      { text: "Speed up to get through the rest of the slides.", tier: "misstep", pattern: "Push on faster", why: "Rushing loses even the people still listening." },
      { text: "Stop, and ask: “Before I go on, which of these matters most to you?”", tier: "best", pattern: "Change something", why: "Fidgeting rises as attention drops. A question, a story or a pause resets the room." },
      { text: "Carry on exactly as planned.", tier: "flat", pattern: "Ignore the signs", why: "The room has told you something; ignoring it rarely ends well." },
      { text: "Skip to your one key point, then take questions.", tier: "good", pattern: "Cut to the point", why: "Good: shorter wins attention back. Asking them first would tell you which point matters." },
    ],
    principle: "When the room drifts, change something: ask, tell a story, or pause.", sayIt: "Say what you would say to bring the room back.",
  },
  // 21. Looking away
  {
    id: "sc-looks-away", move: "wait-thinking", title: "The pause",
    situation: "You ask your new colleague Sam what they'd change about the onboarding. Sam looks away at the window and says nothing for a few seconds.",
    options: [
      { text: "“Sorry, that's a weird question, never mind.”", tier: "misstep", pattern: "Filling the silence", why: "Looking away usually means thinking. Jumping in takes away the answer." },
      { text: "Wait, and let Sam think.", tier: "best", pattern: "Wait", why: "People look away more as a question gets harder, and it helps them answer." },
      { text: "“You don't have to answer if you don't want to.”", tier: "flat", pattern: "Offering an out", why: "Kind, but it may read as doubting their answer is coming." },
    ],
    principle: "When someone looks away to think, wait.", sayIt: "Say how you'd ask Sam the question, then imagine the pause and stay quiet for three seconds.",
  },
  // 22. Thanking a mentor
  {
    id: "sc-old-teacher", move: "thanks", title: "The old teacher",
    situation: "A teacher who pushed you hard at school comes to mind. You've thought about writing to say thanks, but it feels awkward after so many years.",
    options: [
      { text: "Don't write. They won't remember you.", tier: "misstep", pattern: "Assuming it's awkward", why: "Readers of thank-you notes felt far more positive and less awkward than writers expected." },
      { text: "“Thank you for pushing me in Year 10. I became an engineer partly because you wouldn't let me give up on maths.”", tier: "best", pattern: "Thanks with a reason", why: "Specific, and it says what it changed. The warmth matters more than finding perfect words." },
      { text: "“Just wanted to say thanks for everything!”", tier: "good", pattern: "Simple thanks", why: "Good: sent beats unsent. One specific detail would make it land even better." },
    ],
    principle: "Send the thanks; one specific reason is all it needs.", sayIt: "Say your thank-you message out loud, with one specific reason.",
  },
  // 23. Checking it landed
  {
    id: "sc-new-tool", move: "check-landed", title: "The new tool",
    situation: "You've just explained the new booking system to your team in five minutes. It feels obvious to you now.",
    options: [
      { text: "“Any questions?” Then move on when nobody answers.", tier: "flat", pattern: "Any questions?", why: "Silence rarely means understanding. People don't like to be the one who didn't get it." },
      { text: "“Great, so that's all clear.”", tier: "misstep", pattern: "Assuming it landed", why: "What's obvious to you often isn't to them: tappers expected half their songs to be named; listeners got 3 in 120." },
      { text: "“Quick check: what's the first thing you'd click to book a room?”", tier: "best", pattern: "Check it landed", why: "Asking them to use it shows you what landed and what didn't." },
    ],
    principle: "Don't assume it landed; check with a quick question.", sayIt: "Ask the team a quick question that checks they got it.",
  },
  // 24. Three reasons
  {
    id: "sc-new-laptop", move: "three-reasons", title: "Six reasons",
    situation: "You're asking IT for a new laptop. You've got six reasons written down.",
    options: [
      { text: "Give all six, so they can't say no.", tier: "misstep", pattern: "Every reason", why: "Past three claims, people grew sceptical of all of them." },
      { text: "Give the three strongest, and stop.", tier: "best", pattern: "Three, then stop", why: "Three good claims persuaded most; a fourth made people doubt." },
      { text: "Give just one, the strongest.", tier: "good", pattern: "One strong reason", why: "Clear and honest. Up to three strong reasons tends to persuade a little more." },
    ],
    principle: "Pick your three strongest reasons and leave the rest out.", sayIt: "Make the case for the laptop out loud in three reasons.",
  },
  // 25. Before you speak
  {
    id: "sc-before-toast", move: "own-name", title: "Before the toast",
    situation: "You're about to give a toast at your friend's wedding. Your heart is racing as they hand you the microphone.",
    options: [
      { text: "Think: “I'm going to mess this up.”", tier: "misstep", pattern: "Catastrophising", why: "It feeds the fear just when you need your head clear." },
      { text: "Tell yourself silently: “[Your name], you've got this. Breathe, then first line.”", tier: "best", pattern: "Self-talk by name", why: "Talking to yourself by name lowered anxiety and led to better-rated speeches." },
      { text: "Tell yourself: “Calm down, calm down.”", tier: "flat", pattern: "Telling yourself to calm down", why: "It rarely works with a racing heart. Coaching yourself like a friend works better." },
    ],
    principle: "Coach yourself by name, like you would a friend.", sayIt: "Say your line to yourself, out loud once, with your name.",
  },
];

// A scenario by id
export function findScenario(id: string): Scenario | undefined {
  // Looked up
  return SCENARIOS.find((scenario) => scenario.id === id);
}
