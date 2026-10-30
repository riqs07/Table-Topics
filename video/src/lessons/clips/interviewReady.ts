// Interview ready's lesson clips (decision 155): one per lesson, played in the lesson's first part

// Load the clip type
import type { LessonClipDef } from "../types";

// The clips, in lesson order
export const INTERVIEW_READY_CLIPS: ReadonlyArray<LessonClipDef> = [
  // Lesson 1, Tell me about yourself: one moment instead of the CV, with the blob's own radio
  {
    id: "interview-ready-yourself",
    partId: "ir-yourself-1",
    label: "Interview ready · Lesson 1",
    tile: "tell-me-about-yourself",
    title: "One moment, not your CV",
    lines: [
      { text: "“So, tell me about yourself.”", mood: "wow", tag: "[curious]" },
      { text: "And out comes the whole CV.", mood: "worried", tag: "[playful]" },
      { text: "School, first job, second job, and on, and on.", mood: "worried" },
      { text: "They already have your CV.", mood: "ready", tag: "[warm]" },
      { text: "What they don’t have is you.", mood: "ready" },
      { text: "So start from one moment.", mood: "happy", tag: "[confident]" },
      { text: "One moment that shows what you care about.", mood: "ready" },
      { text: "Then link it to what you do now.", mood: "ready" },
      { text: "Here’s mine.", mood: "happy", tag: "[cheerful]" },
      { text: "When I was nine, I fixed my gran’s radio with a hairpin.", mood: "ready" },
      { text: "I loved finding out why it had stopped.", mood: "happy" },
      { text: "Now I fix things for a living.", mood: "happy", tag: "[confident]" },
      { text: "One moment. Then now.", mood: "ready", tag: "[warm]" },
      { text: "Try it with a moment of your own.", mood: "happy", tag: "[cheerful]" },
    ],
    beats: [
      // The question, and the whole CV
      { from: 0, to: 2, ground: "art-sky", visual: { kind: "struck", text: "MY WHOLE CV" } },
      // The lesson's name
      { from: 3, to: 5, ground: "art-plum", visual: { kind: "tile" } },
      // What to do
      { from: 6, to: 7, ground: "art-leaf", visual: { kind: "steps", items: [{ label: "One moment", at: 6 }, { label: "Link it to now", at: 7 }] } },
      // The blob's own moment
      { from: 8, to: 11, ground: "art-bloom", visual: { kind: "example", title: "My moment", quote: "“I fixed my gran’s radio. Now I fix things for a living.”" } },
      // One moment, then now
      { from: 12, to: 13, ground: "art-coral", visual: { kind: "bubble", text: "now" } },
    ],
    close: { heading: "Tell me about yourself", items: [{ sign: "1", label: "One moment" }, { sign: "2", label: "What it showed" }, { sign: "3", label: "Link it to now" }], action: "Find your moment tonight" },
  },
  // Lesson 2, The STAR answer: four beats, most of the time on action and result, with the blob's own kitchen rota
  {
    id: "interview-ready-star",
    partId: "ir-star-1",
    label: "Interview ready · Lesson 2",
    tile: "star-answer",
    title: "Situation, task, action, result",
    lines: [
      { text: "“Tell me about a time when…”", mood: "up", tag: "[curious]" },
      { text: "That’s an invitation to tell a story.", mood: "ready", tag: "[warm]" },
      { text: "But many answers drown in the set-up.", mood: "worried", tag: "[thoughtful]" },
      { text: "Use four beats instead.", mood: "ready", tag: "[confident]" },
      { text: "Situation.", mood: "ready" },
      { text: "Task.", mood: "ready" },
      { text: "Action.", mood: "ready" },
      { text: "Result.", mood: "happy" },
      { text: "Keep the first two short. Spend your time on the last two.", mood: "ready" },
      { text: "Here’s mine.", mood: "happy", tag: "[cheerful]" },
      { text: "The shared kitchen at work was always a mess.", mood: "worried" },
      { text: "I offered to sort it out.", mood: "ready" },
      { text: "I made a simple rota, and put it on the fridge.", mood: "ready" },
      { text: "A month later, no more dirty mugs.", mood: "happy" },
      { text: "Four beats. Most of it on what I did.", mood: "happy", tag: "[warm]" },
      { text: "Try it on your next story.", mood: "happy", tag: "[cheerful]" },
    ],
    beats: [
      // The question
      { from: 0, to: 1, ground: "art-sky", visual: { kind: "bubble", text: "?" } },
      // The lesson's name
      { from: 2, to: 3, ground: "art-coral", visual: { kind: "tile" } },
      // The four beats
      { from: 4, to: 8, ground: "art-leaf", visual: { kind: "steps", items: [{ label: "Situation", at: 4 }, { label: "Task", at: 5 }, { label: "Action", at: 6 }, { label: "Result", at: 7 }] } },
      // The blob's own answer
      { from: 9, to: 13, ground: "art-bloom", visual: { kind: "example", title: "My answer", quote: "“I made a rota. A month later, no more dirty mugs.”" } },
      // Most of it on action and result
      { from: 14, to: 15, ground: "art-sun", visual: { kind: "bubble", text: "A + R" } },
    ],
    close: { heading: "The STAR answer", items: [{ sign: "1", label: "A short set-up" }, { sign: "2", label: "What you did" }, { sign: "3", label: "The result" }], action: "Tell one story as STAR" },
  },
  // Lesson 3, Own it: "I" as well as "we", and a number, with the blob's own bake sale
  {
    id: "interview-ready-own",
    partId: "ir-own-1",
    label: "Interview ready · Lesson 3",
    tile: "own-it",
    title: "Say “I”",
    lines: [
      { text: "Listen to a lot of interview answers.", mood: "ready", tag: "[curious]" },
      { text: "“We did this. We decided that. We fixed it.”", mood: "worried", tag: "[playful]" },
      { text: "Great team. But what did you do?", mood: "up", tag: "[thoughtful]" },
      { text: "They’re hiring you, not the team.", mood: "ready", tag: "[warm]" },
      { text: "So give the team its credit, in a line.", mood: "ready" },
      { text: "Then say “I”.", mood: "happy", tag: "[confident]" },
      { text: "And give a number if you can.", mood: "ready" },
      { text: "Here’s mine.", mood: "happy", tag: "[cheerful]" },
      { text: "Our team ran a bake sale for the local school.", mood: "ready" },
      { text: "I made the sign-up sheet, and asked twenty neighbours.", mood: "ready" },
      { text: "We raised three hundred pounds.", mood: "happy" },
      { text: "The team did it. I did my part, and I said so.", mood: "happy" },
      { text: "Count your “we”s next time.", mood: "ready", tag: "[warm]" },
      { text: "And swap one for an “I”.", mood: "happy", tag: "[cheerful]" },
    ],
    beats: [
      // We, we, we
      { from: 0, to: 2, ground: "art-sky", visual: { kind: "struck", text: "WE, WE, WE" } },
      // The team's credit, then "I"
      { from: 3, to: 5, ground: "art-sun", visual: { kind: "contrast", instead: "“We looked at it, and we decided to change it.”", tryThis: "“The team agreed. I pulled the numbers and wrote the plan.”", tryAt: 5 } },
      // The lesson's name
      { from: 6, to: 6, ground: "art-leaf", visual: { kind: "tile" } },
      // The blob's own part
      { from: 7, to: 11, ground: "art-bloom", visual: { kind: "example", title: "My part", quote: "“I asked twenty neighbours. We raised £300.”" } },
      // One "I"
      { from: 12, to: 13, ground: "art-plum", visual: { kind: "bubble", text: "I" } },
    ],
    close: { heading: "Own it", items: [{ sign: "I", label: "What you did" }, { sign: "#", label: "A number" }], action: "Swap one “we” for an “I”" },
  },
  // Lesson 4, The hard one: a real mistake, told as what changed, with the blob's own wrong meeting time
  {
    id: "interview-ready-hard",
    partId: "ir-hard-1",
    label: "Interview ready · Lesson 4",
    tile: "the-hard-one",
    title: "A real one",
    lines: [
      { text: "“Tell me about a mistake you made.”", mood: "wow", tag: "[curious]" },
      { text: "The tempting answer?", mood: "ready", tag: "[playful]" },
      { text: "“I’m just too much of a perfectionist.”", mood: "worried" },
      { text: "They’ve heard that one a hundred times.", mood: "ready", tag: "[thoughtful]" },
      { text: "The question checks two things.", mood: "ready" },
      { text: "Are you honest? And do you learn?", mood: "up" },
      { text: "So pick a real mistake, small enough to tell calmly.", mood: "closed", tag: "[calm]" },
      { text: "Say it in one line. Spend the rest on the fix.", mood: "ready" },
      { text: "Here’s mine.", mood: "happy", tag: "[cheerful]" },
      { text: "I once sent a whole team the wrong meeting time.", mood: "worried" },
      { text: "I owned up within the hour, and sent the right one.", mood: "ready" },
      { text: "Now I check every invite before I press send.", mood: "happy", tag: "[confident]" },
      { text: "Owning it usually lands better than you fear.", mood: "happy", tag: "[warm]" },
      { text: "Find one real mistake, and what changed.", mood: "happy" },
    ],
    beats: [
      // The tempting answer
      { from: 0, to: 3, ground: "art-sky", visual: { kind: "struck", text: "PERFECTIONIST" } },
      // What the question checks
      { from: 4, to: 5, ground: "art-plum", visual: { kind: "cards", items: [{ sign: "1", label: "Are you honest?", at: 4 }, { sign: "2", label: "Do you learn?", at: 5 }] } },
      // The lesson's name
      { from: 6, to: 7, ground: "art-sun", visual: { kind: "tile" } },
      // The blob's own mistake
      { from: 8, to: 11, ground: "art-bloom", visual: { kind: "example", title: "My mistake", quote: "“The wrong time, once. Now I check every invite.”" } },
      // What changed
      { from: 12, to: 13, ground: "art-coral", visual: { kind: "bubble", text: "now" } },
    ],
    close: { heading: "The hard one", items: [{ sign: "1", label: "A real mistake" }, { sign: "2", label: "What you did" }, { sign: "tick", label: "What you do now" }], action: "Pick one real mistake to tell" },
  },
  // Lesson 5, Your close: why this role, as one reason with a moment behind it, with the blob's own street fair
  {
    id: "interview-ready-close",
    partId: "ir-close-1",
    label: "Interview ready · Lesson 5",
    tile: "your-close",
    title: "Why this role",
    lines: [
      { text: "“So, why do you want this job?”", mood: "up", tag: "[curious]" },
      { text: "It’s easy to answer with flattery.", mood: "ready", tag: "[playful]" },
      { text: "“It’s a great company, and I love what you do.”", mood: "worried" },
      { text: "Nice. But anyone could say it.", mood: "ready", tag: "[thoughtful]" },
      { text: "They want to know who you are, and why you’re here.", mood: "ready", tag: "[warm]" },
      { text: "So name one thing about the job that matches what you care about.", mood: "ready" },
      { text: "Then bring back a moment as proof.", mood: "happy", tag: "[confident]" },
      { text: "Here’s mine.", mood: "happy", tag: "[cheerful]" },
      { text: "A job came up, planning events for a library.", mood: "ready" },
      { text: "I told them I’d run my street’s summer fair for three years.", mood: "ready" },
      { text: "And that my favourite part was seeing new faces turn up.", mood: "happy" },
      { text: "One reason. One moment.", mood: "happy", tag: "[warm]" },
      { text: "Write down your one reason tonight.", mood: "happy", tag: "[cheerful]" },
    ],
    beats: [
      // The question
      { from: 0, to: 1, ground: "art-sky", visual: { kind: "bubble", text: "why?" } },
      // Flattery
      { from: 2, to: 3, ground: "art-plum", visual: { kind: "struck", text: "GREAT COMPANY!" } },
      // The lesson's name
      { from: 4, to: 6, ground: "art-sun", visual: { kind: "tile" } },
      // The blob's own reason
      { from: 7, to: 10, ground: "art-leaf", visual: { kind: "example", title: "My reason", quote: "“Three summers running my street’s fair.”" } },
      // One reason, one moment
      { from: 11, to: 12, ground: "art-coral", visual: { kind: "cards", items: [{ sign: "1", label: "One reason", at: 11 }, { sign: "2", label: "One moment", at: 11 }] } },
    ],
    close: { heading: "Your close", items: [{ sign: "1", label: "One real reason" }, { sign: "2", label: "A moment as proof" }, { sign: "?", label: "A question back" }], action: "Write down your one reason" },
  },
];
