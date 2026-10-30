// Listen like you mean it (decision 155): a second course for small talk and conversations, for someone who waits for their turn to talk, or jumps to advice. Built on the charisma deep dive (responsiveness: understood, validated, cared for; follow-up questions, Huang et al. 2017; perceived listening, Kluger et al. 2024; advice versus listening, Weger et al. 2014; paraphrasing alone is mixed, Weger et al. 2010; fast replies follow listening, Templeton et al. 2022), the earlier conversation note (listeners as co-narrators, Bavelas et al. 2000; support versus shift, Derber) and the Scenes and Active listening plan. It goes deeper than Beyond “good, you?”'s "Listen out loud" lesson, on prompts that course does not use

// Load the course type
import type { Course } from "@/content/courses";

// The course
export const LISTEN_LIKE_YOU_MEAN_IT: Course = {
  id: "listen-like-you-mean-it",
  focus: "conversation",
  title: "Listen like you mean it",
  blurb: "Stop waiting for your turn. Hear them, and let them know it.",
  outcomes: ["React to the moment in their story, not with “mm-hmm”", "Say back how it felt for them, not just what happened", "Stay on their story instead of jumping to yours", "Hold the advice until it’s asked for", "Ask about the part that mattered to them"],
  draft: false,
  lessons: [
    // Lesson 1
    {
      id: "moment",
      title: "React to the moment",
      blurb: "Catch the moment that mattered, and say so.",
      parts: [
        // A specific reaction, not a general one
        { id: "ll-moment-1", title: "Specific beats “mm-hmm”", learn: { headline: "React to the moment, not the story in general.", body: "“Mm-hmm” and a nod help a little. A reaction to one exact moment (“She posted it back?”) helps far more: storytellers tell it better when you do. Pick the moment that surprised you, and react to that.", instead: "“Mm-hmm. Oh, nice.”", tryThis: "“Wait, she posted it back to you? With a note?”", card: "talk-co-narrators" }, practice: { mode: "smalltalk", promptId: "sll1", goal: "React to one exact moment in their story, in their words.", tries: 2, measure: "fillers" } },
        // Listening instead of rehearsing
        { id: "ll-moment-2", title: "Stop planning your line", learn: { headline: "Listen to the end. Your reply will come.", body: "While they talk, it’s tempting to rehearse what you’ll say next. Conversations that click have quick replies, but the gaps are far too short to plan: the speed comes from listening closely. Let the story finish, then react to where it turned.", card: "warm-fast-replies", link: { href: "/listening", label: "Hear a story once, then answer, in Active listening" } }, practice: { mode: "smalltalk", promptId: "sls08", goal: "Listen to the end without planning, then react to the moment it turned.", tries: 1, measure: "fillers" } },
      ],
    },
    // Lesson 2
    {
      id: "feeling",
      title: "Their words, their feeling",
      blurb: "Say back how it felt, not just what happened.",
      parts: [
        // The feeling, not the facts
        { id: "ll-feeling-1", title: "The feeling, not the facts", learn: { headline: "Say back the feeling, not just the facts.", body: "Repeating someone’s facts back to them can sound like a technique, and on its own it doesn’t make people feel understood. What helps is showing you got how it felt. Take one of their words, then name the feeling under it.", instead: "“So you walked the last mile.”", tryThis: "“A mile from the end, after all that training? That must have stung.”", card: "talk-paraphrase" }, practice: { mode: "smalltalk", promptId: "sll2", goal: "Use one of their words, then say how it must have felt.", tries: 2, measure: "fillers" } },
        // A guess they can correct
        { id: "ll-feeling-2", title: "Check, don’t tell", learn: { headline: "Name the feeling as a guess.", body: "You can’t know exactly how they feel, so offer it lightly: “That sounds…”, “I’d guess you were…”. If you’re a little off, they’ll put you right, and that still shows you were listening. Some stories hold two feelings at once; you can name both.", instead: "“You must feel awful.”", tryThis: "“It sounds like it meant a lot to her, and you’re still kicking yourself a bit.”", card: "warm-responsive" }, see: { model: { question: "“I finally called my grandmother. She talked for an hour about her garden, and said it was the best part of her week. I felt terrible for waiting so long.”", answer: "An hour about her garden! It sounds like it meant a lot to her, and like you’re still kicking yourself a bit. Are you going to make it a regular thing?", highlight: "It sounds like it meant a lot to her, and like you’re still kicking yourself a bit.", notice: "Two feelings, both offered as a guess, then a question about what’s next for them." } }, practice: { mode: "smalltalk", promptId: "sls02", goal: "Offer the feeling as a guess (“That sounds…”), then ask one question.", tries: 1, measure: "fillers" } },
      ],
    },
    // Lesson 3
    {
      id: "stay",
      title: "Stay on their story",
      blurb: "No “same thing happened to me”. Not yet.",
      parts: [
        // Support, not shift
        { id: "ll-stay-1", title: "Support, don’t shift", learn: { headline: "Keep the spotlight on them.", body: "“That happened to me too” feels like connecting, but it moves the story to you. A support reply stays with them: it asks what happened next, or how it ended. Shifts are far more common than supports, so most of us have to catch ourselves.", instead: "“Oh, I got lost once too, in the hills.”", tryThis: "“After dark? How did you find your way back?”", card: "talk-support" }, practice: { mode: "smalltalk", promptId: "sll3", goal: "Stay on their story: no “me too”, just a question about theirs.", tries: 2, measure: "fillers" } },
        // Good news belongs to them
        { id: "ll-stay-2", title: "Their news, not yours", learn: { headline: "Don’t top their good news.", body: "When someone shares a win, “Same, I…” takes the spotlight just as they step into it. Stay with their news for a few turns: react, then ask about the moment it happened.", instead: "“Congrats! I ran one last year, actually.”", tryThis: "“You finished! What was the last mile like?”", card: "warm-good-news" }, practice: { mode: "smalltalk", promptId: "snl3", goal: "React to their news and ask about it. No story of your own.", tries: 1, measure: "fillers" } },
        // Sharing later, the same size
        { id: "ll-stay-3", title: "Your story can wait", learn: { headline: "Share later, and keep it the same size.", body: "Sharing your own side isn’t wrong: opening up is half of how people get closer. The trick is the order. Stay with their story first, and when you do share, keep it shorter than theirs and hand it straight back.", tryThis: "“I’d have frozen too. Did you say anything to her in the end?”", card: "warm-share" }, practice: { mode: "smalltalk", promptId: "sls06", goal: "Ask about their story first; if you share, keep it to one line and hand it back.", tries: 1, measure: "fillers" } },
      ],
    },
    // Lesson 4
    {
      id: "advice",
      title: "Hold the advice",
      blurb: "Understood first. Fixes only when asked.",
      parts: [
        // Listening before fixing
        { id: "ll-advice-1", title: "Hold the fix", learn: { headline: "Understood first. Advice can wait.", body: "When someone shares a problem, a fix feels like the kind thing to give. But in a study comparing the two, being listened to made people feel more understood than being given advice. Show you got it, then ask a question about them.", instead: "“Have you tried applying somewhere else? There are loads of courses.”", tryThis: "“Oh no, after all that work on the application? How are you feeling about it?”", card: "warm-advice" }, practice: { mode: "smalltalk", promptId: "snl2", goal: "Show you understood and ask one question. No advice.", tries: 2, measure: "fillers" } },
        // No silver lining
        { id: "ll-advice-2", title: "No “at least”", learn: { headline: "Skip the silver lining.", body: "“At least you…” is meant to cheer them up, but it quietly says their feeling is too big. Feeling heard means feeling that your reaction makes sense. Say that it does, and let the bright side be theirs to find.", instead: "“At least there’s always next year.”", tryThis: "“After all those months of training? Of course you’re gutted.”", card: "warm-responsive" }, practice: { mode: "smalltalk", promptId: "sn10", goal: "Say why it makes sense to feel that way. No “at least”.", tries: 1, measure: "fillers" } },
        // Asking what would help
        { id: "ll-advice-3", title: "Ask before you advise", learn: { headline: "Not sure what they want? Ask.", body: "Sometimes people do want ideas. Instead of guessing, show you heard them, then ask: “Do you want ideas, or do you just need to let it out?” Either answer helps, and the choice stays theirs.", link: { href: "/scenes", label: "Try holding the advice in a conversation, in Scenes" } }, see: { model: { question: "“I failed my driving test again.”", answer: "Oh no, again? That’s so frustrating when you’ve put the hours in. Do you want to talk it through, or would a distraction be better right now?", highlight: "Do you want to talk it through, or would a distraction be better right now?", notice: "It names the feeling first, then lets them choose what kind of help they want." } }, practice: { mode: "smalltalk", promptId: "sn06", goal: "Show you heard it, then ask what would help: ideas, or an ear.", tries: 1, measure: "fillers" } },
      ],
    },
    // Lesson 5
    {
      id: "matter",
      title: "Ask about what mattered",
      blurb: "The best question goes to the heart of it.",
      parts: [
        // The heart of the story
        { id: "ll-matter-1", title: "Find the heart of it", learn: { headline: "Ask about the part that mattered to them.", body: "Most stories have one part the teller cares about, and plenty of side facts. People who ask follow-up questions are liked more, and the best follow-up goes to that part, not to a side fact. Listen for where their voice changed.", instead: "“What was the presentation about?”", tryThis: "“Three people came up to you? How did that feel after no sleep?”", card: "talk-follow-ups", link: { href: "/listening", label: "Practise hearing what mattered, in Active listening" } }, practice: { mode: "smalltalk", promptId: "sls04", goal: "Ask one open question about the part that mattered most to them.", tries: 2, measure: "fillers" } },
        // What sits under the words
        { id: "ll-matter-2", title: "What they didn’t say", learn: { headline: "Sometimes it’s in how they say it.", body: "“It’s been a lot” is a door left a little open. Treat it as a question, not an answer: notice it, and ask gently about that part. If they don’t want to go there, they’ll steer away, and that’s fine.", tryThis: "“That sounds like a hard week. How are you doing with it all?”" }, practice: { mode: "smalltalk", promptId: "sn08", goal: "Ask gently about the part that sounds heaviest.", tries: 1, measure: "fillers" } },
        // Everything at once
        { id: "ll-matter-3", title: "All together", learn: { headline: "React, their feeling, stay, ask.", body: "Put it together: react to the moment, say back how it felt, stay on their story, and ask about what mattered. No advice, no “me too”. Then try it in a whole conversation, where every reply changes how they answer.", link: { href: "/scenes", label: "Then have a conversation in Scenes" } }, practice: { mode: "smalltalk", promptId: "sls01", goal: "React, name the feeling, and ask about what mattered. Nothing about you.", tries: 2, measure: "fillers" } },
      ],
    },
  ],
};
